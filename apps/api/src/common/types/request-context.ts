import { GlobalRole, AccountRole, AccountType } from '@prisma/client';

/** Identité de connexion, posée par JwtStrategy sur req.user. */
export interface RequestUser {
  id: string;
  email: string;
  role: GlobalRole;
}

/** Compte actif, posé par AccountGuard sur req.account (via header x-account-id). */
export interface RequestAccount {
  id: string;
  /** Rôle du user DANS ce compte (issu du Membership). */
  role: AccountRole;
  /** Type de tenant (ESTABLISHMENT | FREELANCE) — pratique pour le RBAC métier. */
  type: AccountType;
  membershipId: string;
}

/** Requête Express enrichie par les guards du cœur. */
export interface AuthenticatedRequest {
  user?: RequestUser;
  account?: RequestAccount;
  headers: Record<string, string | string[] | undefined>;
}
