'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  Bell,
  Search,
  ChevronsUpDown,
  Building2,
  UserRound,
  Check,
  LogOut,
  Settings,
  LifeBuoy,
  LayoutList,
  Newspaper,
  Users,
  Sparkles,
  GraduationCap,
  PenLine,
  Lightbulb,
  MessagesSquare,
} from 'lucide-react';
import { CommandPalette } from './command-palette';
import { IndicateursCompte } from './indicateurs-compte';
import { SupportModal } from '@/app/_shared/modals/SupportModal';
import { BasculeTheme } from '@/app/_shared/BasculeTheme';
import { PastilleNotifications } from './PastilleNotifications';
import { ACCOUNT_ROLE_LABEL } from '@/app/_shared/format';
import { cn, initials } from '@/lib/utils';
import type { SessionUser, SessionAccount } from '@/lib/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export interface HeaderProps {
  user: SessionUser;
  accounts: SessionAccount[];
  activeAccount?: SessionAccount | null;
  /** Accès LEX (solde de crédits > 0 ou accès illimité), lu en frais par AppChrome. */
  isMember?: boolean;
  /** Ouvre la sidebar mobile. */
  onMenuClick?: () => void;
}

/**
 * Barre supérieure de l'app : bouton menu (mobile), switch de compte actif
 * (multi-comptes), notifications et menu utilisateur.
 */
export function Header({ user, accounts, activeAccount, isMember, onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [switching, setSwitching] = React.useState(false);
  const [supportOuvert, setSupportOuvert] = React.useState(false);

  async function switchAccount(accountId: string) {
    if (accountId === activeAccount?.id || switching) return;
    setSwitching(true);
    try {
      await fetch('/api/session/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      router.refresh();
    } finally {
      setSwitching(false);
    }
  }

  async function logout() {
    await fetch('/api/auth/session', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-md md:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="size-5" />
      </button>

      {/* Switch de compte actif */}
      {accounts.length > 0 && (
        <DropdownMenu align="start">
          <DropdownMenuTrigger className="group flex items-center gap-2.5 rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-accent">
            <span
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-lg text-xs font-bold text-primary-foreground',
                activeAccount?.type === 'ESTABLISHMENT' ? 'bg-primary' : 'bg-secondary',
              )}
            >
              {activeAccount?.type === 'ESTABLISHMENT' ? (
                <Building2 className="size-4" />
              ) : (
                <UserRound className="size-4" />
              )}
            </span>
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate text-sm font-semibold text-foreground">
                {activeAccount?.name ?? 'Sélectionner un compte'}
              </span>
              {/* « Freelance · OWNER » : un anglicisme et un code technique,
                  affichés en permanence sous le nom du compte. Le produit
                  possédait déjà la traduction métier (ACCOUNT_ROLE_LABEL) ;
                  elle n'était simplement pas employée ici. « Professionnel ·
                  Direction » se lit, et se dit à voix haute. */}
              <span className="truncate text-xs text-muted-foreground">
                {activeAccount?.type === 'ESTABLISHMENT' ? 'Établissement' : 'Professionnel'}
                {activeAccount?.role
                  ? ` · ${ACCOUNT_ROLE_LABEL[activeAccount.role] ?? activeAccount.role}`
                  : ''}
              </span>
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64">
            <DropdownMenuLabel>Comptes</DropdownMenuLabel>
            {accounts.map((acc) => (
              <DropdownMenuItem key={acc.id} onClick={() => switchAccount(acc.id)}>
                <span
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-md text-[10px] font-bold text-primary-foreground',
                    acc.type === 'ESTABLISHMENT' ? 'bg-primary' : 'bg-secondary',
                  )}
                >
                  {initials(acc.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{acc.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {acc.type === 'ESTABLISHMENT' ? 'Établissement' : 'Freelance'}
                  </span>
                </span>
                {acc.id === activeAccount?.id && <Check className="size-4 text-primary" />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            {/* /dashboard/equipe n'a jamais existé : la gestion des membres
                et des invitations vit dans /dashboard/account. */}
            <DropdownMenuItem onClick={() => router.push('/dashboard/account')}>
              <Building2 />
              Gérer les comptes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Catalogue et LEX & Analyse de pratique : retirés de la sidebar le
          4/8/2026 (demande Siham) et remontés ici, à côté du sélecteur de
          compte, pour rester accessibles sans occuper le menu de gauche.
          Réservé aux comptes établissement : côté freelance, ces entrées
          restent dans la sidebar (pas de doublon de navigation). */}
      {activeAccount?.type === 'ESTABLISHMENT' && (
        <>
          <DropdownMenu align="start">
            <DropdownMenuTrigger className="hidden items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent md:flex">
              <LayoutList className="size-4 text-muted-foreground" />
              Catalogue
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
              <DropdownMenuItem onClick={() => router.push('/edublog')}>
                <Newspaper />
                Édublog
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/intervenants')}>
                <Users />
                Annuaire des intervenants
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/ateliers')}>
                <Sparkles />
                Ateliers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/formations')}>
                <GraduationCap />
                Formations
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* LEX RESTE VISIBLE SUR MOBILE — et c'est le point important.
              Les entrées LEX ont quitté la sidebar le 4/8/2026 pour venir ici ;
              comme ce déclencheur était `hidden md:flex`, un établissement
              consultant la plateforme depuis un téléphone n'avait PLUS AUCUN
              accès à LEX, ni même l'indice que le produit existait. Sur petit
              écran on garde donc le bouton et on n'escamote que son libellé. */}
          <DropdownMenu align="start">
            <DropdownMenuTrigger
              aria-label="LEX et analyse de pratique"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent md:px-3"
            >
              <PenLine className="size-4 text-muted-foreground" />
              <span className="hidden md:inline">LEX &amp; Analyse de pratique</span>
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <DropdownMenuItem onClick={() => router.push('/dashboard/assistant')}>
                <PenLine />
                LEX · Assistant d&apos;écriture
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/activites')}>
                <Lightbulb />
                LEX · Générateur d&apos;activités
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/gap')}>
                <MessagesSquare />
                Analyse de pratique
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}

      <CommandPalette
        isMember={isMember ?? activeAccount?.isMember}
        role={user.role}
        accountType={activeAccount?.type}
      />

      <div className="ml-auto flex items-center gap-1.5">
        <IndicateursCompte userId={user.id} accountId={activeAccount?.id} />
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event('cmdk:open'))}
          className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Rechercher"
        >
          <Search className="size-4" />
          <span className="hidden lg:inline">Rechercher</span>
          <kbd className="hidden rounded border border-border px-1 text-[10px] lg:inline">⌘K</kbd>
        </button>
        {/* La cloche mène aux notifications, pas à la messagerie : la
            pastille compte des notifications, et la page marque tout lu —
            avant, le compteur ne redescendait jamais. */}
        <Link
          href="/dashboard/notifications"
          className="relative rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          <PastilleNotifications />
        </Link>
        <BasculeTheme />

        {/* Menu utilisateur */}
        <DropdownMenu align="end">
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? user.email} />
              <AvatarFallback className="text-xs">{initials(user.name ?? user.email)}</AvatarFallback>
            </Avatar>
            <span className="hidden flex-col items-start leading-tight lg:flex">
              <span className="text-sm font-semibold text-foreground">{user.name ?? 'Mon profil'}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-60">
            <div className="flex items-center gap-3 px-2.5 py-2">
              <Avatar>
                <AvatarImage src={user.avatarUrl ?? undefined} alt={user.name ?? user.email} />
                <AvatarFallback>{initials(user.name ?? user.email)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{user.name ?? user.email}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            {user.role === 'ADMIN' && (
              <div className="px-2.5 pb-2">
                <Badge variant="soft">Administrateur</Badge>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push(user.role === 'ADMIN' ? '/admin' : '/dashboard/account')}
            >
              <UserRound />
              Mon profil
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push(user.role === 'ADMIN' ? '/admin/statistiques' : '/dashboard/account')}
            >
              <Settings />
              Paramètres
            </DropdownMenuItem>
            {/* /dashboard/inbox est la messagerie entre membres : y envoyer
                quelqu'un qui cherche de l'aide, c'est le faire écrire dans le
                vide. Le support, c'est un contact avec l'équipe ADéPA. */}
            <DropdownMenuItem onClick={() => setSupportOuvert(true)}>
              <LifeBuoy />
              Support
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={logout}>
              <LogOut />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Rendue hors du menu déroulant : celui-ci se referme au clic et
          emporterait la modale avec lui. */}
      <SupportModal
        open={supportOuvert}
        onOpenChange={setSupportOuvert}
        utilisateur={{ name: user.name, email: user.email }}
      />
    </header>
  );
}
