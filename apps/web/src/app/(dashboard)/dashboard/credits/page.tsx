// Abonnement & crédits : statut d'abonnement, solde, rechargement par packs.
// Paiement via Stripe Checkout (compte Stripe ADéPA) — page réservée aux
// comptes établissement.
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle, ErrorState } from "../../../_shared/ui";
import { CheckoutButton } from "../../../_shared/BillingActions";
import { formatDate } from "../../../_shared/format";

export const metadata: Metadata = { title: "Abonnement & crédits · Les Extras" };

interface Pack {
  id: string;
  label: string;
  credits: number;
  amountCents: number;
}
interface Plan {
  id: string;
  label: string;
  amountCents: number;
  perks: string;
}
interface Subscription {
  planId: string;
  status: string;
  currentPeriodEnd?: string | null;
}
interface Overview {
  balance: number;
  subscription?: Subscription | null;
  packs: Pack[];
  plans: Plan[];
  configured: boolean;
}

const euros = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const SUB_STATUS_LABEL: Record<string, string> = {
  active: "Actif",
  pending: "En attente de paiement",
  past_due: "Paiement en retard",
  canceled: "Résilié",
};

export default async function CreditsPage({
  searchParams,
}: {
  searchParams: { paiement?: string };
}) {
  const session = await requireSession();
  const accountId = session.account.id;
  const res = await fetchApi<Overview>(
    session,
    `/billing/overview?accountId=${accountId}`,
  );

  if (res.error || !res.data) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Abonnement & crédits"
          subtitle="Gérez votre abonnement et rechargez vos crédits."
        />
        <ErrorState message={res.error ?? "Données indisponibles."} />
      </div>
    );
  }

  const { balance, subscription, packs, plans, configured } = res.data;
  const retour = searchParams.paiement;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Abonnement & crédits"
        subtitle="Abonnement mensuel, rechargement de crédits et paiements sécurisés par Stripe."
      />

      {retour === "succes" ? (
        <Card className="border-emerald-200 bg-emerald-50/60">
          <CardContent className="p-4 text-sm text-emerald-900">
            <span className="font-semibold">Paiement confirmé.</span> Votre compte
            sera mis à jour d&apos;ici quelques secondes (créditation automatique).
          </CardContent>
        </Card>
      ) : null}
      {retour === "annule" ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 text-sm text-foreground">
            Paiement annulé — aucun montant n&apos;a été débité.
          </CardContent>
        </Card>
      ) : null}
      {!configured ? (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="p-4 text-sm text-foreground">
            Le paiement en ligne n&apos;est pas encore activé (clés Stripe en
            attente). Les boutons ci-dessous seront fonctionnels dès l&apos;activation.
          </CardContent>
        </Card>
      ) : null}

      {/* ── Abonnement ── */}
      <section className="space-y-4">
        <SectionTitle>Abonnement</SectionTitle>
        {subscription ? (
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="font-medium text-foreground">
                  Plan {plans.find((p) => p.id === subscription.planId)?.label ?? subscription.planId}
                </p>
                <p className="text-sm text-muted-foreground">
                  {subscription.currentPeriodEnd
                    ? `Prochaine échéance : ${formatDate(subscription.currentPeriodEnd)}`
                    : "Renouvellement mensuel automatique"}
                </p>
              </div>
              <Badge variant={subscription.status === "active" ? "default" : "secondary"}>
                {SUB_STATUS_LABEL[subscription.status] ?? subscription.status}
              </Badge>
            </CardContent>
          </Card>
        ) : null}
        {!subscription || subscription.status !== "active" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {plans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-foreground">{plan.label}</p>
                    <p className="text-lg font-bold text-primary">
                      {euros(plan.amountCents)}
                      <span className="text-xs font-normal text-muted-foreground"> /mois</span>
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.perks}</p>
                  <CheckoutButton
                    accountId={accountId}
                    kind="subscription"
                    planId={plan.id}
                    label="S'abonner"
                    disabled={!configured}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}
      </section>

      {/* ── Rechargement de crédits ── */}
      <section className="space-y-4">
        <SectionTitle>Rechargement de crédits</SectionTitle>
        <Card>
          <CardContent className="flex items-center justify-between p-5">
            <p className="text-sm text-muted-foreground">Solde actuel</p>
            <p className="text-2xl font-bold text-foreground">
              {balance} crédit{balance > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-3">
          {packs.map((pack) => (
            <Card key={pack.id}>
              <CardContent className="space-y-3 p-5">
                <p className="font-semibold text-foreground">{pack.label}</p>
                <p className="text-2xl font-bold text-primary">{pack.credits} crédits</p>
                <p className="text-sm text-muted-foreground">{euros(pack.amountCents)} TTC — paiement en une fois</p>
                <CheckoutButton
                  accountId={accountId}
                  kind="credit_pack"
                  packId={pack.id}
                  label="Recharger"
                  variant="outline"
                  disabled={!configured}
                />
              </CardContent>
            </Card>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Paiement sécurisé par Stripe. Le solde est crédité automatiquement à la
          confirmation du paiement ; l&apos;historique complet est visible dans
          Finance.
        </p>
      </section>
    </div>
  );
}
