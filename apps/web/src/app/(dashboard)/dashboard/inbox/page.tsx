// Messagerie : liste des conversations (colonne gauche) + fil actif (droite).
import type { Metadata } from "next";
import Link from "next/link";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState } from "../../../_shared/ui";
import { MessageComposer } from "../../../_shared/MessageComposer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fullName, initials, timeAgo, formatDateTime } from "../../../_shared/format";
import type { Conversation, Message } from "../../../_shared/types";

export const metadata: Metadata = { title: "Messagerie" };

export default async function InboxPage({
  searchParams,
}: {
  searchParams: { c?: string };
}) {
  const session = await requireSession();
  const activeId = searchParams.c;

  const { data: conversations } = await fetchApi<Conversation[]>(session, "/conversations");
  const list = conversations ?? [];
  const active = activeId ?? list[0]?.id;

  const thread = active
    ? await fetchApi<{ conversation: Conversation; messages: Message[] }>(
        session,
        `/conversations/${active}`,
      )
    : { data: undefined };

  return (
    <div className="space-y-6">
      <PageHeader title="Messagerie" subtitle="Échangez avec vos établissements et freelances." />

      {list.length === 0 ? (
        <EmptyState
          title="Aucune conversation"
          description="Les échanges démarrent automatiquement lors d'une candidature ou d'une réservation."
        />
      ) : (
        <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-border md:grid-cols-[320px_1fr]">
          {/* Liste */}
          <aside className="border-b border-border md:border-b-0 md:border-r">
            <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
              {list.map((c) => {
                const other = c.participants?.[0];
                const isActive = c.id === active;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/dashboard/inbox?c=${c.id}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                        isActive && "bg-muted",
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={other?.avatarUrl ?? undefined} />
                        <AvatarFallback>{initials(other?.firstName, other?.lastName)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {fullName(other?.firstName, other?.lastName)}
                          </p>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {timeAgo(c.updatedAt)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.mission?.title ? `${c.mission.title} · ` : ""}
                          {c.lastMessage?.body ?? "Nouvelle conversation"}
                        </p>
                      </div>
                      {c.unreadCount ? (
                        <Badge className="shrink-0">{c.unreadCount}</Badge>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* Fil */}
          <section className="flex min-h-[60vh] flex-col bg-background">
            {thread.data ? (
              <>
                <header className="border-b border-border px-5 py-3">
                  <p className="text-sm font-medium text-foreground">
                    {fullName(
                      thread.data.conversation.participants?.[0]?.firstName,
                      thread.data.conversation.participants?.[0]?.lastName,
                    )}
                  </p>
                  {thread.data.conversation.mission?.title ? (
                    <p className="text-xs text-muted-foreground">
                      À propos de : {thread.data.conversation.mission.title}
                    </p>
                  ) : null}
                </header>
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {thread.data.messages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      Démarrez la conversation.
                    </p>
                  ) : (
                    thread.data.messages.map((m) => {
                      const mine = m.senderId === session.user.id;
                      return (
                        <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                              mine
                                ? "rounded-br-sm bg-primary text-primary-foreground"
                                : "rounded-bl-sm bg-muted text-foreground",
                            )}
                          >
                            <p className="whitespace-pre-wrap">{m.body}</p>
                            <p
                              className={cn(
                                "mt-1 text-[10px]",
                                mine ? "text-primary-foreground/70" : "text-muted-foreground",
                              )}
                            >
                              {formatDateTime(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <MessageComposer conversationId={active!} accountId={session.account.id} />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
                Sélectionnez une conversation.
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
