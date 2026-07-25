import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Store,
  Sparkles,
  CalendarClock,
  CalendarCheck,
  Clock,
  GraduationCap,
  MessageSquare,
  Receipt,
  FileText,
  ShieldCheck,
  FileCheck,
  ClipboardList,
  Home,
  Mail,
  KeyRound,
  Tags,
  Users,
  Building2,
  Settings,
  BarChart3,
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
    title: 'Mon activité',
    items: [
      { label: 'Opportunités', href: '/dashboard/opportunites', icon: Target, hint: 'Missions qui correspondent à votre profil, classées par score' },
      { label: 'Mon planning', href: '/dashboard/planning', icon: CalendarClock, hint: 'Vos interventions confirmées' },
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessageSquare, hint: 'Échanges avec les établissements' },
    ],
  },
  {
    title: 'Mon offre',
    items: [
      { label: 'Marketplace', href: '/marketplace', icon: Store, hint: 'Toutes les missions et ateliers ouverts' },
      { label: 'Mes ateliers', href: '/dashboard/ateliers', icon: Sparkles, hint: 'Créez et gérez vos interventions' },
      { label: 'Mes formations', href: '/dashboard/formations', icon: GraduationCap, hint: 'Sessions que vous animez : émargement, apprenants, attestations' },
    ],
  },
  {
    title: 'Mon espace',
    items: [
      { label: 'Factures & revenus', href: '/dashboard/finance', icon: Receipt, hint: 'Vos revenus et documents' },
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
    title: 'Mon activité',
    items: [
      { label: 'SOS Renfort', href: '/dashboard/renforts', icon: Megaphone, hint: 'Publiez un besoin de remplacement et suivez les candidatures' },
      { label: 'Planning', href: '/dashboard/planning', icon: CalendarClock, hint: 'Vos créneaux et interventions' },
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessageSquare, hint: 'Échanges avec les freelances' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { label: 'Marketplace', href: '/marketplace', icon: Store, hint: 'Toutes les missions et ateliers' },
      { label: 'Ateliers', href: '/marketplace?type=services', icon: Sparkles, hint: 'Catalogue d’ateliers à réserver' },
      { label: 'Formations', href: '/marketplace/formations', icon: GraduationCap, hint: 'Catalogue certifiant ADéPA — inscrivez vos salariés' },
    ],
  },
  {
    title: 'Mon établissement',
    items: [
      { label: 'Formation interne', href: '/dashboard/formations', icon: GraduationCap, hint: 'Faites former vos équipes par un salarié référent' },
      { label: 'Coffre-fort conformité', href: '/dashboard/conformite', icon: FileCheck, hint: 'Pièces obligatoires des intervenants (CNI, casier, permis, IBAN, URSSAF) : statut, échéances et alertes' },
      { label: 'Équipe & invitations', href: '/dashboard/account', icon: Users, hint: 'Gérez les membres et les accès de votre structure' },
      { label: 'Factures', href: '/dashboard/finance', icon: Receipt, hint: 'Vos factures et dépenses' },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard, hint: 'Vue d’ensemble de la plateforme' },
      { label: 'Mon espace', href: '/dashboard', icon: Home, hint: 'Votre tableau de bord personnel (ateliers, missions, activité)' },
    ],
  },
  {
    title: 'Marketplace',
    items: [
      { label: 'Missions', href: '/admin/missions', icon: Megaphone, hint: 'Modérer les missions de renfort' },
      { label: 'Ateliers', href: '/admin/ateliers', icon: Sparkles, hint: 'Modérer le catalogue d’ateliers' },
      { label: 'Réservations', href: '/admin/reservations', icon: CalendarCheck, hint: 'Suivi des réservations et des bookings' },
      { label: 'Educat’heures', href: '/admin/educatheures', icon: Clock, hint: 'Banque d’heures et crédits d’intervention' },
    ],
  },
  {
    title: 'Gestion des utilisateurs',
    items: [
      { label: 'Comptes & sous-comptes', href: '/admin/etablissements', icon: Building2, hint: 'Chaque compte (établissement/freelance) avec ses sous-comptes rattachés et leurs rôles' },
      { label: 'Utilisateurs', href: '/admin/utilisateurs', icon: Users, hint: 'Tous les utilisateurs et leurs rattachements (salarié, responsable, freelance)' },
      { label: 'Coffre-fort conformité', href: '/admin/conformite', icon: FileCheck, hint: 'Complétude des pièces obligatoires des intervenants, agrégée par établissement' },
      { label: 'Invitations', href: '/admin/invitations', icon: Mail, hint: 'Invitations en attente, révoquer ou renvoyer' },
      { label: 'Rôles & droits', href: '/admin/roles', icon: KeyRound, hint: 'Matrice des rôles et permissions' },
    ],
  },
  {
    title: 'Centre de formation',
    items: [
      { label: 'Formations', href: '/admin/formations', icon: GraduationCap, hint: 'Programmes certifiants (Qualiopi) et formations internes' },
      { label: 'Conformité Qualiopi', href: '/admin/qualiopi', icon: ShieldCheck, hint: 'Matrice des 7 critères / 32 indicateurs et preuves' },
      { label: 'Registre & BPF', href: '/admin/registre', icon: ClipboardList, hint: 'Registre des formations et Bilan Pédagogique et Financier' },
    ],
  },
  {
    title: 'Contenu',
    items: [
      { label: 'Articles', href: '/admin/articles', icon: FileText, hint: 'Articles et pages éditoriales' },
      { label: 'Catégories', href: '/admin/categories', icon: Tags, hint: 'Taxonomie des missions et ateliers' },
      { label: 'Demandes de contact', href: '/admin/contacts', icon: Mail, hint: 'Messages reçus via le formulaire de contact public' },
    ],
  },
  {
    title: 'Facturation',
    items: [
      { label: 'Factures', href: '/admin/factures', icon: Receipt, hint: 'Facturation de la plateforme' },
    ],
  },
  {
    title: 'Pilotage',
    items: [
      { label: 'Statistiques', href: '/admin/statistiques', icon: BarChart3, hint: 'KPIs détaillés de la plateforme' },
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
