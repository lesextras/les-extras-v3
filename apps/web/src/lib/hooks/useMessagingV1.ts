"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchApiConversations,
  fetchApiMessages,
  callMarkAsRead,
  sendMessage as sendMessageAction,
} from "@/actions/messaging";
import type { ApiConversation, ApiMessage } from "@/actions/messaging";
import { messagingQueryKeys } from "@/lib/messaging-query-keys";
import type { MessagingConversation, MessagingConversationSeed, MessagingMessage } from "@/lib/messaging-v1";

type UseMessagingV1Input = {
  currentUserId: string;
  currentUserRole: "FREELANCE" | "ESTABLISHMENT";
  conversationSeeds: MessagingConversationSeed[];
  pollingMs?: number;
};

type ConvEntry = { realConvId: string; receiverId: string };

function parseSeedId(seedId: string): { type: "BOOKING" | "PROFILE"; extractedId: string } | null {
  if (seedId.startsWith("booking:")) {
    const parts = seedId.split(":");
    const id = parts[parts.length - 1];
    return id ? { type: "BOOKING", extractedId: id } : null;
  }
  if (seedId.startsWith("profile:")) {
    const id = seedId.slice("profile:".length);
    return id ? { type: "PROFILE", extractedId: id } : null;
  }
  return null;
}

function buildConvMap(
  seeds: MessagingConversationSeed[],
  apiConvs: ApiConversation[],
): Map<string, ConvEntry> {
  const map = new Map<string, ConvEntry>();
  for (const seed of seeds) {
    const parsed = parseSeedId(seed.id);
    if (!parsed) continue;
    let conv: ApiConversation | undefined;
    if (parsed.type === "BOOKING") {
      conv = apiConvs.find((c) => c.bookingId === parsed.extractedId);
    } else {
      conv = apiConvs.find((c) => c.otherParticipant.id === parsed.extractedId);
    }
    if (conv) {
      map.set(seed.id, { realConvId: conv.id, receiverId: conv.otherParticipant.id });
    } else if (parsed.type === "PROFILE") {
      // No existing conversation yet — we know who to send to
      map.set(seed.id, { realConvId: "", receiverId: parsed.extractedId });
    }
  }
  return map;
}

function toMessagingConversation(seed: MessagingConversationSeed, conv: ApiConversation | undefined): MessagingConversation {
  return {
    ...seed,
    lastMessage: conv?.lastMessage?.content ?? "",
    lastMessageAt: conv?.updatedAt ?? new Date(0).toISOString(),
    unread: (conv?.unreadCount ?? 0) > 0,
  };
}

function toMessagingMessages(apiMessages: ApiMessage[]): MessagingMessage[] {
  return apiMessages.map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderId: m.senderId,
    senderRole: "FREELANCE" as const,
    content: m.content,
    createdAt: m.createdAt,
    isRead: m.isRead,
  }));
}

export function useMessagingV1({
  currentUserId,
  currentUserRole: _currentUserRole,
  conversationSeeds,
  pollingMs = 10000,
}: UseMessagingV1Input) {
  const queryKey = messagingQueryKeys.conversations();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<MessagingConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<MessagingMessage[]>([]);
  const [convMap, setConvMap] = useState<Map<string, ConvEntry>>(new Map());

  const loadConversations = useCallback(async () => {
    const apiConvs = await fetchApiConversations();
    const map = buildConvMap(conversationSeeds, apiConvs);
    setConvMap(map);
    const built = conversationSeeds.map((seed) => {
      const entry = map.get(seed.id);
      const apiConv = entry?.realConvId ? apiConvs.find((c) => c.id === entry.realConvId) : undefined;
      return toMessagingConversation(seed, apiConv);
    });
    setConversations(built);
    setError(null);
    return { built, map };
  }, [conversationSeeds]);

  const refetchConversations = useCallback(() => {
    loadConversations().catch(() => setError("Impossible de charger les conversations."));
  }, [loadConversations]);

  const loadMessages = useCallback(async (seedId: string, map: Map<string, ConvEntry>) => {
    const entry = map.get(seedId);
    if (!entry?.realConvId) {
      setThreadMessages([]);
      return;
    }
    const [msgs] = await Promise.all([
      fetchApiMessages(entry.realConvId),
      callMarkAsRead(entry.realConvId),
    ]);
    setThreadMessages(toMessagingMessages(msgs));
  }, []);

  const refetchMessages = useCallback(
    (seedId: string) => {
      loadMessages(seedId, convMap).catch(() => setError("Impossible de charger les messages."));
    },
    [convMap, loadMessages],
  );

  const selectConversation = useCallback(
    (seedId: string) => {
      setActiveConversationId(seedId);
      loadMessages(seedId, convMap).catch(() => setError("Impossible de charger les messages."));
    },
    [convMap, loadMessages],
  );

  const sendMessage = useCallback(
    async (content: string): Promise<{ ok: true } | { ok: false; error: string }> => {
      if (!activeConversationId) return { ok: false, error: "Conversation manquante." };
      if (!content.trim()) return { ok: false, error: "Message vide." };
      const entry = convMap.get(activeConversationId);
      if (!entry?.receiverId) return { ok: false, error: "Destinataire introuvable." };

      const result = await sendMessageAction({ receiverId: entry.receiverId, content });
      if ("error" in result && result.error) {
        return { ok: false, error: result.error };
      }
      // After send: refresh conversation list and messages
      const loaded = await loadConversations().catch(() => null);
      if (loaded) {
        await loadMessages(activeConversationId, loaded.map).catch(() => {});
      }
      return { ok: true };
    },
    [activeConversationId, convMap, loadConversations, loadMessages],
  );

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    loadConversations()
      .then(({ built, map }) => {
        if (built.length > 0) {
          const firstSeedId = built[0]!.id;
          setActiveConversationId(firstSeedId);
          loadMessages(firstSeedId, map).catch(() => {});
        }
      })
      .catch(() => setError("Impossible d'initialiser la messagerie."))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // mount only

  // Polling for active conversation
  useEffect(() => {
    if (!activeConversationId) return;
    const timer = window.setInterval(() => {
      refetchMessages(activeConversationId);
    }, pollingMs);
    return () => window.clearInterval(timer);
  }, [activeConversationId, pollingMs, refetchMessages]);

  return {
    queryKey,
    conversations,
    activeConversationId,
    threadMessages,
    isLoading,
    error,
    setError,
    selectConversation,
    sendMessage,
    refetchConversations,
    refetchMessages,
  };
}
