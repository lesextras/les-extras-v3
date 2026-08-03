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

/** Libellés français des statuts HTTP courants — le repli quand l'API ne dit rien de mieux. */
const STATUT_FR: Record<number, string> = {
  400: 'Demande invalide — vérifiez les champs saisis.',
  401: 'Session expirée — reconnectez-vous.',
  403: "Vous n'avez pas les droits pour cette action.",
  404: 'Introuvable — la page ou la ressource a peut-être été supprimée.',
  409: 'Conflit — cette action a déjà été faite, ou entre en collision avec une autre.',
  422: 'Données invalides — vérifiez les champs saisis.',
  429: 'Trop de tentatives — patientez un instant avant de réessayer.',
  500: 'Erreur du serveur — réessayez dans un instant.',
  502: 'Service momentanément indisponible — réessayez dans un instant.',
  503: 'Service momentanément indisponible — réessayez dans un instant.',
};

/**
 * Extrait un message montrable d'une erreur NestJS.
 *
 * La ValidationPipe renvoie `message` comme TABLEAU de phrases (une par champ
 * en faute) : `String(tableau)` les collait avec des virgules en un bloc
 * illisible. On les aplatit proprement, et quand l'API ne fournit rien
 * d'utilisable (ou un libellé technique anglais type "Internal server error"),
 * on retombe sur un libellé français du statut.
 */
function messageLisible(status: number, payload: unknown): string {
  const repli = STATUT_FR[status] ?? `Erreur ${status} — réessayez dans un instant.`;
  if (!payload || typeof payload !== 'object' || !('message' in payload)) return repli;
  const brut = (payload as { message: unknown }).message;
  const textes = (Array.isArray(brut) ? brut : [brut])
    .filter((m): m is string => typeof m === 'string' && m.trim().length > 0);
  if (textes.length === 0) return repli;
  // Libellés techniques par défaut de NestJS : pas montrables tels quels.
  const techniques = new Set([
    'Bad Request', 'Unauthorized', 'Forbidden', 'Not Found', 'Conflict',
    'Internal Server Error', 'Internal server error', 'Unprocessable Entity',
    'Too Many Requests', 'ThrottlerException: Too Many Requests',
  ]);
  const utiles = textes.filter((t) => !techniques.has(t));
  return utiles.length > 0 ? utiles.join(' · ') : repli;
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
    throw new ApiError(res.status, messageLisible(res.status, isJson ? payload : null), payload);
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
