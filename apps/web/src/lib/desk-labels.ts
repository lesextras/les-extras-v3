export const DESK_REQUEST_TYPE_LABELS = {
  MISSION_INFO_REQUEST: "Info mission",
  PAYMENT_ISSUE: "Problème paiement",
  BOOKING_FAILURE: "Réservation échouée",
  PACK_PURCHASE_FAILURE: "Achat pack échoué",
  MISSION_PUBLISH_FAILURE: "Publication mission échouée",
  TECHNICAL_ISSUE: "Problème technique",
  USER_REPORT: "Signalement utilisateur",
  LITIGE: "Litige",
} as const;

export type DeskRequestTypeKey = keyof typeof DESK_REQUEST_TYPE_LABELS;

export const FINANCE_DESK_REQUEST_TYPES = [
  "PAYMENT_ISSUE",
  "BOOKING_FAILURE",
  "PACK_PURCHASE_FAILURE",
  "MISSION_PUBLISH_FAILURE",
] as const;

export const USER_DESK_REQUEST_TYPES = [
  "MISSION_INFO_REQUEST",
  "MISSION_PUBLISH_FAILURE",
  "BOOKING_FAILURE",
  "PACK_PURCHASE_FAILURE",
  "TECHNICAL_ISSUE",
  "USER_REPORT",
  "LITIGE",
] as const;

export const USER_MANUAL_DESK_REQUEST_TYPES = [
  "TECHNICAL_ISSUE",
  "USER_REPORT",
  "LITIGE",
] as const;

export function getDeskRequestTypeLabel(type: string): string {
  return DESK_REQUEST_TYPE_LABELS[type as DeskRequestTypeKey] ?? type;
}

export function getDeskContextLabel(request: {
  mission?: { title: string } | null;
  booking?: {
    id: string;
    status?: string;
    reliefMission?: { title: string } | null;
    service?: { title: string } | null;
  } | null;
}): string {
  if (request.mission?.title) {
    return request.mission.title;
  }

  if (request.booking) {
    return request.booking.reliefMission?.title ?? request.booking.service?.title ?? `Réservation ${request.booking.id}`;
  }

  return "Sans objet lié";
}
