import { useState } from "react";
import { useChat } from "@/context/ChatContext";
import { useAuth } from "@/context/AuthContext";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Conversation } from "@/types";

export default function Sidebar({ onNavigate }: { onNavigate: () => void }) {
  const { conversations, activeId, selectConversation, newConversation, removeConversation, rename, loadingConversations } =
    useChat();
  const { user, logOut } = useAuth();

  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [draftTitle, setDraftTitle] = useState("");

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <Button
          className="w-full"
          onClick={async () => {
            await newConversation();
            onNavigate();
          }}
        >
          <PlusIcon /> New chat
        </Button>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-2">
        {loadingConversations ? (
          <div className="space-y-2 px-1 pt-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-ink-800" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <p className="px-3 pt-6 text-center text-sm text-parchment-200/40">
            No chats yet — start one above.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {conversations.map((c) => (
              <li key={c.id} className="group relative">
                <button
                  onClick={() => {
                    selectConversation(c.id);
                    onNavigate();
                  }}
                  className={`w-full truncate rounded-lg px-3 py-2.5 pr-16 text-left text-sm transition-colors ${
                    c.id === activeId
                      ? "bg-ink-700 text-parchment-100"
                      : "text-parchment-200/70 hover:bg-ink-800 hover:text-parchment-100"
                  }`}
                >
                  {c.title || "New chat"}
                </button>
                <div className="absolute right-1.5 top-1 hidden gap-0.5 group-hover:flex">
                  <IconButton
                    label="Rename chat"
                    onClick={() => {
                      setRenameTarget(c);
                      setDraftTitle(c.title);
                    }}
                  >
                    <PencilIcon />
                  </IconButton>
                  <IconButton label="Delete chat" onClick={() => setDeleteTarget(c)}>
                    <TrashIcon />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-ink-700 p-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-semibold text-parchment-100">
            {(user?.displayName || user?.email || "?").slice(0, 1).toUpperCase()}
          </div>
          <span className="truncate text-sm text-parchment-200/80">
            {user?.displayName || user?.email}
          </span>
        </div>
        <IconButton label="Sign out" onClick={() => logOut()}>
          <LogoutIcon />
        </IconButton>
      </div>

      <Modal open={!!renameTarget} onClose={() => setRenameTarget(null)} title="Rename chat">
        <input
          autoFocus
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && renameTarget && commitRename()}
          className="mb-4 w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-parchment-100 focus:border-amber-500"
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRenameTarget(null)}>
            Cancel
          </Button>
          <Button onClick={commitRename}>Save</Button>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete chat?">
        <p className="mb-4 text-sm text-parchment-200/70">
          “{deleteTarget?.title}” and all its messages will be permanently deleted.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            className="bg-red-500/10"
            onClick={async () => {
              if (deleteTarget) await removeConversation(deleteTarget.id);
              setDeleteTarget(null);
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );

  async function commitRename() {
    if (renameTarget) await rename(renameTarget.id, draftTitle);
    setRenameTarget(null);
  }
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
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
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0-1 14a2 2 0 01-2 2H7a2 2 0 01-2-2L4 6h16z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
