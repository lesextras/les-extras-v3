import type { LucideIcon } from 'lucide-react';
import {
  Network,
  IdCard,
  MessagesSquare,
  LayoutDashboard,
  TrendingUp,
  Store,
  Sparkles,
  CalendarClock,
  CalendarCheck,
  Clock,
  GraduationCap,
  Receipt,
  BadgeCheck,
  FileText,
  ShieldCheck,
  FileCheck,
  ClipboardList,
  Home,
  Mail,
  MessageSquareHeart,
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
  Newspaper,
  Lightbulb,
  Award,
  UserPlus,
  FileSignature,
  ShieldAlert,
  UsersRound,
  BellRing,
  Globe,
  LifeBuoy,
  Video,
} from 'lucide-react';
import type { NavRole, AccountType, AccountRole } from './types';
import { renfortSalarieVisible, visioconsultationVisible } from './offre';

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
  /**
   * @deprecated Plus lu depuis le 12/08/2026 : la « vue essentielle » a été
   * retirée du menu. Deux réglages d'affichage se superposaient — l'un cachait
   * le non-essentiel, l'autre montrait l'avancé — et on ne savait plus lequel
   * expliquait ce qu'on avait sous les yeux. Le drapeau est conservé sur les
   * entrées : il documente ce qui relève du quotidien, et resservira si l'on
   * revient un jour à un menu à deux étages.
   */
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
   *
   * ⚠⚠ CE DRAPEAU NE VEUT PAS DIRE « INUTILE ». Il veut dire « pas tous les
   * jours ». Tout ce qui porte `avance` reste servi à son adresse, reste dans
   * la palette ⌘K, et revient dans le menu d'un seul interrupteur. Ne JAMAIS
   * le poser sur une entrée qui est le seul chemin vers un geste : une porte
   * qu'on ne trouve pas est une porte fermée, et c'est le défaut qu'on a payé
   * deux fois sur ce fichier (« Opportunités » pour un salarié le 25/08,
   * « Mes congés » le 16/09).
   */
  avance?: boolean;
  /**
   * Le nom de la rubrique qui accueille cette entrée quand les outils avancés
   * sont affichés. Par défaut « Gestion RH ».
   *
   * ⚠ IL N'EXISTE QU'UNE SEULE RUBRIQUE À L'ÉCRAN : ce champ ne la scinde pas,
   * il la NOMME. Tant que toutes les entrées avancées portent le même nom,
   * c'est ce nom qui s'affiche ; dès qu'elles en portent plusieurs, la rubrique
   * prend le nom générique du réglage (« Outils avancés »), parce qu'un titre
   * qui ne décrit que la moitié de ce qu'il couvre est pire qu'un titre
   * générique. Voir `getNavForRole`.
   */
  rubrique?: string;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

/**
 * LES DEUX NOMS QUE PEUT PRENDRE LA RUBRIQUE DES OUTILS AVANCÉS.
 *
 * ⚠ IL N'Y A QU'UNE RUBRIQUE À L'ÉCRAN, JAMAIS DEUX. Ces constantes la
 * NOMMENT, elles ne la scindent pas : `nommerRubrique` (dans `getNavForRole`)
 * affiche le nom commun quand toutes les entrées le partagent, et retombe sur
 * le générique dès qu'elles en portent plusieurs. Scinder produirait des
 * rubriques d'une seule entrée — ce que la règle « deux entrées ne font pas
 * une rubrique » interdit partout dans ce fichier.
 */
const RUBRIQUE_RH = 'Gestion RH';
const RUBRIQUE_SECONDAIRE = 'Outils avancés';

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
  if (params.accountType === 'PARTICULIER') return 'PARTICULIER';
  return 'FREELANCE';
}

/**
 * QUATRE ENTRÉES RETIRÉES DU MENU LE 12/08/2026 (demande de Siham).
 *
 * « À la connexion, il y a trop de choses et c'est compliqué à comprendre. »
 * Un menu ne se juge pas au nombre de portes qu'il ouvre mais au temps qu'il
 * faut pour trouver la bonne. Retirées : Messagerie, Boîte à idées, Mes
 * données personnelles, et Conformité (côté établissement).
 *
 * RIEN N'EST SUPPRIMÉ — ni page, ni donnée, ni route. Chacune reste servie à
 * son adresse, présente dans la palette ⌘K, et atteinte par le chemin qui la
 * concerne :
 *
 *   Messagerie             REVENUE AU MENU LE 16/09/2026, à la demande de
 *                          Siham : « il faut une messagerie pour que tous se
 *                          parlent ». Ce n'est plus la même chose qu'en août —
 *                          c'était alors un fil par mission, sans équipe, sans
 *                          service et sans Les Extras. Le motif du retrait
 *                          (« une porte de plus pour presque rien ») ne tient
 *                          donc plus : le produit a changé, pas la règle.
 *   Mes données perso.     la politique cookies y renvoie, et le bandeau de
 *                          consentement mène à cette politique — le droit
 *                          d'accès et d'effacement reste donc exerçable sans
 *                          passer par le menu (art. 12 RGPD).
 *   Boîte à idées          l'administration garde la sienne, pour arbitrer.
 *   Conformité             les pièces manquantes remontent déjà sur la fiche
 *                          de chaque personne, dans « Équipe ».
 *
 * Remettre une entrée au menu = remettre sa ligne. Rien d'autre à défaire.
 */
const freelanceNav: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, essentiel: true },
      // Côté intervenant, la messagerie est le fil d'une DEMANDE — devis,
      // réservation, mission. Il n'existe pas de fil libre depuis le catalogue,
      // et il ne faut pas en ouvrir : ce serait la porte au démarchage, et les
      // intervenants partiraient.
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessagesSquare, essentiel: true, hint: 'Les échanges rattachés à vos demandes de devis, vos réservations et vos missions' },
    ],
  },
  /*
    ⚠⚠ CETTE SECTION SUIT LE CHEMIN DE L'ARGENT (21/09/2026, demande de Siham).

    Un intervenant fait quatre gestes, toujours dans le même ordre : il PUBLIE
    une fiche, il est RÉSERVÉ, l'intervention SE FAIT, et elle SE PAIE. Le menu
    les éparpillait dans trois rubriques — « Mes ateliers » huitième, sous
    « Mon offre », et « Devis & factures » douzième, sous « Mon espace ». Le
    premier et le dernier geste du même métier se trouvaient donc aux deux
    extrémités du menu.

    ⚠ LA RUBRIQUE « Mon offre » A ÉTÉ DISSOUTE, et ce n'est pas un oubli :
    « Mes ateliers » a rejoint le chemin ci-dessous, et ce qui restait —
    formations animées, publications — ne fait pas deux entrées de quotidien.
    La règle de ce fichier est constante : deux entrées ne font pas une
    rubrique.

    ⚠ NE PAS REDESCENDRE « Devis & factures » DANS « Mon espace ». Ce n'est pas
    un réglage de compte rangé à côté du dossier et des crédits : c'est la
    quatrième marche d'un escalier, et c'est celle où l'on abandonne.
  */
  {
    title: 'Mon activité',
    items: [
      // PUBLIER — ce que je vends. Vient de l'ancienne rubrique « Mon offre ».
      { label: 'Mes ateliers', href: '/dashboard/ateliers', icon: Sparkles, essentiel: true },
      // ÊTRE RÉSERVÉ — du travail engagé, avec une date et un contrat.
      { label: 'Mes interventions', href: '/dashboard/reservations', icon: CalendarCheck, essentiel: true, hint: 'Les missions et ateliers qu’on vous a confiés, avec leur proposition d’engagement' },
      // FAIRE.
      { label: 'Mon planning', href: '/dashboard/planning', icon: CalendarClock, essentiel: true },
      // ÊTRE PAYÉ. Vient de l'ancienne rubrique « Mon espace ».
      { label: 'Devis & factures', href: '/dashboard/facturation', icon: Receipt, essentiel: true, hint: 'Vos devis à chiffrer et vos factures, au même endroit' },
      /*
       * ⚠ « Opportunités » RESTE DANS LE MENU DU QUOTIDIEN, et ce n'est pas un
       * oubli de tri : c'est le SEUL chemin d'un intervenant vers les missions
       * ouvertes à la candidature. Ce fichier a déjà payé deux fois le fait
       * d'enterrer un chemin unique (le salarié sans accès aux missions le
       * 25/08, le salarié sans accès à ses congés le 16/09). Qu'il n'y ait
       * aucune mission ouverte aujourd'hui ne change rien : le jour où il y en
       * a une, personne ne doit avoir à trouver un réglage pour la voir.
       */
      { label: 'Opportunités', href: '/dashboard/opportunites', icon: Target, essentiel: true, hint: 'Missions qui correspondent à votre profil, classées par score' },
      /*
       * ⚠ L'ENTRÉE N'APPARAÎT QUE SI LA VISIO EST OUVERTE. Elle mène à une
       * page qui répond 404 tant que `NEXT_PUBLIC_VISIOCONSULTATION` n'est pas
       * posée (voir `@/lib/offre`) : un menu qui conduit à une page
       * introuvable se lit comme une panne du produit entier.
       *
       * ⚠ Ce sont des séances de rééducation et d'éducation spécialisée, pas
       * de la télémédecine. Le libellé dit « rendez-vous à distance », jamais
       * « téléconsultation » — ce mot-là désigne un acte médical.
       */
      ...(visioconsultationVisible()
        ? [
            {
              label: 'Rendez-vous à distance',
              href: '/dashboard/visio',
              icon: Video,
              essentiel: true,
              hint: 'Proposer une séance en visioconsultation sur une intervention acceptée',
            } as NavItem,
          ]
        : []),
      /**
       * ⚠ SE RENDRE VISIBLE EST UN GESTE QU'IL FAUT POUVOIR DÉFAIRE EN UN CLIC.
       *
       * Cette entrée n'est pas un réglage de plus : c'est la page où quelqu'un
       * qui cherche du travail se met dans une liste consultée par des
       * établissements — et où il se retire. Enterrée dans les paramètres, on
       * ne la retrouve pas le jour où l'on a retrouvé un poste, et la liste
       * devient fausse.
       */
      { label: 'Ma disponibilité', href: '/dashboard/disponibilite', icon: UserPlus, hint: 'Ce que vous acceptez de faire, où vous pouvez vous déplacer, et si les établissements peuvent vous voir' },
      // Les trois outils LEX sont remontés dans la barre du haut le
      // 03/09/2026 (voir header.tsx). Ils occupaient les trois dernières
      // lignes de cette section dans les QUATRE menus du fichier.
    ],
  },
  // Le Catalogue (Édublog, Ateliers, Formations) a quitté le menu de
  // gauche le 25/08/2026 : il vit désormais dans la barre du haut, à droite
  // du sélecteur de compte, pour tous les comptes. Un menu de gauche sert à
  // travailler ; un catalogue, à consulter.
  /*
    ⚠ « Mon offre » N'EST PLUS UNE RUBRIQUE. « Mes ateliers » — la seule de ses
    trois entrées qu'on ouvre toutes les semaines — a rejoint le chemin de
    l'argent ci-dessus. Les deux autres restent, en secondaire : animer une
    session de formation et écrire sur l'Édublog sont des gestes réels, mais
    pas quotidiens, et aucun des deux n'est le seul chemin vers quoi que ce
    soit.
  */
  {
    items: [
      { label: 'Mes formations', href: '/dashboard/formations', icon: GraduationCap, avance: true, rubrique: RUBRIQUE_SECONDAIRE, hint: 'Sessions que vous animez : émargement, apprenants, attestations' },
      { label: 'Mes publications', href: '/dashboard/actualites', icon: Newspaper, avance: true, rubrique: RUBRIQUE_SECONDAIRE, hint: 'Écrivez pour l’Édublog, vos articles vous font connaître des établissements' },
    ],
  },
  {
    title: 'Mon espace',
    items: [
      // Le coffre-fort etait unilateral : l'etablissement documentait
      // l'intervenant, l'intervenant n'y avait aucun acces. Il ne pouvait ni
      // voir ce qui manquait, ni deposer sa carte d'identite.
      { label: 'Mon dossier', href: '/dashboard/mon-dossier', icon: ShieldAlert, essentiel: true, hint: 'Vos pièces obligatoires : identité, diplôme, casier judiciaire, IBAN, attestation URSSAF. Un dossier complet vous fait passer devant.' },
      // ⚠ « Devis & factures » N'EST PLUS ICI : il a rejoint « Mon activité »,
      // dont il est la quatrième et dernière marche. Voir l'avertissement en
      // tête de cette section-là.
      // LEX se recharge aussi depuis un compte intervenant : l'assistant IA
      // est ouvert aux deux types de comptes, à crédits pour tout le monde.
      // Réservée au seul OWNER, cette page privait un directeur adjoint ou un
      // chef de service de toute vue sur la consommation de LEX — et de tout
      // moyen de recharger. Les rôles de pilotage y ont accès, comme pour les
      // devis et la conformité.
      { label: 'LEX · Crédits', href: '/dashboard/adhesion', icon: Receipt, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Votre dotation mensuelle offerte, votre consommation, le journal des générations et vos recharges. Le reste de la plateforme est gratuit.' },
      { label: 'Avis', href: '/dashboard/avis', icon: Star, avance: true, rubrique: RUBRIQUE_SECONDAIRE, hint: 'Les avis reçus et ceux qu\'il vous reste à donner' },
      // La progression se REGARDE, elle ne se fait pas : c'est un état, pas un
      // geste. Rien ne s'y décide, et elle avance toute seule.
      { label: 'Ma progression', href: '/dashboard/progression', icon: TrendingUp, avance: true, rubrique: RUBRIQUE_SECONDAIRE, hint: 'Vos paliers : Nouveau, Confirmé, Super Extra, et l\'accès prioritaire aux missions' },
      // « Points & parrainage » n'est plus dans cette liste : il est épinglé
      // en bas du menu, juste au-dessus du bloc d'aide (voir sidebar.tsx).
      // Au fond d'une liste défilante, personne ne descendait jusqu'à lui.
      // « Mon compte » n'est plus listé ici : il vit dans le menu de l'avatar,
      // en haut à droite, et dans la palette ⌘K. Deux chemins vers la même
      // page allongeaient le menu sans rien apporter.
      { label: 'Aide & contact', href: '/dashboard/aide', icon: LifeBuoy, hint: 'Écrivez à l’équipe Les Extras : un problème, une question. La réponse arrive ici et par e-mail.' },
    ],
  },
];

const establishmentNav: NavSection[] = [
  {
    items: [
      // Pas de `hint` : « Tableau de bord » se comprend sans explication, et
      // un « i » sur chaque ligne finit par former une colonne de bruit qui
      // concurrence les icônes de gauche. On les garde pour les entrées dont
      // le nom seul ne suffit pas (Vivier…).
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, essentiel: true },
    ],
  },
  // L'ancienne section « Mon activité » empilait douze entrées, presque
  // toutes marquées essentielles — un menu où tout est prioritaire n'a plus
  // de priorité. Trois sections à la place, dans l'ordre du quotidien :
  // trouver du monde, gérer les siens, s'outiller.
  /*
    ⚠⚠ CETTE SECTION SUIT LE CHEMIN DE L'ARGENT, ET L'ORDRE EST LA SEULE CHOSE
    QUI COMPTE ICI (21/09/2026, demande de Siham).

    Un établissement fait quatre gestes, toujours dans le même ordre : il
    PUBLIE un besoin, il est RÉSERVÉ, l'intervention SE FAIT, et elle SE PAIE.
    Le menu rangeait les trois premiers ensemble et le quatrième — « Devis &
    factures » — vingt lignes plus bas, dans « Mon établissement », entre les
    publications et les crédits LEX. Il fallait traverser le menu pour
    retrouver la facture d'une réservation qu'on venait de terminer, et c'est
    exactement le dernier mètre où l'on abandonne : mesuré le 21/09, six
    factures sur onze dormaient en brouillon.

    ⚠ NE PAS RENVOYER « Devis & factures » DANS « Mon établissement ». Ce
    n'est pas une fonction de gestion interne rangée à côté de l'organigramme :
    c'est la quatrième marche d'un escalier, et une marche manquante ne se
    remplace pas par une porte ailleurs dans le couloir.
  */
  {
    title: 'Renfort & prestations',
    items: [
      { label: 'RenforTeam', href: '/dashboard/renforts', icon: Megaphone, essentiel: true, hint: 'Publiez un besoin de remplacement et suivez les candidatures' },
      // OPPORTUNITÉS — POUR LES SALARIÉS (25/08/2026).
      //
      // Un salarié rattaché à un établissement n'avait aucune entrée vers les
      // missions ouvertes : ni RenforTeam (réservé à la direction pour publier),
      // ni marketplace, qui n'était liée nulle part dans son menu. Il pouvait
      // donc être destinataire d'une diffusion en cascade sans jamais pouvoir
      // aller voir ce qui était ouvert.
      { label: 'Opportunités', href: '/dashboard/opportunites', icon: Target, essentiel: true, roles: ['MEMBER'], hint: 'Les missions de renfort et les ateliers ouverts à la candidature' },
      // Le suivi de ce qu'on a commandé manquait complètement : renforts,
      // ateliers et inscriptions en formation étaient enregistrés mais
      // invisibles hors du back-office administrateur.
      //
      // Libellé raccourci : « Renforts et interventions » était tronqué en
      // « Renforts et interv… » dans la barre latérale. Une entrée qu'on ne
      // peut pas lire est une entrée sur laquelle on ne clique pas.
      // DEUX ENTRÉES REDEVENUES UNE (26/08/2026).
      //
      // On les avait séparées pour donner sa porte à chaque nature : un
      // atelier commandé et une inscription en formation ne se décident ni
      // ne se paient pareil. Mais la page filtre déjà elle-même — Tout /
      // Ateliers / Formations — et deux entrées qui mènent à deux onglets du
      // même écran, c'est le menu qui refait le travail de la page.
      //
      // Une seule porte, qui ouvre sur « Tout ». Le tri se fait ensuite, là
      // où on le voit.
      { label: 'Mes réservations', href: '/dashboard/reservations', icon: CalendarCheck, essentiel: true, hint: 'Les ateliers commandés et les inscriptions en formation, au même endroit, filtrables sur la page' },
      { label: 'Planning', href: '/dashboard/planning', icon: CalendarClock, essentiel: true },
      // LA QUATRIÈME MARCHE — voir l'avertissement en tête de section. Devis et
      // factures sont les deux temps du même geste : on chiffre, puis on
      // facture. Ils viennent de « Mon établissement », où ils étaient à vingt
      // lignes de la réservation qu'ils closent.
      { label: 'Devis & factures', href: '/dashboard/facturation', icon: Receipt, essentiel: true, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Vos devis à chiffrer ou à décider, et vos factures, au même endroit' },
      // ⚠ CÔTÉ ÉTABLISSEMENT SEULEMENT, et c'est délibéré : c'est lui qui
      // cherche dans le catalogue et repart bredouille. Un intervenant ne
      // cherche pas d'atelier, il en publie.
      //
      // Passée en avancée le 21/09/2026 : c'est un réglage qu'on pose une fois
      // et qui travaille tout seul par courriel — pas une ligne qu'on ouvre
      // chaque semaine. Elle n'est le seul chemin vers rien : l'écran vide du
      // catalogue propose « Me prévenir quand ça arrive » au moment exact où la
      // question se pose.
      { label: 'Mes alertes', href: '/dashboard/alertes', icon: BellRing, avance: true, rubrique: RUBRIQUE_SECONDAIRE, hint: 'Dites ce que vous cherchez : on vous écrit le jour où ça arrive au catalogue, jamais plus d’un message par jour' },
      // Le pendant contractuel du planning : on a trouvé quelqu'un, on
      // l'embauche soi-même en CDD. L'outil calcule ce que personne ne
      // calcule — essai, précarité, carence — et refuse de transmettre un
      // contrat auquel il manque une mention obligatoire.
      /*
        ⚠⚠ CONDITIONNÉ À L'OFFRE PUBLIQUE (21/09/2026).

        Le recentrage du 19/09 a sorti le remplacement de poste en CDD de
        l'offre, et `lib/nav.ts` n'importait même pas `renfortSalarieVisible` :
        le site public disait que ce montage n'existait plus pendant que le
        menu de l'espace connecté proposait toujours d'éditer des CDD. Un
        établissement lisait donc deux offres différentes selon qu'il était
        connecté ou non.

        ⚠ RIEN N'EST SUPPRIMÉ : la page, les routes et le générateur de
        contrat restent en place, et l'entrée revient avec
        NEXT_PUBLIC_OFFRE_PUBLIQUE=complete. Aucun contrat n'existait en base
        au moment de poser ce garde-fou (vérifié sur les comptes ADéPA,
        association et académie) — masquer l'entrée ne cache donc aucun
        document déjà émis. Si des contrats apparaissent un jour alors que
        l'offre est fermée, il faudra rouvrir l'entrée : on ne cache pas à
        quelqu'un un document qui l'engage.
      */
      ...(renfortSalarieVisible()
        ? ([
            {
              label: 'Contrats CDD',
              href: '/dashboard/contrats',
              icon: FileSignature,
              roles: ['OWNER', 'ADMIN', 'MANAGER'],
              hint: 'Vous embauchez, l’outil calcule : période d’essai, indemnité de fin de contrat, délai de carence et mentions obligatoires',
              avance: true,
            },
          ] satisfies NavItem[])
        : []),
    ],
  },
  // « LEX & pratique » et « Catalogue » ont été retirés du menu de gauche
  // le 4/8/2026 (demande Siham) : ces deux sections vivent désormais en haut
  // du header, à côté du sélecteur de compte (voir header.tsx), pour rester
  // accessibles à tout moment sans occuper la sidebar.
  //
  // Le 13/8/2026 (demande Siham) : l'ancienne section « Équipe & conformité »
  // a été dissoute et repliée à la FIN de « Mon établissement ». Tout ce qui
  // relève de la gestion interne de la structure — sa fiche, sa facturation,
  // ses gens, leurs dossiers, son temps de travail — vit désormais sous un
  // seul chapeau, au lieu de deux sections voisines qu'on hésitait à séparer.
  // LEX EST REMONTÉ DANS LA BARRE DU HAUT (03/09/2026, demande Siham).
  //
  // Il y était déjà avant le 25/08/2026, il en est redescendu ce jour-là au
  // motif qu'un outil ouvert plusieurs fois par jour se pose à portée d'œil.
  // Ce motif n'était pas faux ; il coûtait trois entrées répétées dans les
  // quatre menus de ce fichier, et sur le compte admin il repoussait le
  // travail d'administration sous la ligne de flottaison. Les trois outils
  // vivent donc dans un menu déroulant à droite du Catalogue (header.tsx).
  //
  {
    title: 'Mon établissement',
    // ORDRE DEMANDÉ PAR SIHAM LE 20/08/2026 — il suit le quotidien d'une
    // directrice, pas l'ordre dans lequel les écrans ont été construits :
    // la fiche de la maison, puis les gens (salariés, puis remplaçants), puis
    // ce qu'on leur donne (formation), puis ce qu'on montre au dehors
    // (publications, avis), puis l'argent, puis les pièces à jour.
    //
    // Deux entrées ne figurent pas dans cette liste et sont donc restées à la
    // fin : « Proposer mes services », qui ne s'affiche qu'aux sous-comptes,
    // et « Temps de travail & congés », marquée avancée. Aucune n'a été
    // supprimée.
    items: [
      // « Mon établissement » (→ /dashboard/account) retiré le 21/08/2026
      // (demande Siham) : la page reste accessible par le menu de l'avatar en
      // haut à droite — deux chemins vers la même fiche allongeaient le menu
      // sans rien apporter, exactement comme « Mon compte » côté intervenant.
      // Les personnes d'abord : c'est par elles qu'on entre dans le reste.
      // Une fiche par personne, et la conformité comme propriété de cette
      // personne — pas comme un annuaire parallèle qu'il faut recouper.
      // ORGANIGRAMME ET POSTE (16/09/2026).
      //
      // ⚠ NI L'UN NI L'AUTRE N'EST RÉSERVÉ À LA DIRECTION, et c'est le cœur du
      // modèle. L'organigramme montre à TOUS les rattachés la structure, les
      // services et les effectifs — seuls les noms sont bornés au périmètre de
      // qui regarde. Le réserver aux responsables le laisserait vide le premier
      // jour, et personne ne le remplirait jamais.
      //
      // « Mon poste » est la porte par laquelle un chef de service arrivé seul
      // se déclare, sans attendre que sa direction ouvre un compte. Lui poser
      // un filtre de rôle fermerait exactement la porte qu'il doit ouvrir.
      { label: 'Messagerie', href: '/dashboard/inbox', icon: MessagesSquare, essentiel: true, hint: 'Vos échanges avec votre équipe, vos services, les intervenants et Les Extras — chacun rattaché à son contexte' },
      { label: 'Organigramme', href: '/dashboard/organigramme', icon: Network, essentiel: true, hint: 'Votre structure, votre établissement et ses services. Les noms que vous voyez dépendent de votre périmètre.' },
      { label: 'Mon poste', href: '/dashboard/mon-poste', icon: IdCard, hint: 'Votre poste, votre niveau de responsabilité et ce que vous pouvez engager pour votre établissement' },
      { label: 'Mon équipe', href: '/dashboard/equipe', icon: UsersRound, essentiel: true, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Qui travaille chez vous, dans quel service, avec quel rôle et quel dossier, recherche et filtres par service' },
      // Le vivier vient juste après l'équipe, et c'est voulu : ce sont les
      // mêmes gens dans la tête d'un chef de service — ceux sur qui il compte.
      // Les uns sont salariés, les autres viennent en renfort.
      //
      // « de CDD » ajouté au libellé (20/08/2026) : « Mon vivier » seul ne
      // disait pas de quoi il était le vivier, et se confondait avec l'équipe
      // juste au-dessus. Ce sont les gens qu'on rappelle et qu'on embauche
      // soi-même en contrat court — le pendant humain de « Contrats CDD ».
      { label: 'Mon vivier RenforTeam', href: '/dashboard/vivier', icon: UserPlus, avance: true, rubrique: RUBRIQUE_SECONDAIRE, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Les intervenants qui connaissent déjà votre maison : retenez-les, notez ce qu’il faut savoir, et rappelez-les en un clic sur votre prochain RenforTeam' },
      /**
       * ⚠ DEUX VIVIERS, ET ILS NE DISENT PAS LA MÊME CHOSE.
       *
       * Celui du dessus est VOTRE carnet d'adresses : les gens que vous avez
       * déjà fait venir, et c'est lui qui alimente le palier « réseau » de la
       * diffusion. Celui-ci est alimenté par les personnes elles-mêmes, et
       * vous y trouverez des gens que vous ne connaissez pas encore.
       *
       * Les fondre remplirait « mes intervenants » de gens jamais rencontrés
       * et fausserait le ciblage de vos missions.
       */
      { label: 'Personnes disponibles', href: '/dashboard/vivier-ouvert', icon: UsersRound, avance: true, rubrique: RUBRIQUE_SECONDAIRE, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Celles et ceux qui se déclarent disponibles pour un remplacement en CDD ou un renfort personnalisé, près de chez vous' },
      { label: 'Former mes équipes', href: '/dashboard/formations', icon: GraduationCap, avance: true, rubrique: RUBRIQUE_SECONDAIRE, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Organisez une formation en interne, animée par un salarié référent' },
      { label: 'Mes publications', href: '/dashboard/actualites', icon: Newspaper, avance: true, rubrique: RUBRIQUE_SECONDAIRE, hint: 'Écrivez pour l’Édublog, vos articles vous font connaître des établissements' },
      { label: 'Avis', href: '/dashboard/avis', icon: Star, avance: true, rubrique: RUBRIQUE_SECONDAIRE, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Évaluez les intervenants après leurs missions' },
      // ⚠ « Devis & factures » N'EST PLUS ICI : il a rejoint « Renfort &
      // prestations », dont il est la quatrième et dernière marche — publier,
      // être réservé, faire, être payé. Ne pas le redescendre : voir
      // l'avertissement en tête de cette section-là.
      // Réservée au seul OWNER, cette page privait un directeur adjoint ou un
      // chef de service de toute vue sur la consommation de LEX — et de tout
      // moyen de recharger. Les rôles de pilotage y ont accès, comme pour les
      // devis et la conformité.
      { label: 'LEX · Crédits', href: '/dashboard/adhesion', icon: Receipt, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Votre dotation mensuelle offerte, votre consommation, le journal des générations et vos recharges. Le reste de la plateforme est gratuit.' },
      // La conformité existait comme page mais n'était liée nulle part dans le
      // menu établissement : on la rend visible. Elle ferme la section — c'est
      // ce qu'on vérifie, pas ce qu'on fait tous les jours.
      { label: 'Conformité', href: '/dashboard/conformite', icon: FileCheck, avance: true, rubrique: RUBRIQUE_SECONDAIRE, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Les pièces obligatoires de vos intervenants, identité, diplôme, casier judiciaire, IBAN, attestation URSSAF : on ne montre que ce qui manque ou arrive à échéance' },
      // « Points & parrainage » n'est plus dans cette liste : comme côté
      // intervenant, l'entrée est épinglée en bas du menu, juste au-dessus du
      // bloc d'aide (voir sidebar.tsx). Même place pour tous les comptes.
      // ── Hors de l'ordre demandé, conservées à la fin ───────────────────────
      // « Proposer mes services » avait été retiré du menu des salariés le
      // 25/08/2026 : un salarié consulte tout — missions, ateliers, catalogue —
      // mais il ne propose pas d'offre et ne candidate pas. Ce qu'il vend, il
      // le vend sous le nom de la maison qui l'emploie.
      //
      // CETTE RÈGLE EST MAINTENUE, et l'entrée ci-dessous ne la contredit pas
      // (02/09/2026). La page ne fait pas publier une offre sous le compte de
      // l'employeur : elle ouvre un compte SÉPARÉ, au nom propre du salarié,
      // avec une adresse personnelle exigée explicitement — « les demandes
      // liées à votre activité indépendante ne doivent pas arriver sur la
      // messagerie de votre employeur ». C'est exactement la frontière que la
      // règle du 25/08 protège.
      //
      // Réservée au rôle MEMBER : un directeur ou un chef de service n'est pas
      // le public de cette page. Elle ferme la section, après le travail
      // quotidien — et non au milieu.
      //
      // Pour la retirer de nouveau : supprimer la ligne qui suit, rien d'autre
      // n'en dépend.
      { label: 'Proposer mes services', href: '/dashboard/devenir-intervenant', icon: UserPlus, roles: ['MEMBER'], hint: 'Vous intervenez déjà auprès de publics accompagnés : proposez les mêmes interventions à d’autres structures, en votre nom et sous votre SIRET, sans quitter votre poste' },
      // Les regles de la convention, reportees une fois. Sans elles, les
      // chiffrages sortent sans majoration de nuit ni de dimanche — ce qui est
      // juridiquement exact mais rarement ce que veut l'etablissement.
      { label: 'Temps de travail & congés', href: '/dashboard/temps-de-travail', icon: Clock, roles: ['OWNER', 'ADMIN', 'MANAGER'], hint: 'Le planning d’équipe déjà posé, les demandes d’absence, les soldes, et les règles de votre convention : nuit, dimanche, fériés, heures supplémentaires, annualisation' , avance: true },
      /*
        ⚠⚠ LA MÊME PAGE, POUR LE SALARIÉ — ET C'EST UNE SECONDE ENTRÉE EXPRÈS.

        L'entrée ci-dessus est réservée aux responsables ET rangée derrière
        « Outils avancés ». Or `/dashboard/temps-de-travail` est écrite pour
        servir aussi le salarié simple : quand `canDecide` est faux, elle lui
        dit en toutes lettres « posez vos demandes d'absence ». Le filtre de
        rôle s'appliquant AVANT le filtre `avance`, l'entrée disparaissait pour
        lui à la première étape — le bouton « Outils avancés » ne s'affichait
        donc même pas, et la palette ne la portait pas non plus. Résultat
        mesuré le 16/09/2026 : un salarié n'avait AUCUN chemin pour poser une
        absence, alors que l'écran existe et l'attend.

        ⚠ NE PAS FUSIONNER LES DEUX EN AJOUTANT 'MEMBER' À L'ENTRÉE DU DESSUS.
        Elle porte `avance: true` : le salarié se retrouverait avec un menu
        « Outils avancés » d'une seule ligne, et la question qu'il se pose
        (« comment je pose mes congés ») n'est pas celle d'un responsable qui
        règle une convention collective. Deux publics, deux libellés, un seul
        écran — c'est le libellé qui fait le travail.
      */
      { label: 'Mes congés & mes heures', href: '/dashboard/temps-de-travail', icon: Clock, roles: ['MEMBER'], hint: 'Posez vos demandes d’absence, suivez vos soldes et retrouvez le planning de l’équipe. Vos responsables décident depuis le même écran.' },
      { label: 'Aide & contact', href: '/dashboard/aide', icon: LifeBuoy, hint: 'Écrivez à l’équipe Les Extras : un problème, une question. La réponse arrive ici et par e-mail.' },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    items: [
      // UN SEUL TABLEAU DE BORD (16/09/2026). Le menu admin ouvrait sur deux
      // portes — « Tableau de bord » (/admin) et « Mon espace » (/dashboard) —
      // et il fallait avoir compris la différence pour savoir laquelle cliquer.
      // Les deux contenus sont maintenant sur /admin, l'un sous l'autre :
      // l'administration de la plateforme d'abord, l'espace personnel ensuite.
      // « Mon espace » a donc disparu du menu ; /dashboard reste servie (les
      // sous-pages /dashboard/* y renvoient), simplement elle n'est plus une
      // entrée de navigation.
      { label: 'Tableau de bord', href: '/admin', icon: LayoutDashboard, hint: 'La plateforme et votre espace personnel, sur la même page' },
      // C'est ici que la demande est née (03/09/2026) : sur le compte admin,
      // trois lignes LEX en tête de menu repoussaient le travail
      // d'administration vers le bas. Elles sont dans la barre du haut.
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
      // LE SEUL PASSAGE MANUEL DU MODÈLE D'ORGANISATION : une demande par
      // établissement, jamais une par salarié. Si cette file grossit, c'est le
      // signe qu'il faut alléger la demande, pas qu'il faut y passer ses
      // journées.
      { label: 'Accès direction', href: '/admin/organisation', icon: Network, hint: 'Les demandes de niveau Direction : accepter ouvre la vue sur des équipes constituées par d’autres' },
      { label: 'Messagerie interne', href: '/admin/assistance', icon: LifeBuoy, hint: 'Les messages écrits depuis un compte : problèmes, questions. On y répond dans le fil.' },
      { label: 'Demandes de contact', href: '/admin/contacts', icon: Mail, hint: 'Messages reçus via le formulaire de contact public' },
      { label: 'Boîte à idées', href: '/dashboard/idees', icon: Lightbulb, avance: true, rubrique: RUBRIQUE_SECONDAIRE, hint: 'Idées de la communauté : arbitrer, répondre, planifier' },
    ],
  },
  {
    title: 'Mon compte',
    items: [
      { label: 'Avis', href: '/dashboard/avis', icon: Star, hint: 'Les avis que vous avez reçus et ceux qu’il vous reste à donner' },
      { label: 'Mon profil', href: '/dashboard/account', icon: Users, hint: 'Vos informations, votre équipe et vos invitations' },
      { label: 'Aide & contact', href: '/dashboard/aide', icon: LifeBuoy, hint: 'Écrivez à l’équipe Les Extras : un problème, une question. La réponse arrive ici et par e-mail.' },
    ],
  },
  {
    title: 'Facturation',
    items: [
      { label: 'Factures', href: '/admin/factures', icon: Receipt, hint: 'Facturation de la plateforme' },
      // ⚠ L'entrée reste visible même sans commande : c'est ici qu'on découvre
      // qu'une attestation attend d'être délivrée, et une file qu'on ne voit
      // pas est une file qu'on ne relève pas.
      {
        label: 'Attestations',
        href: '/admin/attestations',
        icon: BadgeCheck,
        hint: 'Commandes d’attestation de suivi, à délivrer',
      },
      { label: 'LEX · Crédits & abonnements', href: '/admin/lex', icon: Sparkles, hint: 'Ventes de packs, consommation de crédits, abonnements actifs et essais en cours' },
      { label: 'LEX · Qualité', href: '/admin/lex-qualite', icon: Sparkles, hint: 'Sur quel moteur tourne LEX, ce qui est réellement produit, et quelle trame est la moins bien notée' },
    ],
  },
  {
    title: 'Pilotage',
    items: [
      { label: 'Statistiques', href: '/admin/statistiques', icon: BarChart3, hint: 'KPIs détaillés de la plateforme' },
      { label: "Tunnel d'acquisition", href: '/admin/tunnel', icon: Filter, hint: 'Vue → demande → devis → réservation, fiche par fiche' },
      // Ajouté le 04/09/2026 : d'où viennent les visites, et lesquelles
      // deviennent des gens. Mesure sans traceur, même clé `source` que les
      // inscriptions et les demandes.
      { label: 'Trafic par canal', href: '/admin/trafic', icon: Globe, hint: 'Visites, inscriptions, adresses captées et demandes, canal par canal' },
      // Ajouté le 03/09/2026. Cinq séquences partent toutes seules et
      // `MailService.send()` ne lève jamais : un envoi raté ne se voyait que
      // dans les journaux du conteneur, autant dire nulle part.
      // Ajouté le 03/09/2026. L'enquête part toute seule sept jours après la
      // première fiche mise en ligne d'un compte ; sans écran, ses réponses ne
      // seraient lues nulle part — et un problème signalé qui n'est pas lu est
      // pire qu'un problème non signalé.
      { label: 'Retours d’expérience', href: '/admin/retours', icon: MessageSquareHeart, hint: 'Satisfaction, avis sur le site et sur le dépôt de fiche, problèmes signalés' },
      { label: 'Suivi des e-mails', href: '/admin/emails', icon: Mail, hint: 'Ce qui part, ce qui échoue, et où en sont les inscrits dans la séquence d’accueil' },
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
/**
 * Menu d'un salarié qui attend d'être rattaché à un établissement.
 *
 * Proposer vingt entrées qui répondront toutes « pas encore » serait une
 * promesse en trompe-l'œil. On ne montre que ce qui fonctionne vraiment :
 * LEX, son dossier, ses crédits, et l'écran où sa demande avance.
 */
const attenteRattachementNav: NavSection[] = [
  // MON ESPACE EN PREMIER (25/08/2026).
  //
  // Tant qu'un salarie n'est pas rattache, son sujet n'est pas le travail :
  // c'est sa demande et son dossier. Le menu commence donc par la, et le
  // rattachement y a sa place — il fait partie de son espace, pas du reste.
  {
    title: 'Mon espace',
    items: [
      { label: 'Mon rattachement', href: '/dashboard', icon: Building2, essentiel: true, hint: 'Où en est votre demande, et à qui l’envoyer' },
      // « Mon compte » a quitte cette liste le 25/08/2026 : le profil est deja
      // en haut a droite, et deux portes vers le meme ecran font douter qu'il
      // s'agisse du meme.
      { label: 'Mon dossier', href: '/dashboard/mon-dossier', icon: ShieldAlert, essentiel: true, hint: 'Vos pièces : identité, diplôme, casier judiciaire. Un dossier prêt le jour du rattachement, c’est autant de gagné.' },
    ],
  },
  {
    items: [
      // Pas de titre au-dessus : « Trouver du travail » annoncait une rubrique
      // pour une seule entree. Les opportunites se lisent directement.
      { label: 'Opportunités', href: '/dashboard/opportunites', icon: Target, essentiel: true, hint: 'Les missions ouvertes à la candidature, et le catalogue des ateliers et formations du réseau' },
    ],
  },
  // CE QUI EXISTE DEJA AVANT LE RATTACHEMENT (25/08/2026).
  //
  // Un salarie tient un planning bien avant qu'un etablissement l'accepte :
  // c'est le sien. On lui ouvre donc son agenda — import de son planning
  // compris — et la vue de ce qu'on lui confie, plutot que de lui faire
  // decouvrir ces ecrans le jour du rattachement.
  {
    title: 'Mon activité',
    items: [
      { label: 'Mes interventions', href: '/dashboard/reservations', icon: CalendarCheck, essentiel: true, hint: 'Les missions et ateliers qu’on vous a confiés, avec leur proposition d’engagement' },
      // « Mon offre » a disparu le 25/08/2026 : deux entrees ne font pas une
      // rubrique, et ce qu'on anime releve de son activite comme le reste.
      { label: 'Mes ateliers', href: '/dashboard/ateliers', icon: Sparkles },
      { label: 'Mes formations', href: '/dashboard/formations', icon: GraduationCap, hint: 'Sessions que vous animez : émargement, apprenants, attestations' },
      { label: 'Mon planning', href: '/dashboard/planning', icon: CalendarClock, essentiel: true, hint: 'Votre agenda, importez-y le planning que vous avez déjà, en CSV, Excel ou PDF' },
    ],
  },
  // Les deux outils LEX sont dans la barre du haut depuis le 03/09/2026. Le
  // solde reste ici : c'est la seule des trois entrées qui parle d'argent, et
  // un salarié en attente de rattachement a besoin de savoir ce qu'il lui
  // reste avant d'ouvrir l'outil.
  {
    items: [
      { label: 'LEX · Crédits', href: '/dashboard/adhesion', icon: Receipt, hint: 'Votre dotation du mois et votre consommation' },
    ],
  },
];

/**
 * LE MENU D'UN PARTICULIER — 9/09/2026.
 *
 * Un parent n'a rien à faire de RenforTeam, du vivier, des candidatures ou du
 * temps de travail : il cherche un atelier pour son enfant, il le réserve, il
 * veut sa facture, et il a des questions éducatives. Lui servir le menu d'un
 * établissement serait lui montrer vingt portes dont dix-huit lui sont
 * fermées — la façon la plus sûre de lui faire croire que le site n'est pas
 * pour lui.
 *
 * Ce menu est donc court, et c'est sa qualité principale.
 */
const particulierNav: NavSection[] = [
  {
    items: [
      { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, essentiel: true },
    ],
  },
  {
    title: 'Trouver et réserver',
    items: [
      { label: 'Ateliers', href: '/ateliers', icon: Sparkles, essentiel: true, hint: 'Le catalogue : ateliers et interventions près de chez vous' },
      { label: 'Formations', href: '/formations', icon: GraduationCap, hint: 'Les parcours ouverts à tous, la plupart gratuits' },
      { label: 'Mes réservations', href: '/dashboard/reservations', icon: CalendarCheck, essentiel: true, hint: 'Ce que vous avez réservé, les dates et les intervenants' },
    ],
  },
  {
    title: 'Mes outils',
    items: [
      { label: 'Générateur d’activités', href: '/dashboard/activites', icon: Lightbulb, hint: 'Une activité prête à faire, adaptée à l’âge et à ce que vous voulez travailler' },
      { label: 'Appui scolaire', href: '/dashboard/appui-scolaire', icon: GraduationCap, hint: 'Fiches de révision, mémos et exercices, à partir de ce que vous décrivez' },
    ],
  },
  {
    title: 'Mon compte',
    items: [
      { label: 'Mes factures', href: '/dashboard/facturation', icon: Receipt, essentiel: true, hint: 'Vos factures et vos règlements' },
      /**
       * ⚠ UN PARTICULIER PEUT AUSSI VENIR TRAVAILLER, depuis le 16/09/2026.
       * Étudiant, professionnel entre deux postes, retraité du secteur : le
       * remplacement se fait en CDD, donc en salarié, donc sans structure ni
       * SIRET. C'est le chemin le plus propre juridiquement, et c'est ce qui
       * manque le plus au renfort — des bras, pas des demandes.
       */
      { label: 'Ma disponibilité', href: '/dashboard/disponibilite', icon: UserPlus, hint: 'Proposer vos disponibilités pour des remplacements en CDD, et vous retirer de la liste quand vous voulez' },
      { label: 'LEX · Crédits', href: '/dashboard/adhesion', icon: Sparkles, hint: 'Votre dotation offerte du mois et vos recharges' },
      { label: 'Mon profil', href: '/dashboard/account', icon: Users, hint: 'Vos informations et vos préférences d’e-mail' },
      { label: 'Aide & contact', href: '/dashboard/aide', icon: LifeBuoy, hint: 'Écrivez à l’équipe Les Extras : un problème, une question. La réponse arrive ici et par e-mail.' },
    ],
  },
];

export function getNavForRole(
  role: NavRole,
  roleCompte?: AccountRole,
  options?: { outilsAvances?: boolean; enAttenteRattachement?: boolean },
): NavSection[] {
  // Avant toute chose : un compte qui attend son rattachement n'a qu'un menu.
  if (options?.enAttenteRattachement) return attenteRattachementNav;

  const base =
    role === 'ADMIN'
      ? adminNav
      : role === 'ESTABLISHMENT'
        ? establishmentNav
        : role === 'PARTICULIER'
          ? particulierNav
          : freelanceNav;

  /**
   * Les outils avancés (gestion RH) sont masqués tant qu'on ne les a pas
   * demandés. Quand on les demande, ils s'AJOUTENT au menu, groupés dans une
   * rubrique à eux, tout en bas.
   *
   * ⚠ CECI REMPLACE LA RÈGLE DU 12/08/2026 (« quand on les demande, on ne voit
   * qu'eux »), et il faut dire pourquoi plutôt que de faire comme si elle
   * n'avait jamais existé. Le motif d'alors était juste : les activer ajoutait
   * des entrées AU MILIEU de vingt autres, et on cherchait dans un menu devenu
   * plus long ce qu'on venait précisément d'ouvrir. Mais la réponse choisie —
   * masquer tout le reste — coûtait plus cher que le défaut : un chef de
   * service qui ouvrait « Contrats CDD » perdait l'accès à ses renforts, à ses
   * réservations et à LEX tant qu'il n'avait pas retrouvé le bouton du bas.
   * Et comme il ne reste que DEUX entrées avancées, l'aiguillage produisait un
   * menu de deux lignes dans deux rubriques d'une seule entrée — ce que la
   * règle « deux entrées ne font pas une rubrique », écrite plus haut dans ce
   * fichier, interdit partout ailleurs.
   *
   * Le groupement en UNE rubrique nommée répond au motif d'origine (on voit
   * d'un bloc ce qu'on vient d'ouvrir, et où) sans fermer le reste de l'outil.
   *
   * ⚠ NE PAS SCINDER LA RUBRIQUE par section d'origine : deux rubriques d'une
   * entrée, c'est exactement le défaut qu'on répare.
   */
  /**
   * ⚠ LE NOM DE LA RUBRIQUE SE DÉDUIT DE CE QU'ELLE CONTIENT (21/09/2026).
   *
   * Elle s'appelait « Gestion RH » en dur, et c'était juste tant qu'elle ne
   * portait que les contrats CDD et le temps de travail. Le jour où le menu a
   * été allégé, elle a reçu des entrées qui n'ont rien de RH — les alertes du
   * catalogue, les publications, les avis. Un titre qui ne décrit que deux de
   * ses neuf lignes ment sur les sept autres : on garde alors le nom du
   * réglage, celui que la personne vient de cliquer.
   */
  const nommerRubrique = (items: NavItem[]) => {
    const noms = new Set(items.map((i) => i.rubrique ?? RUBRIQUE_RH));
    return noms.size === 1 ? [...noms][0] : RUBRIQUE_SECONDAIRE;
  };
  const filtrerAvances = (sections: NavSection[]) => {
    const quotidien = sections
      .map((s) => ({ ...s, items: s.items.filter((i) => !i.avance) }))
      .filter((s) => s.items.length > 0);
    if (!options?.outilsAvances) return quotidien;
    const avances = sections.flatMap((s) => s.items.filter((i) => i.avance));
    if (avances.length === 0) return quotidien;
    /*
     * ⚠ UNE SEULE ENTRÉE AVANCÉE : PAS DE RUBRIQUE (21/09/2026).
     *
     * « Deux entrées ne font pas une rubrique » est la règle de ce fichier, et
     * elle s'appliquait jusqu'ici à la main, section par section. Elle s'est
     * trouvée prise en défaut le jour où « Contrats CDD » a été conditionné à
     * l'offre publique : hors offre complète il ne reste que « Temps de
     * travail & congés », et la rubrique « Gestion RH » se retrouvait titrée
     * au-dessus d'une seule ligne. Deux tests l'ont attrapé avant la mise en
     * ligne.
     *
     * La règle est donc appliquée ICI, une fois, plutôt que d'être re-vérifiée
     * à chaque entrée qu'on conditionne : une entrée seule rejoint le menu du
     * quotidien, sans titre au-dessus d'elle.
     */
    if (avances.length === 1) return [...quotidien, { items: avances }];
    return [...quotidien, { title: nommerRubrique(avances), items: avances }];
  };
  const sansAvances = filtrerAvances;

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
