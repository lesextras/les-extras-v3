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
  Filter,
  Megaphone,
  Target,
  Star,
  ScrollText,
  ShieldQuestion,
  Newspaper,
  PenLine,
  Lightbulb,
  Award,
  UserPlus,
  MessagesSquare,
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
  /** Fonctionnalité LEX réservée aux adhérents (cadenas si non-adhérent). */
  premium?: boolean;
  /** Entrée du « mode essentiel » : visible même quand le menu est replié. */
  essentiel?: boolean;
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
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, hint: 'Vue d’ensemble et actions à traiter', essentiel: true },
    ],
  },
  {
    title: 'Mon activité',
    items: [
      { label: 'Opportunités', href: '/dashboard/opportunites', icon: Target, essentiel: true, hint: 'Missions qui correspondent à votre profil, classées par score' },
      { label: 'Mon planning', href: '/dashboard/planning', icon: CalendarClock, essentiel: true, hint: 'Vos interventions confirmées' },
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessageSquare, essentiel: true, hint: 'Échanges avec les établissements' },
      { label: 'Le GAP', href: '/dashboard/gap', icon: MessagesSquare, essentiel: true, hint: 'Groupe d’Analyse de Pratique en ligne : déposez une situation, recevez les retours de professionnels, anonymement' },
      { label: "LEX · Assistant d'écriture", href: '/dashboard/assistant', icon: PenLine, premium: true, hint: 'Notes brutes → écrit professionnel relu par vous. Noms masqués, notes jamais stockées. Réservé aux adhérents.' },
      { label: "LEX · Générateur d'activités", href: '/dashboard/activites', icon: Lightbulb, premium: true, hint: 'Décrivez le public et les besoins : LEX propose des activités structurées, à valider en équipe. Réservé aux adhérents.' },
    ],
  },
  {
    title: 'Mon offre',
    items: [
      { label: 'Édublog', href: '/edublog', icon: Newspaper, hint: 'Le fil public : articles et actualités du médico-social' },
      // Deux besoins distincts, deux entrées : gérer SES fiches (dans l'espace)
      // et parcourir le catalogue tel que le voient les établissements (la
      // vitrine publique).
      { label: 'Mes réservations', href: '/dashboard/reservations', icon: CalendarCheck, essentiel: true, hint: 'Missions et ateliers qu’on vous a réservés, avec leur contrat' },
      { label: 'Mes ateliers', href: '/dashboard/ateliers', icon: Sparkles, essentiel: true, hint: 'Créez et gérez vos interventions' },
      { label: 'Mes formations', href: '/dashboard/formations', icon: GraduationCap, hint: 'Sessions que vous animez : émargement, apprenants, attestations' },
      { label: 'Le catalogue d’ateliers', href: '/ateliers', icon: Sparkles, hint: 'Le catalogue public, tel que le voient les établissements' },
      { label: 'Les formations Qualiopi', href: '/formations', icon: GraduationCap, hint: 'Le catalogue certifiant ADéPA, côté public' },

    ],
  },
  {
    title: 'Mon espace',
    items: [
      { label: 'Devis & factures', href: '/dashboard/facturation', icon: Receipt, essentiel: true, hint: 'Vos devis à chiffrer et vos factures — au même endroit' },
      { label: 'Avis', href: '/dashboard/avis', icon: Star, hint: 'Les avis reçus et ceux qu\'il vous reste à donner' },
      { label: 'Mes publications', href: '/dashboard/actualites', icon: Newspaper, hint: 'Écrivez pour l’Édublog et partagez sur LinkedIn' },
      { label: 'Points & récompenses', href: '/dashboard/points', icon: Award, hint: '10 points = 1 € de réduction. Publier, intervenir, donner un avis : tout compte.' },
      { label: 'Boîte à idées', href: '/dashboard/idees', icon: Lightbulb, hint: 'Proposez une amélioration et votez pour celles des autres' },
      { label: 'Mon compte', href: '/dashboard/account', icon: Settings, hint: 'Profil, paramètres et sécurité' },
      { label: 'Mes données personnelles', href: '/dashboard/donnees-personnelles', icon: ShieldQuestion, hint: 'Exporter vos données ou demander leur suppression (RGPD)' },
    ],
  },
];

const establishmentNav: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, hint: 'Vue d’ensemble et actions à traiter', essentiel: true },
    ],
  },
  {
    title: 'Mon activité',
    items: [
      { label: 'SOS Renfort', href: '/dashboard/renforts', icon: Megaphone, essentiel: true, hint: 'Publiez un besoin de remplacement et suivez les candidatures' },
      // Le suivi de ce qu'on a commandé manquait complètement : renforts,
      // ateliers et inscriptions en formation étaient enregistrés mais
      // invisibles hors du back-office administrateur.
      { label: 'Mes réservations', href: '/dashboard/reservations', icon: CalendarCheck, essentiel: true, hint: 'Renforts pourvus, ateliers réservés et inscriptions en formation — internes comme externes' },
      { label: 'Planning', href: '/dashboard/planning', icon: CalendarClock, essentiel: true, hint: 'Vos créneaux et interventions' },
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessageSquare, essentiel: true, hint: 'Échanges avec les freelances' },
      { label: 'Le GAP', href: '/dashboard/gap', icon: MessagesSquare, essentiel: true, hint: 'Groupe d’Analyse de Pratique en ligne : déposez une situation, recevez les retours de professionnels, anonymement' },
      { label: "LEX · Assistant d'écriture", href: '/dashboard/assistant', icon: PenLine, premium: true, hint: 'Notes brutes → écrit professionnel relu par vous. Noms masqués, notes jamais stockées. Réservé aux adhérents.' },
      { label: "LEX · Générateur d'activités", href: '/dashboard/activites', icon: Lightbulb, premium: true, hint: 'Décrivez le public et les besoins : LEX propose des activités structurées, à valider en équipe. Réservé aux adhérents.' },
    ],
  },
  {
    title: 'Catalogue',
    items: [
      { label: 'Édublog', href: '/edublog', icon: Newspaper, hint: 'Le fil public : articles et actualités du médico-social' },
      // Comme l'Édublog : on envoie sur la vitrine publique, pas sur un double
      // interne. Le catalogue de l'accueil est le plus complet et le mieux
      // présenté ; entretenir une seconde liste dans le tableau de bord, c'est
      // entretenir deux vérités et en laisser une vieillir.
      { label: 'Ateliers', href: '/ateliers', icon: Sparkles, essentiel: true, hint: 'Catalogue d’ateliers à réserver' },
      { label: 'Formations', href: '/formations', icon: GraduationCap, essentiel: true, hint: 'Catalogue certifiant ADéPA — inscrivez vos salariés' },
    ],
  },
  {
    title: 'Mon établissement',
    items: [
      { label: 'Formation interne', href: '/dashboard/formations', icon: GraduationCap, hint: 'Faites former vos équipes par un salarié référent' },
      { label: 'Équipe & invitations', href: '/dashboard/account', icon: Users, hint: 'Gérez les membres et les accès de votre structure' },
      // Devis et factures sont les deux temps du même geste : on chiffre,
      // puis on facture. Deux entrées éloignées obligeaient à traverser le
      // menu pour retrouver la facture d'un devis accepté.
      { label: 'Devis & factures', href: '/dashboard/facturation', icon: Receipt, essentiel: true, hint: 'Vos devis à chiffrer ou à décider, et vos factures — au même endroit' },
      { label: 'Adhésion', href: '/dashboard/adhesion', icon: Receipt, hint: 'Adhérer à l’association pour débloquer LEX. Les prestations, elles, se règlent à la facture.' },
      { label: 'Avis', href: '/dashboard/avis', icon: Star, hint: 'Évaluez les intervenants après leurs missions' },
      { label: 'Mes publications', href: '/dashboard/actualites', icon: Newspaper, hint: 'Écrivez pour l’Édublog et partagez sur LinkedIn' },
      { label: 'Proposer mes services', href: '/dashboard/devenir-intervenant', icon: UserPlus, hint: 'Salarié ? Créez votre compte intervenant et reprenez vos fiches pour intervenir aussi dans d’autres structures' },
      { label: 'Points & récompenses', href: '/dashboard/points', icon: Award, hint: '10 points = 1 € de réduction sur vos factures, dans la limite de 30 % du montant' },
      { label: 'Boîte à idées', href: '/dashboard/idees', icon: Lightbulb, hint: 'Proposez une amélioration et votez pour celles des autres' },
      { label: 'Mes données personnelles', href: '/dashboard/donnees-personnelles', icon: ShieldQuestion, hint: 'Exporter vos données ou demander leur suppression (RGPD)' },
      { label: 'Coffre-fort conformité', href: '/dashboard/conformite', icon: FileCheck, hint: 'Pièces obligatoires des intervenants (CNI, casier, permis, IBAN, URSSAF) : statut, échéances et alertes' },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard, hint: 'Vue d’ensemble de la plateforme' },
      { label: 'Mon espace', href: '/dashboard', icon: Home, hint: 'Votre tableau de bord personnel (ateliers, missions, activité)' },
      { label: "LEX · Assistant d'écriture", href: '/dashboard/assistant', icon: PenLine, premium: true, hint: 'Notes brutes → écrit professionnel relu par vous. Noms masqués, notes jamais stockées. Réservé aux adhérents.' },
      { label: "LEX · Générateur d'activités", href: '/dashboard/activites', icon: Lightbulb, premium: true, hint: 'Décrivez le public et les besoins : LEX propose des activités structurées, à valider en équipe. Réservé aux adhérents.' },
    ],
  },
  {
    title: 'Catalogue & réservations',
    items: [
      { label: 'Missions', href: '/admin/missions', icon: Megaphone, hint: 'Modérer les missions de renfort' },
      { label: 'Ateliers', href: '/admin/ateliers', icon: Sparkles, hint: 'Modérer le catalogue d’ateliers' },
      { label: 'Réservations', href: '/admin/reservations', icon: CalendarCheck, hint: 'Suivi des réservations et des bookings' },
      { label: 'Educat’heures', href: '/admin/educatheures', icon: Clock, hint: 'Banque d’heures d’intervention' },
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
      { label: 'Boîte à idées', href: '/dashboard/idees', icon: Lightbulb, hint: 'Idées de la communauté : arbitrer, répondre, planifier' },
      { label: 'Le GAP', href: '/dashboard/gap', icon: MessagesSquare, hint: 'Groupe d’Analyse de Pratique : modérer et animer les situations déposées' },
    ],
  },
  {
    title: 'Mon compte',
    items: [
      { label: 'Avis', href: '/dashboard/avis', icon: Star, hint: 'Les avis que vous avez reçus et ceux qu’il vous reste à donner' },
      { label: 'Points & récompenses', href: '/dashboard/points', icon: Award, hint: '10 points = 1 € de réduction. Publier, intervenir, donner un avis : tout compte.' },
      { label: 'Mon profil', href: '/dashboard/account', icon: Users, hint: 'Vos informations, votre équipe et vos invitations' },
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
      { label: "Tunnel d'acquisition", href: '/admin/tunnel', icon: Filter, hint: 'Vue → demande → devis → réservation, fiche par fiche' },
      { label: 'Journal d\'audit', href: '/admin/journal', icon: ScrollText, hint: 'Qui a fait quoi, et quand : validations d\'heures, modérations, changements de rôle' },
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
