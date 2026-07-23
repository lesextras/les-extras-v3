import { SetMetadata } from '@nestjs/common';
import { AccountRole } from '@prisma/client';

export const ACCOUNT_ROLES_KEY = 'accountRoles';

/**
 * Déclare les AccountRole autorisés sur une route (RBAC compte).
 * À combiner avec AccountRolesGuard.
 * Ex : `@AccountRoles('OWNER', 'ADMIN')`.
 */
export const AccountRoles = (...roles: AccountRole[]) => SetMetadata(ACCOUNT_ROLES_KEY, roles);
