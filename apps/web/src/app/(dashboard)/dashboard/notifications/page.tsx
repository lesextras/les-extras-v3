// NOTIFICATIONS — la page qui manquait derrière la pastille.
//
// La pastille du haut comptait des notifications (candidature reçue, contrat
// signé, rappel du vivier…) mais pointait vers la messagerie, et aucun écran
// ne listait ces notifications ni ne remettait le compteur à zéro. Le badge
// montait, montait, et ne redescendait jamais.
//
// Ouvrir cette page marque tout comme lu : c'est le geste attendu — on a vu,
// le compteur repart de zéro.
import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../../../_shared/ui";
import { timeAgo } from "../../../_shared/format";
import { MarquerLues } from "../../../_shared/MarquerLues";

export const metadata: Metadata = { title: "Notifications" };

interface Notification {
  id: string;
  type: string;
  title: string;
  body?: string | null;
  link?: string | null;
  readAt?: string | null;
  createdAt: string;
}

export default async function NotificationsPage() {
  const session = await requireSession();
  const res = await fetchApi<Notification[]>(session, "/notifications");
  const liste = res.data ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Tout ce qui s'est passé pendant que vous étiez ailleurs."
      />
      {/* Composant client : marque tout lu à l'ouverture, une seule fois. */}
      <MarquerLues accountId={session.account.id} />

      {res.error ? (
        <ErrorState retryHref="/dashboard/notifications" />
      ) : liste.length === 0 ? (
        <EmptyState
          icon={<Bell className="size-6" />}
          title="Rien de nouveau"
          description="Les candidatures, signatures, rappels et confirmations apparaîtront ici."
        />
      ) : (
        <div className="space-y-2">
          {liste.map((n) => {
            const contenu = (
              <CardContent className="flex items-start gap-3 p-4">
                <span
                  className={
                    n.readAt
                      ? "mt-1.5 size-2 shrink-0 rounded-full bg-transparent"
                      : "mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                  }
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-medium text-foreground">
                      {n.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                  {n.body ? (
                    <span className="mt-0.5 block text-sm text-muted-foreground">{n.body}</span>
                  ) : null}
                </span>
              </CardContent>
            );
            return (
              <Card
                key={n.id}
                className={n.readAt ? "opacity-80" : "border-primary/30"}
              >
                {n.link ? (
                  <Link href={n.link} className="block hover:bg-muted/40">
                    {contenu}
                  </Link>
                ) : (
                  contenu
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
