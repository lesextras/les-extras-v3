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
import { apiRequest } from '@/lib/api';

export interface AppChromeProps {
  user: SessionUser;
  accounts: SessionAccount[];
  activeAccount?: SessionAccount | null;
  role: NavRole;
  /** Salarié pas encore rattaché : le menu se réduit à ce qui marche. */
  enAttenteRattachement?: boolean;
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
  enAttenteRattachement,
  children,
  actionPanel,
}: AppChromeProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Accès LEX = solde de crédits > 0 (ou accès illimité, ou ADMIN). Le jeton
  // de session ne connaît pas le solde — il bouge à chaque génération — donc
  // on l'interroge une fois au montage. Optimiste par défaut : pas de cadenas
  // qui clignote pendant le chargement, et en cas d'erreur réseau c'est la
  // garde serveur qui tranchera de toute façon.
  const [lexOk, setLexOk] = React.useState(true);
  const accountId = activeAccount?.id;
  React.useEffect(() => {
    if (!accountId || role === 'ADMIN') return;
    let annule = false;
    apiRequest<{ credits?: number; illimite?: boolean }>('/billing/utilisation', { accountId })
      .then((d) => {
        if (!annule && d) setLexOk(Boolean(d.illimite) || (d.credits ?? 0) > 0);
      })
      .catch(() => {
        /* API muette : on reste optimiste, la garde serveur décide. */
      });
    return () => {
      annule = true;
    };
  }, [accountId, role]);
  const isMember = lexOk || Boolean(activeAccount?.isMember) || role === 'ADMIN';

  return (
    // theme-sombre : l'espace connecté partage l'identité de l'accueil. Toutes
    // les couleurs de l'application passent par les jetons CSS (--background,
    // --card, --foreground…), donc un seul conteneur suffit à basculer. Les
    // documents imprimables (contrat, facture, attestation) ont leur propre
    // route hors de cette coquille : ils restent clairs, pour le papier.
    <div className="theme-sombre flex h-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar desktop */}
      <div className="hidden md:block">
        <Sidebar role={role} isMember={isMember} roleCompte={activeAccount?.role} enAttenteRattachement={enAttenteRattachement} utilisateur={user} />
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
              <Sidebar role={role} isMember={isMember} roleCompte={activeAccount?.role} enAttenteRattachement={enAttenteRattachement} utilisateur={user} onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          user={user}
          accounts={accounts}
          activeAccount={activeAccount}
          isMember={isMember}
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
          {/* Le bot d'aide est GRATUIT pour tous : il aide à se servir de la
              plateforme, seule la génération LEX consomme des crédits. */}
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
