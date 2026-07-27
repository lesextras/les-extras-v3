/**
 * Thrown when the API returns 401 Unauthorized.
 * Caught by the dashboard layout to clear the stale session and redirect to /login.
 */
export class UnauthorizedError extends Error {
  readonly status = 401;
  constructor() {
    super("Session expirée — veuillez vous reconnecter.");
    this.name = "UnauthorizedError";
  }
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
  cache?: RequestCache;
  label?: string;
};

export type SafeApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; unauthorized?: boolean };

const DEFAULT_API_BASE_URL = "http://localhost:3001/api";
const GET_RETRY_DELAYS_MS = process.env.NODE_ENV === "test" ? [0, 0] : [150, 350];

function toErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const candidate = payload as { message?: string | string[] };
  if (typeof candidate.message === "string") {
    return candidate.message;
  }

  if (Array.isArray(candidate.message)) {
    return candidate.message.join(", ");
  }

  return fallback;
}

export function getApiBaseUrl(): string {
  const configuredBaseUrl =
    process.env.API_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    DEFAULT_API_BASE_URL;

  return configuredBaseUrl.replace(/\/$/, "");
}

function getApiHost(): string {
  try {
    return new URL(getApiBaseUrl()).host;
  } catch {
    return "invalid-api-base-url";
  }
}

function logApiFailure({
  path,
  method,
  label,
  status,
  durationMs,
  error,
}: {
  path: string;
  method: string;
  label?: string;
  status?: number;
  durationMs: number;
  error?: unknown;
}) {
  const errorMessage =
    error instanceof Error ? error.message : typeof error === "string" ? error : undefined;

  console.error("[apiRequest] request failed", {
    label,
    method,
    path,
    host: getApiHost(),
    status,
    durationMs,
    error: errorMessage,
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetriableStatus(status: number) {
  return status === 502 || status === 503 || status === 504;
}

function isRetriableFetchError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("networkerror") ||
    message.includes("the operation was aborted") ||
    message.includes("aborterror") ||
    error.name === "AbortError" ||
    error.name === "TimeoutError"
  );
}

export function toUserFacingApiError(error: unknown, fallback: string): string {
  if (error instanceof UnauthorizedError) {
    return "Session expirée — reconnectez-vous.";
  }

  const message = error instanceof Error ? error.message.trim() : "";
  if (!message) return fallback;

  const normalized = message.toLowerCase();
  const isTechnicalServerMessage =
    normalized.includes("server components render") ||
    normalized.includes("api request failed (5") ||
    normalized.includes("fetch failed") ||
    normalized.includes("networkerror") ||
    normalized.includes("the operation was aborted") ||
    normalized.includes("aborterror") ||
    normalized.includes("digest");

  return isTechnicalServerMessage ? fallback : message;
}

export async function safeApiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
  fallback = "Donnée indisponible pour le moment.",
): Promise<SafeApiResult<T>> {
  try {
    const data = await apiRequest<T>(path, options);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: toUserFacingApiError(error, fallback),
      unauthorized: error instanceof UnauthorizedError,
    };
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const startedAt = Date.now();
  const maxAttempts = method === "GET" ? GET_RETRY_DELAYS_MS.length + 1 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, {
        method,
        cache: options.cache ?? "no-store",
        headers: {
          ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
          ...(options.body ? { "Content-Type": "application/json" } : {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      const canRetry =
        method === "GET" &&
        attempt < maxAttempts - 1 &&
        isRetriableFetchError(error);

      if (canRetry) {
        await sleep(GET_RETRY_DELAYS_MS[attempt] ?? 0);
        continue;
      }

      logApiFailure({
        path,
        method,
        label: options.label,
        durationMs: Date.now() - startedAt,
        error,
      });
      throw error;
    }

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text) as unknown;
      } catch {
        payload = text;
      }
    }

    if (response.status === 401) {
      throw new UnauthorizedError();
    }

    if (!response.ok) {
      const fallback = `API request failed (${response.status})`;
      const message = toErrorMessage(payload, fallback);
      const canRetry =
        method === "GET" &&
        attempt < maxAttempts - 1 &&
        isRetriableStatus(response.status);

      if (canRetry) {
        await sleep(GET_RETRY_DELAYS_MS[attempt] ?? 0);
        continue;
      }

      logApiFailure({
        path,
        method,
        label: options.label,
        status: response.status,
        durationMs: Date.now() - startedAt,
        error: message,
      });
      throw new Error(message);
    }

    return payload as T;
  }

  throw new Error("API request failed");
}
