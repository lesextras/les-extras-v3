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
  /** Info-bulle explicative affichée au survol. */
  hint?: string;
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
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, hint: 'Vue d’ensemble et actions à traiter' },
    ],
  },
  {
    title: 'Activité',
    items: [
      { label: 'Opportunités', href: '/dashboard/opportunites', icon: Target, hint: 'Missions qui correspondent à votre profil, classées par score' },
      { label: 'Mon planning', href: '/dashboard/planning', icon: CalendarClock, hint: 'Vos interventions confirmées' },
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessageSquare, hint: 'Échanges avec les établissements' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { label: 'Marketplace', href: '/marketplace', icon: Sparkles, hint: 'Toutes les missions et ateliers ouverts' },
      { label: 'Mes ateliers', href: '/dashboard/ateliers', icon: GraduationCap, hint: 'Créez et gérez vos interventions' },
      { label: 'Mes formations', href: '/dashboard/formations', icon: GraduationCap, hint: 'Sessions que vous animez : émargement, apprenants, attestations' },
    ],
  },
  {
    title: 'Mon espace',
    items: [
      { label: 'Factures & revenus', href: '/dashboard/finance', icon: FileText, hint: 'Vos revenus et documents' },
      { label: 'Mon compte', href: '/dashboard/account', icon: Settings, hint: 'Profil, paramètres et sécurité' },
    ],
  },
];

const establishmentNav: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, hint: 'Vue d’ensemble et actions à traiter' },
    ],
  },
  {
    title: 'Activité',
    items: [
      { label: 'SOS Renfort', href: '/dashboard/renforts', icon: Megaphone, hint: 'Publiez un besoin de remplacement et suivez les candidatures' },
      { label: 'Planning', href: '/dashboard/planning', icon: CalendarClock, hint: 'Vos créneaux et interventions' },
      { label: 'Formation interne', href: '/dashboard/formations', icon: GraduationCap, hint: 'Faites former vos équipes par un salarié référent' },
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessageSquare, hint: 'Échanges avec les freelances' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { label: 'Marketplace', href: '/marketplace', icon: Sparkles, hint: 'Toutes les missions et ateliers' },
      { label: 'Ateliers', href: '/marketplace?type=services', icon: GraduationCap, hint: 'Catalogue d’ateliers à réserver' },
      { label: 'Formations', href: '/marketplace/formations', icon: GraduationCap, hint: 'Catalogue certifiant ADéPA — inscrivez vos salariés' },
    ],
  },
  {
    title: 'Mon espace',
    items: [
      { label: 'Équipe & invitations', href: '/dashboard/account', icon: Users, hint: 'Gérez les membres et les accès de votre structure' },
      { label: 'Factures', href: '/dashboard/finance', icon: FileText, hint: 'Vos factures et dépenses' },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard, hint: 'Vue d\u2019ensemble de la plateforme' },
    ],
  },
  {
    title: 'Contenu',
    items: [
      { label: 'Articles', href: '/admin/articles', icon: FileText },
      { label: 'Cat\u00e9gories', href: '/admin/categories', icon: FolderLock },
    ],
  },
  {
    title: 'Administration',
    items: [
      { label: '\u00c9tablissements', href: '/admin/etablissements', icon: Building2 },
      { label: 'Ateliers', href: '/admin/ateliers', icon: GraduationCap },
      { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users },
    ],
  },
  {
    title: 'AD\u00e9PA',
    items: [
      { label: 'R\u00e9servations', href: '/admin/reservations', icon: CalendarClock },
      { label: 'Missions', href: '/admin/missions', icon: Megaphone },
    ],
  },
  {
    title: 'Centre de formation',
    items: [
      { label: 'Formations', href: '/admin/formations', icon: GraduationCap },
    ],
  },
  {
    title: 'Facturation',
    items: [
      { label: 'Factures', href: '/admin/factures', icon: Star },
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
