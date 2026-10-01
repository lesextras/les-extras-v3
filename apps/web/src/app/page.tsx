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
// c'est la phrase la plus simple : un réseau d'intervenants pour des renforts
// et des ateliers, et un seul logiciel pour tout gérer.
//
// L'ordre retenu, et rien d'autre n'a changé — charte, couleurs, animations et
// composants sont ceux du site :
//   1. le héros : les usages et le logiciel, dès le titre ;
//   2. les situations (renfort, atelier, écrit) ;
//   3. l'aiguillage, deux portes ;
//   4. le tout-en-un : il diffuse, il formalise, il vérifie, il compte ;
//   5. le catalogue d'ateliers, puis le centre de formation ADéPA ;
//   6. LEX ;
//   7. le prix, en une ligne ;
//   8. ouvrir un compte.
//
// ─────────────────────────────────────────────────────────────────────────────
// ⚠⚠ AUDIT DU 28/09/2026 : SIX SECTIONS AU PLUS, UN SEUL BLOC LEX.
//
// Mesuré avant : dix sections (héros compris, pied de page non compté),
// treize écrans sur ordinateur, vingt et un sur téléphone, LEX présenté deux
// fois. Stratégie décidée par Siham : Les Extras est une PLACE DE MARCHÉ ;
// RenforTeam, « la team d'éducateurs en renfort », en est le cœur, les
// ateliers le deuxième rayon, LEX un outil, les formations vivent sur
// adepa77.fr. On a retiré, sans rien réécrire, le tout-en-un, la section LEX,
// les tarifs et le bloc ADéPA. L'ordre est désormais :
//   1. le héros ;
//   2. les situations (RenforTeam, ateliers, LEX : le seul bloc LEX) ;
//   3. l'aiguillage, deux portes ;
//   4. le catalogue d'ateliers ;
//   5. le centre de formation ADéPA (le seul bloc formation) ;
//   6. ouvrir un compte.
// (`DeuxRenforts` ne s'affiche qu'en offre complète, qui n'est pas en ligne.)
//
// RIEN N'EST SUPPRIMÉ, tout est déplacé :
//   • la barre de recherche descend sur /ateliers, qui a déjà la sienne ;
//   • « un seul formulaire » et « l'aperçu du produit » partent sur
//     /renforteam, la page qui raconte le renfort en détail ;
//   • « recevoir le catalogue » et « nous écrire » partent sur /contact.
// Aucun lien de l'ancienne page ne disparaît sans destination.
//
// ─────────────────────────────────────────────────────────────────────────────
// ⚠⚠ LES FORMATIONS ONT QUITTÉ LES EXTRAS LE 28/09/2026 (décision de Siham).
//
// adepa77.fr est désormais LE site du centre de formation ADéPA. Sur cette
// page : plus de rayon « Formations » dans le catalogue, plus de situation
// « Formations », plus de carte ni de puce de tarif « formation ». Il reste UN
// bloc, `CentreFormationAdepa`, posé juste après le catalogue d'ateliers (là
// où était le rayon), qui présente les parcours gratuits et renvoie vers
// adepa77.fr. Ne pas en rajouter un second.
export const revalidate = 300;

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Sparkles,
  FileCheck,
  Euro,
  ShieldCheck,
  Video,
  Handshake,
  HeartHandshake,
} from 'lucide-react';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Button } from '@/components/ui/button';
import { fetchPublic } from './_shared/server';
// Les visuels de la médiathèque WordPress passent par `lib/media.ts` : ils
// ont déjà déménagé deux fois, et les URL écrites en dur sont celles qui
// survivent au déménagement puis cassent seules.
import { premierVisuel } from '@/lib/media';
import { renfortSalarieVisible, visioconsultationVisible } from '@/lib/offre';
import { type OfferCard } from './_shared/OfferCarousel';
import { CatalogueOnglets } from './_shared/CatalogueOnglets';
import { CentreFormationAdepa } from './_shared/CentreFormationAdepa';
import { BanqueOutils } from './_shared/BanqueOutils';
import { Reveal } from './_shared/Reveal';
import { ChatBot } from './_shared/ChatBot';
import { RetourHaut } from './_shared/RetourHaut';
import { DeuxPortes } from './_shared/DeuxPortes';
import { DeuxRenforts } from './_shared/DeuxRenforts';
import { QuatreSituations } from './_shared/QuatreSituations';
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
        alt: 'LES EXTRAS, ateliers éducatifs, renfort d’équipe et assistant d’écriture pour le médico-social',
      },
    ],
  },
};

// ─────────────────────────────────── ce qui remplace les trois usages
//
// ⚠ `USAGES` A ÉTÉ RETIRÉ LE 21/09/2026, avec la section qui l'affichait. Les
// trois cartes énuméraient les offres ; elles sont remplacées par
// `QuatreSituations`, qui ouvre chaque service sur le problème qu'il résout et
// donne enfin une section à RenforTeam et à LEX. Ne pas le rétablir sans
// relire le commentaire de la section 2 : on retomberait sur deux inventaires
// des mêmes offres à trois écrans d'écart.

// ⚠ `TOUT_EN_UN`, `CARTE_VISIO` ET `BANDEAU` ONT ÉTÉ RETIRÉS LE 28/09/2026,
// avec la section « Le fil commun » qui les affichait (voir le commentaire
// posé à sa place, plus bas). La carte « Il trouve » y promettait
// ergothérapeute, psychomotricienne et orthophoniste : RenforTeam est
// désormais la team d'éducateurs en renfort, sans métier paramédical.

// ────────────────────────────────────────────────────────────── les tarifs
//
// UNE COLONNE PAR PRIX.
//
// Le prix tenait dans une seule carte avec trois lignes en petit corps : de
// loin, la page disait « un tarif », alors qu'il y en avait plusieurs et qu'ils
// ne se ressemblaient pas. Des colonnes de même largeur, chacune avec SON prix
// en grand, c'est ce qui se lit d'un coup d'œil et ce qu'on va comparer.
//
// ⚠ LA COLONNE « Formations Qualiopi » ET LA PUCE « Formations : commission
// sur devis » ONT ÉTÉ RETIRÉES LE 28/09/2026 : les formations ne sont plus un
// service de Les Extras (voir l'en-tête du fichier). Restent deux colonnes.
//
// ⚠⚠ CETTE LISTE N'EST PLUS AFFICHÉE DEPUIS LE 21/09/2026. Les prix ont quitté
// l'accueil (décision de Siham), et la section #tarifs qui renvoyait vers
// /frais-de-service a elle-même été retirée le 28/09/2026. Elle est
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
     * Les ateliers, eux, restent à 0 % : on y réserve en direct, l'intervenant
     * facture l'établissement, l'association ne s'y interpose pas.
     *
     * Les formations (commission sur devis, 24/09/2026) ont quitté Les
     * Extras le 28/09/2026 : deux régimes, deux lignes.
     *
     * ⚠ 15 %, ARRÊTÉ LE 21/09/2026. Le taux et sa justification sont dans
     * `lib/commission.ts` — relevé des grilles publiques compris. Ne pas le
     * changer ici seul : il est aussi sur /frais-de-service, /renforteam et
     * dans les CGU.
     */
    points: [
      'Publication, diffusion et relances',
      'Devis et feuille de mission édités',
      'Ateliers : 0 % de commission',
      'RenforTeam : 15 % de frais de gestion, ajoutés au tarif. L’intervenant touche 100 %',
    ],
    lien: { libelle: 'Publier un besoin', href: '/renforteam' },
    trait: 'bg-primary',
    teinte: 'text-primary',
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

export default async function LandingPage() {
  // Plus de lecture de session ici : l'en-tête interroge `/api/visiteur`
  // depuis le navigateur. Voir `app/(public)/layout.tsx`.
  //
  // Marketplace visible sans compte : la sélection, directement en accueil.
  // ⚠ `/public/highlights` renvoie AUSSI une liste `formations` : elle n'est
  // plus lue (28/09/2026, les formations vivent sur adepa77.fr).
  const { data: unes, error: erreurUnes } = await fetchPublic<{
    ateliers: OfferCard[];
  }>('/public/highlights');

  // DIX CARTES.
  //
  // Les rayons ne sont plus des sections empilées mais un carrousel : il
  // défile latéralement. Le poids de la page ne dépend donc plus du nombre de
  // fiches, et une vitrine à trois cartes donnait à croire que le catalogue
  // était vide. Dix, c'est ce que les répertoires renvoient et ce qu'un
  // carrousel porte sans peser.
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

  /**
   * UN SEUL RAYON DEPUIS LE 28/09/2026 : les ateliers.
   *
   * L'accueil en a porté trois (« Ateliers », « Formations Qualiopi »,
   * « Parcours gratuits »), puis deux le 16/09. Le rayon « Formations » est
   * parti avec le service : les parcours gratuits sont présentés par
   * `CentreFormationAdepa`, juste sous le catalogue. `CatalogueOnglets`
   * s'affiche sans barre d'onglets quand il n'a qu'un rayon.
   */
  const rayons = [
    {
      cle: 'ateliers',
      libelle: 'Ateliers',
      items: ateliersUne,
      basePath: '/ateliers',
      lien: { libelle: 'Tout le catalogue', href: '/ateliers' },
    },
  ];

  return (
    <div className="theme-sombre bg-ivoire-degrade flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* ═══════════ 1. HÉROS : les usages et le logiciel, dès le titre */}
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
              {/* ═══ LE TITRE, ET LES QUATRE VERSIONS QU'IL A EUES ═══════════
                  ⚠⚠ ON EST REVENU À LA VERSION 2. NE PAS REFAIRE LE DÉTOUR.

                  1. « Les interventions portées par ceux qui font le terrain »
                     disait QUI, pas QUOI : une signature, pas une promesse.
                  2. « Renforts, ateliers, formations : le bon réseau dans un
                     seul logiciel » — il nomme la catégorie et le produit.
                     (Depuis le 28/09/2026 : « Renforts et ateliers », les
                     formations ayant quitté Les Extras pour adepa77.fr.)
                  3. Le 21/09, je l'ai remplacé par une phrase de situation
                     (« Vous cherchez depuis des semaines… ») pour aligner le
                     premier écran sur le reste de la page, refaite en
                     « problème d'abord ». Siham l'a refusé, et elle avait
                     raison : un héros raconte ce que le produit EST, la page
                     raconte ce qu'il RÉSOUT. C'est la division du travail
                     normale, pas une incohérence.
                  4. Retour au n° 2, enrichi du seul élément qui lui manquait
                     vraiment : les établissements nommés.
                  5. 01/10/2026, choix de Siham : « Ateliers, Renforts
                     éducatifs. Tout commence par votre besoin. »
                     Le héros part du besoin de la personne (enfant, proche,
                     soi-même, structure). Pas de deux-points : un point.
                     Ne pas écrire « à domicile » ni « crédit d'impôt » tant
                     que l'agrément services à la personne n'est pas obtenu.

                  ⚠ CE CHOIX EST ADOSSÉ AUX CONCURRENTS, RELEVÉS LE 21/09 :
                  Hublo joue l'émotion (« Préserver ce qui vous a fait choisir
                  votre métier ») parce qu'il est connu ; Brigad joue le slogan
                  mais s'appuie sur « 12 000 établissements » en sous-titre ;
                  NotaSuivi — le concurrent direct, de notre taille — est le
                  plus concret des trois et nomme les sigles DANS son titre
                  (« IME · ITEP · SESSAD · MECS · ESAT »). Sans notoriété ni
                  chiffres à afficher, c'est la voie concrète qui paie. */}
              <h1 className="animate-fade-in-up stagger-1 mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl xl:text-6xl">
                Ateliers, Renforts éducatifs.{' '}
                <span className="text-secondary">Tout commence par votre besoin.</span>
              </h1>
              {/* LE SOUS-TITRE NOMME LES PUBLICS, ce qui manquait au titre n° 2
                  et ce que NotaSuivi fait mieux que nous depuis le début : les
                  sigles sont exactement ce que les gens tapent, et c'est à eux
                  qu'un directeur se reconnaît.

                  ⚠ IL NE RÉPÈTE PAS LES PASTILLES qui le suivent (renforts
                  vérifiés, devis avant intervention). Depuis le 01/10/2026,
                  aucun prix ni délai sur l'accueil.

                  ⚠⚠ ET SURTOUT : PAS DE « MISE EN RELATION GRATUITE » TOUT
                  COURT. Depuis le 21/09, RenforTeam prend 15 % de frais de
                  gestion ; seuls les ateliers sont à 0 %.
                  Une gratuité annoncée sans son périmètre est démentie deux
                  écrans plus bas, sur la page qui vend le renfort — c'est la
                  pastille « 0 % sur les ateliers » qui porte la nuance, et
                  elle doit rester ainsi libellée.

                  ⚠ « devis, feuille de mission, facture » et pas « contrat » :
                  le logiciel édite ces trois-là. Le contrat de travail reste
                  rédigé par l'établissement, et l'écrire autrement promet de
                  l'intérim qu'on ne fait pas. La même phrase est dans
                  `QuatreSituations` : les deux bougent ensemble. */}
              <p className="animate-fade-in-up stagger-2 mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Pour votre enfant, un proche, vous-même ou votre structure (IME, SESSAD, MECS,
                école…). Décrivez ce que vous recherchez, choisissez votre intervenant et retrouvez
                devis, feuille de mission et facture au même endroit.
              </p>

              {/* LA BARRE DE RECHERCHE A QUITTÉ LE HÉROS.
                  Mise ici, elle rangeait Les Extras dans la catégorie
                  « annuaire d'ateliers » : le geste le moins représentatif de
                  ce que le logiciel sait faire, proposé en premier. Elle a sa
                  place — sur /ateliers, qui a déjà la sienne. À sa place, les deux gestes qui comptent, un par
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
                    validation n'existe. Les repères ci-dessous sont
                    mesurables et tenus.
                    ⚠ La pastille « Qualiopi · finançable OPCO » est retirée le
                    28/09/2026 : elle parlait des formations, qui ont quitté
                    Les Extras. Le centre de formation ADéPA a son bloc plus
                    bas (`CentreFormationAdepa`), et un seul. */}
                {/* ⚠⚠ PLUS AUCUN CHIFFRE NI PRIX ICI (01/10/2026, décision de Siham,
                    « les autres ne mettent pas leur prix », méthode Airbnb).
                    « 0 % sur les ateliers » et « 48 h pour un devis » sont
                    retirés : l'accueil donne envie et rassure, le prix se lit
                    sur la fiche et, frais compris, au moment du devis.
                    « Vérifiés » est vrai pour RenforTeam (29/09/2026). */}
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-primary" />
                  Renforts <strong className="font-semibold text-foreground">vérifiés</strong> par l’association
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileCheck className="size-4 text-primary" />
                  <strong className="font-semibold text-foreground">Devis</strong> avant toute intervention
                </span>
                {/* La visioconférence mise en avant (01/10/2026, demande de
                    Siham), pour les renforts comme pour les ateliers. ⚠ Elle
                    ne s'affiche que si la visio est en service. */}
                {visioconsultationVisible() ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Video className="size-4 text-primary" />
                    Sur place ou en <strong className="font-semibold text-foreground">visioconférence</strong>
                  </span>
                ) : null}
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
                    {/* « Devis sous 48 h » retiré le 01/10/2026 : pas de délai
                        ni de prix sur l'accueil (méthode Airbnb). */}
                    <p className="text-sm font-semibold text-foreground">Devis édité ici</p>
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
                    <HeartHandshake className="size-5" />
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

        {/* ═══ 2. LES SITUATIONS — le fil de la page (trois depuis le 28/09) ═

            ⚠ CETTE SECTION A REMPLACÉ « LES TROIS USAGES » LE 21/09/2026, ET IL
            NE FAUT PAS REMETTRE L'ANCIENNE. Trois cartes annonçaient « Le réseau
            répond aux trois », puis la section 3 annonçait « Le travail
            administratif que vous ne ferez plus » : deux inventaires des mêmes
            offres, l'un en produits, l'autre en fonctions du logiciel. Le
            visiteur lisait donc deux fois la même liste et aucune histoire.

            Trois défauts que le remplacement corrige, et qui étaient réels :
              1. RENFORTEAM N'AVAIT PAS DE SECTION. Il était une carte parmi
                 trois, et la seule section qui l'expliquait (`DeuxRenforts`)
                 est masquée depuis le recentrage du 19/09.
              2. LEX NON PLUS, et il n'avait même pas de page — `/lex` a été
                 créée dans le même mouvement.
              3. LA CARTE « Renfort » PROMETTAIT « en présentiel ou en
                 visioconsultation » alors que `/visio/:jeton` redirige. La
                 mention est désormais conditionnée à la bascule du service.

            Chaque section s'ouvre sur LA SITUATION, jamais sur le produit.
            C'est la règle d'écriture, et elle est documentée dans le composant. */}
        <QuatreSituations />

        {/* ═══════════════════════════ 3. L'AIGUILLAGE, DEUX PORTES ═══════════ */}
        <DeuxPortes />

        {/* ═══ LE RENFORT, EN DEUX (offre complète seulement) ═══════════════
            ⚠ 28/09/2026 : en offre complète, ce serait la SEPTIÈME section de
            l'accueil. Le jour où la variable repasse à « complete », en
            retirer une autre pour tenir la règle des six sections.

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

        {/* ═══════════════ 4. LE CATALOGUE, EN UN SEUL BLOC À ONGLETS ═════════ */}
        <section id="marketplace" className="scroll-mt-24">
          <div className="section">
            {/* ⚠ EN-TÊTE CENTRÉ (demande de Siham, 21/09/2026), et c'est le
                SEUL de l'accueil qui l'est. Ce n'est pas une inconséquence :
                tous les autres titres ouvrent une section qui se LIT — un
                texte, une image à côté —, et un titre centré au-dessus d'un
                paragraphe aligné à gauche casse la colonne de lecture. Celui-ci
                ouvre une GRILLE de cartes, symétrique et centrée sous lui : un
                titre poussé à gauche y pendait dans le vide.

                ⚠ `mx-auto` SANS `text-center` NE CENTRE RIEN d'autre que la
                boîte. Il faut les deux, plus `justify-center` sur la rangée des
                deux repères — c'est un conteneur flex, et l'alignement du texte
                ne descend pas dedans. */}
            <Reveal className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">Sans compte, sans engagement</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl text-balance">
                Le catalogue, en un seul endroit
              </h2>
              {/* Deux repères au lieu d'une phrase : ce sont les deux seules
                  choses à retenir avant d'ouvrir le catalogue. */}
              <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-base text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <Handshake className="size-5 text-primary" aria-hidden />
                  {/* ⚠ « Vous réservez directement » était faux (audit du
                      28/09/2026) : le paiement en ligne n'est actif sur aucune
                      fiche, et « Réserver » menait à la connexion. Le devis
                      sans compte, lui, existe sur chaque fiche. */}
                  Vous demandez un devis sans compte
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
            {erreurUnes && ateliersUne.length === 0 ? (
              <Reveal className="mt-10 rounded-2xl border border-border/60 bg-card/40 p-8 text-center">
                <p className="text-lg font-semibold text-foreground">
                  Notre sélection ne s’affiche pas en ce moment.
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  C’est un incident passager de notre côté, pas un catalogue vide : les ateliers
                  sont bien en ligne.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button asChild>
                    <Link href="/ateliers">
                      Voir les ateliers <ArrowRight />
                    </Link>
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

        {/* ═══ 5. LA BANQUE D'OUTILS GRATUITS (01/10/2026, demande de Siham) ═══
            Juste après le catalogue : ce qu'on télécharge sans compte. Voir
            l'en-tête du composant. */}
        <BanqueOutils />

        {/* ═══ 6. LE CENTRE DE FORMATION ADÉPA — le seul bloc formation ═══════
            Posé à la place de l'ancien rayon « Formations » du catalogue :
            juste après les ateliers, avant LEX. Voir l'en-tête du composant. */}
        <CentreFormationAdepa />

        {/*
          ⚠⚠ QUATRE SECTIONS RETIRÉES LE 28/09/2026 (audit, décision de Siham :
          « Accueil ramené à six sections, un seul bloc LEX »). L'accueil
          faisait treize écrans sur ordinateur et vingt et un sur téléphone, et
          présentait LEX deux fois. On a RETIRÉ, sans rien réécrire :
            • « Le fil commun / Trois réponses, un seul logiciel dessous » et
              ses cartes « Il diffuse, il formalise… » : un second inventaire
              des mêmes offres, et un positionnement « logiciel » quand Les
              Extras est une PLACE DE MARCHÉ. Sa carte « Il trouve » promettait
              en outre des métiers paramédicaux que RenforTeam ne porte plus ;
            • la section LEX (`OffreLex`) : LEX est un outil, et il a déjà sa
              situation dans `QuatreSituations`, qui mène à /lex. `OffreLex`
              vit sur /lex, sa page ;
            • « Tarifs » : un titre et un bouton vers /frais-de-service, page
              qui reste à un clic depuis le pied de page (« Frais de service ») ;
            • « Derrière le réseau, il y a ADéPA » : l'éditeur est nommé dans le
              pied de page, et son histoire sur /notre-histoire.
          ⚠ NE PAS LES REMETTRE sans retirer autant de sections ailleurs : six
          au plus, héros compris, pied de page non compté. Exception décidée
          par Siham le 01/10/2026 : la banque d'outils gratuits (`BanqueOutils`)
          porte le compte à SEPT. Ne pas en ajouter une huitième.
        */}
        {/* ═══════════════════════════════ 7. OUVRIR UN COMPTE ════════════════ */}
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
