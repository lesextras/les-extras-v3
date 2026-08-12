import type { ReactNode } from 'react';
import type { Session, SessionUser, SessionAccount, NavRole } from '@/lib/types';
import { resolveNavRole } from '@/lib/nav';
import { AppChrome } from './app-shell';

/**
 * Coquille applicative (Server Component). Accepte DEUX formes d'appel pour
 * s'adapter aux consommateurs :
 *  1. `session` (+ `variant`) — le rôle de nav est déduit automatiquement.
 *  2. props explicites `user` / `accounts` / `activeAccount` / `role`.
 *
 * Ne transmet jamais le token au chrome client.
 */
export type AppShellProps = {
  children: ReactNode;
  actionPanel?: ReactNode;
  /** Salarié pas encore rattaché : menu réduit à ce qui fonctionne. */
  enAttenteRattachement?: boolean;
} & (
  | { session: Session; variant?: 'app' | 'admin'; user?: never; role?: never }
  | {
      user: SessionUser;
      accounts: SessionAccount[];
      activeAccount?: SessionAccount | null;
      role: NavRole;
      session?: never;
      variant?: never;
    }
);

export function AppShell(props: AppShellProps) {
  const { children, actionPanel, enAttenteRattachement } = props;

  let user: SessionUser;
  let accounts: SessionAccount[];
  let activeAccount: SessionAccount | null;
  let role: NavRole;

  if ('session' in props && props.session) {
    const account = props.session.account ?? props.session.activeAccount ?? null;
    user = props.session.user;
    accounts = props.session.accounts ?? (account ? [account] : []);
    activeAccount = account;
    role =
      props.variant === 'admin'
        ? 'ADMIN'
        : resolveNavRole({
            globalRole: props.session.user.role,
            accountType: account?.type ?? null,
          });
  } else {
    user = props.user;
    accounts = props.accounts;
    activeAccount = props.activeAccount ?? null;
    role = props.role;
  }

  return (
    <AppChrome
      user={user}
      accounts={accounts}
      activeAccount={activeAccount}
      role={role}
      enAttenteRattachement={enAttenteRattachement}
      actionPanel={actionPanel}
    >
      {children}
    </AppChrome>
  );
}

export default AppShell;
