import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import type { ChatMessage, Conversation } from "@/types";
import {
  addMessage,
  createConversation,
  deleteConversation,
  deleteMessagesFrom,
  renameConversation,
  subscribeToConversations,
  subscribeToMessages,
  touchConversation,
  updateMessageContent,
} from "@/lib/chatStore";
import { streamGeminiReply } from "@/lib/gemini";

interface ChatContextValue {
  conversations: Conversation[];
  activeId: string | null;
  messages: ChatMessage[];
  isStreaming: boolean;
  loadingConversations: boolean;
  selectConversation: (id: string) => void;
  newConversation: () => Promise<string>;
  removeConversation: (id: string) => Promise<void>;
  rename: (id: string, title: string) => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  editMessage: (messageId: string, newText: string) => Promise<void>;
  regenerate: (assistantMessageId: string) => Promise<void>;
  stopStreaming: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

// Local streaming buffer keyed by message id, flushed to Firestore at low
// frequency to avoid excessive writes while still feeling instant on-screen.
const FLUSH_INTERVAL_MS = 220;

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const localOverlay = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!uid) {
      setConversations([]);
      setLoadingConversations(false);
      return;
    }
    setLoadingConversations(true);
    const unsub = subscribeToConversations(uid, (convos) => {
      setConversations(convos);
      setLoadingConversations(false);
    });
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (!uid || !activeId) {
      setMessages([]);
      return;
    }
    const unsub = subscribeToMessages(uid, activeId, (msgs) => {
      // Merge in-flight streaming text so a Firestore snapshot mid-stream
      // never clobbers what the user is currently watching render.
      setMessages(
        msgs.map((m) =>
          localOverlay.current.has(m.id)
            ? { ...m, content: localOverlay.current.get(m.id)!, streaming: true }
            : m,
        ),
      );
    });
    return unsub;
  }, [uid, activeId]);

  const selectConversation = useCallback((id: string) => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setActiveId(id);
  }, []);

  const newConversation = useCallback(async () => {
    if (!uid) throw new Error("Not signed in");
    const id = await createConversation(uid);
    setActiveId(id);
    return id;
  }, [uid]);

  const removeConversation = useCallback(
    async (id: string) => {
      if (!uid) return;
      await deleteConversation(uid, id);
      if (activeId === id) setActiveId(null);
    },
    [uid, activeId],
  );

  const rename = useCallback(
    async (id: string, title: string) => {
      if (!uid) return;
      await renameConversation(uid, id, title.trim() || "Untitled chat");
    },
    [uid],
  );

  const runAssistantTurn = useCallback(
    async (conversationId: string, history: ChatMessage[], assistantId: string) => {
      if (!uid) return;
      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      let buffer = "";
      let lastFlush = 0;
      localOverlay.current.set(assistantId, "");

      const flush = async (force = false) => {
        const now = Date.now();
        if (!force && now - lastFlush < FLUSH_INTERVAL_MS) return;
        lastFlush = now;
        await updateMessageContent(uid, conversationId, assistantId, buffer);
      };

      await streamGeminiReply(history, controller.signal, {
        onDelta: (text) => {
          buffer += text;
          localOverlay.current.set(assistantId, buffer);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: buffer, streaming: true } : m,
            ),
          );
          void flush();
        },
        onDone: async () => {
          localOverlay.current.delete(assistantId);
          await updateMessageContent(uid, conversationId, assistantId, buffer, {
            streaming: false,
          } as never);
          await touchConversation(uid, conversationId, buffer || "New response");
          setIsStreaming(false);
        },
        onError: async (message) => {
          localOverlay.current.delete(assistantId);
          await updateMessageContent(uid, conversationId, assistantId, buffer, {
            error: message,
          } as never);
          setIsStreaming(false);
        },
      });
    },
    [uid],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!uid || !text.trim()) return;
      let conversationId = activeId;
      if (!conversationId) {
        conversationId = await createConversation(
          uid,
          text.trim().slice(0, 48) || "New chat",
        );
        setActiveId(conversationId);
      }

      const userMsg: Omit<ChatMessage, "id" | "createdAt"> = {
        role: "user",
        content: text.trim(),
      };
      await addMessage(uid, conversationId, userMsg);

      // Auto-title fresh conversations from the first message.
      const convo = conversations.find((c) => c.id === conversationId);
      if (convo && (!convo.title || convo.title === "New chat")) {
        await renameConversation(uid, conversationId, text.trim().slice(0, 48));
      }

      const assistantId = await addMessage(uid, conversationId, {
        role: "assistant",
        content: "",
        streaming: true,
      });

      const historyForModel = [...messages, { ...userMsg, id: "tmp", createdAt: Date.now() }];
      await runAssistantTurn(conversationId, historyForModel, assistantId);
    },
    [uid, activeId, messages, conversations, runAssistantTurn],
  );

  const editMessage = useCallback(
    async (messageId: string, newText: string) => {
      if (!uid || !activeId || !newText.trim()) return;
      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      await updateMessageContent(uid, activeId, messageId, newText.trim());
      // Remove everything after the edited message (its old response + any
      // later turns) since the conversation branches from here.
      await deleteMessagesFrom(uid, activeId, messages, index + 1);

      const truncatedHistory = [
        ...messages.slice(0, index),
        { ...messages[index], content: newText.trim() },
      ];

      const assistantId = await addMessage(uid, activeId, {
        role: "assistant",
        content: "",
        streaming: true,
      });
      await runAssistantTurn(activeId, truncatedHistory, assistantId);
    },
    [uid, activeId, messages, runAssistantTurn],
  );

  const regenerate = useCallback(
    async (assistantMessageId: string) => {
      if (!uid || !activeId) return;
      const index = messages.findIndex((m) => m.id === assistantMessageId);
      if (index === -1) return;

      const historyBefore = messages.slice(0, index);
      await deleteMessagesFrom(uid, activeId, messages, index);

      const assistantId = await addMessage(uid, activeId, {
        role: "assistant",
        content: "",
        streaming: true,
      });
      await runAssistantTurn(activeId, historyBefore, assistantId);
    },
    [uid, activeId, messages, runAssistantTurn],
  );

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeId,
        messages,
        isStreaming,
        loadingConversations,
        selectConversation,
        newConversation,
        removeConversation,
        rename,
        sendMessage,
        editMessage,
        regenerate,
        stopStreaming,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
