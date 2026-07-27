// Back-office ADMIN — tunnel d'acquisition.
// Répond à une seule question : quelle fiche travaille réellement ?
// Source : /admin/stats/funnel (compteurs `views` / `requestsCount` croisés
// avec les devis et les réservations).
import type { Metadata } from "next";
import Link from "next/link";
import { Eye, MessageSquareQuote, FileText, CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, StatCard, ErrorState, EmptyState, SectionTitle } from "../../../_shared/ui";
import { formatMoney } from "../../../_shared/format";

export const metadata: Metadata = { title: "Tunnel d'acquisition · Administration" };

interface LigneAtelier {
  id: string;
  titre: string;
  vues: number;
  demandes: number;
  devis: number;
  reservations: number;
  prix?: string | number | null;
  conversion: number | null;
}

interface LigneFormation {
  id: string;
  slug: string;
  titre: string;
  vues: number;
  demandes: number;
  conversion: number | null;
}

interface Funnel {
  global: {
    vues: number;
    demandes: number;
    devis: number;
    reservations: number;
    reservationsTotales: number;
    demandesPubliques: number;
    tauxVueVersDemande: number | null;
    tauxDemandeVersDevis: number | null;
    tauxDevisVersReservation: number | null;
  };
  ateliers: LigneAtelier[];
  formations: LigneFormation[];
}

function pourcent(v: number | null): string {
  return v == null ? "—" : `${v} %`;
}

export default async function TunnelPage() {
  const session = await requireAdmin();
  const { data, error } = await fetchApi<Funnel>(session, "/admin/stats/funnel");

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Tunnel d'acquisition" />
        <ErrorState description={error} />
      </div>
    );
  }

  const g = data.global;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tunnel d'acquisition"
        subtitle="De la vue d'une fiche à la réservation signée. Les taux se lisent d'un étage à l'autre : c'est là que se voient les fiches à pousser et celles à réécrire."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Vues de fiches" value={g.vues} icon={<Eye />} accent="teal" />
        <StatCard
          label="Demandes"
          value={g.demandes}
          hint={`${pourcent(g.tauxVueVersDemande)} des vues`}
          icon={<MessageSquareQuote />}
        />
        <StatCard
          label="Devis"
          value={g.devis}
          hint={`${pourcent(g.tauxDemandeVersDevis)} des demandes`}
          icon={<FileText />}
          accent="warning"
        />
        <StatCard
          label="Réservations issues d'un devis"
          value={g.reservations}
          hint={`${pourcent(g.tauxDevisVersReservation)} des devis · ${g.reservationsTotales} réservations toutes origines`}
          icon={<CalendarCheck />}
          accent="terracotta"
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {g.demandesPubliques} demande{g.demandesPubliques > 1 ? "s" : ""} déposée
        {g.demandesPubliques > 1 ? "s" : ""} depuis les formulaires publics (contact et devis sans
        compte).
      </p>

      <section className="space-y-4">
        <SectionTitle title="Ateliers, du plus vu au moins vu" />
        {data.ateliers.length === 0 ? (
          <EmptyState
            title="Aucune fiche publiée"
            description="Publiez au moins un atelier pour que le tunnel se remplisse."
          />
        ) : (
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fiche</th>
                    <th className="px-4 py-3 text-right font-medium">Vues</th>
                    <th className="px-4 py-3 text-right font-medium">Demandes</th>
                    <th className="px-4 py-3 text-right font-medium">Devis</th>
                    <th className="px-4 py-3 text-right font-medium">Réservations</th>
                    <th className="px-4 py-3 text-right font-medium">Conversion</th>
                    <th className="px-4 py-3 text-right font-medium">Prix</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ateliers.map((a) => (
                    <tr key={a.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/ateliers/${a.id}`}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {a.titre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right [font-variant-numeric:tabular-nums]">
                        {a.vues}
                      </td>
                      <td className="px-4 py-3 text-right [font-variant-numeric:tabular-nums]">
                        {a.demandes}
                      </td>
                      <td className="px-4 py-3 text-right [font-variant-numeric:tabular-nums]">
                        {a.devis}
                      </td>
                      <td className="px-4 py-3 text-right [font-variant-numeric:tabular-nums]">
                        {a.reservations}
                      </td>
                      <td className="px-4 py-3 text-right [font-variant-numeric:tabular-nums]">
                        {pourcent(a.conversion)}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        {a.prix ? formatMoney(a.prix) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>

      {data.formations.length > 0 ? (
        <section className="space-y-4">
          <SectionTitle title="Formations" />
          <Card>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Formation</th>
                    <th className="px-4 py-3 text-right font-medium">Vues</th>
                    <th className="px-4 py-3 text-right font-medium">Demandes</th>
                    <th className="px-4 py-3 text-right font-medium">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.formations.map((f) => (
                    <tr key={f.id} className="border-b border-border/60 last:border-0">
                      <td className="px-4 py-3">
                        <Link
                          href={`/formations/${f.slug}`}
                          className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                          {f.titre}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right [font-variant-numeric:tabular-nums]">
                        {f.vues}
                      </td>
                      <td className="px-4 py-3 text-right [font-variant-numeric:tabular-nums]">
                        {f.demandes}
                      </td>
                      <td className="px-4 py-3 text-right [font-variant-numeric:tabular-nums]">
                        {pourcent(f.conversion)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
