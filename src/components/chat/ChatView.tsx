import { useChat } from "@/context/ChatContext";
import MessageList from "./MessageList";
import Composer from "./Composer";
import EmptyState from "./EmptyState";

export default function ChatView() {
  const { activeId, messages, sendMessage, isStreaming, stopStreaming } = useChat();

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-ink-950">
      {activeId && messages.length > 0 ? (
        <MessageList messages={messages} />
      ) : (
        <EmptyState onPrompt={sendMessage} />
      )}
      <Composer onSend={sendMessage} isStreaming={isStreaming} onStop={stopStreaming} />
    </main>
  );
}
