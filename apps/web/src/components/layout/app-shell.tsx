'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SessionUser, SessionAccount, NavRole } from '@/lib/types';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { Breadcrumb } from './breadcrumb';
import { PageHelp } from './page-help';
import { ChatBot } from '@/app/_shared/ChatBot';

export interface AppChromeProps {
  user: SessionUser;
  accounts: SessionAccount[];
  activeAccount?: SessionAccount | null;
  role: NavRole;
  children: React.ReactNode;
  /** Panneau latéral droit contextuel (ActionPanel) optionnel. */
  actionPanel?: React.ReactNode;
}

/**
 * Chrome applicatif CLIENT : Sidebar (desktop + overlay mobile) + Header +
 * contenu, avec un ActionPanel optionnel. Reçoit uniquement des données
 * sérialisables (pas de token). Monté par <AppShell> (server).
 */
export function AppChrome({
  user,
  accounts,
  activeAccount,
  role,
  children,
  actionPanel,
}: AppChromeProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        <Sidebar role={role} />
      </div>

      {/* Sidebar mobile en overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="absolute left-0 top-0 h-full animate-slide-up">
            <div className="relative h-full">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="absolute -right-11 top-4 rounded-lg bg-card p-2 text-foreground shadow-soft"
                aria-label="Fermer le menu"
              >
                <X className="size-5" />
              </button>
              <Sidebar role={role} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          user={user}
          accounts={accounts}
          activeAccount={activeAccount}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main
            id="main"
            className={cn('min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8')}
          >
            <Breadcrumb />
            <PageHelp />
            {children}
          </main>
          <ChatBot mode="dashboard" />
          {actionPanel && (
            <div className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-card xl:block">
              {actionPanel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
