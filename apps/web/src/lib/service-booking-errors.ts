export const SERVICE_BOOKING_FALLBACK_ERROR =
  "Impossible d'envoyer votre demande de réservation pour le moment.";

export const SERVICE_BOOKING_DATE_ERROR =
  "Choisissez une date future pour votre demande.";

export const SERVICE_BOOKING_PARTICIPANTS_ERROR =
  "Le nombre de participants doit être supérieur ou égal à 1.";

function withOriginalDeskSuffix(message: string, fallback: string) {
  return message.includes("Le Desk a été prévenu.")
    ? `${fallback} Le Desk a été prévenu.`
    : fallback;
}

export function normalizeServiceBookingErrorMessage(
  message: string | null | undefined,
  fallback = SERVICE_BOOKING_FALLBACK_ERROR,
): string {
  const rawMessage = typeof message === "string" ? message.trim() : "";
  if (!rawMessage) {
    return fallback;
  }

  const normalized = rawMessage.toLowerCase();

  if (/^fail(?:ed)?\b/i.test(rawMessage)) {
    return withOriginalDeskSuffix(rawMessage, fallback);
  }

  if (normalized.includes("already") || normalized.includes("déjà")) {
    return "Vous avez déjà une demande active pour ce service.";
  }

  if (normalized.includes("service not found") || normalized.includes("introuvable")) {
    return "Service introuvable.";
  }

  if (
    normalized.includes("plus disponible") ||
    normalized.includes("not available") ||
    normalized.includes("inactive") ||
    normalized.includes("draft")
  ) {
    return "Ce service n'est plus disponible à la réservation.";
  }

  if (
    normalized.includes("invalid time value") ||
    normalized.includes("date de réservation est invalide") ||
    normalized.includes("date invalide") ||
    normalized.includes("date souhaitée") ||
    normalized.includes("dans le passé") ||
    normalized.includes("future")
  ) {
    return SERVICE_BOOKING_DATE_ERROR;
  }

  if (
    normalized.includes("participant") &&
    (normalized.includes("supérieur") ||
      normalized.includes("greater") ||
      normalized.includes("minimum") ||
      normalized.includes("min"))
  ) {
    return SERVICE_BOOKING_PARTICIPANTS_ERROR;
  }

  if (normalized.includes("capacité") || normalized.includes("capacity")) {
    return normalized.includes("capacité maximale")
      ? rawMessage
      : "Le nombre de participants dépasse la capacité maximale de ce service.";
  }

  if (normalized.includes("propre service") || normalized.includes("own service")) {
    return "Vous ne pouvez pas réserver votre propre service.";
  }

  const isTechnicalMessage =
    normalized.includes("api request failed") ||
    normalized.includes("fetch failed") ||
    normalized.includes("networkerror") ||
    normalized.includes("server components render") ||
    normalized.includes("the operation was aborted") ||
    normalized.includes("aborterror") ||
    normalized.includes("timeout") ||
    normalized.includes("digest");

  return isTechnicalMessage ? fallback : rawMessage;
}
