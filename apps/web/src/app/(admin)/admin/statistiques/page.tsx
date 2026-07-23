// Back-office ADMIN — statistiques : KPIs détaillés depuis /admin/stats
// enrichis de répartitions calculées sur users / missions / services.
import type { Metadata } from "next";
import { Users, Building2, Megaphone, GraduationCap, CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, StatCard, ErrorState } from "../../../_shared/ui";
import {
  MISSION_STATUS_LABEL,
  SERVICE_STATUS_LABEL,
  USER_STATUS_LABEL,
} from "../../../_shared/format";
import type { Mission, Service } from "../../../_shared/types";

export const metadata: Metadata = { title: "Statistiques · Administration" };

interface AdminStats {
  users?: number;
  accounts?: number;
  missions?: number;
  services?: number;
  bookings?: number;
}

interface AdminUser {
  id: string;
  status?: string;
}

function countBy<T>(items: T[], key: (item: T) => string | undefined): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    acc[k] = (acc[k] ?? 0) + 1;
  }
  return acc;
}

function Breakdown({
  title,
  data,
  labels,
}: {
  title: string;
  data: Record<string, number>;
  labels: Record<string, string>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune donnée.</p>
        ) : (
          <ul className="space-y-2">
            {entries.map(([k, v]) => (
              <li key={k} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{labels[k] ?? k}</span>
                <span className="font-medium text-foreground [font-variant-numeric:tabular-nums]">{v}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AdminStatsPage() {
  const session = await requireAdmin();

  const [statsRes, usersRes, missionsRes, servicesRes] = await Promise.all([
    fetchApi<AdminStats>(session, "/admin/stats"),
    fetchApi<AdminUser[]>(session, "/admin/users"),
    fetchApi<Mission[]>(session, "/admin/missions"),
    fetchApi<Service[]>(session, "/admin/services"),
  ]);

  const s = statsRes.data ?? {};
  const users = Array.isArray(usersRes.data) ? usersRes.data : [];
  const missions = Array.isArray(missionsRes.data) ? missionsRes.data : [];
  const services = Array.isArray(servicesRes.data) ? servicesRes.data : [];

  const usersByStatus = countBy(users, (u) => u.status ?? "PENDING");
  const missionsByStatus = countBy(missions, (m) => m.status);
  const servicesByStatus = countBy(services, (sv) => sv.status);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Statistiques"
        subtitle="Indicateurs clés et répartitions de l'activité de la plateforme."
      />

      {statsRes.error ? (
        <ErrorState retryHref="/admin/statistiques" />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatCard label="Utilisateurs" value={s.users ?? 0} accent="teal" icon={<Users />} />
            <StatCard label="Comptes" value={s.accounts ?? 0} icon={<Building2 />} />
            <StatCard label="Missions" value={s.missions ?? 0} icon={<Megaphone />} />
            <StatCard label="Ateliers" value={s.services ?? 0} icon={<GraduationCap />} />
            <StatCard label="Réservations" value={s.bookings ?? 0} accent="terracotta" icon={<CalendarCheck />} />
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Répartitions</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Breakdown title="Utilisateurs par statut" data={usersByStatus} labels={USER_STATUS_LABEL} />
              <Breakdown title="Missions par statut" data={missionsByStatus} labels={MISSION_STATUS_LABEL} />
              <Breakdown title="Ateliers par statut" data={servicesByStatus} labels={SERVICE_STATUS_LABEL} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
