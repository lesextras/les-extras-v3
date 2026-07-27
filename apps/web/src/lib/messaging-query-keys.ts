export const messagingQueryKeys = {
  all: ["messaging"] as const,
  conversations: () => ["messaging", "conversations"] as const,
  messages: (conversationId: string) => ["messaging", "messages", conversationId] as const,
};

export const freelancePublicQueryKeys = {
  all: ["freelance-public"] as const,
  detail: (freelanceId: string) => ["freelance-public", "detail", freelanceId] as const,
};

export const lot5InvalidationPaths = {
  inbox: "/dashboard/inbox",
  freelancePublicBase: "/freelances",
} as const;
