// Back-office ADMIN — tableau de bord : KPIs plateforme, raccourcis, file de modération.
import type { Metadata } from "next";
import Link from "next/link";
import { Users, Building2, Megaphone, GraduationCap, CalendarCheck, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin, fetchApi } from "../../_shared/server";
import { PageHeader, StatCard, EmptyState } from "../../_shared/ui";
import {
  MISSION_CATEGORY_LABEL,
  SERVICE_CATEGORY_LABEL,
  formatDate,
} from "../../_shared/format";
import type { Mission, Service } from "../../_shared/types";

export const metadata: Metadata = { title: "Administration · Les Extras" };

interface AdminStats {
  users?: number;
  accounts?: number;
  missions?: number;
  services?: number;
  bookings?: number;
}

const SHORTCUTS = [
  { href: "/admin/utilisateurs", label: "Utilisateurs", description: "Gérer et modérer les comptes", icon: Users },
  { href: "/admin/missions", label: "Missions", description: "Modérer les missions de renfort", icon: Megaphone },
  { href: "/admin/ateliers", label: "Ateliers", description: "Modérer le catalogue d'ateliers", icon: GraduationCap },
  { href: "/admin/statistiques", label: "Statistiques", description: "KPIs détaillés de la plateforme", icon: CalendarCheck },
];

export default async function AdminPage() {
  const session = await requireAdmin();

  const [statsRes, missionsRes, servicesRes] = await Promise.all([
    fetchApi<AdminStats>(session, "/admin/stats"),
    fetchApi<Mission[]>(session, "/admin/missions"),
    fetchApi<Service[]>(session, "/admin/services"),
  ]);

  const s = statsRes.data ?? {};
  const missions = Array.isArray(missionsRes.data) ? missionsRes.data : [];
  const services = Array.isArray(servicesRes.data) ? servicesRes.data : [];

  const pendingMissions = missions.filter((m) => m.status === "DRAFT");
  const pendingServices = services.filter((sv) => sv.status === "DRAFT");
  const pendingTotal = pendingMissions.length + pendingServices.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Administration"
        subtitle="Vue d'ensemble de la plateforme, modération et pilotage."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Utilisateurs" value={s.users ?? 0} accent="teal" icon={<Users />} />
        <StatCard label="Comptes" value={s.accounts ?? 0} icon={<Building2 />} />
        <StatCard label="Missions" value={s.missions ?? 0} icon={<Megaphone />} />
        <StatCard label="Ateliers" value={s.services ?? 0} icon={<GraduationCap />} />
        <StatCard label="Réservations" value={s.bookings ?? 0} accent="terracotta" icon={<CalendarCheck />} />
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
