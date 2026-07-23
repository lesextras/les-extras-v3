// Types & constantes partagés entre apps/api et apps/web.
export const APP_NAME = 'LES EXTRAS';

export type AccountType = 'ESTABLISHMENT' | 'FREELANCE';
export type AccountRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER';
export type GlobalRole = 'USER' | 'ADMIN';

export const ACCOUNT_ROLES: AccountRole[] = ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'];
