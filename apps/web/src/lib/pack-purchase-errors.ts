export const PACK_PURCHASE_FALLBACK_ERROR =
  "Impossible d'ajouter ce pack pour le moment.";

function withOriginalDeskSuffix(message: string, fallback: string) {
  return message.includes("Le Desk a été prévenu.")
    ? `${fallback} Le Desk a été prévenu.`
    : fallback;
}

export function normalizePackPurchaseErrorMessage(
  message: string | null | undefined,
  fallback = PACK_PURCHASE_FALLBACK_ERROR,
): string {
  const rawMessage = typeof message === "string" ? message.trim() : "";
  if (!rawMessage) {
    return fallback;
  }

  const normalized = rawMessage.toLowerCase();

  if (/^fail(?:ed)?\b/i.test(rawMessage)) {
    return withOriginalDeskSuffix(rawMessage, fallback);
  }

  const isTechnicalMessage =
    normalized.includes("api request failed") ||
    normalized.includes("internal server error") ||
    normalized.includes("server components render") ||
    normalized.includes("fetch failed") ||
    normalized.includes("networkerror") ||
    normalized.includes("the operation was aborted") ||
    normalized.includes("aborterror") ||
    normalized.includes("timeout") ||
    normalized.includes("cannot read") ||
    normalized.includes("typeerror") ||
    normalized.includes("referenceerror") ||
    normalized.includes("syntaxerror") ||
    normalized.includes("exception") ||
    normalized.includes("status code") ||
    normalized.includes("econn") ||
    normalized.includes("digest");

  return isTechnicalMessage ? fallback : rawMessage;
}
