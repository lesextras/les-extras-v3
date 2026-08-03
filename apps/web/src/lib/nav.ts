import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  TrendingUp,
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
  FileSignature,
  ShieldAlert,
  UsersRound,
} from 'lucide-react';
import type { NavRole, AccountType, AccountRole } from './types';

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
  /**
   * Réservée aux sous-comptes, c'est-à-dire à toute personne rattachée au
   * compte sans en être le titulaire. Proposer à une MECS de « devenir
   * intervenante » n'a pas de sens : c'est à ses salariés que l'on s'adresse.
   */
  sousComptesSeulement?: boolean;
  /**
   * Rôles autorisés DANS le compte actif. Absent = tout le monde.
   *
   * Un menu qui propose ce que le serveur refusera fait passer une règle pour
   * une panne. Et certaines entrées ne relèvent pas seulement du droit d'agir
   * mais du droit de VOIR : les contrats portent des salaires, la conformité
   * porte des casiers judiciaires, la facturation porte les comptes de la
   * structure. Ce ne sont pas des informations d'équipe.
   */
  roles?: AccountRole[];
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
      // Ce qu'on m'a réservé relève de mon activité, pas de mon offre : c'est
      // du travail engagé, avec une date et un contrat — au même rang que le
      // planning, comme côté établissement.
      { label: 'Mes interventions', href: '/dashboard/reservations', icon: CalendarCheck, essentiel: true, hint: 'Les missions et ateliers qu’on vous a confiés, avec leur proposition d’engagement' },
      { label: 'Mon planning', href: '/dashboard/planning', icon: CalendarClock, essentiel: true, hint: 'Vos interventions confirmées' },
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessageSquare, essentiel: true, hint: 'Échanges avec les établissements' },
      { label: 'Analyse de pratique', href: '/gap', icon: MessagesSquare, essentiel: true, hint: 'Le GAP — groupe d’analyse de la pratique en ligne : déposez une situation, recevez les retours de professionnels, anonymement' },
      { label: "LEX · Assistant d'écriture", href: '/dashboard/assistant', icon: PenLine, premium: true, hint: 'Notes brutes → écrit professionnel relu par vous. Noms masqués, notes jamais stockées. Réservé aux adhérents.' },
      { label: "LEX · Générateur d'activités", href: '/dashboard/activites', icon: Lightbulb, premium: true, hint: 'Décrivez le public et les besoins : LEX propose des activités structurées, à valider en équipe. Réservé aux adhérents.' },
    ],
  },
  // Même section, mêmes libellés que côté établissement : ce sont les mêmes
  // pages publiques. Un intervenant les consulte pour voir comment son offre
  // est présentée, et pour s'inscrire lui-même à une formation.
  {
    title: 'Catalogue',
    items: [
      { label: 'Édublog', href: '/edublog', icon: Newspaper, hint: 'Le fil public : articles et actualités du médico-social' },
      { label: 'Annuaire des intervenants', href: '/intervenants', icon: Users, hint: 'Les profils publics des intervenants du réseau' },
      { label: 'Ateliers', href: '/ateliers', icon: Sparkles, hint: 'Le catalogue public, tel que le voient les établissements' },
      { label: 'Formations', href: '/formations', icon: GraduationCap, hint: 'Le catalogue certifiant ADéPA, côté public' },
    ],
  },
  // « Mon offre », c'est ce que je vends et que je pilote — mes fiches, mes
  // sessions. Rien d'autre : les vitrines publiques sont dans Catalogue.
  {
    title: 'Mon offre',
    items: [
      { label: 'Mes ateliers', href: '/dashboard/ateliers', icon: Sparkles, essentiel: true, hint: 'Créez et gérez vos interventions' },
      { label: 'Mes formations', href: '/dashboard/formations', icon: GraduationCap, hint: 'Sessions que vous animez : émargement, apprenants, attestations' },
      { label: 'Mes publications', href: '/dashboard/actualites', icon: Newspaper, hint: 'Écrivez pour l’Édublog et partagez sur LinkedIn' },
    ],
  },
  {
    title: 'Mon espace',
    items: [
      { label: 'Devis & factures', href: '/dashboard/facturation', icon: Receipt, essentiel: true, hint: 'Vos devis à chiffrer et vos factures — au même endroit' },
      { label: 'Avis', href: '/dashboard/avis', icon: Star, hint: 'Les avis reçus et ceux qu\'il vous reste à donner' },
      { label: 'Ma progression', href: '/dashboard/progression', icon: TrendingUp, hint: 'Vos paliers : Nouveau, Confirmé, Super Extra — et l\'accès prioritaire aux missions' },
      { label: 'Boîte à idées', href: '/dashboard/idees', icon: Lightbulb, hint: 'Proposez une amélioration et votez pour celles des autres' },
      // « Mon compte » n'est plus listé ici : il vit dans le menu de l'avatar,
      // en haut à droite, et dans la palette ⌘K. Deux chemins vers la même
      // page allongeaient le menu sans rien apporter.
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
      { label: 'Renforts et interventions', href: '/dashboard/reservations', icon: CalendarCheck, essentiel: true, hint: 'Vos renforts pourvus, ateliers commandés et inscriptions en formation — internes comme externes' },
      { label: 'Planning', href: '/dashboard/planning', icon: CalendarClock, essentiel: true, hint: 'Vos créneaux et interventions' },
      // Le pendant contractuel du planning : on a trouvé quelqu'un, on
      // l'embauche soi-même en CDD. L'outil calcule ce que personne ne
      // calcule — essai, précarité, carence — et refuse de transmettre un
      // contrat auquel il manque une mention obligatoire.
      { label: 'Contrats CDD', href: '/dashboard/contrats', icon: FileSignature, essentiel: true, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Vous embauchez, l’outil calcule : période d’essai, indemnité de fin de contrat, délai de carence et mentions obligatoires' },
      // Les personnes d'abord : c'est par elles qu'on entre dans le reste.
      // Une fiche par personne, et la conformité comme propriété de cette
      // personne — pas comme un annuaire parallèle qu'il faut recouper.
      { label: 'Équipe', href: '/dashboard/equipe', icon: UsersRound, essentiel: true, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Qui travaille chez vous, dans quel service, avec quel rôle et quel dossier — recherche et filtres par service' },
      { label: 'Conformité', href: '/dashboard/conformite', icon: ShieldAlert, essentiel: true, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Les pièces obligatoires qui manquent ou arrivent à échéance : identité, diplôme, casier judiciaire, permis' },
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessageSquare, essentiel: true, hint: 'Échanges avec les freelances' },
      { label: 'Analyse de pratique', href: '/gap', icon: MessagesSquare, essentiel: true, hint: 'Le GAP — groupe d’analyse de la pratique en ligne : déposez une situation, recevez les retours de professionnels, anonymement' },
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
      { label: 'Annuaire des intervenants', href: '/intervenants', icon: Users, essentiel: true, hint: 'Parcourez les profils publics des intervenants du réseau' },
      { label: 'Ateliers', href: '/ateliers', icon: Sparkles, essentiel: true, hint: 'Catalogue d’ateliers à réserver' },
      { label: 'Formations', href: '/formations', icon: GraduationCap, essentiel: true, hint: 'Catalogue certifiant ADéPA — inscrivez vos salariés' },
    ],
  },
  {
    title: 'Mon établissement',
    items: [
      { label: 'Former mes équipes', href: '/dashboard/formations', icon: GraduationCap, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Organisez une formation en interne, animée par un salarié référent' },
      { label: 'Mon établissement', href: '/dashboard/account', icon: Building2, hint: 'Coordonnées, préférences et réglages de votre structure' },
      { label: 'Congés & compteurs', href: '/dashboard/conges', icon: CalendarCheck, hint: 'Demandes d\'absence validées par un responsable, heures planifiées, soldes et export paie' },
      // Devis et factures sont les deux temps du même geste : on chiffre,
      // puis on facture. Deux entrées éloignées obligeaient à traverser le
      // menu pour retrouver la facture d'un devis accepté.
      { label: 'Devis & factures', href: '/dashboard/facturation', icon: Receipt, essentiel: true, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Vos devis à chiffrer ou à décider, et vos factures — au même endroit' },
      { label: 'Adhésion', href: '/dashboard/adhesion', icon: Receipt, roles: ['OWNER'], hint: 'Adhérer à l’association pour débloquer LEX. Les prestations, elles, se règlent à la facture.' },
      { label: 'Avis', href: '/dashboard/avis', icon: Star, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Évaluez les intervenants après leurs missions' },
      { label: 'Mes publications', href: '/dashboard/actualites', icon: Newspaper, hint: 'Écrivez pour l’Édublog et partagez sur LinkedIn' },
      { label: 'Proposer mes services', href: '/dashboard/devenir-intervenant', icon: UserPlus, sousComptesSeulement: true, hint: 'Salarié ? Créez votre compte intervenant et reprenez vos fiches pour intervenir aussi dans d’autres structures' },
      { label: 'Boîte à idées', href: '/dashboard/idees', icon: Lightbulb, hint: 'Proposez une amélioration et votez pour celles des autres' },
      { label: 'Mes données personnelles', href: '/dashboard/donnees-personnelles', icon: ShieldQuestion, hint: 'Exporter vos données ou demander leur suppression (RGPD)' },
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
      { label: 'Le GAP', href: '/gap', icon: MessagesSquare, hint: 'Groupe d’Analyse de Pratique : modérer et animer les situations déposées' },
    ],
  },
  {
    title: 'Mon compte',
    items: [
      { label: 'Avis', href: '/dashboard/avis', icon: Star, hint: 'Les avis que vous avez reçus et ceux qu’il vous reste à donner' },
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

/**
 * Les sections de navigation adaptées au rôle.
 *
 * `roleCompte` est le rôle DANS le compte actif. Sans lui, tout le monde voyait
 * le même menu de vingt-six entrées : la direction s'y noyait, et un
 * moniteur-éducateur y trouvait des boutons qui lui renvoyaient une erreur
 * d'autorisation, ou pire, des informations qui ne le regardaient pas.
 * Une entrée sans `roles` reste visible par tout le monde.
 */
export function getNavForRole(role: NavRole, roleCompte?: AccountRole): NavSection[] {
  const base =
    role === 'ADMIN' ? adminNav : role === 'ESTABLISHMENT' ? establishmentNav : freelanceNav;

  // L'administration de la plateforme n'a pas de rôle « dans un compte » :
  // on ne lui retire rien.
  if (role === 'ADMIN' || !roleCompte) return base;

  return base
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.roles || item.roles.includes(roleCompte)),
    }))
    .filter((section) => section.items.length > 0);
}
