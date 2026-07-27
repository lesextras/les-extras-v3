export const DESK_REQUEST_FALLBACK_ERROR =
  "Impossible d'envoyer votre demande pour le moment.";

const TECHNICAL_DESK_ERROR_PATTERNS = [
  "fail",
  "api request failed",
  "internal server error",
  "failed to fetch",
  "network error",
  "networkerror",
  "unexpected token",
  "json",
];

export function normalizeDeskRequestErrorMessage(
  error: unknown,
  fallback = DESK_REQUEST_FALLBACK_ERROR,
) {
  const raw =
    typeof error === "string" ? error : error instanceof Error ? error.message : "";
  const message = raw.trim();

  if (!message) {
    return fallback;
  }

  const normalized = message.toLowerCase();
  const isTechnical = TECHNICAL_DESK_ERROR_PATTERNS.some((pattern) =>
    normalized === pattern || normalized.includes(pattern),
  );

  return isTechnical ? fallback : message;
}
