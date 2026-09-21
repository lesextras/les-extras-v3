// PAGE STATIQUE, RÉGÉNÉRÉE TOUTES LES CINQ MINUTES (ISR).
//
// Jusqu'au 21/08/2026 : `force-dynamic` — le serveur RE-RENDAIT l'accueil à
// chaque visite et répondait `no-store`. La donnée était cachée une minute
// (fetchPublic), mais le rendu, lui, était payé par chaque visiteur : le pire
// réglage possible sous campagne publicitaire, où tout le trafic payant
// atterrit précisément ici.
//
// Le verrou historique (« le build n'atteint pas l'API ») est tombé :
// `NEXT_PUBLIC_API_URL` est un argument de build (Dockerfile + Coolify) qui
// pointe l'API PUBLIQUE, joignable pendant `next build`. La page se pré-rend
// donc avec de vraies données, se sert toute prête (TTFB de fichier statique),
// et se régénère en arrière-plan. Si l'API est injoignable au build,
// `fetchPublic` renvoie une erreur sans jeter : la page sort sans la section
// « catalogue », et la première régénération (le healthcheck Docker frappe `/`
// toutes les 30 s) la complète.
//
// ─────────────────────────────────────────────────────────────────────────────
// REFONTE DU 08/09/2026 : DIX-SEPT SECTIONS DEVENUES HUIT.
//
// L'accueil disait tout, et c'était exactement le problème : dix-sept
// sections, deux publics qui s'alternaient huit fois, LEX raconté trois fois,
// le prix deux fois, le catalogue quatre fois. Ce qui ne se lisait nulle part,
// c'est la phrase la plus simple : un réseau d'intervenants pour des renforts,
// des ateliers et des formations, et un seul logiciel pour tout gérer.
//
// L'ordre retenu, et rien d'autre n'a changé — charte, couleurs, animations et
// composants sont ceux du site :
//   1. le héros : les trois usages et le logiciel, dès le titre ;
//   2. Renfort · Atelier · Formation, à largeur égale ;
//   3. l'aiguillage, deux portes ;
//   4. le tout-en-un : il diffuse, il formalise, il vérifie, il compte ;
//   5. le catalogue, en un bloc à onglets ;
//   6. LEX ;
//   7. le prix, en une ligne ;
//   8. ouvrir un compte.
//
// RIEN N'EST SUPPRIMÉ, tout est déplacé :
//   • la barre de recherche descend sur /ateliers, qui a déjà la sienne ;
//   • « un seul formulaire » et « l'aperçu du produit » partent sur
//     /renforteam, la page qui raconte le renfort en détail ;
//   • « recevoir le catalogue » et « nous écrire » partent sur /contact.
// Aucun lien de l'ancienne page ne disparaît sans destination.
export const revalidate = 300;

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileCheck,
  Clock,
  Megaphone,
  FileSignature,
  Timer,
  Euro,
  Check,
  Boxes,
  Handshake,
  HeartHandshake,
  BookOpen,
  Users,
  Video,
} from 'lucide-react';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Button } from '@/components/ui/button';
import { fetchPublic } from './_shared/server';
// Les visuels de la médiathèque WordPress passent par `wp()` : ils ont déjà
// déménagé deux fois, et les URL écrites en dur sont celles qui survivent au
// déménagement puis cassent seules. Voir `lib/media.ts`.
import { premierVisuel, wp } from '@/lib/media';
import { renfortSalarieVisible, visioconsultationVisible } from '@/lib/offre';
import { OfferCarousel, type OfferCard } from './_shared/OfferCarousel';
import { CatalogueOnglets } from './_shared/CatalogueOnglets';
import { estMaison } from '@/lib/mini-formations';
import { Reveal } from './_shared/Reveal';
import { ChatBot } from './_shared/ChatBot';
import { OffreLex } from './_shared/OffreLex';
import { RetourHaut } from './_shared/RetourHaut';
import { DeuxPortes } from './_shared/DeuxPortes';
import { DeuxRenforts } from './_shared/DeuxRenforts';
import { Mascotte } from './_shared/Mascotte';

/**
 * L'accueil n'avait aucune canonique : les visites arrivant avec un
 * paramètre de campagne (?utm_source=…) s'indexaient comme autant de pages
 * distinctes. Titre et description restent ceux du layout racine — ils sont
 * écrits pour cette page.
 *
 * La carte de partage, en revanche, doit être répétée : Next fusionne les
 * métadonnées en surface, donc cet objet `openGraph` REMPLACE celui du layout
 * racine au lieu de le compléter. N'y poser que l'`url` suffisait à effacer
 * l'image, le `siteName`, la locale et le `type` — sur l'accueil, c'est-à-dire
 * la page d'atterrissage de la campagne. Valeurs identiques à `layout.tsx`.
 */
export const metadata: Metadata = {
  alternates: { canonical: '/' },
  // Repris ici depuis le layout racine : voir le commentaire de `layout.tsx`.
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'LES EXTRAS',
    url: '/',
    images: [
      {
        url: '/images/partage-les-extras.jpg',
        width: 1200,
        height: 630,
        alt: 'LES EXTRAS, ateliers éducatifs, formations Qualiopi et renfort d’équipe pour le médico-social',
      },
    ],
  },
};

// ─────────────────────────────────────────────────────── les trois usages
//
// Un renfort, un atelier, une formation : trois besoins, un même chemin. Ils
// étaient traités à trois poids différents — le remplacement occupait quatre
// sections pleines, les ateliers et les formations une vitrine. Trois colonnes
// de même largeur, c'est ce qui se lit : trois usages d'un même réseau.
const USAGES = [
  {
    kicker: 'Renfort',
    // ⚠ LA CARTE A CHANGÉ D'OBJET LE 19/09/2026, PAS SEULEMENT DE MOTS.
    // Le renfort de poste — « absorber une absence », la cascade, l'export
    // paie — sort de l'offre publique (voir `@/lib/offre`). Ce qui reste, et
    // qui est désormais annoncé ici, c'est le renfort par des indépendants
    // spécialisés, sur un besoin nommé. L'ancienne version est conservée
    // juste en dessous et revient en offre complète.
    ...(renfortSalarieVisible()
      ? {
          titre: 'Absorber une absence',
          texte: 'Éducateur, moniteur, AES, psychologue.',
          points: [
            'Diffusion en cascade',
            'Feuille de mission éditée',
            'Heures pointées, export paie',
          ],
          action: 'Comprendre le renfort',
        }
      : {
          titre: 'Faire intervenir un spécialiste',
          texte: 'Ergothérapeute, éducateur spécialisé, psychomotricienne, psychologue, orthophoniste.',
          points: [
            'Familles, écoles, mairies, établissements',
            'En présentiel ou en visioconsultation',
            'Devis écrit avant l’intervention',
          ],
          action: 'Découvrir RenforTeam',
        }),
    href: '/renforteam',
    image: wp('/wp-content/uploads/2025/02/mineur-protection-de-lenfance.jpg'),
    trait: 'bg-primary',
    teinte: 'text-primary',
    puce: 'border-primary bg-primary-soft',
  },
  {
    kicker: 'Atelier',
    titre: 'Programmer une médiation',
    texte:
      'Musicothérapie, théâtre, psycho-boxe, slam, socio-esthétique.',
    points: ['Public, durée et tarif affichés', 'Devis sous 48 h', 'Le tarif affiché est le tarif payé'],
    href: '/ateliers',
    action: 'Parcourir les ateliers',
    image: wp('/wp-content/uploads/2023/02/cerf-volant-game-enfant-400x400.jpg'),
    trait: 'bg-secondary',
    teinte: 'text-secondary',
    puce: 'border-secondary bg-secondary-soft',
  },
  {
    kicker: 'Formation',
    titre: 'Faire monter l’équipe',
    texte:
      'Analyse des pratiques, gestion de la violence, accueil du public.',
    points: ['Qualiopi, finançable OPCO', 'Émargement et attestations', 'Des parcours gratuits en plus'],
    href: '/formations',
    action: 'Voir les formations',
    image: wp('/wp-content/uploads/2025/02/lever-vous-400x400.jpeg'),
    trait: 'bg-foreground',
    teinte: 'text-foreground',
    puce: 'border-foreground bg-muted',
  },
];

// Ce que le logiciel fait, en quatre verbes valables pour les trois usages.
// Les six tuiles « comment marche le renfort » ne parlaient que du renfort :
// c'était le tout-en-un raconté pour un seul besoin sur trois.
const TOUT_EN_UN = [
  {
    icone: Megaphone,
    titre: 'Il diffuse',
    texte:
      'Un formulaire pour les trois besoins. Les bons profils sont prévenus, et relancés.',
  },
  {
    icone: FileSignature,
    titre: 'Il formalise',
    texte:
      'Devis sous 48 h, feuille de mission, facture. Le contrat reste le vôtre.',
  },
  {
    icone: ShieldCheck,
    titre: 'Il vérifie',
    texte:
      'Diplômes, casier, URSSAF, assurance : réunis une fois, alerte avant l’échéance.',
  },
  {
    icone: Timer,
    titre: 'Il compte',
    texte:
      'Heures, congés, export paie. Émargement et attestations.',
  },
  /*
    ⚠ LES DEUX CARTES SUIVANTES DISENT CE QU'EST LE SERVICE, pas ce que le
    logiciel fait — elles ont été demandées le 21/09/2026 parce que le bloc
    listait quatre fonctions administratives sans jamais nommer RenforTeam ni
    la visio. Le visiteur lisait « il diffuse, il formalise » sans savoir QUOI.

    ⚠ CETTE CARTE DIT LE PROBLÈME, PAS LE PRIX — décision de Siham le
    21/09/2026 au soir. Elle a d'abord porté « 15 % de frais de gestion » :
    un tarif, sur une carte dont le travail est de faire reconnaître une
    SITUATION. Le prix a sa page (/frais-de-service) et le bloc « tout-en-un »
    n'est pas une grille tarifaire.

    ⚠ Si un chiffre revient ici un jour, ce doit être 15 % et jamais 0 % :
    0 % est le taux des ateliers et des formations, pas celui du renfort. Deux
    chiffres différents sur deux pages du même site est exactement ce que
    l'audit reprochait ailleurs.
  */
  {
    icone: HeartHandshake,
    titre: 'RenforTeam',
    texte:
      'Quatorze mois d’attente pour une psychomotricienne, et l’enfant qui grandit pendant ce temps-là. Vous décrivez le besoin ce soir, le réseau est prévenu.',
  },
];

/*
  LA CARTE VISIOCONSULTATION — AFFICHÉE SEULEMENT SI LE SERVICE EST OUVERT.

  ⚠ ELLE EST SÉPARÉE DE `TOUT_EN_UN` EXPRÈS. Le service s'allume par
  `NEXT_PUBLIC_VISIOCONSULTATION=1` (voir `lib/offre.ts`), et tant que la
  variable n'est pas posée, `/visio/:jeton` redirige : annoncer la visio sur
  l'accueil pendant ce temps-là afficherait une promesse que le site ne peut
  pas tenir — le défaut exact que l'audit reproche partout ailleurs.

  Grâce à cette séparation, le jour où la variable est posée la carte apparaît
  toute seule, sans toucher à ce fichier.
*/
const CARTE_VISIO = {
  icone: Video,
  titre: 'En visio, aussi',
  texte:
    'Quand personne n’est disponible près de chez vous, la séance se tient en visioconsultation — même devis, même feuille de mission, même facture.',
};

// ────────────────────────────────────────────────────────────── les tarifs
//
// TROIS COLONNES, PARCE QU'IL Y A TROIS PRIX.
//
// Le prix tenait dans une seule carte avec trois lignes en petit corps : de
// loin, la page disait « un tarif », alors qu'il y en a trois et qu'ils ne se
// ressemblent pas — gratuit pour toujours, sur devis, et un abonnement. Trois
// colonnes de même largeur, chacune avec SON prix en grand, c'est ce qui se
// lit d'un coup d'œil et ce qu'on va comparer.
//
// ⚠⚠ CETTE LISTE N'EST PLUS AFFICHÉE DEPUIS LE 21/09/2026. Les prix ont quitté
// l'accueil (décision de Siham, voir la section #tarifs plus bas). Elle est
// CONSERVÉE parce qu'elle est la seule trace, dans ce fichier, de la grille
// telle qu'elle a été publiée — et parce que la remettre en ligne un jour ne
// doit pas obliger à la réécrire de mémoire.
//
// ⚠ NE PAS LA SUPPRIMER, ET NE PAS LA REBRANCHER SANS SIHAM.
//
// ⚠ AUCUN CHIFFRE N'EST INVENTÉ ICI : les trois montants sont ceux qui
// figuraient déjà sur la page. Un prix affiché est un engagement.
// eslint-disable-next-line no-unused-vars
const TARIFS = [
  {
    kicker: 'Renforts et ateliers',
    prix: '0 €',
    precision: 'gratuit pour toujours',
    /*
     * ⚠⚠ LES DEUX RÉGIMES NE SONT PLUS LE MÊME DEPUIS LE 21/09/2026.
     *
     * « 0 % de commission » couvrait tout. Décision de Siham : RenforTeam est
     * commissionné, parce que l'association VÉRIFIE chaque professionnel de
     * l'éducation spécialisée avant de l'envoyer chez quelqu'un. Ce n'est pas
     * une mise en relation, c'est une sélection — et c'est ce qui se paie.
     *
     * Les ateliers et les formations, eux, restent à 0 % : on y réserve en
     * direct, l'intervenant facture l'établissement, l'association ne s'y
     * interpose pas. Les deux lignes disent donc deux choses différentes, et
     * c'est volontaire.
     *
     * ⚠ 15 %, ARRÊTÉ LE 21/09/2026. Le taux et sa justification sont dans
     * `lib/commission.ts` — relevé des grilles publiques compris. Ne pas le
     * changer ici seul : il est aussi sur /frais-de-service, /renforteam et
     * dans les CGU.
     */
    points: [
      'Publication, diffusion et relances',
      'Devis et feuille de mission édités',
      'Ateliers et formations : 0 % de commission',
      'RenforTeam : 15 % de frais de gestion, ajoutés au tarif — l’intervenant touche 100 %',
    ],
    lien: { libelle: 'Publier un besoin', href: '/renforteam' },
    trait: 'bg-primary',
    teinte: 'text-primary',
  },
  {
    kicker: 'Formations Qualiopi',
    prix: 'Sur devis',
    precision: 'selon la durée et l’effectif',
    points: [
      'Dans votre établissement',
      'Certifiées Qualiopi',
      'Finançables par votre OPCO',
    ],
    lien: { libelle: 'Voir les formations', href: '/formations' },
    trait: 'bg-secondary',
    teinte: 'text-secondary',
  },
  {
    kicker: 'LEX, pour les écrits',
    prix: '19 €',
    precision: 'par mois, pour 200 générations',
    points: [
      '15 générations offertes chaque mois',
      'Sans carte bancaire pour commencer',
      'Rapports, projets, comptes rendus',
    ],
    lien: { libelle: 'Le détail de LEX', href: '#offre-lex' },
    trait: 'bg-amber-500',
    teinte: 'text-amber-500',
  },
];

// Le bandeau défilant : ce que le même logiciel porte, d'un besoin à l'autre.
const BANDEAU = [
  'Planning partagé',
  'Coffre-fort de conformité',
  'Messagerie',
  'Congés & compteurs',
  'Export paie CSV',
  'Devis, feuille de mission, facture',
];

export default async function LandingPage() {
  // Plus de lecture de session ici : l'en-tête interroge `/api/visiteur`
  // depuis le navigateur. Voir `app/(public)/layout.tsx`.
  //
  // Marketplace visible sans compte : la sélection, directement en accueil.
  const { data: unes, error: erreurUnes } = await fetchPublic<{
    ateliers: OfferCard[];
    formations: OfferCard[];
  }>('/public/highlights');

  // DIX CARTES PAR RAYON.
  //
  // Les trois rayons ne sont plus trois sections empilées mais trois onglets
  // d'un carrousel : on n'en voit qu'un à la fois, et il défile latéralement.
  // Le poids de la page ne dépend donc plus du nombre de fiches, et une vitrine
  // à trois cartes donnait à croire que le catalogue était vide. Dix par rayon,
  // c'est ce que les répertoires renvoient et ce qu'un carrousel porte sans
  // peser.
  const VITRINE = 10;

  // ⚠ L'ORDRE VIENT DE LA DATE, PAS DE LA NOTE NI DES VUES. `/public/highlights`
  // renvoie les fiches publiées les plus récentes d'abord : la vitrine montre
  // ce qui vient d'arriver, et publier une fiche se voit le jour même.
  // ⚠ LES FICHES AVEC PHOTO PASSENT DEVANT, À DATE ÉGALE DE SÉLECTION. La
  // sélection reste celle des dernières publiées ; c'est seulement l'ordre
  // d'affichage qui change à l'intérieur. Une carte avec photo arrête l'œil,
  // une vignette dessinée non — mettre la seconde en tête du carrousel, c'est
  // se priver du seul moment où le visiteur regarde vraiment.
  //
  // `sort` est stable en JavaScript : à photo égale, l'ordre par date est
  // conservé tel quel. Aucune fiche n'est écartée, aucune n'est ajoutée.
  const photoDabord = <T extends { images?: string[] | null }>(liste: T[]) =>
    [...liste].sort(
      (a, b) => Number(Boolean(premierVisuel(b.images))) - Number(Boolean(premierVisuel(a.images))),
    );

  const ateliersUne = photoDabord((unes?.ateliers ?? []).slice(0, VITRINE));

  // Le même partage que sur /formations : les mini-formations gratuites de la
  // maison d'un côté, les formations Qualiopi vendues en intra de l'autre. Une
  // mini-formation gratuite et une formation en intra ne s'adressent pas aux
  // mêmes personnes et n'ont pas le même prix : dans la même ligne, chacune
  // brouillait l'autre. Elles sont maintenant deux onglets.
  const gratuites = photoDabord(
    (unes?.formations ?? []).filter((f) => f.freeOnline && estMaison(f.account?.name)).slice(0, VITRINE),
  );
  const payantes = photoDabord(
    (unes?.formations ?? []).filter((f) => !(f.freeOnline && estMaison(f.account?.name))).slice(0, VITRINE),
  );

  /**
   * ⚠⚠ DEUX RAYONS, PAS TROIS — 16/09/2026, demande de Siham.
   *
   * L'accueil en portait trois : « Ateliers », « Formations Qualiopi » et
   * « Parcours gratuits ». Deux des trois disaient « formation » : le visiteur
   * devait trancher entre deux mots qu'il ne distingue pas encore, sur la
   * première page qu'il voit. Les parcours gratuits rejoignent donc l'onglet
   * Formations.
   *
   * ⚠ CE QUI REND LA FUSION TENABLE AUJOURD'HUI, ET QUI NE L'ÉTAIT PAS AVANT :
   * la carte du carrousel dit maintenant elle-même ce qu'elle est — « Gratuit ·
   * en ligne » ou son prix, la pastille « Conçue par ADéPA », la durée, le
   * concepteur. Quand ces cartes ne portaient qu'un titre et un prix, mélanger
   * une mini-formation gratuite et une formation en intra à 1 600 € brouillait
   * effectivement les deux. Si un jour la carte est appauvrie, il faudra
   * reséparer les rayons. Le partage en deux listes existe toujours sur
   * `/formations`, où le visiteur vient déjà avec une idée précise.
   *
   * ⚠ LES QUALIOPI D'ABORD, LES GRATUITS ENSUITE — c'est un choix, pas un
   * hasard. Elles sont trois contre douze : derrière les gratuites, elles
   * seraient invisibles, et ce sont les seules qui portent du chiffre
   * d'affaires. Inverser est un échange de deux lignes.
   */
  const rayons = [
    {
      cle: 'ateliers',
      libelle: 'Ateliers',
      items: ateliersUne,
      basePath: '/ateliers',
      lien: { libelle: 'Tout le catalogue', href: '/ateliers' },
    },
    {
      cle: 'formations',
      libelle: 'Formations',
      items: [...payantes, ...gratuites].slice(0, VITRINE),
      basePath: '/formations',
      lien: { libelle: 'Toutes les formations', href: '/formations' },
    },
  ];

  return (
    <div className="theme-sombre bg-ivoire-degrade flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* ═══════════ 1. HÉROS : les trois usages et le logiciel, dès le titre */}
        <section className="relative isolate overflow-hidden bg-warm-gradient">
          {/* Deux masses floues qui dérivent lentement derrière le contenu.
              Purement décoratives : aria-hidden, aucun coût de lecture. */}
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
            <span className="animate-halo absolute -left-24 -top-32 size-[34rem] rounded-full bg-primary/[0.13] blur-3xl" />
            <span className="animate-halo-2 absolute -right-32 top-1/3 size-[30rem] rounded-full bg-secondary/[0.11] blur-3xl" />
          </div>
          <div className="mx-auto grid max-w-[1360px] items-center gap-12 px-6 pb-16 pt-14 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-20">
            {/* Colonne texte */}
            <div>
              <span className="eyebrow animate-fade-in-up inline-flex">
                <Sparkles className="size-3.5" />
                Le logiciel du médico-social · association ADéPA
              </span>
              {/* LE TITRE NOMME LES TROIS USAGES ET LE LOGICIEL.
                  « Les interventions portées par ceux qui font le terrain »
                  disait QUI, pas QUOI : une belle phrase sur l'esprit de la
                  maison, mais qui ne renseignait ni sur ce qu'on trouve ici,
                  ni sur ce que le logiciel fait. Aucun des trois usages ne
                  passe devant les autres, et le mot qui manquait — logiciel —
                  est là. */}
              <h1 className="animate-fade-in-up stagger-1 mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl xl:text-6xl">
                Renforts, ateliers, formations&nbsp;:{' '}
                <span className="text-secondary">le bon réseau dans un seul logiciel.</span>
              </h1>
              {/* TROIS LIGNES DEVENUES UNE. Sous un titre qui dit déjà les
                  trois usages et le logiciel, le paragraphe ne faisait que
                  répéter — et les trois repères chiffrés, juste dessous,
                  disaient le reste mieux que lui. */}
              <p className="animate-fade-in-up stagger-2 mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {/* ⚠ « sans commission » RETIRÉ ICI LE 21/09/2026 : cette
                    phrase décrit le renfort, et le renfort est désormais
                    commissionné. Le repère « 0 % » juste dessous précise ce
                    qu'il couvre. */}
                Vous publiez votre besoin, un intervenant du réseau répond. Devis et feuille de
                mission suivent.
              </p>

              {/* LA BARRE DE RECHERCHE A QUITTÉ LE HÉROS.
                  Mise ici, elle rangeait Les Extras dans la catégorie
                  « annuaire d'ateliers » : le geste le moins représentatif de
                  ce que le logiciel sait faire, proposé en premier. Elle a sa
                  place — sur /ateliers, qui a déjà la sienne, et sur
                  /formations. À sa place, les deux gestes qui comptent, un par
                  public, chacun vers sa propre destination. */}
              <div className="animate-fade-in-up stagger-3 mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/renforteam">
                    Je cherche un intervenant
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  {/* ⚠ PAS `/missions` : cette route n'a qu'un segment
                      dynamique `[id]`, il n'existe aucune page d'index — le
                      lien tombait sur un 404. La porte publique de
                      l'intervenant, c'est /intervenant-independant. */}
                  <Link href="/intervenant-independant">Je cherche des missions</Link>
                </Button>
              </div>

              <div className="animate-fade-in-up stagger-4 mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {/* « INTERVENANTS VÉRIFIÉS » N'ÉTAIT PAS VRAI : aucune étape de
                    validation n'existe. Les trois repères ci-dessous sont
                    mesurables et tenus. */}
                <span className="inline-flex items-center gap-1.5">
                  <Euro className="size-4 text-primary" />
                  <strong className="font-semibold text-foreground">0 %</strong> sur les ateliers
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-primary" />
                  <strong className="font-semibold text-foreground">48 h</strong> pour un devis
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="size-4 text-primary" />
                  <strong className="font-semibold text-foreground">Qualiopi</strong> · finançable
                  OPCO
                </span>
              </div>
            </div>

            {/* Colonne visuelle : composition avec cartes flottantes.
                Attention : Reveal applique un `transform`, ce qui en fait le
                bloc conteneur de tout enfant `absolute`. Le positionnement
                doit donc vivre SUR le Reveal, pas dans son enfant, sinon les
                cartes retombent sous la photo au lieu de se poser dessus. */}
            <div className="relative hidden lg:block">
              <Reveal>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-card">
                  <Image
                    src="/images/reseau-les-extras.jpg"
                    alt="Le réseau des intervenants Les Extras"
                    fill
                    priority
                    sizes="(max-width: 1024px) 0px, 45vw"
                    className="animate-panoramique object-cover"
                  />
                  {/* Voile bas : garantit le contraste de la carte posée
                      dessus, quelle que soit la photo qui remplacera celle-ci. */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
                </div>
              </Reveal>

              <Reveal delay={200} className="absolute bottom-5 left-5 z-10">
                <div className="animate-derive flex items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-card backdrop-blur">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                    <FileCheck className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Devis sous 48 h</p>
                    {/* ⚠ PLUS DE « CONTRAT AUTOMATIQUE ». Le logiciel édite un
                        DEVIS et une FEUILLE DE MISSION ; le contrat de travail
                        reste rédigé par l'établissement. « Contrat généré »
                        promet plus que ce qui est fait, et c'est le genre de
                        promesse qu'une direction vérifie avant de signer. */}
                    <p className="text-xs text-muted-foreground">
                      feuille de mission et facture
                    </p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={320} className="absolute right-5 top-5 z-10">
                <div className="animate-derive-lente flex items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-card backdrop-blur">
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary-soft text-secondary">
                    <GraduationCap className="size-5" />
                  </span>
                  <div>
                    {/* ⚠ ON N'AFFICHE PLUS LA TAILLE DU CATALOGUE ICI : dix-sept
                        se lit comme « petit » sur une place de marché. On
                        publie le chiffre qui est fort, celui qu'aucun
                        concurrent ne peut écrire : les zéros. */}
                    {/* ⚠ CETTE PASTILLE A PORTÉ « 17 interventions », puis
                        « 0 % de commission », puis « 0 % sur les ateliers ».
                        Depuis le 21/09/2026 elle ne porte plus de chiffre du
                        tout : les prix ont quitté l'accueil. Ce qui reste est
                        un fait de produit, pas un argument tarifaire. */}
                    <p className="text-sm font-semibold text-foreground">Aucun frais de recrutement</p>
                    <p className="text-xs text-muted-foreground">et aucun engagement de durée</p>
                  </div>
                </div>
              </Reveal>

              {/* Pastille « en activité » : le seul élément qui pulse, et il
                  porte une information réelle, la plateforme tourne. */}
              <Reveal delay={440} className="absolute -bottom-4 right-8 z-10">
                <div className="flex items-center gap-2.5 rounded-full border border-border/70 bg-card/95 py-2 pl-3 pr-4 shadow-card backdrop-blur">
                  <span className="relative grid size-2.5 place-items-center">
                    <span className="animate-anneau absolute size-2.5 rounded-full bg-success" />
                    <span className="size-2.5 rounded-full bg-success" />
                  </span>
                  {/* Le réseau réel est aujourd'hui francilien, et on continue
                      de le dire : promettre la France entière déçoit le premier
                      établissement breton qui s'inscrit. */}
                  <span className="text-xs font-medium text-foreground">
                    Réseau actif en Île-de-France
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══ 2. LES TROIS USAGES, À LARGEUR ÉGALE ═══
            « Trois services » posait trois cartes de tailles différentes dans
            la tête du lecteur : quatre sections pour le renfort, une vitrine
            pour le reste. À largeur égale, on lit enfin ce que c'est — trois
            usages d'un même réseau, et le même chemin pour les trois. */}
        <section className="section">
          <Reveal className="max-w-3xl">
            <span className="eyebrow">Trois besoins, un même chemin</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl text-balance">
              Le réseau répond aux trois. Le logiciel gère les trois.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              On publie une fois. Tout ce qui suit est édité au même endroit.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {USAGES.map((u, i) => (
              <Reveal key={u.kicker} delay={i * 110} className="h-full">
                <div className="reflet group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
                  <span
                    className={`animate-trait absolute left-0 top-6 bottom-6 w-[3px] rounded-full ${u.trait}`}
                    aria-hidden
                  />
                  <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                    <Image
                      src={u.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-6 pl-7">
                    <span
                      className={`text-xs font-bold uppercase tracking-[0.14em] ${u.teinte}`}
                    >
                      {u.kicker}
                    </span>
                    <h3 className="mt-2.5 text-xl font-bold leading-snug text-foreground">
                      {u.titre}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{u.texte}</p>
                    <ul className="mt-4 space-y-2">
                      {u.points.map((p) => (
                        <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                          {/* Une coche plutôt qu'un point : elle dit « c'est
                              compris », le point ne disait rien. */}
                          <Check className={`mt-0.5 size-4 shrink-0 ${u.teinte}`} aria-hidden />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={u.href}
                      className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                    >
                      {u.action}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Et par-dessus les trois, le même logiciel. */}
          <Reveal delay={120}>
            <div className="marquee-hover mt-8 flex flex-wrap items-center gap-x-6 gap-y-4 overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-card via-primary-soft to-card px-6 py-5">
              <p className="flex items-center gap-2 text-sm">
                <Boxes className="size-4 shrink-0 text-primary" aria-hidden />
                <strong className="font-semibold text-foreground">Le même logiciel pour les trois.</strong>
              </p>
              <div
                className="min-w-[220px] flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]"
                aria-hidden
              >
                <div className="animate-marquee flex w-max gap-2.5">
                  {[...BANDEAU, ...BANDEAU].map((m, i) => (
                    <span
                      key={`${m}-${i}`}
                      className="whitespace-nowrap rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ═══════════════════════════ 3. L'AIGUILLAGE, DEUX PORTES ═══════════ */}
        <DeuxPortes />

        {/* ═══ 4. LE TOUT-EN-UN : ce que le logiciel fait, pour les trois ═══ */}
        <section className="bg-nacre">
          <div className="section">
            <Reveal className="max-w-3xl">
              <span className="eyebrow">Tout-en-un</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl text-balance">
                Le travail administratif que vous ne ferez plus
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Valable pour un renfort comme pour un atelier ou une formation : même dossier, même
                conformité, même facture.
              </p>
            </Reveal>

            {/* ⚠ TROIS COLONNES, PLUS QUATRE : avec cinq ou six cartes, une
                grille de quatre laisse une ou deux orphelines sur la seconde
                ligne. En trois, c'est 3+2 ou 3+3 — les deux se tiennent. */}
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[...TOUT_EN_UN, ...(visioconsultationVisible() ? [CARTE_VISIO] : [])].map((t, i) => {
                const Icone = t.icone;
                return (
                  <Reveal key={t.titre} delay={i * 90} className="h-full">
                    <div className="flex h-full flex-col rounded-2xl border border-border bg-background p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                      <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                        <Icone className="size-5" />
                      </span>
                      <h3 className="mt-4 text-lg font-bold text-foreground">{t.titre}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.texte}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={120}>
              <p className="mt-8 text-sm text-muted-foreground">
                Le détail du renfort, écran par écran, est sur{' '}
                <Link
                  href="/renforteam"
                  className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                >
                  la page RenforTeam
                </Link>
                .
              </p>
            </Reveal>
          </div>
        </section>

        {/* ═══ 5. LE RENFORT, EN DEUX — et ce n'est pas du vocabulaire ═══════
            ⚠⚠ CETTE SECTION A CHANGÉ DE PLACE LE 16/09/2026 (demande de Siham :
            « l'emplacement actuel est étrange »), ET IL NE FAUT PAS LA REMONTER.

            Elle était en 3ᵉ position, juste après « Trois besoins » et AVANT
            l'aiguillage. Trois défauts, tous les trois réels :
              1. elle découpait en deux L'UN des trois usages, à la même largeur
                 et avec le même poids visuel que les trois réunis — on lisait
                 donc « trois offres », puis « deux offres », puis « deux
                 portes » : trois blocs de cartes côte à côte d'affilée, dont le
                 deuxième est un sous-chapitre du premier ;
              2. elle répondait à une question de MONTAGE JURIDIQUE que le
                 visiteur ne s'était pas encore posée — il en est encore à
                 « est-ce que c'est pour moi, et combien » ;
              3. elle repoussait « Par où commencer ? », c'est-à-dire le seul
                 aiguillage de la page, d'un écran et demi.

            Ici, elle arrive APRÈS que le visiteur s'est reconnu (les deux
            portes) et après « le travail administratif que vous ne ferez plus »
            — la nuance explique alors QUEL document le logiciel édite et
            pourquoi. Et son second lien (« Voir les intervenants ») tombe juste
            au-dessus du catalogue, où il mène. */}
        {/* ⚠ CETTE SECTION N'A PLUS D'OBJET HORS OFFRE PUBLIQUE, ET C'EST
            LE POINT : elle existe UNIQUEMENT pour expliquer que « renfort »
            désigne deux montages opposés — un poste couvert en CDD salarié, et
            une intervention en plus de l'équipe facturée en prestation. Depuis
            le 19/09/2026 il n'y en a plus qu'un seul en ligne (voir
            `@/lib/offre`) : garder la nuance reviendrait à vendre le montage
            qu'on vient de retirer, dans la section même qui le décrit.

            Le composant n'est pas supprimé. Il revient ici, intact, avec
            NEXT_PUBLIC_OFFRE_PUBLIQUE=complete. */}
        {renfortSalarieVisible() && <DeuxRenforts />}

        {/* ═══════════════ 6. LE CATALOGUE, EN UN SEUL BLOC À ONGLETS ═════════ */}
        <section id="marketplace" className="scroll-mt-24">
          <div className="section">
            <Reveal className="max-w-3xl">
              <span className="eyebrow">Sans compte, sans engagement</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl text-balance">
                Le catalogue, en un seul endroit
              </h2>
              {/* Deux repères au lieu d'une phrase : ce sont les deux seules
                  choses à retenir avant d'ouvrir le catalogue. */}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-base text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Handshake className="size-5 text-primary" aria-hidden />
                  Vous réservez directement auprès de l’intervenant
                </span>
                <span className="inline-flex items-center gap-2">
                  <Euro className="size-5 text-primary" aria-hidden />
                  Tarifs affichés, devis avant toute intervention
                </span>
              </div>
            </Reveal>

            {/* ⚠ QUAND L'API NE RÉPOND PAS, LA VITRINE DISPARAISSAIT EN SILENCE.
                Rien ne distinguait « rien à montrer » de « je n'ai pas pu
                demander ». Un visiteur arrivant pendant un redéploiement voyait
                une association sans un seul atelier au catalogue. On préfère
                dire que le chargement a échoué et donner la porte du
                catalogue : l'erreur avouée coûte moins cher que le vide. */}
            {erreurUnes && ateliersUne.length === 0 && payantes.length === 0 && gratuites.length === 0 ? (
              <Reveal className="mt-10 rounded-2xl border border-border/60 bg-card/40 p-8 text-center">
                <p className="text-lg font-semibold text-foreground">
                  Notre sélection ne s’affiche pas en ce moment.
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  C’est un incident passager de notre côté, pas un catalogue vide : les ateliers et
                  les formations sont bien en ligne.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button asChild>
                    <Link href="/ateliers">
                      Voir les ateliers <ArrowRight />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/formations">Voir les formations</Link>
                  </Button>
                </div>
              </Reveal>
            ) : (
              <Reveal className="mt-8">
                <CatalogueOnglets rayons={rayons} />
              </Reveal>
            )}
          </div>
        </section>

        {/* ═══════════════════════════════ 6. LEX ═══════════════════════════
            L'essai et le détail de l'offre se suivaient en deux sections :
            deux titres, deux respirations, deux fois la même promesse. Tout
            tient ici, sur la bande claire qui sert déjà de repère au milieu
            du fond charbon. */}
        <section
          id="lex"
          className="scroll-mt-24 border-y border-border bg-gradient-to-b from-primary/[0.07] via-background to-background"
        >
          <div className="section">
            <Reveal className="flex max-w-3xl items-start gap-5">
              {/* Le personnage tient le stylo : c'est la section des écrits. */}
              <Mascotte className="hidden w-24 shrink-0 sm:block" />
              <div>
              {/*
                ⚠ TITRE ET SOUS-TITRE, 16/09/2026 (demande de Siham).

                « Pour celles et ceux qui font le terrain » était en pastille
                grise au-dessus du titre — c'est-à-dire à l'endroit qu'on saute.
                C'est pourtant la seule ligne de la section qui dise À QUI elle
                s'adresse, et c'est ce qui fait s'arrêter un éducateur. Elle
                devient donc le titre, avec le nom du service devant : « LEX »
                seul ne dit rien à quelqu'un qui le lit pour la première fois.

                La phrase qui était le titre — « le métier ne s'arrête pas à la
                fin de la journée » — passe en sous-titre : elle dit le problème,
                pas le public, et un problème se lit après avoir su qu'on est
                concerné.

                ⚠ PLUS D'EYEBROW ICI. Reposer une pastille au-dessus rendrait
                trois lignes de titre pour une section, et on serait revenu au
                point de départ.
              */}
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-balance">
                LEX, pour celles et ceux qui{' '}
                <span className="text-gradient-brand">font le terrain</span>
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Le métier ne s’arrête pas à la fin de la journée.
              </p>
              </div>
            </Reveal>

            {/*
              ⚠ LE BLOC « POURQUOI PAS CHATGPT » A ÉTÉ DÉPLACÉ DANS `OffreLex`,
              ET IL NE DOIT PAS REVENIR ICI.

              Il pesait sept paragraphes — et ses trois arguments étaient déjà
              repris mot pour mot par la bande « garanties » du composant
              juste en dessous : les noms, l'enregistrement, la décision.
              Deux fois le même argument, à quelques centimètres : on saute
              les deux. Il tient maintenant en trois lignes, en tête du même
              bloc, une seule unité visuelle de la question aux garanties.
            */}
            <div id="offre-lex" className="mt-12 scroll-mt-24">
              <Reveal>
                <OffreLex />
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════ 7. LE PRIX, EN TROIS COLONNES ═════════
            « Gratuit des deux côtés » est l'argument le plus fort du site : il
            méritait une section à lui, pas deux moitiés éloignées de six
            écrans. Elle a d'abord tenu dans une carte unique — mais il y a bien
            TROIS prix, et ils ne se ressemblent pas : gratuit pour toujours,
            sur devis, et un abonnement. En petit corps sur une seule carte, la
            page avait l'air de n'en annoncer qu'un. En trois colonnes, chacun
            avec son montant en grand, on les compare d'un coup d'œil. */}
        {/*
          ⚠⚠ LES PRIX ONT QUITTÉ L'ACCUEIL LE 21/09/2026 — DÉCISION DE SIHAM,
          APRÈS AVOIR REGARDÉ CE QUE FONT LES AUTRES.

          Aucun concurrent du secteur n'expose sa grille sur sa page d'accueil,
          et Hublo ne publie même pas la sienne. Nous affichions trois montants
          en grand ET le taux de commission, c'est-à-dire tout ce qu'un
          concurrent a besoin de savoir, au premier écran, sans avoir à
          demander. Un prix se défend dans une conversation ou sur la page qui
          l'explique ; en vitrine, il se compare hors contexte.

          ⚠ LA PAGE `/frais-de-service` N'A PAS BOUGÉ, et ne doit pas bouger :
          elle porte les trois montants, les 15 % de RenforTeam, la
          comparaison avec Brigad et l'intérim. Cacher un prix n'est acceptable
          QUE s'il reste à un clic et sans formulaire — sinon on redevient le
          « créez un compte pour connaître un prix » corrigé le 3/08/2026.
          L'ancre #tarifs est conservée : le pied de page et de vieux liens
          pointent dessus.

          ⚠ NE PAS REMETTRE DE MONTANT ICI. Ni en petit, ni « à partir de »,
          ni dans une puce de réassurance.
        */}
        <section id="tarifs" className="scroll-mt-24 bg-nacre">
          <div className="section">
            <Reveal className="mx-auto max-w-3xl text-center">
              <span className="eyebrow mx-auto w-fit">Tarifs</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
                La mise en relation est gratuite. Des deux côtés.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Publier un besoin, réserver, éditer les devis, les feuilles de mission et les
                factures : rien de tout cela ne se paie. Ce qui se paie est écrit noir sur blanc,
                sur une page faite pour ça.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/frais-de-service">
                    Ce qui est gratuit, ce qui est payant
                    <ArrowRight />
                  </Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ═════════════════════════ 8. L'ASSOCIATION QUI PORTE TOUT ÇA ══════
            Les Extras n'est pas une entreprise : c'est le dispositif d'une
            association. C'est ce qui explique le modèle, et c'est
            ce que la page ne disait qu'en petit, dans une ligne de pied de
            page. Une association vit de ses adhérents et de ses bénévoles :
            si on ne le demande jamais, personne ne le propose. */}
        <section id="adepa" className="scroll-mt-24 section">
          <Reveal>
            <div className="reflet relative overflow-hidden rounded-3xl border border-border bg-nacre p-7 shadow-card md:p-12">
              <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div>
                  {/* LE LOGO, ET PAS SEULEMENT LE NOM. Le bloc parlait d'une
                      association que le visiteur ne reconnaissait nulle part :
                      son nom était écrit trois fois, sa marque zéro.
                      Le dessin est posé ici en SVG plutôt qu'en fichier image,
                      pour une raison de lisibilité : sa partie sombre est en
                      `currentColor`, donc elle suit la couleur du texte et se
                      lit sur le fond clair comme sur le fond sombre. Un PNG,
                      lui, aurait disparu dans l'un des deux. */}
                  <span
                    className="mb-5 grid size-14 place-items-center rounded-2xl border border-border bg-background shadow-soft"
                    aria-hidden
                  >
                    <svg viewBox="0 0 160 152" className="size-8 text-foreground" role="presentation" focusable="false">
                      <path fill="currentColor" d="M79.5 0 133 98h-30.5L79.5 55.5 30 152H0Z" />
                      <path fill="#EF4E4A" d="M117 124.5h29.5L160 152h-31Z" />
                    </svg>
                  </span>
                  <span className="eyebrow flex w-fit">
                    <HeartHandshake className="size-3.5" />
                    ADéPA porte Les Extras
                  </span>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
                    Derrière le réseau, il y a ADéPA.
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    Association éducative de Melun, en Seine-et-Marne. Elle agit pour l’insertion
                    des enfants, des adolescents et des familles par l’éducation, l’animation et la
                    prévention. Les Extras est l’un de ses dispositifs, et c’est ce qui explique
                    son modèle.
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {[
                      'Pas d’actionnaire, pas d’abonnement obligatoire',
                      'Ce que rapportent les formations revient aux actions de terrain',
                      'Un don ouvre droit à un reçu fiscal',
                    ].map((p) => (
                      <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Trois portes, du plus léger au plus engageant : on regarde,
                    on adhère, on rejoint. */}
                <div className="grid gap-3">
                  {[
                    {
                      icone: BookOpen,
                      titre: 'Découvrir ADéPA',
                      texte: 'Son histoire, ses actions, ce qu’elle défend.',
                      href: 'https://adepa77.fr/notre-histoire/',
                    },
                    {
                      icone: HeartHandshake,
                      titre: 'Devenir adhérent',
                      texte: 'Faire partie de l’aventure et soutenir ce qui se construit ici.',
                      href: 'https://adepa77.fr/devenir-adherent/',
                    },
                    {
                      icone: Users,
                      titre: 'Rejoindre l’équipe',
                      texte: 'Bénévole, intervenant ou formateur, il y a de la place.',
                      href: 'https://adepa77.fr/rejoignez-nous/',
                    },
                  ].map((porte) => {
                    const Icone = porte.icone;
                    return (
                      <a
                        key={porte.titre}
                        href={porte.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-4 rounded-2xl border border-border bg-background p-5 no-underline transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
                      >
                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                          <Icone className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold text-foreground">{porte.titre}</span>
                          <span className="mt-0.5 block text-sm text-muted-foreground">
                            {porte.texte}
                          </span>
                        </span>
                        <ArrowRight className="mt-1 size-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ═══════════════════════════════ 9. OUVRIR UN COMPTE ════════════════ */}
        <section className="section">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bloc-nuit bg-[hsl(222,21%,15%)] px-6 py-16 text-center text-foreground shadow-card ring-1 ring-border md:px-16">
              <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
              <div
                className="absolute -right-16 -top-16 size-64 rounded-full bg-secondary/20 blur-3xl"
                aria-hidden
              />
              <div className="relative mx-auto max-w-2xl">
                {/* Il salue : c'est la dernière chose que voit le visiteur
                    avant de décider, et un bloc noir de texte centré ne
                    donnait envie à personne. */}
                <Mascotte className="mx-auto mb-2 w-32 md:w-40" stylo={false} />
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-balance">
                  Ouvrez un compte, regardez, décidez ensuite
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Gratuit, sans engagement, sans carte bancaire.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/register">
                      Créer un compte
                      <ArrowRight />
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-border bg-transparent text-foreground hover:bg-accent"
                  >
                    <Link href="/login">J’ai déjà un compte</Link>
                  </Button>
                </div>
                <p className="mt-6 text-sm text-muted-foreground">
                  Une question avant&nbsp;?{' '}
                  <Link
                    href="/contact"
                    className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
                  >
                    Écrivez-nous ou demandez le catalogue
                  </Link>
                  .
                </p>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
      <ChatBot mode="public" />
      <RetourHaut />
    </div>
  );
}
