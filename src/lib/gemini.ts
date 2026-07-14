import type { ChatMessage } from "@/types";

export interface StreamHandlers {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (message: string) => void;
}

/**
 * Streams a Gemini completion through our serverless proxy (keeps the API key
 * server-side). Consumes newline-delimited JSON chunks: { delta } | { done } | { error }.
 */
export async function streamGeminiReply(
  history: ChatMessage[],
  signal: AbortSignal,
  handlers: StreamHandlers,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/.netlify/functions/gemini-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } catch {
    handlers.onError("Network error — check your connection and try again.");
    return;
  }

  if (!res.ok || !res.body) {
    const text = await safeText(res);
    handlers.onError(text || `Request failed (${res.status}). Please retry.`);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line) continue;

        try {
          const chunk = JSON.parse(line) as {
            delta?: string;
            done?: boolean;
            error?: string;
          };
          if (chunk.error) {
            handlers.onError(chunk.error);
            return;
          }
          if (chunk.delta) handlers.onDelta(chunk.delta);
          if (chunk.done) {
            handlers.onDone();
            return;
          }
        } catch {
          // ignore malformed partial line; wait for more data
        }
      }
    }
    handlers.onDone();
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    handlers.onError("Connection interrupted. Please try again.");
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.error ?? "";
  } catch {
    return "";
  }
}
