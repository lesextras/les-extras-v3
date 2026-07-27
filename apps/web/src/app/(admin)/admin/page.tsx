import Link from "next/link";
import { getAdminMissions, getAdminOverview, getAdminUsers, getDeskRequests } from "@/app/actions/admin";
import { AdminStats } from "@/components/admin/AdminStats";
import { RequiredActions } from "@/components/admin/RequiredActions";
import { BentoSection } from "@/components/layout/BentoSection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchAdminSafe } from "@/lib/admin-safe-fetch";
import { FINANCE_DESK_REQUEST_TYPES } from "@/lib/desk-labels";

export const dynamic = "force-dynamic";
const OPEN_DESK_REQUEST_STATUSES = new Set(["OPEN", "IN_PROGRESS"]);
const FINANCE_TYPES = new Set<string>(FINANCE_DESK_REQUEST_TYPES);
const OVERVIEW_FALLBACK = {
  pendingUsersCount: 0,
  openDeskRequestsCount: 0,
  urgentOpenMissionsCount: 0,
  featuredServicesCount: 0,
  hiddenServicesCount: 0,
  awaitingPaymentCount: 0,
};

function getUrgentOpenMissions(
  missions: Awaited<ReturnType<typeof getAdminMissions>>,
  now = new Date(),
) {
  const deadline = now.getTime() + 48 * 60 * 60 * 1000;

  return missions.filter((mission) => {
    const start = new Date(mission.dateStart).getTime();
    return (
      mission.status === "OPEN" &&
      Number.isFinite(start) &&
      start >= now.getTime() &&
      start <= deadline
    );
  });
}

export default async function AdminOverviewPage() {
  const [overviewResult, usersResult, deskRequestsResult, missionsResult] = await Promise.all([
    fetchAdminSafe(getAdminOverview, OVERVIEW_FALLBACK, "Synthèse Desk"),
    fetchAdminSafe(() => getAdminUsers(), [], "Utilisateurs Desk"),
    fetchAdminSafe(getDeskRequests, [], "Demandes Desk"),
    fetchAdminSafe(getAdminMissions, [], "Missions Desk"),
  ]);
  const overview = overviewResult.data;
  const users = usersResult.data;
  const deskRequests = deskRequestsResult.data;
  const missions = missionsResult.data;
  const widgetErrors = [
    overviewResult.error,
    usersResult.error,
    deskRequestsResult.error,
    missionsResult.error,
  ].filter((error): error is string => Boolean(error));

  const pendingUsers = users.filter((user) => user.status === "PENDING");
  const openDeskRequests = deskRequests.filter((request) =>
    OPEN_DESK_REQUEST_STATUSES.has(request.status),
  );
  const financeIncidents = openDeskRequests.filter((request) => FINANCE_TYPES.has(request.type));
  const supportDeskRequests = openDeskRequests.filter((request) => !FINANCE_TYPES.has(request.type));
  const urgentMissions = getUrgentOpenMissions(missions);
  const urgentDeskRequests = openDeskRequests.filter((request) => request.priority === "URGENT");
  const criticalCount = urgentDeskRequests.length + urgentMissions.length;

  return (
    <section className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Le Desk — Admin</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Tableau de bord
          </h1>
          <p className="text-sm text-muted-foreground">
            Pilotage opérationnel global des missions, utilisateurs et performances.
          </p>
        </div>
      </header>

      {widgetErrors.length > 0 && (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertTitle>Données Desk partiellement indisponibles</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {widgetErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <section className="space-y-3" aria-labelledby="critical-alerts">
        <div className="space-y-1">
          <h2 id="critical-alerts" className="text-xl font-semibold tracking-tight">
            Alertes critiques
          </h2>
          <p className="text-sm text-muted-foreground">
            Tickets urgents et renforts ouverts à moins de 48 h.
          </p>
        </div>
        {criticalCount > 0 ? (
          <Alert className="border-[hsl(var(--coral)/0.4)] bg-[hsl(var(--coral)/0.1)]">
            <AlertTitle>{criticalCount} alerte(s) critique(s) à traiter</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {urgentDeskRequests.length} ticket(s) urgent(s) et {urgentMissions.length} mission(s) à moins de 48 h.
              </span>
              <div className="flex flex-wrap gap-2">
                {urgentDeskRequests.length > 0 && (
                  <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/admin/demandes">
                    Ouvrir les tickets
                  </Link>
                )}
                {urgentMissions.length > 0 && (
                  <Link className="font-medium text-primary underline-offset-4 hover:underline" href="/admin/missions">
                    Voir les missions
                  </Link>
                )}
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-border/50 bg-muted/20">
            <AlertTitle>Aucune alerte critique</AlertTitle>
            <AlertDescription>
              Aucun ticket urgent ni renfort ouvert à moins de 48 h pour le moment.
            </AlertDescription>
          </Alert>
        )}
      </section>

      <BentoSection
        cols={2}
        gap="md"
        heading="Actions Requises"
        description="Points de contrôle prioritaires du Desk."
      >
        <RequiredActions
          pendingUsers={pendingUsers}
          openDeskRequests={supportDeskRequests}
          financeIncidents={financeIncidents}
          urgentMissions={urgentMissions}
        />
      </BentoSection>

      <section className="space-y-4" aria-labelledby="operational-health">
        <div className="space-y-1">
          <h2 id="operational-health" className="text-xl font-semibold tracking-tight">
            Santé opérationnelle
          </h2>
          <p className="text-sm text-muted-foreground">
            Indicateurs de volume pour naviguer vers les files détaillées.
          </p>
        </div>
        <AdminStats data={overview} />
      </section>
    </section>
  );
}
