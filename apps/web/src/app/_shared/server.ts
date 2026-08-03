// Helpers serveur : garde de session + fetch API tolérant aux erreurs.
// Utilisés par les Server Components des écrans (dashboard, marketplace, admin).
import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { apiRequest } from "@/lib/api";
import type { Session } from "./types";

/** Renvoie la session ou redirige vers /login. */
export async function requireSession(): Promise<Session> {
  const session = (await getSession()) as Session | null;
  if (!session) redirect("/login");
  return session;
}

/** Redirige si le rôle global n'est pas ADMIN. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

/**
 * Appel API côté serveur avec le token + compte actif de la session.
 * Renvoie `{ data }` ou `{ error }` — jamais de throw, pour permettre aux écrans
 * d'afficher un état d'erreur propre sans faire planter le rendu.
 */
/** Verbes acceptés par le client API — aligné sur `apiRequest`. */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function fetchApi<T>(
  session: Session,
  path: string,
  init?: { method?: HttpMethod; body?: unknown },
): Promise<{ data?: T; error?: string }> {
  try {
    const data = (await apiRequest(path, {
      method: init?.method ?? "GET",
      body: init?.body,
      token: session.token,
      accountId: session.account.id,
    })) as T;
    return { data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return { error: message };
  }
}

/** Appel API public (pages non authentifiées) — sans token ni compte. */
export async function fetchPublic<T>(path: string): Promise<{ data?: T; error?: string }> {
  try {
    const data = (await apiRequest(path, { method: "GET" })) as T;
    return { data };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    return { error: message };
  }
}

/**
 * L'accès LEX est lu EN FRAIS depuis l'API : il dépend du solde de crédits
 * du compte (ou d'un accès illimité accordé à la main), qui change à chaque
 * génération et à chaque recharge. Les ADMIN passent toujours. En cas
 * d'erreur réseau, on laisse passer : la garde serveur de l'API reste le
 * verrou de vérité, et elle débite ou refuse à l'appel.
 */
export async function estAdherent(session: Session): Promise<boolean> {
  if (session.user.role === "ADMIN") return true;
  const { data } = await fetchApi<{ credits?: number; illimite?: boolean }>(
    session,
    "/billing/utilisation",
  );
  if (!data) return true; // API muette -> l'API tranchera à l'appel
  return Boolean(data.illimite) || (data.credits ?? 0) > 0;
}
