import type { ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, AlertTriangle, Inbox, Receipt, UserCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GlassCard, GlassCardContent, GlassCardHeader } from "@/components/ui/glass-card";
import { StatusPill } from "@/components/ui/status-pill";
import { getDeskContextLabel, getDeskRequestTypeLabel } from "@/lib/desk-labels";
import {
  sortDeskRequestsByPriority,
  sortPendingUsersByAge,
  sortUrgentMissionsByDate,
} from "@/lib/admin-priority";
import type { AdminMissionRow, AdminUserRow, DeskRequestRow } from "@/app/actions/admin";

type RequiredActionsProps = {
  pendingUsers: AdminUserRow[];
  openDeskRequests: DeskRequestRow[];
  financeIncidents?: DeskRequestRow[];
  urgentMissions?: AdminMissionRow[];
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const priorityVariant = {
  URGENT: "coral",
  HIGH: "amber",
  NORMAL: "quiet",
  LOW: "outline",
} as const;

function getRequesterName(requester: DeskRequestRow["requester"]): string {
  if (requester.profile) {
    return `${requester.profile.firstName} ${requester.profile.lastName}`.trim();
  }
  return requester.email;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date inconnue";
  }

  return dateFormatter.format(date);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date à confirmer";
  }

  return dateTimeFormatter.format(date);
}

function formatAge(value: string, now = new Date()): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Ancienneté inconnue";
  }

  const diffMs = Math.max(0, now.getTime() - date.getTime());
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "À l'instant";
  if (diffHours < 24) return `Il y a ${diffHours} h`;

  const diffDays = Math.floor(diffHours / 24);
  return `Il y a ${diffDays} j`;
}

function EmptyAction({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-dashed border-border/50 bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function ViewAllLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {label}
    </Link>
  );
}

export function RequiredActions({
  pendingUsers,
  openDeskRequests,
  financeIncidents = [],
  urgentMissions = [],
}: RequiredActionsProps) {
  const sortedUsers = sortPendingUsersByAge(pendingUsers);
  const sortedDeskRequests = sortDeskRequestsByPriority(openDeskRequests);
  const sortedFinanceIncidents = sortDeskRequestsByPriority(financeIncidents);
  const sortedUrgentMissions = sortUrgentMissionsByDate(urgentMissions);

  return (
    <>
      <GlassCard>
        <GlassCardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <h4 className="text-base font-semibold leading-none tracking-tight">
              Utilisateurs à valider
            </h4>
            <p className="text-xs text-muted-foreground">
              Les comptes les plus anciens passent en premier.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewAllLink href="/admin/users" label="Voir tout" />
            <UserCheck className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {sortedUsers.length === 0 ? (
            <EmptyAction>Aucun utilisateur en attente de validation.</EmptyAction>
          ) : (
            <div className="space-y-2">
              {sortedUsers.slice(0, 5).map((user) => (
                <Link
                  key={user.id}
                  href="/admin/users"
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/40 px-3 py-2.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Ouvrir les utilisateurs à valider pour ${user.name}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(user.createdAt)} · {formatAge(user.createdAt)}
                    </p>
                  </div>
                  <StatusPill status="pending" label={user.status} showDot={false} />
                </Link>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <h4 className="text-base font-semibold leading-none tracking-tight">
              Tickets Desk ouverts
            </h4>
            <p className="text-xs text-muted-foreground">
              Priorité, non-assignation et ancienneté déterminent l'ordre.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewAllLink href="/admin/demandes" label="Voir tout" />
            <Inbox className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {sortedDeskRequests.length === 0 ? (
            <EmptyAction>Aucun ticket Desk ouvert.</EmptyAction>
          ) : (
            <div className="space-y-2">
              {sortedDeskRequests.slice(0, 5).map((request) => (
                <Link
                  key={request.id}
                  href="/admin/demandes"
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/40 px-3 py-2.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Ouvrir le ticket Desk ${getDeskContextLabel(request)}`}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {getDeskContextLabel(request)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {getDeskRequestTypeLabel(request.type)} · {getRequesterName(request.requester)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.assignedToAdminId ? "Assigné" : "Non assigné"} · {formatAge(request.createdAt)}
                    </p>
                  </div>
                  <Badge variant={priorityVariant[request.priority]}>
                    {request.priority}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <h4 className="text-base font-semibold leading-none tracking-tight">Incidents finance</h4>
            <p className="text-xs text-muted-foreground">
              Paiements, achats packs et réservations bloquées.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewAllLink href="/admin/incidents" label="Voir tout" />
            <Receipt className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {sortedFinanceIncidents.length === 0 ? (
            <EmptyAction>Aucun incident finance ouvert.</EmptyAction>
          ) : (
            <div className="space-y-2">
              {sortedFinanceIncidents.slice(0, 5).map((request) => (
                <Link
                  key={request.id}
                  href="/admin/incidents"
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/40 px-3 py-2.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Ouvrir l'incident finance ${getDeskContextLabel(request)}`}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {getDeskContextLabel(request)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {getDeskRequestTypeLabel(request.type)} · {getRequesterName(request.requester)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {request.assignedToAdminId ? "Assigné" : "Non assigné"} · {formatAge(request.createdAt)}
                    </p>
                  </div>
                  <Badge variant={priorityVariant[request.priority]}>
                    {request.priority}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      <GlassCard>
        <GlassCardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-1">
            <h4 className="text-base font-semibold leading-none tracking-tight">Missions urgentes</h4>
            <p className="text-xs text-muted-foreground">
              Renforts ouverts dans les prochaines 48 h.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ViewAllLink href="/admin/missions" label="Voir tout" />
            <AlertTriangle className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {sortedUrgentMissions.length === 0 ? (
            <EmptyAction>Aucune mission urgente ouverte.</EmptyAction>
          ) : (
            <div className="space-y-2">
              {sortedUrgentMissions.slice(0, 5).map((mission) => (
                <Link
                  key={mission.id}
                  href="/admin/missions"
                  className="flex items-start justify-between gap-3 rounded-xl border border-border/40 px-3 py-2.5 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label={`Ouvrir les missions pour ${mission.title}`}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate text-sm font-medium text-foreground">{mission.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {mission.establishmentName} · {mission.city}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(mission.dateStart)} · {mission.candidatesCount} candidature(s)
                    </p>
                  </div>
                  <Badge variant="coral">Urgent</Badge>
                </Link>
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </>
  );
}
