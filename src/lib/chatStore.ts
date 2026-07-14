import {
  collection,
  doc,
  addDoc,
  updateDoc,
  setDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { ChatMessage, Conversation } from "@/types";

const conversationsCol = (uid: string) =>
  collection(db, "users", uid, "conversations");

const messagesCol = (uid: string, conversationId: string) =>
  collection(db, "users", uid, "conversations", conversationId, "messages");

export function subscribeToConversations(
  uid: string,
  cb: (conversations: Conversation[]) => void,
) {
  const q = query(conversationsCol(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title ?? "New chat",
          preview: data.preview ?? "",
          model: data.model ?? "gemini-2.0-flash",
          createdAt: toMillis(data.createdAt),
          updatedAt: toMillis(data.updatedAt),
        };
      }),
    );
  });
}

export function subscribeToMessages(
  uid: string,
  conversationId: string,
  cb: (messages: ChatMessage[]) => void,
) {
  const q = query(messagesCol(uid, conversationId), orderBy("createdAt", "asc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          role: data.role,
          content: data.content ?? "",
          createdAt: toMillis(data.createdAt),
          version: data.version ?? 1,
        } as ChatMessage;
      }),
    );
  });
}

export async function createConversation(uid: string, title = "New chat") {
  const ref = await addDoc(conversationsCol(uid), {
    title,
    preview: "",
    model: "gemini-2.0-flash",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function renameConversation(
  uid: string,
  conversationId: string,
  title: string,
) {
  await updateDoc(doc(conversationsCol(uid), conversationId), { title });
}

export async function touchConversation(
  uid: string,
  conversationId: string,
  preview: string,
) {
  await updateDoc(doc(conversationsCol(uid), conversationId), {
    preview: preview.slice(0, 140),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteConversation(uid: string, conversationId: string) {
  const msgs = await getDocs(messagesCol(uid, conversationId));
  const batch = writeBatch(db);
  msgs.docs.forEach((m) => batch.delete(m.ref));
  batch.delete(doc(conversationsCol(uid), conversationId));
  await batch.commit();
}

export async function addMessage(
  uid: string,
  conversationId: string,
  message: Omit<ChatMessage, "id" | "createdAt">,
) {
  const ref = await addDoc(messagesCol(uid, conversationId), {
    ...message,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateMessageContent(
  uid: string,
  conversationId: string,
  messageId: string,
  content: string,
  extra: Partial<ChatMessage> = {},
) {
  await setDoc(
    doc(messagesCol(uid, conversationId), messageId),
    { content, ...extra },
    { merge: true },
  );
}

export async function deleteMessagesFrom(
  uid: string,
  conversationId: string,
  messages: ChatMessage[],
  fromIndex: number,
) {
  const batch = writeBatch(db);
  messages.slice(fromIndex).forEach((m) => {
    batch.delete(doc(messagesCol(uid, conversationId), m.id));
  });
  await batch.commit();
}

function toMillis(value: unknown): number {
  if (value instanceof Timestamp) return value.toMillis();
  return Date.now();
}
