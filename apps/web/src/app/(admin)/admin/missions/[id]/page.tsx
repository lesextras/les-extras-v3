// Back-office ADMIN — aperçu d'une mission (voir le produit, tout statut).
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../../_shared/server";
import { PageHeader, ErrorState } from "../../../../_shared/ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MISSION_CATEGORY_LABEL,
  MISSION_STATUS_LABEL,
  missionBadgeVariant,
  formatDate,
  formatRate,
} from "../../../../_shared/format";
import { ModerateMissionActions } from "../../../../_shared/AdminActions";

export const metadata: Metadata = { title: "Aperçu mission · Administration" };

interface AdminMission {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  job?: string | null;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  city?: string | null;
  postalCode?: string | null;
  hourlyRate?: number | string | null;
  headcount: number;
  visibility?: string | null;
  account?: { id: string; name: string; city?: string | null; type?: string } | null;
  categoryRef?: { id: string; title: string } | null;
  _count?: { bookings?: number };
}

export default async function AdminMissionDetail({ params }: { params: { id: string } }) {
  const session = await requireAdmin();
  const res = await fetchApi<AdminMission>(session, `/admin/missions/${params.id}`);
  const m = res.data;

  if (res.error || !m) {
    return (
      <div className="space-y-6">
        <PageHeader title="Aperçu mission" />
        <ErrorState retryHref="/admin/missions" description="Mission introuvable." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link href="/admin/missions" className="text-muted-foreground hover:text-foreground">
          ← Retour à la modération des missions
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={missionBadgeVariant(m.status)}>{MISSION_STATUS_LABEL[m.status] ?? m.status}</Badge>
            <Badge variant="outline">{m.categoryRef?.title ?? MISSION_CATEGORY_LABEL[m.category] ?? m.category}</Badge>
            {m.visibility ? <Badge variant="muted">Diffusion : {m.visibility}</Badge> : null}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{m.title}</h1>
          {/* « Publiée par » sur un brouillon contredisait le badge de statut. */}
          <p className="text-sm text-muted-foreground">
            {m.status === "DRAFT" ? "Déposée par" : "Publiée par"} {m.account?.name ?? "—"}
            {m.account?.city ? ` · ${m.account.city}` : ""} · {m._count?.bookings ?? 0} candidature(s)
          </p>
        </div>
        <ModerateMissionActions missionId={m.id} status={m.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-foreground">Description</h2>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{m.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5 text-sm">
            <Row label="Début" value={formatDate(m.startDate)} />
            {m.endDate ? <Row label="Fin" value={formatDate(m.endDate)} /> : null}
            {m.startTime || m.endTime ? (
              <Row label="Horaires" value={`${m.startTime ?? "?"} – ${m.endTime ?? "?"}`} />
            ) : null}
            {m.job ? <Row label="Métier" value={m.job} /> : null}
            <Row label="Lieu" value={`${m.city ?? "—"}${m.postalCode ? ` (${m.postalCode})` : ""}`} />
            <Row label="Postes" value={String(m.headcount)} />
            {m.hourlyRate ? <Row label="Rémunération" value={formatRate(m.hourlyRate)} highlight /> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold text-primary" : "font-medium text-foreground"}>{value}</span>
    </div>
  );
}
