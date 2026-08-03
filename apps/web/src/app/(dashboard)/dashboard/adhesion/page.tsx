// LEX — CRÉDITS & ABONNEMENT, l'écran « Utilisation » façon Claude.
//
// Le modèle économique de la plateforme tient en trois lignes : la mise en
// relation et l'aide à la contractualisation (renforts, ateliers) sont
// GRATUITES pour tout le monde ; les formations Qualiopi se facturent au
// devis par l'association ; LEX, l'assistant IA, est le produit payant —
// un crédit par génération. On recharge par packs, ou par un abonnement
// dont l'allocation quotidienne remet le solde à niveau chaque matin.
import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sparkles, Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle, ErrorState } from "../../../_shared/ui";
import { CheckoutButton } from "../../../_shared/BillingActions";
import { EssaiLexButton } from "../../../_shared/EssaiLexButton";
import { formatDate } from "../../../_shared/format";

export const metadata: Metadata = { title: "LEX — Crédits & abonnement" };

interface Plan {
  id: string;
  label: string;
  amountCents: number;
  dailyCredits: number;
  perks: string;
}
interface Pack {
  id: string;
  label: string;
  credits: number;
  amountCents: number;
}
interface Subscription {
  planId: string;
  status: string;
  currentPeriodEnd?: string | null;
}
interface Overview {
  credits: number;
  illimite: boolean;
  essai?: { finLe: string; actif: boolean } | null;
  essaiJours?: number;
  essaiCreditsParJour?: number;
  subscription?: Subscription | null;
  plans: Plan[];
  packs: Pack[];
  configured: boolean;
}
interface Mouvement {
  id: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
}
interface Utilisation {
  credits: number;
  illimite: boolean;
  consomme30Jours: number;
  mouvements: Mouvement[];
}

const euros = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const STATUT: Record<string, string> = {
  active: "Actif",
  pending: "En attente de paiement",
  past_due: "Paiement en retard",
  canceled: "Résilié",
};

/** Libellés lisibles des motifs du grand livre. */
const MOTIF: Record<string, string> = {
  LEX_ECRIT: "Écrit professionnel généré",
  LEX_ACTIVITE: "Activité générée",
  LEX_FICHE: "Fiche pré-remplie",
  LEX_GAPISTE: "Tour de GAPiste",
  ACHAT_PACK: "Achat d'un pack de crédits",
  ESSAI_DECOUVERTE: "Essai Découverte (gratuit)",
  RECHARGE_QUOTIDIENNE: "Recharge quotidienne (abonnement)",
  REMBOURSEMENT_LEX_ECRIT: "Remboursement — génération échouée",
  REMBOURSEMENT_LEX_ACTIVITE: "Remboursement — génération échouée",
  REMBOURSEMENT_LEX_FICHE: "Remboursement — génération échouée",
  REMBOURSEMENT_LEX_GAPISTE: "Remboursement — génération échouée",
  STRIPE_PURCHASE: "Achat de crédits",
};

export default async function LexCreditsPage({
  searchParams,
}: {
  searchParams: { paiement?: string };
}) {
  const session = await requireSession();
  const accountId = session.account.id;
  const [resOverview, resUtilisation] = await Promise.all([
    fetchApi<Overview>(session, "/billing/overview"),
    fetchApi<Utilisation>(session, "/billing/utilisation"),
  ]);

  if (resOverview.error || !resOverview.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="LEX — Crédits & abonnement" subtitle="Votre utilisation de l'assistant IA." />
        <ErrorState description={resOverview.error ?? "Données indisponibles."} />
      </div>
    );
  }

  const { credits, illimite, essai, essaiJours, essaiCreditsParJour, subscription, plans, packs, configured } =
    resOverview.data;
  const utilisation = resUtilisation.data;
  const retour = searchParams.paiement;
  const active = subscription?.status === "active";
  const planActif = active ? plans.find((p) => p.id === subscription?.planId) : null;
  // Jauge : par rapport à l'allocation quotidienne si abonné, sinon au plus
  // gros pack — un repère visuel, pas une limite.
  const repere = planActif?.dailyCredits ?? Math.max(...packs.map((p) => p.credits), 1);
  const pct = Math.max(0, Math.min(100, Math.round((credits / repere) * 100)));

  return (
    <div className="space-y-8">
      <PageHeader
        title="LEX — Crédits & abonnement"
        subtitle="LEX est le seul outil payant de votre espace : un crédit par génération. Toute la mise en relation — renforts, ateliers, contractualisation — reste gratuite."
      />

      {retour === "succes" ? (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="p-4 text-sm text-foreground">
            <span className="font-semibold">Paiement confirmé.</span> Vos crédits seront visibles
            d&apos;ici quelques secondes — rechargez la page si besoin.
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

      {/* ── Utilisation : solde, jauge, consommation ── */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {illimite ? "Illimité" : `${credits} crédit${credits > 1 ? "s" : ""}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {illimite
                    ? "Accès illimité accordé à votre compte"
                    : planActif
                      ? `Abonnement ${planActif.label} — solde remis à ${planActif.dailyCredits} crédits chaque matin`
                      : "Solde disponible — 1 crédit = 1 génération LEX"}
                </p>
              </div>
            </div>
            {subscription ? (
              <Badge variant={active ? "default" : "secondary"}>
                {STATUT[subscription.status] ?? subscription.status}
              </Badge>
            ) : null}
          </div>

          {!illimite ? (
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${pct}%` }}
                  aria-hidden
                />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                <span>
                  {utilisation
                    ? `${utilisation.consomme30Jours} crédit${utilisation.consomme30Jours > 1 ? "s" : ""} consommé${utilisation.consomme30Jours > 1 ? "s" : ""} sur 30 jours`
                    : null}
                </span>
                <span>
                  {planActif
                    ? `Allocation quotidienne : ${planActif.dailyCredits}`
                    : `Repère : ${repere} crédits`}
                </span>
              </div>
            </div>
          ) : null}

          {subscription && active && subscription.currentPeriodEnd ? (
            <p className="text-sm text-muted-foreground">
              Prochaine échéance : {formatDate(subscription.currentPeriodEnd)}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Essai Découverte : gratuit, une fois, 7 jours ── */}
      {!illimite && !active && !essai ? (
        <Card className="border-primary/30 bg-primary-soft/30">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-foreground">
                Pack Découverte — gratuit, {essaiJours ?? 7} jours
              </p>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Essayez LEX sans rien payer : {essaiCreditsParJour ?? 10} crédits rechargés chaque
                matin pendant {essaiJours ?? 7} jours, sans carte bancaire ni engagement. Une seule
                fois par compte.
              </p>
            </div>
            <div className="shrink-0">
              <EssaiLexButton accountId={accountId} />
            </div>
          </CardContent>
        </Card>
      ) : null}
      {essai?.actif ? (
        <Card className="border-success/30 bg-success/10">
          <CardContent className="p-4 text-sm text-foreground">
            <span className="font-semibold">Essai Découverte en cours</span> — recharge quotidienne
            gratuite jusqu&apos;au {formatDate(essai.finLe)}. Ensuite, rechargez par pack ou
            prenez un abonnement.
          </CardContent>
        </Card>
      ) : null}

      {/* ── Recharger : packs en une fois ── */}
      {!illimite ? (
        <section className="space-y-4">
          <div>
            <SectionTitle title="Recharger des crédits" />
            <p className="mt-1 text-sm text-muted-foreground">
              Paiement en une fois — les crédits achetés n&apos;expirent pas.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {packs.map((pack) => (
              <Card key={pack.id}>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-baseline justify-between">
                    <p className="font-semibold text-foreground">{pack.label}</p>
                    <p className="text-lg font-bold text-primary">{euros(pack.amountCents)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pack.credits} crédits — soit {pack.credits} générations LEX
                  </p>
                  <CheckoutButton
                    accountId={accountId}
                    kind="credits"
                    packId={pack.id}
                    label="Recharger"
                    variant="outline"
                    disabled={!configured}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* ── S'abonner : recharge quotidienne ── */}
      {!illimite && !active ? (
        <section className="space-y-4">
          <div>
            <SectionTitle title="S'abonner — recharge quotidienne" />
            <p className="mt-1 text-sm text-muted-foreground">
              Chaque matin, votre solde est remis au niveau de votre allocation quotidienne.
              Pour un usage régulier, c&apos;est plus simple qu&apos;un pack.
            </p>
          </div>
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
        </section>
      ) : null}

      {/* ── Historique de consommation ── */}
      {utilisation && utilisation.mouvements.length > 0 ? (
        <section className="space-y-3">
          <div>
            <SectionTitle title="Historique" />
            <p className="mt-1 text-sm text-muted-foreground">
              Les 50 derniers mouvements de votre compte de crédits.
            </p>
          </div>
          <Card>
            <CardContent className="divide-y p-0">
              {utilisation.mouvements.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-foreground">
                      {MOTIF[m.reason] ?? m.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(m.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p
                      className={
                        m.delta > 0
                          ? "text-sm font-semibold text-success"
                          : "text-sm font-semibold text-foreground"
                      }
                    >
                      {m.delta > 0 ? `+${m.delta}` : m.delta}
                    </p>
                    <p className="text-xs text-muted-foreground">solde : {m.balanceAfter}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* ── Ce que couvrent les crédits, et ce qui reste gratuit ── */}
      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold">Ce que consomment les crédits</h2>
            <ul className="mt-3 space-y-2">
              {[
                "LEX · Assistant d'écriture — notes brutes transformées en écrit professionnel",
                "LEX · Générateur d'activités éducatives et thérapeutiques",
                "LEX · Aide au remplissage des fiches ateliers et formations",
                "LEX · GAPiste — animation du groupe d'analyse de pratique",
              ].map((i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Un crédit par génération. Si une génération échoue, le crédit est automatiquement
              remboursé. Le bot d&apos;aide, lui, est gratuit.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h2 className="font-semibold">Ce qui reste gratuit, pour tous</h2>
            <ul className="mt-3 space-y-2">
              {[
                "Publier des renforts et y candidater, jusqu'au contrat signé",
                "Proposer et réserver des ateliers, de la demande à la facture",
                "Gérer votre équipe, le planning, le pointage et la conformité",
                "La messagerie, le catalogue, les devis et le bot d'aide",
              ].map((i) => (
                <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {i}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>

      {/* ── Et les formations ? ── */}
      <Card>
        <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <Receipt className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
            <div>
              <h2 className="font-semibold">Les formations Qualiopi se facturent au devis</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                C&apos;est l&apos;autre service payant de la plateforme — mais pas ici : les
                formations sont facturées par l&apos;association ADéPA, certifiée Qualiopi, qui fait
                appel aux formateurs du réseau Les Extras. Demandez un devis depuis le catalogue,
                réglez la facture après la session.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/formations">Voir le catalogue</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
