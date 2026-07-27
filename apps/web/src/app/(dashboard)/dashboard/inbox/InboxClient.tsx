"use client";

import { useMemo, useState, useTransition } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMessagingV1 } from "@/lib/hooks/useMessagingV1";
import type { MessagingConversationSeed, MessagingMessage } from "@/lib/messaging-v1";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, ArrowLeft, CircleAlert, RefreshCw } from "lucide-react";

type InboxClientProps = {
  currentUserId: string;
  currentUserRole: "FREELANCE" | "ESTABLISHMENT";
  initialSeeds: MessagingConversationSeed[];
  initialLoadError?: string | null;
  initialNotifications?: {
    id: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  }[];
  notificationsError?: string | null;
};

function formatRelativeTime(iso: string) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNowStrict(date, { addSuffix: true, locale: fr });
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  if (parts.length === 0) return "?";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

function MessageBubble({
  message,
  isMine,
}: {
  message: MessagingMessage;
  isMine: boolean;
}) {
  return (
    <div className={cn("flex", isMine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
          isMine
            ? "bg-[hsl(var(--teal))] text-white"
            : "bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <p className={cn("mt-1 text-[10px]", isMine ? "text-white/80" : "text-muted-foreground")}>{formatRelativeTime(message.createdAt)}</p>
      </div>
    </div>
  );
}

export function InboxClient({
  currentUserId,
  currentUserRole,
  initialSeeds,
  initialLoadError,
  initialNotifications = [],
  notificationsError = null,
}: InboxClientProps) {
  const [mobileView, setMobileView] = useState<"list" | "thread">("list");
  const [draft, setDraft] = useState("");
  const [notifications] = useState(initialNotifications);
  const [isSending, startSendTransition] = useTransition();

  const {
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
  } = useMessagingV1({
    currentUserId,
    currentUserRole,
    conversationSeeds: initialSeeds,
  });

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  const globalError = error ?? initialLoadError ?? null;

  const handleSelectConversation = (conversationId: string) => {
    selectConversation(conversationId);
    setMobileView("thread");
  };

  const handleSend = () => {
    startSendTransition(async () => {
      const result = await sendMessage(draft);
      if (result.ok) {
        setDraft("");
        return;
      }
      setError(result.error ?? "Impossible d'envoyer le message.");
    });
  };

  return (
    <div className="space-y-4" data-testid="inbox-client">
      <header className="space-y-1.5">
        <p className="text-overline uppercase tracking-widest text-muted-foreground">Messages</p>
        <h1 className="font-display text-heading-xl tracking-tight">Messagerie</h1>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Notifications utiles</h2>
          {notifications.length > 0 ? (
            <Badge variant="outline" className="text-[10px]">
              {notifications.filter((item) => !item.isRead).length} non lue(s)
            </Badge>
          ) : null}
        </div>

        {notificationsError ? (
          <p className="text-xs text-destructive">{notificationsError}</p>
        ) : notifications.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aucune notification disponible.</p>
        ) : (
          <ul className="space-y-2">
            {notifications.slice(0, 5).map((notification) => (
              <li
                key={notification.id}
                className={cn(
                  "rounded-xl border px-3 py-2 text-xs",
                  notification.isRead
                    ? "border-border text-muted-foreground"
                    : "border-[hsl(var(--color-teal-300))] bg-[hsl(var(--color-teal-50))]",
                )}
              >
                <p>{notification.message}</p>
                <p className="mt-1 text-[10px]">
                  {notification.type} · {formatRelativeTime(notification.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {globalError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <CircleAlert className="h-4 w-4 mt-0.5" aria-hidden="true" />
            <span>{globalError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={() => {
              setError(null);
              refetchConversations();
            }}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
            Réessayer
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card min-h-[440px] p-4 animate-pulse space-y-3">
          <div className="h-10 rounded-lg bg-muted" />
          <div className="h-10 rounded-lg bg-muted" />
          <div className="h-10 rounded-lg bg-muted" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Aucune conversation"
          description="Vos échanges entre FREELANCE et ESTABLISHMENT apparaîtront ici."
          tips="Les conversations sont créées depuis vos missions et ateliers." 
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden min-h-[500px] flex">
          <div
            className={cn(
              "w-full md:w-80 md:border-r border-border shrink-0 overflow-y-auto",
              mobileView === "thread" && "hidden md:block",
            )}
          >
            {conversations.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                onClick={() => handleSelectConversation(conversation.id)}
                className={cn(
                  "w-full text-left p-4 border-b border-border transition-colors",
                  activeConversationId === conversation.id
                    ? "bg-[hsl(var(--color-teal-50))]"
                    : "hover:bg-[hsl(var(--color-cream))]",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-[hsl(var(--color-teal-100))] flex items-center justify-center shrink-0 text-sm font-semibold text-[hsl(var(--color-teal-700))]">
                    {getInitials(conversation.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn("text-sm truncate", conversation.unread && "font-semibold")}>{conversation.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(conversation.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conversation.lastMessage}</p>
                    <div className="mt-1 flex items-center gap-2">
                      {conversation.context && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{conversation.context}</Badge>
                      )}
                      {conversation.unread && (
                        <Badge variant="info" className="text-[10px] px-1.5 py-0">Nouveau</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className={cn("flex-1 flex flex-col", mobileView === "list" && "hidden md:flex")}>
            {activeConversation ? (
              <>
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    className="md:hidden p-1"
                    aria-label="Retour à la liste"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <p className="text-sm font-semibold">{activeConversation.name}</p>
                    {activeConversation.context && (
                      <p className="text-xs text-muted-foreground">{activeConversation.context}</p>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-2" data-testid="thread-messages">
                  {threadMessages.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">Début de la conversation</p>
                  ) : (
                    threadMessages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isMine={message.senderId === currentUserId}
                      />
                    ))
                  )}
                </div>

                <div className="p-4 border-t border-border">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      placeholder="Votre message…"
                      rows={1}
                      className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(var(--teal))] resize-none"
                    />
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      className="h-10 w-10 p-0"
                      disabled={!draft.trim() || isSending}
                      aria-label="Envoyer"
                      onClick={handleSend}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-muted-foreground text-sm">
                Sélectionnez une conversation
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
