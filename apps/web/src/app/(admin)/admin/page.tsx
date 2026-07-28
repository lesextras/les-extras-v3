// Back-office ADMIN — tableau de bord : KPIs plateforme, raccourcis, file de modération.
import type { Metadata } from "next";
import Link from "next/link";
import { Users, Building2, Megaphone, GraduationCap, CalendarCheck, ArrowRight, AlertTriangle, Clock, FileWarning, UserCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin, fetchApi } from "../../_shared/server";
import { ObjectifCampagne, type ObjectifData, type Activite } from "../../_shared/ObjectifCampagne";
import { PageHeader, StatCard, EmptyState } from "../../_shared/ui";
import {
  MISSION_CATEGORY_LABEL,
  SERVICE_CATEGORY_LABEL,
  formatDate,
} from "../../_shared/format";
import type { Mission, Service } from "../../_shared/types";

export const metadata: Metadata = { title: "Administration" };

interface AdminStats {
  users?: number;
  accounts?: number;
  missions?: number;
  services?: number;
  bookings?: number;
}

interface DeskData {
  urgentMissions?: { id: string; title: string; startDate: string; city?: string | null; emergency?: boolean; account?: { name?: string | null } | null }[];
  pendingUsers?: { id: string; email: string; role: string; createdAt: string; firstName?: string | null; lastName?: string | null }[];
  expiringDocuments?: { id: string; type: string; label?: string | null; expiresAt?: string | null; user?: { email?: string; firstName?: string | null; lastName?: string | null } | null }[];
  counts?: {
    urgentMissions?: number;
    pendingUsers?: number;
    expiredDocuments?: number;
    expiringDocuments?: number;
    pendingTimeEntries?: number;
    pendingModeration?: number;
  };
}

const SHORTCUTS = [
  { href: "/admin/utilisateurs", label: "Utilisateurs", description: "Gérer et modérer les comptes", icon: Users },
  { href: "/admin/missions", label: "Missions", description: "Modérer les missions de renfort", icon: Megaphone },
  { href: "/admin/ateliers", label: "Ateliers", description: "Modérer le catalogue d'ateliers", icon: GraduationCap },
  { href: "/admin/statistiques", label: "Statistiques", description: "KPIs détaillés de la plateforme", icon: CalendarCheck },
];

export default async function AdminPage() {
  const session = await requireAdmin();

  const [statsRes, missionsRes, servicesRes, deskRes] = await Promise.all([
    fetchApi<AdminStats>(session, "/admin/stats"),
    fetchApi<Mission[]>(session, "/admin/missions"),
    fetchApi<Service[]>(session, "/admin/services"),
    fetchApi<DeskData>(session, "/admin/desk"),
  ]);
  const funnelRes = await fetchApi<{
    objectif?: ObjectifData;
    global?: { vues: number; demandes: number; devis: number; reservations: number };
    sources?: { source: string; demandes: number }[];
    activite?: Activite[];
  }>(session, "/admin/stats/funnel");

  const s = statsRes.data ?? {};
  const missions = Array.isArray(missionsRes.data) ? missionsRes.data : [];
  const services = Array.isArray(servicesRes.data) ? servicesRes.data : [];

  const pendingMissions = missions.filter((m) => m.status === "DRAFT");
  const pendingServices = services.filter((sv) => sv.status === "DRAFT");
  const pendingTotal = pendingMissions.length + pendingServices.length;

  const desk = deskRes.data ?? {};
  const dc = desk.counts ?? {};
  const urgent = desk.urgentMissions ?? [];
  const toValidate = desk.pendingUsers ?? [];
  const expDocs = desk.expiringDocuments ?? [];
  const alertTotal =
    (dc.urgentMissions ?? 0) +
    (dc.pendingUsers ?? 0) +
    (dc.expiredDocuments ?? 0) +
    (dc.expiringDocuments ?? 0) +
    (dc.pendingTimeEntries ?? 0);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Administration"
        subtitle="Vue d'ensemble de la plateforme, modération et pilotage."
      />

      {funnelRes.data?.objectif ? (
        <ObjectifCampagne
          objectif={funnelRes.data.objectif}
          funnel={funnelRes.data.global}
          sources={funnelRes.data.sources}
          activite={funnelRes.data.activite}
        />
      ) : null}

      {/* ── LE DESK — cockpit par alertes : on traite ce qui brûle, on ne navigue pas ── */}
      <section aria-label="Le Desk" className="space-y-4">
        {alertTotal === 0 ? (
          <Card className="border-success/30 bg-success/10">
            <CardContent className="flex items-center gap-3 p-4">
              <CheckCircle2 className="size-5 shrink-0 text-success" />
              <p className="text-sm text-foreground">
                <span className="font-semibold">Rien d&apos;urgent.</span> Aucun renfort à moins de 48 h non pourvu,
                aucun compte à valider, aucun document en échéance, aucune heure en attente.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-warning/40 bg-warning/5">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-5 text-warning" />
                <h2 className="text-base font-semibold text-foreground">
                  {alertTotal} point{alertTotal > 1 ? "s" : ""} à traiter
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {(dc.urgentMissions ?? 0) > 0 ? (
                  <Link href="/admin/missions" className="group rounded-xl border border-warning/30 bg-card p-4 transition hover:shadow-card">
                    <div className="flex items-center gap-2 text-warning"><Clock className="size-4" /><span className="text-2xl font-bold">{dc.urgentMissions}</span></div>
                    <p className="mt-1 text-sm font-medium text-foreground">Renfort{(dc.urgentMissions ?? 0) > 1 ? "s" : ""} &lt; 48 h non pourvu{(dc.urgentMissions ?? 0) > 1 ? "s" : ""}</p>
                    <p className="text-xs text-muted-foreground">{urgent[0] ? `${urgent[0].title} · ${formatDate(urgent[0].startDate)}` : ""}</p>
                  </Link>
                ) : null}
                {(dc.pendingUsers ?? 0) > 0 ? (
                  <Link href="/admin/utilisateurs" className="group rounded-xl border border-border bg-card p-4 transition hover:shadow-card">
                    <div className="flex items-center gap-2 text-primary"><UserCheck className="size-4" /><span className="text-2xl font-bold">{dc.pendingUsers}</span></div>
                    <p className="mt-1 text-sm font-medium text-foreground">Compte{(dc.pendingUsers ?? 0) > 1 ? "s" : ""} à valider</p>
                    <p className="text-xs text-muted-foreground">{toValidate[0] ? `Le plus ancien : ${toValidate[0].email}` : ""}</p>
                  </Link>
                ) : null}
                {((dc.expiredDocuments ?? 0) + (dc.expiringDocuments ?? 0)) > 0 ? (
                  <Link href="/admin/conformite" className="group rounded-xl border border-border bg-card p-4 transition hover:shadow-card">
                    <div className="flex items-center gap-2 text-warning"><FileWarning className="size-4" /><span className="text-2xl font-bold">{(dc.expiredDocuments ?? 0) + (dc.expiringDocuments ?? 0)}</span></div>
                    <p className="mt-1 text-sm font-medium text-foreground">Document{((dc.expiredDocuments ?? 0) + (dc.expiringDocuments ?? 0)) > 1 ? "s" : ""} en échéance</p>
                    <p className="text-xs text-muted-foreground">
                      {(dc.expiredDocuments ?? 0) > 0 ? `${dc.expiredDocuments} déjà expiré${(dc.expiredDocuments ?? 0) > 1 ? "s" : ""}` : "Expire(nt) sous 30 jours"}
                      {expDocs[0]?.expiresAt ? ` · 1er : ${formatDate(expDocs[0].expiresAt)}` : ""}
                    </p>
                  </Link>
                ) : null}
                {(dc.pendingTimeEntries ?? 0) > 0 ? (
                  <Link href="/admin/reservations" className="group rounded-xl border border-border bg-card p-4 transition hover:shadow-card">
                    <div className="flex items-center gap-2 text-primary"><CalendarCheck className="size-4" /><span className="text-2xl font-bold">{dc.pendingTimeEntries}</span></div>
                    <p className="mt-1 text-sm font-medium text-foreground">Heure{(dc.pendingTimeEntries ?? 0) > 1 ? "s" : ""} à valider</p>
                    <p className="text-xs text-muted-foreground">Déclarées par les freelances, en attente</p>
                  </Link>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Utilisateurs" value={s.users ?? 0} accent="teal" icon={<Users />} />
        <StatCard label="Comptes" value={s.accounts ?? 0} icon={<Building2 />} />
        <StatCard label="Missions" value={s.missions ?? 0} icon={<Megaphone />} />
        <StatCard label="Ateliers" value={s.services ?? 0} icon={<GraduationCap />} />
        <StatCard label="Réservations" value={s.bookings ?? 0} accent="warning" icon={<CalendarCheck />} />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Accès rapide</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SHORTCUTS.map((sc) => (
            <Link key={sc.href} href={sc.href} className="group">
              <Card className="h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card">
                <CardContent className="flex h-full flex-col gap-3 p-5">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary [&_svg]:size-5">
                    <sc.icon />
                  </div>
                  <div className="space-y-1">
                    <p className="flex items-center gap-1 font-medium text-foreground">
                      {sc.label}
                      <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                    </p>
                    <p className="text-sm text-muted-foreground">{sc.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            En attente de modération
            {pendingTotal > 0 ? <Badge variant="secondary">{pendingTotal}</Badge> : null}
          </h2>
        </div>

        {pendingTotal === 0 ? (
          <EmptyState title="Rien à modérer" description="Aucune offre en attente de validation." />
        ) : (
          <div className="space-y-3">
            {pendingMissions.slice(0, 6).map((m) => (
              <Card key={m.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Mission</Badge>
                      <Badge variant="outline">{MISSION_CATEGORY_LABEL[m.category] ?? m.category}</Badge>
                    </div>
                    <p className="truncate text-sm font-medium text-foreground">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.account?.name ?? "Établissement"} · {formatDate(m.startDate)}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/missions">Modérer</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
            {pendingServices.slice(0, 6).map((sv) => (
              <Card key={sv.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Atelier</Badge>
                      <Badge variant="outline">{SERVICE_CATEGORY_LABEL[sv.category] ?? sv.category}</Badge>
                    </div>
                    <p className="truncate text-sm font-medium text-foreground">{sv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {sv.account?.name ?? "Établissement"}
                      {sv.city ? ` · ${sv.city}` : ""}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/admin/ateliers">Modérer</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
