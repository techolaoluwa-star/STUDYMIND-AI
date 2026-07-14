import { useRef, useState, type KeyboardEvent } from "react";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";

interface ComposerProps {
  onSend: (text: string) => void;
  isStreaming: boolean;
  onStop: () => void;
}

export default function Composer({ onSend, isStreaming, onStop }: ComposerProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useAutoResizeTextarea(textareaRef, value);

  function submit() {
    const text = value.trim();
    if (!text || isStreaming) return;
    onSend(text);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="shrink-0 border-t border-ink-700 bg-ink-950 px-4 py-3 md:px-8 md:py-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl2 border border-ink-700 bg-ink-800 px-3 py-2 focus-within:border-amber-500/50">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about a concept, paste your notes, or share a problem to solve…"
          className="max-h-[200px] flex-1 resize-none bg-transparent py-1.5 text-sm text-parchment-100 placeholder:text-parchment-200/40 outline-none"
        />
        {isStreaming ? (
          <button
            onClick={onStop}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-700 text-parchment-100 hover:bg-ink-600"
            aria-label="Stop generating"
          >
            <span className="h-2.5 w-2.5 rounded-sm bg-parchment-100" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={!value.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-ink-950 transition-colors hover:bg-amber-400 disabled:opacity-40"
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-parchment-200/35">
        StudyMind can make mistakes. Verify important facts and calculations.
      </p>
    </div>
  );
}
