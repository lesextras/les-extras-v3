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
  /** Fonctionnalité LEX à crédits (badge si le solde est à zéro). */
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
  /**
   * Module AVANCÉ, masqué par défaut.
   *
   * Vingt-sept entrées proposées à un établissement qui vient publier un
   * remplacement, c'est un outil qu'on n'ose pas ouvrir. Les modules de
   * gestion RH (contrats CDD, annualisation du temps de travail, compteurs de
   * congés) sont aboutis mais relèvent d'un autre métier que la mise en
   * relation, et engagent lourdement en droit du travail. Ils restent
   * accessibles — par leur URL, et via le réglage « Afficher les outils
   * avancés » — mais ne s'imposent plus à qui n'en a pas besoin.
   */
  avance?: boolean;
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
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, essentiel: true },
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
      { label: 'Mon planning', href: '/dashboard/planning', icon: CalendarClock, essentiel: true },
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessageSquare, essentiel: true },
      { label: 'Analyse de pratique', href: '/gap', icon: MessagesSquare, essentiel: true, hint: 'Le GAP — groupe d’analyse de la pratique en ligne : déposez une situation, recevez les retours de professionnels, anonymement' },
      { label: "LEX · Assistant d'écriture", href: '/dashboard/assistant', icon: PenLine, premium: true, hint: 'Notes brutes → écrit professionnel relu par vous. Noms masqués, notes jamais stockées. 1 crédit LEX par génération.' },
      { label: "LEX · Générateur d'activités", href: '/dashboard/activites', icon: Lightbulb, premium: true, hint: 'Décrivez le public et les besoins : LEX propose des activités structurées, à valider en équipe. 1 crédit LEX par génération.' },
    ],
  },
  // Même section, mêmes libellés que côté établissement : ce sont les mêmes
  // pages publiques. Un intervenant les consulte pour voir comment son offre
  // est présentée, et pour s'inscrire lui-même à une formation.
  {
    title: 'Catalogue',
    items: [
      { label: 'Édublog', href: '/edublog', icon: Newspaper, hint: 'Le fil public : articles et actualités du médico-social' },
      { label: 'Ateliers', href: '/ateliers', icon: Sparkles, hint: 'Le catalogue public, tel que le voient les établissements' },
      { label: 'Formations', href: '/formations', icon: GraduationCap, hint: 'Le catalogue certifiant ADéPA, côté public' },
    ],
  },
  // « Mon offre », c'est ce que je vends et que je pilote — mes fiches, mes
  // sessions. Rien d'autre : les vitrines publiques sont dans Catalogue.
  {
    title: 'Mon offre',
    items: [
      { label: 'Mes ateliers', href: '/dashboard/ateliers', icon: Sparkles, essentiel: true },
      { label: 'Mes formations', href: '/dashboard/formations', icon: GraduationCap, hint: 'Sessions que vous animez : émargement, apprenants, attestations' },
      { label: 'Mes publications', href: '/dashboard/actualites', icon: Newspaper, hint: 'Écrivez pour l’Édublog et partagez sur LinkedIn' },
    ],
  },
  {
    title: 'Mon espace',
    items: [
      // Le coffre-fort etait unilateral : l'etablissement documentait
      // l'intervenant, l'intervenant n'y avait aucun acces. Il ne pouvait ni
      // voir ce qui manquait, ni deposer sa carte d'identite.
      { label: 'Mon dossier', href: '/dashboard/mon-dossier', icon: ShieldAlert, essentiel: true, hint: 'Vos pièces obligatoires : identité, diplôme, casier judiciaire, IBAN, attestation URSSAF. Un dossier complet vous fait passer devant.' },
      { label: 'Devis & factures', href: '/dashboard/facturation', icon: Receipt, essentiel: true, hint: 'Vos devis à chiffrer et vos factures — au même endroit' },
      // LEX se recharge aussi depuis un compte intervenant : l'assistant IA
      // est ouvert aux deux types de comptes, à crédits pour tout le monde.
      // Réservée au seul OWNER, cette page privait un directeur adjoint ou un
      // chef de service de toute vue sur la consommation de LEX — et de tout
      // moyen de recharger. Les rôles de pilotage y ont accès, comme pour les
      // devis et la conformité.
      { label: 'LEX · Crédits', href: '/dashboard/adhesion', icon: Receipt, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Votre dotation mensuelle offerte, votre consommation, le journal des générations et vos recharges. Le reste de la plateforme est gratuit.' },
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
      // Pas de `hint` : « Tableau de bord » se comprend sans explication, et
      // un « i » sur chaque ligne finit par former une colonne de bruit qui
      // concurrence les icônes de gauche. On les garde pour les entrées dont
      // le nom seul ne suffit pas (Conformité, Vivier, Analyse de pratique…).
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, essentiel: true },
    ],
  },
  // L'ancienne section « Mon activité » empilait douze entrées, presque
  // toutes marquées essentielles — un menu où tout est prioritaire n'a plus
  // de priorité. Trois sections à la place, dans l'ordre du quotidien :
  // trouver du monde, gérer les siens, s'outiller.
  {
    title: 'Renfort & prestations',
    items: [
      { label: 'SOS Renfort', href: '/dashboard/renforts', icon: Megaphone, essentiel: true, hint: 'Publiez un besoin de remplacement et suivez les candidatures' },
      // Le suivi de ce qu'on a commandé manquait complètement : renforts,
      // ateliers et inscriptions en formation étaient enregistrés mais
      // invisibles hors du back-office administrateur.
      //
      // Libellé raccourci : « Renforts et interventions » était tronqué en
      // « Renforts et interv… » dans la barre latérale. Une entrée qu'on ne
      // peut pas lire est une entrée sur laquelle on ne clique pas.
      { label: 'Mes interventions', href: '/dashboard/reservations', icon: CalendarCheck, essentiel: true, hint: 'Vos renforts pourvus, ateliers commandés et inscriptions en formation — internes comme externes' },
      { label: 'Planning', href: '/dashboard/planning', icon: CalendarClock, essentiel: true },
      // Le pendant contractuel du planning : on a trouvé quelqu'un, on
      // l'embauche soi-même en CDD. L'outil calcule ce que personne ne
      // calcule — essai, précarité, carence — et refuse de transmettre un
      // contrat auquel il manque une mention obligatoire.
      { label: 'Contrats CDD', href: '/dashboard/contrats', icon: FileSignature, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Vous embauchez, l’outil calcule : période d’essai, indemnité de fin de contrat, délai de carence et mentions obligatoires' , avance: true },
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessageSquare, essentiel: true },
    ],
  },
  {
    title: 'Équipe & conformité',
    items: [
      // Les personnes d'abord : c'est par elles qu'on entre dans le reste.
      // Une fiche par personne, et la conformité comme propriété de cette
      // personne — pas comme un annuaire parallèle qu'il faut recouper.
      { label: 'Équipe', href: '/dashboard/equipe', icon: UsersRound, essentiel: true, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Qui travaille chez vous, dans quel service, avec quel rôle et quel dossier — recherche et filtres par service' },
      // Le vivier vient juste après l'équipe, et c'est voulu : ce sont les
      // mêmes gens dans la tête d'un chef de service — ceux sur qui il compte.
      // Les uns sont salariés, les autres viennent en renfort.
      { label: 'Mon vivier', href: '/dashboard/vivier', icon: UserPlus, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Les intervenants qui connaissent déjà votre maison : retenez-les, notez ce qu’il faut savoir, et rappelez-les en un clic' },
      { label: 'Conformité', href: '/dashboard/conformite', icon: ShieldAlert, essentiel: true, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Les pièces obligatoires qui manquent ou arrivent à échéance : identité, diplôme, casier judiciaire, permis' },
      { label: 'Congés & compteurs', href: '/dashboard/conges', icon: CalendarCheck, hint: 'Demandes d\'absence validées par un responsable, heures planifiées, soldes et export paie' , avance: true },
      // Les regles de la convention, reportees une fois. Sans elles, les
      // chiffrages sortent sans majoration de nuit ni de dimanche — ce qui est
      // juridiquement exact mais rarement ce que veut l'etablissement.
      { label: 'Temps de travail', href: '/dashboard/temps-de-travail', icon: Clock, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Nuit, dimanche, jours fériés, heures supplémentaires, annualisation : les règles de votre convention, appliquées à chaque chiffrage' , avance: true },
      { label: 'Former mes équipes', href: '/dashboard/formations', icon: GraduationCap, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Organisez une formation en interne, animée par un salarié référent' },
    ],
  },
  // « LEX & pratique » et « Catalogue » ont été retirés du menu de gauche
  // le 4/8/2026 (demande Siham) : ces deux sections vivent désormais en haut
  // du header, à côté du sélecteur de compte (voir header.tsx), pour rester
  // accessibles à tout moment sans occuper la sidebar.
  {
    title: 'Mon établissement',
    items: [
      { label: 'Mon établissement', href: '/dashboard/account', icon: Building2 },
      // Devis et factures sont les deux temps du même geste : on chiffre,
      // puis on facture. Deux entrées éloignées obligeaient à traverser le
      // menu pour retrouver la facture d'un devis accepté.
      { label: 'Devis & factures', href: '/dashboard/facturation', icon: Receipt, essentiel: true, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Vos devis à chiffrer ou à décider, et vos factures — au même endroit' },
      // Réservée au seul OWNER, cette page privait un directeur adjoint ou un
      // chef de service de toute vue sur la consommation de LEX — et de tout
      // moyen de recharger. Les rôles de pilotage y ont accès, comme pour les
      // devis et la conformité.
      { label: 'LEX · Crédits', href: '/dashboard/adhesion', icon: Receipt, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Votre dotation mensuelle offerte, votre consommation, le journal des générations et vos recharges. Le reste de la plateforme est gratuit.' },
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
      { label: "LEX · Assistant d'écriture", href: '/dashboard/assistant', icon: PenLine, premium: true, hint: 'Notes brutes → écrit professionnel relu par vous. Noms masqués, notes jamais stockées. 1 crédit LEX par génération.' },
      { label: "LEX · Générateur d'activités", href: '/dashboard/activites', icon: Lightbulb, premium: true, hint: 'Décrivez le public et les besoins : LEX propose des activités structurées, à valider en équipe. 1 crédit LEX par génération.' },
    ],
  },
  {
    title: 'Catalogue & réservations',
    items: [
      { label: 'Missions', href: '/admin/missions', icon: Megaphone, hint: 'Modérer les missions de renfort' },
      { label: 'Ateliers', href: '/admin/ateliers', icon: Sparkles, hint: 'Modérer le catalogue d’ateliers' },
      { label: 'Réservations', href: '/admin/reservations', icon: CalendarCheck, hint: 'Suivi des réservations et des bookings' },
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
      { label: 'Le GAP', href: '/gap', icon: MessagesSquare, hint: 'Groupe d’Analyse de Pratique : suivre le fil des situations déposées et y répondre' },
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
      { label: 'LEX · Crédits & abonnements', href: '/admin/lex', icon: Sparkles, hint: 'Ventes de packs, consommation de crédits, abonnements actifs et essais en cours' },
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
export function getNavForRole(
  role: NavRole,
  roleCompte?: AccountRole,
  options?: { outilsAvances?: boolean },
): NavSection[] {
  const base =
    role === 'ADMIN' ? adminNav : role === 'ESTABLISHMENT' ? establishmentNav : freelanceNav;

  // Les outils avancés (gestion RH) restent masqués tant qu'on ne les a pas
  // demandés — y compris pour l'administration, qui a déjà son propre menu.
  const sansAvances = (sections: NavSection[]) =>
    options?.outilsAvances
      ? sections
      : sections
          .map((s) => ({ ...s, items: s.items.filter((i) => !i.avance) }))
          .filter((s) => s.items.length > 0);

  // L'administration de la plateforme n'a pas de rôle « dans un compte » :
  // on ne lui retire rien d'autre.
  if (role === 'ADMIN' || !roleCompte) return sansAvances(base);

  return sansAvances(
    base
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => !item.roles || item.roles.includes(roleCompte)),
      }))
      .filter((section) => section.items.length > 0),
  );
}

/** Nombre d'entrées avancées masquées, pour le libellé du réglage. */
export function compterOutilsAvances(role: NavRole, roleCompte?: AccountRole): number {
  const complet = getNavForRole(role, roleCompte, { outilsAvances: true });
  const reduit = getNavForRole(role, roleCompte);
  const total = (s: NavSection[]) => s.reduce((n, sec) => n + sec.items.length, 0);
  return total(complet) - total(reduit);
}
