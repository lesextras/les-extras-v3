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
//   6. LEX et le GAP ;
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
} from 'lucide-react';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Button } from '@/components/ui/button';
import { fetchPublic } from './_shared/server';
// Les visuels de la médiathèque WordPress passent par `wp()` : ils ont déjà
// déménagé deux fois, et les URL écrites en dur sont celles qui survivent au
// déménagement puis cassent seules. Voir `lib/media.ts`.
import { wp } from '@/lib/media';
import { OfferCarousel, type OfferCard } from './_shared/OfferCarousel';
import { CatalogueOnglets } from './_shared/CatalogueOnglets';
import { estMaison } from '@/lib/mini-formations';
import { Reveal } from './_shared/Reveal';
import { ChatBot } from './_shared/ChatBot';
import { OffreLex } from './_shared/OffreLex';
import { IllustrationReseau } from './_shared/Illustrations';
import { BlocGap } from './_shared/BlocGap';
import { RetourHaut } from './_shared/RetourHaut';
import { DeuxPortes } from './_shared/DeuxPortes';
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
    titre: 'Absorber une absence',
    texte:
      'Éducateur, moniteur, AES, psychologue.',
    points: ['Diffusion en cascade', 'Feuille de mission éditée', 'Heures pointées, export paie'],
    href: '/renforteam',
    action: 'Comprendre le renfort',
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
];

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
// ⚠ AUCUN CHIFFRE N'EST INVENTÉ ICI : les trois montants sont ceux qui
// figuraient déjà sur la page. Un prix affiché est un engagement.
const TARIFS = [
  {
    kicker: 'Renforts et ateliers',
    prix: '0 €',
    precision: 'gratuit pour toujours',
    points: [
      'Publication, diffusion et relances',
      'Devis et feuille de mission édités',
      '0 % de commission : l’intervenant touche son tarif en entier',
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

  // TROIS CARTES PAR RAYON, PAS DIX ET SEPT.
  //
  // La vitrine affichait dix ateliers, sept mini-formations et trois formations
  // en intra : vingt cartes produit, soit 44 % du poids de la page. Une page
  // d'accueil qui déroule l'inventaire devient une page de catégorie — or son
  // travail est de qualifier et d'orienter, pas de lister. Le catalogue a ses
  // propres pages, et chaque rayon porte son lien vers elles.
  const VITRINE = 3;

  // ⚠ L'ORDRE VIENT DE `featured`, PAS DES VUES. `/public/highlights` trie par
  // `featured` puis par nombre de vues. Les trois fiches mises en avant sont
  // posées par `seed-fiches-ateliers.js` (MISE_EN_AVANT) et se changent depuis
  // l'administration.
  const ateliersUne = (unes?.ateliers ?? []).slice(0, VITRINE);

  // Le même partage que sur /formations : les mini-formations gratuites de la
  // maison d'un côté, les formations Qualiopi vendues en intra de l'autre. Une
  // mini-formation gratuite et une formation en intra ne s'adressent pas aux
  // mêmes personnes et n'ont pas le même prix : dans la même ligne, chacune
  // brouillait l'autre. Elles sont maintenant deux onglets.
  const gratuites = (unes?.formations ?? [])
    .filter((f) => f.freeOnline && estMaison(f.account?.name))
    .slice(0, VITRINE);
  const payantes = (unes?.formations ?? [])
    .filter((f) => !(f.freeOnline && estMaison(f.account?.name)))
    .slice(0, VITRINE);

  const rayons = [
    {
      cle: 'ateliers',
      libelle: 'Ateliers',
      items: ateliersUne,
      basePath: '/ateliers',
      lien: { libelle: 'Tout le catalogue', href: '/ateliers' },
    },
    {
      cle: 'qualiopi',
      libelle: 'Formations Qualiopi',
      items: payantes,
      basePath: '/formations',
      lien: { libelle: 'Toutes les formations', href: '/formations' },
    },
    {
      cle: 'gratuits',
      libelle: 'Parcours gratuits',
      items: gratuites,
      basePath: '/formations',
      lien: { libelle: 'Tous les parcours gratuits', href: '/formations' },
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
                <span className="text-secondary">un seul réseau, un seul logiciel.</span>
              </h1>
              {/* TROIS LIGNES DEVENUES UNE. Sous un titre qui dit déjà les
                  trois usages et le logiciel, le paragraphe ne faisait que
                  répéter — et les trois repères chiffrés, juste dessous,
                  disaient le reste mieux que lui. */}
              <p className="animate-fade-in-up stagger-2 mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Vous publiez votre besoin, un intervenant du réseau répond. Devis et feuille de
                mission suivent, sans commission.
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
                  <strong className="font-semibold text-foreground">0 %</strong> de commission
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
                    <p className="text-sm font-semibold text-foreground">0 % de commission</p>
                    <p className="text-xs text-muted-foreground">et aucun frais de recrutement</p>
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

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TOUT_EN_UN.map((t, i) => {
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

        {/* ═══════════════ 5. LE CATALOGUE, EN UN SEUL BLOC À ONGLETS ═════════ */}
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
                  Aucune commission
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

        {/* ═══════════════════════════════ 6. LEX ET LE GAP ═══════════════════
            L'essai, le détail de l'offre puis le GAP se suivaient en trois
            sections : trois titres, trois respirations, trois fois la même
            promesse. Tout tient ici, sur la bande claire qui sert déjà de
            repère au milieu du fond charbon. */}
        <section
          id="lex"
          className="scroll-mt-24 border-y border-border bg-gradient-to-b from-primary/[0.07] via-background to-background"
        >
          <div className="section">
            <Reveal className="flex max-w-3xl items-start gap-5">
              {/* Le personnage tient le stylo : c'est la section des écrits. */}
              <Mascotte className="hidden w-24 shrink-0 sm:block" />
              <div>
              <span className="eyebrow">Pour celles et ceux qui font le terrain</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
                Le métier ne s’arrête pas à la fin de la journée
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                LEX pour les écrits, le GAP pour la pratique.
              </p>
              </div>
            </Reveal>

            <div id="offre-lex" className="mt-12 scroll-mt-24">
              <Reveal>
                <OffreLex />
              </Reveal>
            </div>

            <div id="gap" className="mt-14 scroll-mt-24">
              <Reveal>
                <BlocGap illustration={<IllustrationReseau className="w-full max-w-sm" />} />
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
        <section id="tarifs" className="scroll-mt-24 bg-nacre">
          <div className="section">
            <Reveal className="max-w-3xl">
              <span className="eyebrow">Tarifs</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
                La mise en relation est gratuite. Des deux côtés.
              </h2>
            </Reveal>

            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {TARIFS.map((tarif, i) => (
                <Reveal key={tarif.kicker} delay={i * 110} className="h-full">
                  <div className="reflet group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl md:p-7">
                    <span
                      className={`animate-trait absolute left-0 top-6 bottom-6 w-[3px] rounded-full ${tarif.trait}`}
                      aria-hidden
                    />
                    <div className="pl-3">
                      <span className={`text-xs font-bold uppercase tracking-[0.14em] ${tarif.teinte}`}>
                        {tarif.kicker}
                      </span>
                      <p className="mt-3 text-4xl font-bold tracking-tight text-foreground">
                        {tarif.prix}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{tarif.precision}</p>
                      <ul className="mt-5 space-y-2">
                        {tarif.points.map((p) => (
                          <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                            <Check className={`mt-0.5 size-4 shrink-0 ${tarif.teinte}`} aria-hidden />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={tarif.lien.href}
                        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                      >
                        {tarif.lien.libelle}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={340}>
              <p className="mt-6 text-sm text-muted-foreground">
                Montants HT. L’association ne prélève aucune commission sur les renforts et les
                ateliers : vous payez l’intervenant, à son tarif.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ═════════════════════════ 8. L'ASSOCIATION QUI PORTE TOUT ÇA ══════
            Les Extras n'est pas une entreprise : c'est le dispositif d'une
            association. C'est ce qui explique les 0 % de commission, et c'est
            ce que la page ne disait qu'en petit, dans une ligne de pied de
            page. Une association vit de ses adhérents et de ses bénévoles :
            si on ne le demande jamais, personne ne le propose. */}
        <section id="adepa" className="scroll-mt-24 section">
          <Reveal>
            <div className="reflet relative overflow-hidden rounded-3xl border border-border bg-nacre p-7 shadow-card md:p-12">
              <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                <div>
                  <span className="eyebrow">
                    <HeartHandshake className="size-3.5" />
                    ADéPA porte Les Extras
                  </span>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
                    Derrière le réseau, il y a ADéPA.
                  </h2>
                  <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                    Association éducative de Melun, en Seine-et-Marne. Elle agit pour l’insertion
                    des enfants, des adolescents et des familles par l’éducation, l’animation et la
                    prévention. Les Extras est l’un de ses dispositifs, et c’est ce qui explique les
                    0 % de commission.
                  </p>
                  <ul className="mt-6 space-y-2.5">
                    {[
                      'Pas d’actionnaire, pas d’abonnement',
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
