// Avis après mission — boucle de confiance.
// Haut de page : les prestations terminées restant à évaluer (GET /reviews/pending)
// avec le formulaire de dépôt. Bas de page : les avis reçus par l'utilisateur.
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle, EmptyState, ErrorState } from "../../../_shared/ui";
import { ReviewForm } from "../../../_shared/ReviewForm";
import { ReviewList, type ReviewSummary } from "../../../_shared/ReviewList";
import { formatDate, fullName } from "../../../_shared/format";

export const metadata: Metadata = { title: "Avis · Les Extras" };

interface PendingReview {
  bookingId: string;
  label: string;
  scheduledAt?: string | null;
  completedAt: string;
  counterpart: {
    accountId: string;
    accountName: string;
    accountType: "ESTABLISHMENT" | "FREELANCE";
  };
  target: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    avatarUrl?: string | null;
  };
}

export default async function AvisPage() {
  const session = await requireSession();

  const [pending, received] = await Promise.all([
    fetchApi<PendingReview[]>(session, "/reviews/pending"),
    fetchApi<ReviewSummary>(session, `/reviews/user/${session.user.id}`),
  ]);

  const toGive = pending.data ?? [];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Avis"
        subtitle="Évaluez les prestations terminées et consultez les retours qui vous ont été adressés. Les avis alimentent le classement des candidats proposés par le moteur de mise en relation."
      />

      <section className="space-y-4">
        <SectionTitle
          title="Avis à donner"
          action={
            toGive.length > 0 ? (
              <Badge variant="secondary">
                {toGive.length} en attente
              </Badge>
            ) : null
          }
        />

        {pending.error ? (
          <ErrorState
            title="Impossible de charger les prestations à évaluer"
            retryHref="/dashboard/avis"
          />
        ) : toGive.length === 0 ? (
          <EmptyState
            title="Aucun avis à déposer"
            description="Les prestations terminées apparaîtront ici dès qu'elles seront clôturées, pour que vous puissiez évaluer l'autre partie."
          />
        ) : (
          <ul className="space-y-4">
            {toGive.map((item) => {
              const targetName = fullName(item.target.firstName, item.target.lastName);
              return (
                <li key={item.bookingId}>
                  <Card>
                    <CardContent className="space-y-5 p-5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-foreground">{item.label}</p>
                          <Badge variant="outline">
                            {item.counterpart.accountType === "ESTABLISHMENT"
                              ? "Établissement"
                              : "Intervenant"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.counterpart.accountName} — {targetName} · prestation terminée le{" "}
                          {formatDate(item.completedAt)}
                          {item.scheduledAt ? ` (planifiée le ${formatDate(item.scheduledAt)})` : ""}
                        </p>
                      </div>
                      <ReviewForm
                        bookingId={item.bookingId}
                        targetId={item.target.id}
                        accountId={session.account.id}
                        targetName={targetName}
                      />
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <SectionTitle title="Avis reçus" />
        {received.error || !received.data ? (
          <ErrorState title="Impossible de charger vos avis" retryHref="/dashboard/avis" />
        ) : (
          <ReviewList
            summary={received.data}
            emptyLabel="Vous n'avez pas encore reçu d'avis. Ils apparaîtront ici après vos premières prestations terminées."
          />
        )}
      </section>
    </div>
  );
}
