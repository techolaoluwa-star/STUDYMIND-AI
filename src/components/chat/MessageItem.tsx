import { useState } from "react";
import type { ChatMessage } from "@/types";
import { Markdown } from "./Markdown";
import TypingDots from "./TypingDots";
import { IconButton } from "@/components/ui/IconButton";
import { useChat } from "@/context/ChatContext";

export default function MessageItem({ message }: { message: ChatMessage }) {
  const { editMessage, regenerate } = useChat();
  const isUser = message.role === "user";
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }

  async function saveEdit() {
    if (draft.trim() && draft.trim() !== message.content) {
      await editMessage(message.id, draft.trim());
    }
    setEditing(false);
  }

  return (
    <div className={`group flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[85%] flex-col md:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        {editing ? (
          <div className="w-full min-w-[260px] rounded-xl2 border border-amber-500/50 bg-ink-800 p-3">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.min(8, draft.split("\n").length + 1)}
              className="w-full resize-none bg-transparent text-sm text-parchment-100 outline-none"
            />
            <div className="mt-2 flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setDraft(message.content);
                  setEditing(false);
                }}
                className="rounded-md px-2.5 py-1.5 text-parchment-200/60 hover:bg-ink-700"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                className="rounded-md bg-amber-500 px-2.5 py-1.5 font-medium text-ink-950 hover:bg-amber-400"
              >
                Save & submit
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`rounded-xl2 px-4 py-2.5 text-sm ${
              isUser
                ? "bg-amber-500 text-ink-950 font-medium"
                : "bg-ink-800 text-parchment-100 border border-ink-700"
            }`}
          >
            {message.streaming && !message.content ? (
              <TypingDots />
            ) : isUser ? (
              <p className="whitespace-pre-wrap">{message.content}</p>
            ) : (
              <Markdown content={message.content} />
            )}
            {message.error && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                {message.error}
                <button onClick={() => regenerate(message.id)} className="underline underline-offset-2">
                  Retry
                </button>
              </p>
            )}
          </div>
        )}

        {!editing && (
          <div className="mt-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <IconButton label="Copy message" onClick={copy}>
              {copied ? <CheckIcon /> : <CopyIcon />}
            </IconButton>
            {isUser && (
              <IconButton label="Edit message" onClick={() => setEditing(true)}>
                <PencilIcon />
              </IconButton>
            )}
            {!isUser && !message.streaming && (
              <IconButton label="Regenerate response" onClick={() => regenerate(message.id)}>
                <RefreshIcon />
              </IconButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
