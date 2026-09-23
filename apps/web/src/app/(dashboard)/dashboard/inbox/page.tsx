// LA MESSAGERIE.
//
// ⚠ TROIS CHOSES TIENNENT CET ÉCRAN, ET ELLES NE SONT PAS DÉCORATIVES :
//
// 1. UN FIL PORTE SON CONTEXTE, ET L'ÉCRAN LE MONTRE. Le titre vient du
//    serveur (`titre`) : « Renfort — remplacement internat », « Service Pôle
//    jour », « Les Extras ». Avant, toutes les conversations s'appelaient du
//    nom d'un interlocuteur déduit des messages — donc « Utilisateur » quand le
//    fil était vide, et rien du tout quand il y avait trois personnes.
//
// 2. L'AVERTISSEMENT SUR LES DONNÉES D'USAGERS EST EN TÊTE DE FIL, PAS DANS
//    LES CGU. Dans ce secteur, un échange professionnel porte vite un prénom,
//    une date de naissance, une situation. La phrase doit être là au moment où
//    l'on écrit.
//
// 3. LE MASQUAGE DES COORDONNÉES SE DIT. Un message amputé sans explication
//    passe pour une panne ; expliqué, il se comprend. La phrase vient du
//    serveur, qui seul sait si la demande est confirmée.
import type { Metadata } from "next";
import Link from "next/link";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState } from "../../../_shared/ui";
import { MessageComposer } from "../../../_shared/MessageComposer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fullName, initials, timeAgo, formatDateTime } from "../../../_shared/format";
import type { Conversation, Message, TypeConversation } from "../../../_shared/types";

export const metadata: Metadata = { title: "Messagerie" };

/** Les filtres proposés en tête de liste. `undefined` = tout. */
const FILTRES: { cle?: TypeConversation; label: string }[] = [
  { label: "Tout" },
  { cle: "INTERNE", label: "Mon équipe" },
  // « Mes services » retiré le 23/09/2026 : les sous-comptes par service sont
  // archivés. Les fils existants restent lisibles sous « Tout ».
  { cle: "INTERVENANT", label: "Intervenants" },
  { cle: "MISSION", label: "Renforts" },
  { cle: "SUPPORT", label: "Les Extras" },
];

function titreFil(c: Conversation): string {
  if (c.titre) return c.titre;
  const autre = c.participants?.[0];
  return fullName(autre?.firstName, autre?.lastName) || "Conversation";
}

export default async function InboxPage({
  searchParams: searchParamsPromesse,
}: {
  searchParams: Promise<{ c?: string; type?: string; archives?: string }>;
}) {
  const searchParams = await searchParamsPromesse;
  const session = await requireSession();
  const activeId = searchParams.c;
  // Un intervenant n'a ni équipe ni services : ses fils sont ceux des
  // clients qui lui écrivent, ses renforts et Les Extras. Mêmes types en
  // base, autres mots — et deux filtres de moins qui seraient toujours vides.
  const estIntervenant = session.account.type === "FREELANCE";
  const filtres = estIntervenant
    ? FILTRES.filter((f) => f.cle !== "INTERNE" && f.cle !== "SERVICE").map((f) =>
        f.cle === "INTERVENANT" ? { ...f, label: "Clients" } : f,
      )
    : FILTRES;
  const typeFiltre = FILTRES.find((f) => f.cle === searchParams.type)?.cle;
  const archives = searchParams.archives === "1";

  const requete = new URLSearchParams();
  if (typeFiltre) requete.set("type", typeFiltre);
  if (archives) requete.set("archives", "1");
  const suffixe = requete.toString() ? `?${requete}` : "";

  const res = await fetchApi<Conversation[]>(session, `/conversations${suffixe}`);
  // Une panne n'est pas « aucune conversation » : le dire évite de croire que
  // ses échanges ont disparu.
  const enPanne = Boolean(res.error);
  const list = res.data ?? [];
  const active = activeId ?? list[0]?.id;

  const thread = active
    ? await fetchApi<{ conversation: Conversation; messages: Message[] }>(
        session,
        `/conversations/${active}`,
      )
    : { data: undefined };

  const lien = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    if (params.c) p.set("c", params.c);
    if (params.type) p.set("type", params.type);
    if (params.archives) p.set("archives", params.archives);
    return `/dashboard/inbox${p.toString() ? `?${p}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messagerie"
        subtitle={
          estIntervenant
            ? "Vos échanges avec les établissements, les familles et Les Extras, chacun rattaché à son contexte."
            : "Vos échanges avec votre équipe, les intervenants et Les Extras, chacun rattaché à son contexte."
        }
      />

      {/* Filtres par type de fil. */}
      <div className="flex flex-wrap gap-1.5">
        {filtres.map((f) => {
          const actif = typeFiltre === f.cle;
          return (
            <Link
              key={f.label}
              href={lien({ type: f.cle, archives: archives ? "1" : undefined })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                actif
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {f.label}
            </Link>
          );
        })}
        <Link
          href={lien({ type: typeFiltre, archives: archives ? undefined : "1" })}
          className={cn(
            "ml-auto rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            archives
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:border-primary/40",
          )}
        >
          {archives ? "Masquer les fils clos" : "Voir les fils clos"}
        </Link>
      </div>

      {enPanne ? (
        <EmptyState
          title="Messagerie momentanément indisponible"
          description="Vos conversations n'ont pas pu être chargées. Rechargez la page dans un instant."
        />
      ) : list.length === 0 ? (
        <EmptyState
          title="Aucune conversation"
          description="Les échanges démarrent avec une demande de devis, une candidature ou une réservation. C'est ce qui les rattache à quelque chose."
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
                      href={lien({
                        c: c.id,
                        type: typeFiltre,
                        archives: archives ? "1" : undefined,
                      })}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                        isActive && "bg-muted",
                      )}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={other?.avatarUrl ?? undefined} />
                        <AvatarFallback>
                          {initials(other?.firstName, other?.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-foreground">
                            {titreFil(c)}
                          </p>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {timeAgo(c.dernierMessageAt ?? c.updatedAt)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {/* Le nom de l'interlocuteur passe en sous-titre : le
                              titre, lui, dit de QUOI on parle. */}
                          {other ? `${fullName(other.firstName, other.lastName)} · ` : ""}
                          {c.lastMessage?.body ?? "Nouvelle conversation"}
                        </p>
                      </div>
                      {c.fermee ? (
                        <Badge variant="outline" className="shrink-0 text-[10px]">
                          clos
                        </Badge>
                      ) : c.unreadCount ? (
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
                <header className="space-y-2 border-b border-border px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {titreFil(thread.data.conversation)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(thread.data.conversation.participants ?? [])
                        .map((p) => fullName(p.firstName, p.lastName))
                        .filter(Boolean)
                        .join(", ") || "Vous seul pour l’instant"}
                    </p>
                  </div>

                  {/*
                    L'AVERTISSEMENT DONNÉES D'USAGERS — en tête, toujours.
                    Il vient du serveur pour qu'une seule phrase existe, et
                    qu'elle ne se périme pas dans un écran qu'on aurait oublié.
                  */}
                  {thread.data.conversation.avertissement && (
                    <p className="rounded-lg bg-muted/60 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
                      {thread.data.conversation.avertissement}
                    </p>
                  )}

                  {thread.data.conversation.explicationMasquage && (
                    <p className="rounded-lg border border-secondary/35 bg-secondary/10 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
                      {thread.data.conversation.explicationMasquage}
                    </p>
                  )}
                </header>

                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                  {thread.data.messages.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      Démarrez la conversation.
                    </p>
                  ) : (
                    thread.data.messages.map((m) => {
                      // Un message de la plateforme n'appartient à personne :
                      // il se lit au centre, en gris, et ne se confond pas avec
                      // la parole d'un collègue.
                      if (m.type === "SYSTEME") {
                        return (
                          <p
                            key={m.id}
                            className="py-1 text-center text-[11px] text-muted-foreground"
                          >
                            {m.body}
                          </p>
                        );
                      }
                      const mine = m.senderId === session.user.id;
                      const retire = Boolean(m.supprimeLe);
                      return (
                        <div
                          key={m.id}
                          className={cn("flex", mine ? "justify-end" : "justify-start")}
                        >
                          <div
                            className={cn(
                              "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                              retire
                                ? "border border-dashed border-border bg-transparent text-muted-foreground"
                                : mine
                                  ? "rounded-br-sm bg-primary text-primary-foreground"
                                  : "rounded-bl-sm bg-muted text-foreground",
                            )}
                          >
                            {!mine && (
                              <p className="mb-0.5 text-[11px] font-medium opacity-80">
                                {fullName(m.sender?.firstName, m.sender?.lastName)}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap">
                              {retire ? "Message retiré" : m.body}
                            </p>

                            {m.pieces && m.pieces.length > 0 && (
                              <ul className="mt-1.5 space-y-1">
                                {m.pieces.map((p) => (
                                  <li key={p.id}>
                                    <a
                                      href={`/api/proxy/files/${p.fileAsset.id}`}
                                      className="text-[11px] underline underline-offset-2"
                                    >
                                      {p.fileAsset.originalName}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}

                            <p
                              className={cn(
                                "mt-1 text-[10px]",
                                mine && !retire
                                  ? "text-primary-foreground/70"
                                  : "text-muted-foreground",
                              )}
                            >
                              {formatDateTime(m.createdAt)}
                              {m.modifieLe ? " · modifié" : ""}
                              {/* On dit à l'AUTEUR que son message a été amputé :
                                  sans cela, il croit avoir transmis son numéro. */}
                              {mine && m.coordonneesMasquees ? " · coordonnées retirées" : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {thread.data.conversation.fermee ? (
                  <p className="border-t border-border px-5 py-4 text-center text-xs text-muted-foreground">
                    Ce fil est clos. Il reste lisible, mais on ne peut plus y écrire.
                  </p>
                ) : (
                  <MessageComposer conversationId={active!} accountId={session.account.id} />
                )}
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
