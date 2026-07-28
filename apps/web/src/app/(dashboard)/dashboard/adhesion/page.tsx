// Adhésion à l'association — la seule chose qui se paie à l'avance.
// Les prestations (ateliers, formations, renforts) se règlent à la facture :
// il n'y a plus de crédits à recharger, un seul prix par prestation.
import type { Metadata } from "next";
import Link from "next/link";
import { Check, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle, ErrorState } from "../../../_shared/ui";
import { CheckoutButton } from "../../../_shared/BillingActions";
import { formatDate } from "../../../_shared/format";

export const metadata: Metadata = { title: "Adhésion" };

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
  subscription?: Subscription | null;
  plans: Plan[];
  configured: boolean;
}

const euros = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const STATUT: Record<string, string> = {
  active: "Active",
  pending: "En attente de paiement",
  past_due: "Paiement en retard",
  canceled: "Résiliée",
};

const INCLUS_ADHESION = [
  "LEX · Assistant d'écriture — notes brutes transformées en écrit professionnel",
  "LEX · Générateur d'activités éducatives et thérapeutiques",
  "LEX · Aide au remplissage des fiches ateliers et formations",
  "Le bot d'aide dans votre espace et sur le site",
];

const GRATUIT = [
  "Gérer votre équipe interne, le planning et le pointage des heures",
  "Publier vos ateliers et vos formations",
  "Le coffre-fort de conformité et les documents obligatoires",
  "Demander un devis, consulter le catalogue, échanger en messagerie",
];

export default async function AdhesionPage({
  searchParams,
}: {
  searchParams: { paiement?: string };
}) {
  const session = await requireSession();
  const accountId = session.account.id;
  const res = await fetchApi<Overview>(session, `/billing/overview?accountId=${accountId}`);

  if (res.error || !res.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Adhésion" subtitle="Votre adhésion à l'association ADéPA." />
        <ErrorState description={res.error ?? "Données indisponibles."} />
      </div>
    );
  }

  const { subscription, plans, configured } = res.data;
  const retour = searchParams.paiement;
  const active = subscription?.status === "active";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Adhésion"
        subtitle="L'adhésion donne accès à LEX, l'assistant IA. Tout le reste de la plateforme reste gratuit, et les prestations se règlent à la facture."
      />

      {retour === "succes" ? (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="p-4 text-sm text-foreground">
            <span className="font-semibold">Paiement confirmé.</span> Votre adhésion sera active
            d&apos;ici quelques secondes.
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
            Le paiement en ligne n&apos;est pas encore activé (clés Stripe en attente). Les boutons
            ci-dessous seront fonctionnels dès l&apos;activation.
          </CardContent>
        </Card>
      ) : null}

      {/* ── Adhésion en cours ── */}
      {subscription ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="font-medium text-foreground">
                {plans.find((p) => p.id === subscription.planId)?.label ?? subscription.planId}
              </p>
              <p className="text-sm text-muted-foreground">
                {subscription.currentPeriodEnd
                  ? `Prochaine échéance : ${formatDate(subscription.currentPeriodEnd)}`
                  : "Renouvellement mensuel automatique"}
              </p>
            </div>
            <Badge variant={active ? "default" : "secondary"}>
              {STATUT[subscription.status] ?? subscription.status}
            </Badge>
          </CardContent>
        </Card>
      ) : null}

      {!active ? (
        <section className="space-y-4">
          <SectionTitle title="Adhérer" />
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
                    label="Adhérer"
                    disabled={!configured}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── Ce que couvre l'adhésion, et ce qui reste gratuit ── */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold">Ce que débloque l&apos;adhésion</h2>
            <ul className="mt-3 space-y-2">
              {INCLUS_ADHESION.map((i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold">Ce qui reste gratuit, adhérent ou non</h2>
            <ul className="mt-3 space-y-2">
              {GRATUIT.map((i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* ── Comment se règlent les prestations ── */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Receipt className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-semibold">Les prestations se règlent à la facture</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Un atelier, une formation, un renfort : vous voyez le prix avant de réserver, vous
                recevez une facture après l&apos;intervention, vous payez cette facture. Rien à
                recharger à l&apos;avance, aucune monnaie interne, aucun solde à surveiller.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/dashboard/finance">Voir mes factures</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
