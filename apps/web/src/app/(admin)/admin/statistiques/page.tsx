// Back-office ADMIN — statistiques : KPIs détaillés depuis /admin/stats
// enrichis de répartitions calculées sur users / missions / services.
import type { Metadata } from "next";
import {
  Users,
  Building2,
  Megaphone,
  GraduationCap,
  CalendarCheck,
  Target,
  Clock,
  PiggyBank,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, StatCard, ErrorState } from "../../../_shared/ui";
import {
  BOOKING_STATUS_LABEL,
  MISSION_STATUS_LABEL,
  SERVICE_STATUS_LABEL,
  USER_STATUS_LABEL,
  formatMoney,
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

interface RoiStats {
  coverageRate: number;
  publishedMissions: number;
  filledMissions: number;
  avgFirstApplicationHours: number | null;
  estimatedSavingsEur: number;
  savingsPerMissionEur: number;
  missionsPerMonth: { mois: string; count: number }[];
  bookingsByStatus: Record<string, number>;
}

// Couleurs (Tailwind) par statut pour la barre empilée des réservations.
const BOOKING_STATUS_COLOR: Record<string, string> = {
  REQUESTED: "bg-muted-foreground",
  ACCEPTED: "bg-primary/60",
  CONFIRMED: "bg-primary",
  IN_PROGRESS: "bg-warning",
  COMPLETED: "bg-success",
  CANCELLED: "bg-destructive",
};

// "YYYY-MM" -> libellé court FR ("juil.").
function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString("fr-FR", { month: "short" });
}

// Délai en heures -> libellé lisible (h ou j).
function formatDelay(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 48) return `${hours.toLocaleString("fr-FR")} h`;
  return `${(Math.round((hours / 24) * 10) / 10).toLocaleString("fr-FR")} j`;
}

// Graphique en barres verticales (pur CSS/JSX) : missions publiées par mois.
function MissionsBarChart({ data }: { data: { mois: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex h-40 items-end justify-between gap-2">
      {data.map((d) => {
        const pct = Math.round((d.count / max) * 100);
        return (
          <div key={d.mois} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end">
              <div
                className="w-full rounded-t-md bg-primary/80 transition-all"
                style={{ height: `${d.count === 0 ? 2 : Math.max(pct, 4)}%` }}
                title={`${d.count} mission(s)`}
              />
            </div>
            <span className="text-[11px] font-medium text-foreground [font-variant-numeric:tabular-nums]">
              {d.count}
            </span>
            <span className="text-[11px] capitalize text-muted-foreground">{monthLabel(d.mois)}</span>
          </div>
        );
      })}
    </div>
  );
}

// Barre horizontale empilée (pur CSS/JSX) : répartition des bookings par statut.
function BookingsStackedBar({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).filter(([, v]) => v > 0);
  const total = entries.reduce((sum, [, v]) => sum + v, 0);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">Aucune réservation.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
        {entries.map(([status, v]) => (
          <div
            key={status}
            className={BOOKING_STATUS_COLOR[status] ?? "bg-muted-foreground"}
            style={{ width: `${(v / total) * 100}%` }}
            title={`${BOOKING_STATUS_LABEL[status] ?? status} : ${v}`}
          />
        ))}
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-3">
        {entries.map(([status, v]) => (
          <li key={status} className="flex items-center gap-2 text-xs">
            <span
              className={`inline-block size-2.5 shrink-0 rounded-sm ${BOOKING_STATUS_COLOR[status] ?? "bg-muted-foreground"}`}
            />
            <span className="text-muted-foreground">{BOOKING_STATUS_LABEL[status] ?? status}</span>
            <span className="ml-auto font-medium text-foreground [font-variant-numeric:tabular-nums]">{v}</span>
          </li>
        ))}
      </ul>
    </div>
  );
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

  const [statsRes, usersRes, missionsRes, servicesRes, roiRes] = await Promise.all([
    fetchApi<AdminStats>(session, "/admin/stats"),
    fetchApi<AdminUser[]>(session, "/admin/users"),
    fetchApi<Mission[]>(session, "/admin/missions"),
    fetchApi<Service[]>(session, "/admin/services"),
    fetchApi<RoiStats>(session, "/admin/stats/roi"),
  ]);

  const s = statsRes.data ?? {};
  const roi = roiRes.data;
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

          {roi ? (
            <section className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">ROI &amp; performance</h2>
                <p className="text-sm text-muted-foreground">
                  Indicateurs de valeur du dispositif RenforTeam, calculés sur les missions et
                  réservations réelles.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                  label="Taux de couverture"
                  value={`${roi.coverageRate.toLocaleString("fr-FR")} %`}
                  hint={`${roi.filledMissions} / ${roi.publishedMissions} mission(s) publiée(s) pourvue(s)`}
                  accent="teal"
                  icon={<Target />}
                />
                <StatCard
                  label="Délai moyen · 1ʳᵉ candidature"
                  value={formatDelay(roi.avgFirstApplicationHours)}
                  hint="Entre publication et 1ʳᵉ candidature reçue"
                  icon={<Clock />}
                />
                <StatCard
                  label="Économie estimée vs intérim"
                  value={formatMoney(roi.estimatedSavingsEur)}
                  hint={`${roi.filledMissions} mission(s) × ${formatMoney(roi.savingsPerMissionEur)}`}
                  accent="terracotta"
                  icon={<PiggyBank />}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <p className="text-sm font-semibold text-foreground">
                      Missions publiées · 6 derniers mois
                    </p>
                    <MissionsBarChart data={roi.missionsPerMonth} />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="space-y-4 p-5">
                    <p className="text-sm font-semibold text-foreground">
                      Réservations par statut
                    </p>
                    <BookingsStackedBar data={roi.bookingsByStatus} />
                  </CardContent>
                </Card>
              </div>

              <p className="text-xs text-muted-foreground">
                Hypothèse : l&apos;économie est estimée à {formatMoney(roi.savingsPerMissionEur)} par
                mission pourvue en direct via la plateforme, correspondant à la marge d&apos;agence et
                aux frais de gestion moyens évités par rapport au recours à une agence d&apos;intérim.
                Cet ordre de grandeur est indicatif et paramétrable.
              </p>
            </section>
          ) : null}

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
