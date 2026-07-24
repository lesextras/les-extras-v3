// Back-office ADMIN — Coffre-fort de conformité : complétude agrégée par
// établissement + alertes (pièces à renouveler / manquantes).
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState, StatCard } from "../../../_shared/ui";

export const metadata: Metadata = { title: "Conformité intervenants · Administration" };

interface AccountRow {
  account: { id: string; name: string; slug: string | null; city: string | null };
  memberCount: number;
  pctAvg: number;
  expiringSoon: number;
  missing: number;
  fullyCompliant: number;
}
interface Overview {
  requiredTypes: string[];
  totalAccounts: number;
  accounts: AccountRow[];
}

function ProgressBar({ pct }: { pct: number }) {
  const tone = pct >= 100 ? "bg-success" : pct >= 50 ? "bg-primary" : "bg-secondary";
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full ${tone}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
    </div>
  );
}

export default async function AdminConformitePage() {
  const session = await requireAdmin();
  const { data, error } = await fetchApi<Overview>(session, "/admin/conformite");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coffre-fort de conformité"
        subtitle="Suivi réglementaire des pièces obligatoires des intervenants, agrégé par établissement."
      />

      {error || !data ? (
        <ErrorState retryHref="/admin/conformite" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Établissements suivis" value={data.totalAccounts} accent="neutral" />
            <StatCard
              label="Pièces à renouveler"
              value={data.accounts.reduce((acc, a) => acc + a.expiringSoon, 0)}
              accent="terracotta"
            />
            <StatCard
              label="Pièces manquantes"
              value={data.accounts.reduce((acc, a) => acc + a.missing, 0)}
              accent="neutral"
            />
          </div>

          {data.accounts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Aucun établissement à afficher pour le moment.
            </div>
          ) : (
            <div className="space-y-3">
              {data.accounts.map((row) => (
                <div key={row.account.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{row.account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.account.city ? `${row.account.city} · ` : ""}
                        {row.memberCount} intervenant{row.memberCount > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {row.missing > 0 ? <Badge variant="muted">{row.missing} manquante(s)</Badge> : null}
                      {row.expiringSoon > 0 ? (
                        <Badge variant="warning">{row.expiringSoon} à renouveler</Badge>
                      ) : null}
                      <Badge variant="success">{row.fullyCompliant} conforme(s)</Badge>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Complétude moyenne</span>
                      <span className="font-semibold text-foreground">{row.pctAvg}%</span>
                    </div>
                    <ProgressBar pct={row.pctAvg} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
