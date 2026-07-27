import type { DeskRequestPriority, DeskRequestRow, DeskRequestStatus } from "@/app/actions/admin";

export function getDeskStatusLabel(status: DeskRequestStatus): string {
  const labels: Record<DeskRequestStatus, string> = {
    OPEN: "Ouverte",
    IN_PROGRESS: "En cours",
    ANSWERED: "Répondue",
    CLOSED: "Clôturée",
  };
  return labels[status] ?? status;
}

export function getDeskStatusVariant(
  status: DeskRequestStatus,
): "default" | "outline" | "secondary" {
  const variants: Record<DeskRequestStatus, "default" | "outline" | "secondary"> = {
    OPEN: "default",
    IN_PROGRESS: "secondary",
    ANSWERED: "outline",
    CLOSED: "outline",
  };
  return variants[status];
}

export function getDeskPriorityLabel(priority: DeskRequestPriority): string {
  const labels: Record<DeskRequestPriority, string> = {
    LOW: "Basse",
    NORMAL: "Normale",
    HIGH: "Haute",
    URGENT: "Urgente",
  };
  return labels[priority] ?? priority;
}

export function getDeskPriorityVariant(
  priority: DeskRequestPriority,
): "quiet" | "default" | "amber" | "coral" {
  const variants: Record<DeskRequestPriority, "quiet" | "default" | "amber" | "coral"> = {
    LOW: "quiet",
    NORMAL: "default",
    HIGH: "amber",
    URGENT: "coral",
  };
  return variants[priority];
}

export function isDeskRequestOpen(status: DeskRequestStatus): boolean {
  return status === "OPEN" || status === "IN_PROGRESS";
}

const LATE_THRESHOLDS_MS: Record<DeskRequestPriority, number> = {
  URGENT: 2 * 60 * 60 * 1000,
  HIGH: 24 * 60 * 60 * 1000,
  NORMAL: 72 * 60 * 60 * 1000,
  LOW: 7 * 24 * 60 * 60 * 1000,
};

export function isDeskRequestLate(
  request: { status: DeskRequestStatus; priority: DeskRequestPriority; createdAt: string },
  now: Date,
): boolean {
  if (!isDeskRequestOpen(request.status)) return false;
  const createdAt = new Date(request.createdAt);
  if (isNaN(createdAt.getTime())) return false;
  return now.getTime() - createdAt.getTime() > LATE_THRESHOLDS_MS[request.priority];
}

const PRIORITY_ORDER: Record<DeskRequestPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

export function sortDeskRequestsByPriority(
  requests: DeskRequestRow[],
  now: Date,
): DeskRequestRow[] {
  return [...requests].sort((a, b) => {
    const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (priorityDiff !== 0) return priorityDiff;
    const aDate = new Date(a.createdAt).getTime();
    const bDate = new Date(b.createdAt).getTime();
    if (isNaN(aDate) && isNaN(bDate)) return 0;
    if (isNaN(aDate)) return 1;
    if (isNaN(bDate)) return -1;
    return aDate - bDate;
  });
}
