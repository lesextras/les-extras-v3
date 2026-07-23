import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Sparkles,
  CalendarClock,
  GraduationCap,
  MessageSquare,
  Star,
  FileText,
  Users,
  Building2,
  ShieldCheck,
  Settings,
  BarChart3,
  FolderLock,
  Megaphone,
  Target,
} from 'lucide-react';
import type { NavRole, AccountType } from './types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Badge optionnel (ex: nouveautés / compteur). */
  badge?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * Déduit le rôle de navigation UI à partir du rôle global + type de compte actif.
 * ADMIN (rôle global) prime ; sinon on se base sur le type de compte.
 */
export function resolveNavRole(params: {
  globalRole?: 'USER' | 'ADMIN';
  accountType?: AccountType | null;
}): NavRole {
  if (params.globalRole === 'ADMIN') return 'ADMIN';
  if (params.accountType === 'ESTABLISHMENT') return 'ESTABLISHMENT';
  return 'FREELANCE';
}

const freelanceNav: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Opportunités', href: '/dashboard/opportunites', icon: Target },
      { label: 'Marketplace', href: '/marketplace', icon: Sparkles },
      { label: 'Mon planning', href: '/dashboard/planning', icon: CalendarClock },
      { label: 'Mes ateliers', href: '/dashboard/ateliers', icon: GraduationCap },
    ],
  },
  {
    title: 'Activité',
    items: [
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessageSquare },
      { label: 'Factures & revenus', href: '/dashboard/finance', icon: FileText },
      { label: 'Mon compte', href: '/dashboard/account', icon: Settings },
    ],
  },
];

const establishmentNav: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
      { label: 'SOS Renfort', href: '/dashboard/renforts', icon: Megaphone },
      { label: 'Marketplace', href: '/marketplace', icon: Sparkles },
      { label: 'Planning', href: '/dashboard/planning', icon: CalendarClock },
      { label: 'Ateliers', href: '/dashboard/ateliers', icon: GraduationCap },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessageSquare },
      { label: 'Équipe & invitations', href: '/dashboard/account', icon: Users },
      { label: 'Factures', href: '/dashboard/finance', icon: FileText },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    items: [
      { label: 'Vue d\u2019ensemble', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Mod\u00e9ration',
    items: [
      { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
      { label: 'Missions', href: '/admin/missions', icon: Megaphone },
      { label: 'Ateliers', href: '/admin/ateliers', icon: GraduationCap },
    ],
  },
  {
    title: 'Pilotage',
    items: [
      { label: 'Statistiques', href: '/admin/statistiques', icon: BarChart3 },
    ],
  },
];

/** Retourne les sections de navigation adaptées au rôle. */
export function getNavForRole(role: NavRole): NavSection[] {
  switch (role) {
    case 'ADMIN':
      return adminNav;
    case 'ESTABLISHMENT':
      return establishmentNav;
    case 'FREELANCE':
    default:
      return freelanceNav;
  }
}
