/**
 * Types partagés côté web, alignés sur le schéma Prisma (apps/api).
 * On garde des `type` string-union pour rester léger et sérialisable.
 */

export type GlobalRole = 'USER' | 'ADMIN';
export type UserStatus = 'PENDING' | 'VERIFIED' | 'BANNED';
export type AccountType = 'ESTABLISHMENT' | 'FREELANCE';
export type AccountRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';

/** Type de navigation/permissions côté UI (rôle métier effectif). */
export type NavRole = 'FREELANCE' | 'ESTABLISHMENT' | 'ADMIN';

export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  role: GlobalRole;
  status?: UserStatus;
  /** Étape d'onboarding (0 = pas commencé). */
  onboardingStep: number;
}

export interface SessionAccount {
  id: string;
  name: string;
  type: AccountType;
  slug?: string;
  logoUrl?: string | null;
  /** Rôle de l'utilisateur DANS ce compte. */
  role: AccountRole;
}

export interface Session {
  user: SessionUser;
  token: string;
  /**
   * Compte actif (porté par le cookie / header x-account-id).
   * Exposé sous deux noms pour la compat consommateurs : `account`
   * (Web-Marketplace) et `activeAccount` (socle Web-Core).
   */
  account: SessionAccount;
  activeAccount?: SessionAccount | null;
  /** Tous les comptes accessibles (pour le switch de compte). */
  accounts?: SessionAccount[];
}
