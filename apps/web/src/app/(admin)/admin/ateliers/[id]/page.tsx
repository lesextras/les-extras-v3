// Back-office ADMIN — aperçu d'un atelier (voir le produit, tout statut).
import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../../_shared/server";
import { PageHeader, ErrorState } from "../../../../_shared/ui";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SERVICE_CATEGORY_LABEL,
  SERVICE_STATUS_LABEL,
  serviceBadgeVariant,
  formatMoney,
} from "../../../../_shared/format";
import { ModerateServiceActions } from "../../../../_shared/AdminActions";

export const metadata: Metadata = { title: "Aperçu atelier · Administration" };

interface AdminService {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  price?: number | string | null;
  duration?: string | null;
  city?: string | null;
  maxParticipants?: number | null;
  publicTarget?: string | null;
  creditCost?: number | null;
  account?: { id: string; name: string; city?: string | null; type?: string } | null;
  categoryRef?: { id: string; title: string } | null;
  _count?: { bookings?: number };
}

export default async function AdminServiceDetail({ params }: { params: { id: string } }) {
  const session = await requireAdmin();
  const res = await fetchApi<AdminService>(session, `/admin/services/${params.id}`);
  const s = res.data;

  if (res.error || !s) {
    return (
      <div className="space-y-6">
        <PageHeader title="Aperçu atelier" />
        <ErrorState retryHref="/admin/ateliers" description="Atelier introuvable." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm">
        <Link href="/admin/ateliers" className="text-muted-foreground hover:text-foreground">
          ← Retour à la modération des ateliers
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={serviceBadgeVariant(s.status)}>{SERVICE_STATUS_LABEL[s.status] ?? s.status}</Badge>
            <Badge variant="outline">{s.categoryRef?.title ?? SERVICE_CATEGORY_LABEL[s.category] ?? s.category}</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{s.title}</h1>
          <p className="text-sm text-muted-foreground">
            Proposé par {s.account?.name ?? "—"}
            {s.account?.city ? ` · ${s.account.city}` : ""} · {s._count?.bookings ?? 0} réservation(s)
          </p>
        </div>
        <ModerateServiceActions serviceId={s.id} status={s.status} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-foreground">Description</h2>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{s.description}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5 text-sm">
            {s.price ? <Row label="Prix" value={formatMoney(s.price)} highlight /> : null}
            {s.duration ? <Row label="Durée" value={s.duration} /> : null}
            {s.maxParticipants ? <Row label="Participants" value={`${s.maxParticipants} max`} /> : null}
            {s.publicTarget ? <Row label="Public" value={s.publicTarget} /> : null}
            
            <Row label="Lieu" value={s.city ?? "—"} />
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
