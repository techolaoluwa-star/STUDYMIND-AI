export type Role = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  /** true while an assistant message is still streaming in */
  streaming?: boolean;
  /** set if this message errored and can be retried */
  error?: string;
  /** number of times this message has been edited (user) or regenerated (assistant) */
  version?: number;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  /** last message preview, kept denormalized for fast sidebar rendering */
  preview: string;
  model: string;
}

export interface ConversationWithMessages extends Conversation {
  messages: ChatMessage[];
}

export interface StreamChunk {
  delta?: string;
  done?: boolean;
  error?: string;
}
