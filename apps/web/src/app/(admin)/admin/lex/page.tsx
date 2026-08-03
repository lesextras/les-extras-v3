// LEX — LE TABLEAU DE BORD DU PRODUIT PAYANT.
//
// L'association vit de deux recettes : les formations Qualiopi (au devis) et
// LEX. Cette page répond aux trois questions qu'on se pose chaque semaine :
// combien vendu, combien consommé, combien d'abonnés — chiffres tirés des
// écritures réelles (achats Stripe, grand livre des crédits), jamais d'un
// compteur parallèle.
import type { Metadata } from "next";
import { Sparkles, Coins, TrendingUp, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, SectionTitle, ErrorState, StatCard, EmptyState } from "../../../_shared/ui";
import { formatDateTime } from "../../../_shared/format";

export const metadata: Metadata = { title: "LEX — Crédits & abonnements · Administration" };

interface Achat {
  id: string;
  packId: string;
  credits: number;
  amountCents: number;
  status: "PENDING" | "PAID" | "CANCELED";
  createdAt: string;
  account?: { id: string; name: string; type: string } | null;
}

interface LexStats {
  ventes: {
    total: { achats: number; credits: number; montantCents: number };
    trenteJours: { achats: number; credits: number; montantCents: number };
  };
  consommation: {
    total: { generations: number; credits: number };
    trenteJours: { generations: number; credits: number };
  };
  abonnements: { planId: string; actifs: number }[];
  essaisActifs: number;
  creditsEnCirculation: number;
  comptesIllimites: number;
  derniersAchats: Achat[];
}

const euros = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

const PLAN_LABEL: Record<string, string> = {
  "plan-essentiel": "LEX",
  "plan-pro": "LEX Pro",
};

const STATUT_ACHAT: Record<string, { label: string; variant: "success" | "warning" | "muted" }> = {
  PAID: { label: "Payé", variant: "success" },
  PENDING: { label: "En attente", variant: "warning" },
  CANCELED: { label: "Annulé", variant: "muted" },
};

export default async function AdminLexPage() {
  const session = await requireAdmin();
  const res = await fetchApi<LexStats>(session, "/admin/lex");

  if (res.error || !res.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="LEX — Crédits & abonnements" subtitle="Ventes, consommation et abonnés de l'assistant IA." />
        <ErrorState description={res.error ?? "Données indisponibles."} />
      </div>
    );
  }

  const s = res.data;
  const abonnesTotal = s.abonnements.reduce((n, a) => n + a.actifs, 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="LEX — Crédits & abonnements"
        subtitle="Ce qui se vend, ce qui se consomme, qui est abonné — tiré des écritures réelles."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ventes (30 jours)"
          value={euros(s.ventes.trenteJours.montantCents)}
          hint={`${s.ventes.trenteJours.achats} achat(s) · ${s.ventes.trenteJours.credits} crédits — total : ${euros(s.ventes.total.montantCents)}`}
          icon={<Coins className="h-4 w-4" />}
          accent="teal"
        />
        <StatCard
          label="Consommation (30 jours)"
          value={s.consommation.trenteJours.credits}
          hint={`${s.consommation.trenteJours.generations} génération(s) — total : ${s.consommation.total.credits} crédits`}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="neutral"
        />
        <StatCard
          label="Abonnements actifs"
          value={abonnesTotal}
          hint={
            s.abonnements.length > 0
              ? s.abonnements.map((a) => `${PLAN_LABEL[a.planId] ?? a.planId} : ${a.actifs}`).join(" · ")
              : "aucun abonnement actif"
          }
          icon={<Users className="h-4 w-4" />}
          accent={abonnesTotal > 0 ? "teal" : "neutral"}
        />
        <StatCard
          label="Essais en cours"
          value={s.essaisActifs}
          hint={`${s.creditsEnCirculation} crédits en circulation · ${s.comptesIllimites} compte(s) en illimité`}
          icon={<Sparkles className="h-4 w-4" />}
          accent="neutral"
        />
      </div>

      <section className="space-y-3">
        <SectionTitle title="Derniers achats de packs" />
        {s.derniersAchats.length === 0 ? (
          <EmptyState
            title="Aucun achat pour l'instant"
            description="Les achats de packs de crédits apparaîtront ici dès le premier paiement Stripe."
          />
        ) : (
          <Card>
            <CardContent className="divide-y p-0">
              {s.derniersAchats.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {a.account?.name ?? "Compte supprimé"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {a.packId} · {a.credits} crédits · {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-semibold">{euros(a.amountCents)}</span>
                    <Badge variant={STATUT_ACHAT[a.status]?.variant ?? "muted"}>
                      {STATUT_ACHAT[a.status]?.label ?? a.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        L&apos;accès LEX illimité s&apos;accorde compte par compte depuis «&nbsp;Comptes &amp;
        sous-comptes&nbsp;» (bouton LEX&nbsp;∞). Les recharges quotidiennes des abonnés et des
        essais tournent chaque matin à 6&nbsp;h.
      </p>
    </div>
  );
}
