import type { Context } from "@netlify/edge-functions";

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const MAX_HISTORY_MESSAGES = 30;
const DEBUG_KEY_CHECK = Deno.env.get("DEBUG_GEMINI_KEY") === "true";

let diagnosticRan = false;
async function runKeyDiagnosticOnce() {
  if (diagnosticRan || !DEBUG_KEY_CHECK) return;
  diagnosticRan = true;

  if (!GEMINI_API_KEY) {
    console.error("[gemini-chat] GEMINI_API_KEY is undefined in this environment.");
    return;
  }
  try {
    const test = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "ping" }] }] }),
      },
    );
    console.log(`[gemini-chat] diagnostic status: ${test.status}`);
    if (!test.ok) console.error(await test.text());
  } catch (err) {
    console.error("[gemini-chat] diagnostic fetch failed:", err);
  }
}

const SYSTEM_INSTRUCTION = {
  role: "user",
  parts: [
    {
      text:
        "You are StudyMind, an AI study companion for students. Explain concepts " +
        "clearly and step by step, use Markdown (headings, lists, bold) and fenced " +
        "code blocks with language tags for any code, show worked steps for math " +
        "and science problems, and ask a brief clarifying question if the request " +
        "is ambiguous. Keep answers focused and avoid unnecessary filler.",
    },
  ],
};

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

function jsonLine(obj: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj) + "\n");
}

export default async (req: Request, _ctx: Context) => {
  try {
    return await handleRequest(req);
  } catch (err) {
    console.error("[gemini-chat] Unhandled error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected server error. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};

async function handleRequest(req: Request): Promise<Response> {
  await runKeyDiagnosticOnce();

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }
  if (!GEMINI_API_KEY) {
    return new Response(JSON.stringify({ error: "Server is missing GEMINI_API_KEY." }), {
      status: 500,
    });
  }

  let messages: IncomingMessage[];
  try {
    const body = await req.json();
    messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error("empty");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), { status: 400 });
  }

  const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
  const contents = [
    SYSTEM_INSTRUCTION,
    ...trimmed.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
  ];

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:streamGenerateContent` +
    `?alt=sse&key=${GEMINI_API_KEY}`;

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      }),
    });
  } catch (err) {
    console.error("[gemini-chat] Upstream fetch failed:", err);
    return new Response(JSON.stringify({ error: "Could not reach Gemini. Please retry." }), {
      status: 502,
    });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error(`[gemini-chat] Gemini responded ${upstream.status}:`, detail);
    return new Response(
      JSON.stringify({ error: `Gemini request failed${detail ? `: ${detail.slice(0, 200)}` : "."}` }),
      { status: upstream.status || 502 },
    );
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();

  const output = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const evt of events) {
            const line = evt.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            const payload = line.replace(/^data:\s*/, "");
            if (payload === "[DONE]") continue;
            try {
              const parsed = JSON.parse(payload);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) controller.enqueue(jsonLine({ delta: text }));
              const blockReason = parsed?.promptFeedback?.blockReason;
              if (blockReason) {
                controller.enqueue(jsonLine({ error: `Blocked: ${blockReason}` }));
              }
            } catch {
              // skip malformed SSE frame, keep reading
            }
          }
        }
        controller.enqueue(jsonLine({ done: true }));
      } catch (err) {
        console.error("[gemini-chat] Stream loop error:", err);
        controller.enqueue(jsonLine({ error: "Stream interrupted. Please retry." }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(output, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

export const config = { path: "/.netlify/functions/gemini-chat" };
