import type {
  AdminMissionRow,
  AdminUserRow,
  DeskRequestPriority,
  DeskRequestRow,
} from "@/app/actions/admin";

const DESK_PRIORITY_WEIGHT: Record<DeskRequestPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
};

function toTimestamp(value: string): number {
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

function isUnassigned(request: DeskRequestRow): boolean {
  return request.assignedToAdminId === null;
}

export function getDeskPriorityWeight(priority: DeskRequestPriority): number {
  return DESK_PRIORITY_WEIGHT[priority] ?? DESK_PRIORITY_WEIGHT.LOW;
}

export function compareDeskRequestsByPriority(a: DeskRequestRow, b: DeskRequestRow): number {
  const priorityDiff = getDeskPriorityWeight(a.priority) - getDeskPriorityWeight(b.priority);
  if (priorityDiff !== 0) return priorityDiff;

  if (isUnassigned(a) !== isUnassigned(b)) {
    return isUnassigned(a) ? -1 : 1;
  }

  return toTimestamp(a.createdAt) - toTimestamp(b.createdAt);
}

export function sortDeskRequestsByPriority(requests: DeskRequestRow[]): DeskRequestRow[] {
  return [...requests].sort(compareDeskRequestsByPriority);
}

export function sortPendingUsersByAge(users: AdminUserRow[]): AdminUserRow[] {
  return [...users].sort((a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt));
}

export function sortUrgentMissionsByDate(missions: AdminMissionRow[]): AdminMissionRow[] {
  return [...missions].sort((a, b) => toTimestamp(a.dateStart) - toTimestamp(b.dateStart));
}
