export type MessagingConversationSeed = {
  id: string;
  name: string;
  context?: string;
  source: "BOOKING" | "PROFILE" | "MISSION";
};

export type MessagingConversation = MessagingConversationSeed & {
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
};

export type MessagingMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "FREELANCE" | "ESTABLISHMENT" | "SYSTEM";
  content: string;
  createdAt: string;
  isRead: boolean;
};

type MessagingStore = {
  messagesByConversation: Record<string, MessagingMessage[]>;
};

const STORAGE_KEY = "lesextras.messaging.v1";

function createMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function readStore(): MessagingStore {
  if (typeof window === "undefined") return { messagesByConversation: {} };
  const parsed = safeJsonParse<MessagingStore>(window.localStorage.getItem(STORAGE_KEY), {
    messagesByConversation: {},
  });
  if (!parsed.messagesByConversation) {
    return { messagesByConversation: {} };
  }
  return parsed;
}

function writeStore(store: MessagingStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function getConversationMessages(conversationId: string): MessagingMessage[] {
  const store = readStore();
  return [...(store.messagesByConversation[conversationId] ?? [])].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export function markConversationRead(conversationId: string, viewerId: string): MessagingMessage[] {
  const store = readStore();
  const current = store.messagesByConversation[conversationId] ?? [];
  const updated = current.map((msg) => {
    if (msg.senderId !== viewerId && !msg.isRead) {
      return { ...msg, isRead: true };
    }
    return msg;
  });
  store.messagesByConversation[conversationId] = updated;
  writeStore(store);
  return [...updated].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function sendConversationMessage(input: {
  conversationId: string;
  senderId: string;
  senderRole: "FREELANCE" | "ESTABLISHMENT";
  content: string;
}): MessagingMessage {
  const store = readStore();
  const current = store.messagesByConversation[input.conversationId] ?? [];
  const next: MessagingMessage = {
    id: createMessageId(),
    conversationId: input.conversationId,
    senderId: input.senderId,
    senderRole: input.senderRole,
    content: input.content.trim(),
    createdAt: nowIso(),
    isRead: true,
  };
  store.messagesByConversation[input.conversationId] = [...current, next];
  writeStore(store);
  return next;
}

export function ensureSystemSeedMessage(
  conversationId: string,
  seedLabel: string,
): MessagingMessage | null {
  const store = readStore();
  const current = store.messagesByConversation[conversationId] ?? [];
  if (current.length > 0) return null;

  const seed: MessagingMessage = {
    id: createMessageId(),
    conversationId,
    senderId: "system",
    senderRole: "SYSTEM",
    content: `Conversation initiée depuis ${seedLabel}.`,
    createdAt: nowIso(),
    isRead: true,
  };

  store.messagesByConversation[conversationId] = [seed];
  writeStore(store);
  return seed;
}

export function buildConversationView(
  seeds: MessagingConversationSeed[],
  viewerId: string,
): MessagingConversation[] {
  return seeds
    .map((seed) => {
      const messages = getConversationMessages(seed.id);
      const last = messages[messages.length - 1];
      const unread = messages.some((m) => m.senderId !== viewerId && !m.isRead);

      return {
        ...seed,
        lastMessage: last?.content ?? "Aucun message pour le moment.",
        lastMessageAt: last?.createdAt ?? "",
        unread,
      };
    })
    .sort((a, b) => {
      if (!a.lastMessageAt && !b.lastMessageAt) return a.name.localeCompare(b.name, "fr");
      if (!a.lastMessageAt) return 1;
      if (!b.lastMessageAt) return -1;
      return b.lastMessageAt.localeCompare(a.lastMessageAt);
    });
}
