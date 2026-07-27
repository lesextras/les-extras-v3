// Back-office ADMIN — Registre des formations + Bilan Pédagogique et Financier.
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState, EmptyState } from "../../../_shared/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Registre & BPF · Administration" };

interface RegistreRow {
  id: string;
  formation: string;
  type: string | null;
  certifying: boolean;
  startDate: string;
  durationHours: number | null;
  inscrits: number;
  emargements: number;
  financements: Record<string, number>;
}
interface Bpf {
  year: number;
  nbSessions: number;
  stagiaires: number;
  heuresStagiaires: number;
  parFinancement: Record<string, number>;
  produits: Record<string, number>;
  produitTotal: number;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}
function eur(n: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
}

export default async function AdminRegistrePage() {
  const session = await requireAdmin();
  const [registreRes, bpfRes] = await Promise.all([
    fetchApi<RegistreRow[]>(session, "/admin/formations/registre"),
    fetchApi<Bpf>(session, "/admin/formations/bpf"),
  ]);
  const rows = Array.isArray(registreRes.data) ? registreRes.data : [];
  const bpf = bpfRes.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Registre & BPF"
        subtitle="Registre des formations et Bilan Pédagogique et Financier annuel (à ressaisir sur EDOF)."
        actions={
          <Button asChild variant="outline">
            <a href="/api/proxy/admin/formations/bpf.csv" download>
              Exporter le BPF (CSV)
            </a>
          </Button>
        }
      />

      {/* Synthèse BPF */}
      {bpf ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Année</p>
            <p className="text-2xl font-semibold">{bpf.year}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Stagiaires</p>
            <p className="text-2xl font-semibold">{bpf.stagiaires}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Heures-stagiaires</p>
            <p className="text-2xl font-semibold">{bpf.heuresStagiaires}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">Produits</p>
            <p className="text-2xl font-semibold">{eur(bpf.produitTotal)}</p>
          </div>
        </div>
      ) : null}

      {/* Registre */}
      {registreRes.error ? (
        <ErrorState retryHref="/admin/registre" />
      ) : rows.length === 0 ? (
        <EmptyState
          title="Registre vide"
          description="Les sessions de formation apparaîtront ici dès qu'elles seront planifiées."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Formation</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Durée</th>
                <th className="px-4 py-3">Inscrits</th>
                <th className="px-4 py-3">Émargements</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3 font-medium text-foreground">{r.formation}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.type === "INTERNE" ? "outline" : "soft"}>
                      {r.type === "INTERNE" ? "Interne" : "Certifiante"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{fmtDate(r.startDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.durationHours ? `${r.durationHours} h` : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.inscrits}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.emargements}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
