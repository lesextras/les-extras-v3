/**
 * Client HTTP fin vers l'API NestJS (préfixe global /api, port 3001).
 * Utilisable côté serveur (avec token/accountId explicites) et côté client.
 */

export function getApiBaseUrl(): string {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    'http://localhost:3001/api'
  );
}

export interface ApiRequestOptions<TBody = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: TBody;
  /** JWT à poser en Authorization: Bearer. */
  token?: string | null;
  /** Id du compte actif → header x-account-id (isolation multi-tenant). */
  accountId?: string | null;
  /** En-têtes additionnels. */
  headers?: Record<string, string>;
  /** Options de cache Next.js. Par défaut on ne cache pas (no-store). */
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
  /** Signal d'annulation optionnel. */
  signal?: AbortSignal;
}

/** Erreur API typée : conserve le status HTTP et le payload d'erreur. */
export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Effectue une requête vers l'API et renvoie le corps JSON typé.
 *
 * @example
 * const me = await apiRequest<Me>('/auth/me', { token, accountId });
 */
export async function apiRequest<TResponse = unknown, TBody = unknown>(
  path: string,
  options: ApiRequestOptions<TBody> = {},
): Promise<TResponse> {
  const {
    method = 'GET',
    body,
    token,
    accountId,
    headers = {},
    cache = 'no-store',
    next,
    signal,
  } = options;

  const isBrowser = typeof window !== 'undefined';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Navigateur : passe par le proxy same-origin (/api/proxy) qui injecte
  // le token depuis le cookie httpOnly. Serveur : appel direct à l'API.
  const url = isBrowser ? `/api/proxy${cleanPath}` : `${getApiBaseUrl()}${cleanPath}`;

  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  if (accountId) finalHeaders['x-account-id'] = accountId;

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    credentials: isBrowser ? 'include' : 'same-origin',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: next ? undefined : cache,
    next,
    signal,
  });

  // 204 / corps vide
  if (res.status === 204) {
    return undefined as TResponse;
  }

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      (isJson && payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : undefined) ?? `Erreur API ${res.status}`;
    throw new ApiError(res.status, message, payload);
  }

  return payload as TResponse;
}

/**
 * Variante côté navigateur : cible NEXT_PUBLIC_API_URL et ne connaît pas
 * les variables serveur. Le token/accountId doivent être passés explicitement.
 */
export function getPublicApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
}
