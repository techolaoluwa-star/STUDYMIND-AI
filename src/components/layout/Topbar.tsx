import { useChat } from "@/context/ChatContext";
import { IconButton } from "@/components/ui/IconButton";

export default function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { conversations, activeId } = useChat();
  const active = conversations.find((c) => c.id === activeId);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-ink-700 bg-ink-950 px-3 md:hidden">
      <IconButton label="Open menu" onClick={onOpenSidebar}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
        </svg>
      </IconButton>
      <span className="truncate font-display text-sm font-medium text-parchment-100">
        {active?.title || "StudyMind AI"}
      </span>
    </header>
  );
}
