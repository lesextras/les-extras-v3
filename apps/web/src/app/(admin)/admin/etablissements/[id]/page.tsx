// Back-office ADMIN, fiche compte : infos + accès enregistrés.
// ⚠ Un compte Les Extras = une personne (24/09/2026) : seul le titulaire y
// accède. Les autres accès, hérités d'avant, se lisent « Accès fermé ».
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../../_shared/server";
import { PageHeader, ErrorState } from "../../../../_shared/ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Fiche compte · Administration" };

import { libelleAcces } from "../../../../_shared/format";

interface Member {
  id: string;
  role: string;
  status?: string;
  user?: { id: string; email?: string | null; firstName?: string | null; lastName?: string | null } | null;
}
interface AccountDetail {
  id: string;
  name: string;
  type: "ESTABLISHMENT" | "FREELANCE";
  legalName?: string | null;
  siret?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  owner?: { email?: string | null; firstName?: string | null; lastName?: string | null } | null;
  memberships?: Member[];
}

function fullName(m: Member) {
  const n = [m.user?.firstName, m.user?.lastName].filter(Boolean).join(" ");
  return n || m.user?.email || ", ";
}

export default async function AdminAccountDetailPage({ params: paramsPromesse }: { params: Promise<{ id: string }>}) {
  const params = await paramsPromesse;
  const session = await requireAdmin();
  const res = await fetchApi<AccountDetail>(session, `/admin/accounts/${params.id}`);
  const a = res.data;

  if (res.error || !a) {
    return (
      <div className="space-y-6">
        <PageHeader title="Fiche compte" />
        <ErrorState retryHref="/admin/etablissements" description="Compte introuvable." />
      </div>
    );
  }

  const members = a.memberships ?? [];

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link href="/admin/etablissements" className="text-muted-foreground hover:text-foreground">
          ← Retour aux comptes
        </Link>
      </div>

      <PageHeader
        title={a.name}
        subtitle={a.type === "ESTABLISHMENT" ? "Établissement" : "Compte intervenant"}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <h3 className="font-semibold text-foreground">Informations</h3>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Type" value={a.type === "ESTABLISHMENT" ? "Établissement" : "Intervenant"} />
            <Row label="Raison sociale" value={a.legalName} />
            <Row label="SIRET" value={a.siret} />
            <Row label="Ville" value={[a.postalCode, a.city].filter(Boolean).join(" ")} />
            <Row label="Téléphone" value={a.phone} />
            <Row
              label="Titulaire"
              value={
                a.owner
                  ? [a.owner.firstName, a.owner.lastName].filter(Boolean).join(" ") || a.owner.email
                  : null
              }
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Accès au compte</h3>
              <Badge variant="muted">{members.length} accès</Badge>
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aucun accès enregistré pour le moment.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{fullName(m)}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.user?.email}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant={m.role === "OWNER" ? "soft" : "muted"}>
                        {libelleAcces(m.role, a.type)}
                      </Badge>
                      {m.status && m.status !== "ACTIVE" ? (
                        <Badge variant="outline">{m.status}</Badge>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value || ", "}</span>
    </div>
  );
}
