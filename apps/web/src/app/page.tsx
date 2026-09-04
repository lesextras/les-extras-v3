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
// « sélection », et la première régénération (le healthcheck Docker frappe `/`
// toutes les 30 s) la complète.
export const revalidate = 300;

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FileCheck,
  Clock,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Button } from '@/components/ui/button';
import { fetchPublic } from './_shared/server';
// Les visuels de la médiathèque WordPress passent par `wp()` : ils ont déjà
// déménagé deux fois, et les URL écrites en dur sont celles qui survivent au
// déménagement puis cassent seules. Voir `lib/media.ts`.
import { wp } from '@/lib/media';
import type { CatalogItem } from './(public)/_catalog';
import { OfferCarousel, type OfferCard } from './_shared/OfferCarousel';
import { HeroSearch } from './_shared/HeroSearch';
import { estMaison } from '@/lib/mini-formations';
import { Reveal } from './_shared/Reveal';
import { ChatBot } from './_shared/ChatBot';
import { CartesContact } from './_shared/CartesContact';
import { OffreLex } from './_shared/OffreLex';
import { IllustrationReseau } from "./_shared/Illustrations";
import { BlocGap } from './_shared/BlocGap';
import { RetourHaut } from './_shared/RetourHaut';
import { DeuxPortes } from './_shared/DeuxPortes';
import { UnSeulFormulaire } from './_shared/UnSeulFormulaire';
import { ApercuProduit } from './_shared/ApercuProduit';

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

export default async function LandingPage() {
  // Plus de lecture de session ici : l'en-tête interroge `/api/visiteur`
  // depuis le navigateur. Voir `app/(public)/layout.tsx`.
  // Compteur réel du catalogue public (affiché dans le hero).
  const { data: featured } = await fetchPublic<{ items: CatalogItem[]; total?: number }>(
    '/public/catalog?type=all&take=3',
  );
  const catalogueTotal = featured?.total ?? featured?.items?.length ?? 0;

  // Nombre d'ATELIERS seuls — la page annonçait « Quinze médiations » en dur
  // alors que le catalogue en compte dix, le reste étant des formations. Un
  // chiffre faux sur la première page est le plus cher de tous : il se
  // vérifie en un clic, et c'est le clic suivant.
  const { data: catalogueAteliers } = await fetchPublic<{ total?: number; items?: CatalogItem[] }>(
    '/public/catalog?type=atelier&take=1',
  );
  const ateliersTotal = catalogueAteliers?.total ?? 0;

  // Marketplace visible sans compte : les mieux notés, directement en accueil.
  const { data: unes, error: erreurUnes } = await fetchPublic<{
    ateliers: OfferCard[];
    formations: OfferCard[];
  }>('/public/highlights');

  // TROIS CARTES PAR RAYON, PAS DIX ET SEPT.
  //
  // La vitrine affichait dix ateliers, sept mini-formations et trois formations
  // en intra : vingt cartes produit, soit 44 % du poids de la page (944 mots sur
  // 2 151). Une page d'accueil qui déroule l'inventaire devient une page de
  // catégorie — or son travail est de qualifier et d'orienter, pas de lister. Le
  // catalogue a ses propres pages, et chaque rayon porte déjà son lien vers
  // elles.
  //
  // Trois : c'est ce qui tient sur une ligne sans défilement à partir du grand
  // écran, et ce qui se lit d'un coup d'œil sur téléphone.
  const VITRINE = 3;

  // ⚠ L'ORDRE VIENT DE `featured`, PAS DES VUES. `/public/highlights` trie par
  // `featured` puis par nombre de vues. Sans aucune fiche mise en avant, la
  // première carte de la vitrine était RE-DESSINE MOI — 243 vues, et une
  // description qui annonce « un dispositif événement 2025, disponible
  // uniquement durant l'été 2025 ». Le titre de la section promet « notre
  // sélection » : il fallait qu'une sélection existe vraiment. Les trois fiches
  // mises en avant sont posées par `seed-fiches-ateliers.js` (MISE_EN_AVANT) et
  // se changent depuis l'administration.
  const ateliersUne = (unes?.ateliers ?? []).slice(0, VITRINE);

  // Le même partage que sur /formations : les mini-formations gratuites de la
  // maison d'un côté, les formations Qualiopi vendues en intra de l'autre.
  // Voir le commentaire des deux blocs, plus bas.
  const gratuites = (unes?.formations ?? [])
    .filter((f) => f.freeOnline && estMaison(f.account?.name))
    .slice(0, VITRINE);
  const payantes = (unes?.formations ?? [])
    .filter((f) => !(f.freeOnline && estMaison(f.account?.name)))
    .slice(0, VITRINE);


  return (
    <div className="theme-sombre flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* ============ HERO : scindé, style grande plateforme ============ */}
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
                Le dispositif de l’association ADéPA
              </span>
              {/* Le titre nomme le BESOIN, pas la valeur. « Des interventions à
                  fort impact » ne renseigne pas un directeur qui balaie la page
                  en trois secondes : c'est le sous-titre qui faisait tout le
                  travail, deux fois plus petit. On a inversé les deux.
                  Le titre dit maintenant ce en quoi la maison croit, et non
                  qui elle sert : ce sont les professionnels de terrain qui
                  portent les interventions. Le sous-titre, lui, garde le
                  concret : ce qu'on vient chercher, et à quel prix. */}
              <h1 className="animate-fade-in-up stagger-1 mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl xl:text-6xl">
                Les interventions portées{' '}
                <span className="text-secondary">par ceux qui font le terrain.</span>
              </h1>
              <p className="animate-fade-in-up stagger-2 mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Un remplacement à couvrir, un atelier à programmer, une formation pour l’équipe.
                La mise en relation est gratuite et sans commission.
              </p>

              <div className="animate-fade-in-up stagger-3 mt-7 max-w-xl">
                <HeroSearch />
              </div>

              {/* Recherches populaires : vraies catégories du catalogue */}
              <div className="animate-fade-in-up stagger-4 mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Populaire :</span>
                {['Psycho-boxe', 'Slam', 'Théâtre', 'Musicothérapie'].map((c) => (
                  <Link
                    key={c}
                    href={`/ateliers?search=${encodeURIComponent(c.toLowerCase())}`}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Search className="size-3" />
                    {c}
                  </Link>
                ))}
              </div>


              <div className="animate-fade-in-up stagger-4 mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {/* « INTERVENANTS VÉRIFIÉS » N'ÉTAIT PAS VRAI.
                    Aucune étape de validation n'existe : publier une fiche
                    suffit à paraître au catalogue. Ce qui EXISTE, et qui est
                    même le vrai différenciateur face à une plateforme
                    généraliste, c'est le dossier de conformité, identité,
                    diplôme, bulletin n° 3 du casier judiciaire (art. L. 133-6
                    CASF) et coordonnées bancaires, réunis et suivis à
                    échéance. On annonce ça, qui est mesurable. */}
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-primary" />
                  Dossier de conformité par intervenant
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap className="size-4 text-primary" />
                  Qualiopi · finançable OPCO
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-primary" />
                  Devis sous 48 h
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
                    <p className="text-xs text-muted-foreground">contrat et facture automatiques</p>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={320} className="absolute right-5 top-5 z-10">
                <div className="animate-derive-lente flex items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-card backdrop-blur">
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary-soft text-secondary">
                    <GraduationCap className="size-5" />
                  </span>
                  <div>
                    {/* ⚠ ON N'AFFICHE PLUS LA TAILLE DU CATALOGUE ICI.
                        Cet encart portait « {n} interventions au catalogue ».
                        C'était le PREMIER nombre que voyait un visiteur, et
                        dix-sept se lit comme « petit » sur une place de marché.
                        Hublo n'a jamais publié son inventaire : il publie son
                        nombre d'établissements. On publie le chiffre qui est
                        fort : et le nôtre, celui qu'aucun concurrent ne peut
                        écrire, ce sont les zéros : Brigad prend 10 % par
                        mission, Hublo facture 2 000 à 3 000 € HT pour recruter
                        un profil de son vivier.
                        Le compte du catalogue reste affiché sur /ateliers, à sa
                        place : là, il informe au lieu de jauger. */}
                    <p className="text-sm font-semibold text-foreground">0 % de commission</p>
                    <p className="text-xs text-muted-foreground">
                      et aucun frais de recrutement
                    </p>
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
                      établissement breton qui s'inscrit.
                      ⚠ MAIS PLUS « ET BIENTÔT PARTOUT ». Cette fin de phrase
                      annonçait à tout visiteur hors Île-de-France que ce n'était
                      pas encore pour lui, et une promesse d'expansion sans date
                      ne rassure personne : elle avoue seulement qu'on n'y est
                      pas. Le territoire devient un argument : des intervenants
                      qui connaissent les établissements dans lesquels ils
                      interviennent. C'est vrai, et c'est ce qu'on vend. */}
                  <span className="text-xs font-medium text-foreground">
                    Réseau actif en Île-de-France
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============ DOMAINES : cartes photo + texte (style annonce) ============ */}
        <section className="section">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              {/* « Trois portes d'entrée » contredisait, trente lignes plus
                  haut, le « Par où commencer ? » et ses DEUX portes. Deux
                  comptages sur le même écran, et le visiteur ne sait plus
                  lequel lire. Ici on nomme les trois SERVICES, pas des portes. */}
              <span className="eyebrow">Trois services</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Ce que vous trouvez ici
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/ateliers">
                Voir le catalogue <ArrowRight />
              </Link>
            </Button>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                titre: 'Les ateliers de notre réseau',
                texte: 'Médiations clés en main, animées chez vous par un intervenant du réseau.',
                href: '/ateliers',
                image: wp('/wp-content/uploads/2023/02/cerf-volant-game-enfant-400x400.jpg'),
                action: 'Parcourir les ateliers',
              },
              {
                titre: 'Nos formations certifiées Qualiopi',
                texte: 'Montée en compétences des équipes, finançable par votre OPCO.',
                href: '/formations',
                image: wp('/wp-content/uploads/2025/02/lever-vous-400x400.jpeg'),
                action: 'Voir les formations',
              },
              {
                titre: 'Le renfort d’équipe et parental',
                texte: 'Un professionnel disponible vite, pour absorber l’absence.',
                href: '/renforteam',
                image: wp('/wp-content/uploads/2025/02/mineur-protection-de-lenfance.jpg'),
                action: 'Comprendre le renfort',
              },
            ].map((d, i) => (
              <Reveal key={d.titre} delay={i * 110}>
                <Link href={d.href} className="group block">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted">
                    <Image
                      src={d.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
                    {d.titre}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d.texte}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {d.action}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ============ LES DEUX PORTES ============ */}
        <DeuxPortes />

        {/* ============ UN SEUL FORMULAIRE ============
            L’argument central, posé juste après que le visiteur a dit qui il
            est : ce que déclenche une publication, et ce que LEX prend en
            charge de l’autre côté. Chaque promesse correspond à un
            comportement réel du produit. */}
        <UnSeulFormulaire />

        {/* ============ MARKETPLACE EN ACCÈS LIBRE ============ */}
        {(unes?.ateliers?.length ?? 0) > 0 || (unes?.formations?.length ?? 0) > 0 ? (
          <section id="marketplace" className="bg-card">
            <div className="section">
              {/* Ce que la page ne disait nulle part : l’association ne s’intercale
                  pas. On réserve l’intervenant, pas un intermédiaire. */}
              <Reveal className="mx-auto mb-12 max-w-3xl text-center">
                <span className="eyebrow">Sans intermédiaire, sans commission</span>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance md:text-4xl">
                  Ateliers et formations, en direct avec l’intervenant
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  Vous réservez{' '}
                  <strong className="font-semibold text-foreground">
                    directement auprès de l’intervenant
                  </strong>
                  . L’association ne prélève{' '}
                  <strong className="font-semibold text-foreground">aucune commission</strong>.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {['0 % de commission', 'Aucun intermédiaire', 'Devis sous 48 h', 'Association loi 1901'].map(
                    (repere) => (
                      <span
                        key={repere}
                        className="rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground"
                      >
                        {repere}
                      </span>
                    ),
                  )}
                </div>
              </Reveal>

              {/* ⚠ QUAND L'API NE RÉPOND PAS, LA VITRINE DISPARAISSAIT EN SILENCE.
                  Les trois sections produit étaient conditionnées à
                  `length > 0`, et rien ne distinguait « rien à montrer » de
                  « je n'ai pas pu demander ». Un visiteur arrivant pendant un
                  redéploiement : deux à trois minutes, et c'est précisément
                  l'heure où l'on pousse une campagne, voyait une association
                  sans un seul atelier au catalogue. On préfère dire que le
                  chargement a échoué et donner la porte du catalogue :
                  l'erreur avouée coûte infiniment moins cher que le vide. */}
              {erreurUnes && ateliersUne.length === 0 ? (
                <Reveal className="rounded-2xl border border-border/60 bg-card/40 p-8 text-center">
                  <p className="text-lg font-semibold text-foreground">
                    Notre sélection ne s’affiche pas en ce moment.
                  </p>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    C’est un incident passager de notre côté, pas un catalogue vide :
                    les ateliers et les formations sont bien en ligne.
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
              ) : null}

              {ateliersUne.length > 0 ? (
                <div className="space-y-6">
                  <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                      <span className="eyebrow">Sans compte, sans engagement</span>
                      {/* « les mieux notés » sans aucun avis publié minait la
                          confiance : « sélection » dit la même mise en avant,
                          sans promettre une note qui n'existe pas encore. */}
                      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                        Notre sélection d’ateliers
                      </h2>
                    </div>
                    <Button asChild variant="outline">
                      <Link href="/ateliers">
                        Tout le catalogue <ArrowRight />
                      </Link>
                    </Button>
                  </Reveal>
                  <Reveal delay={100}>
                    <OfferCarousel items={ateliersUne} basePath="/ateliers" />
                  </Reveal>
                </div>
              ) : null}

              {/* DEUX LIGNES, PAS UNE.
                  Une mini-formation gratuite et une formation Qualiopi vendue
                  en intra ne s'adressent pas aux mêmes personnes et n'ont pas
                  le même prix. Dans la même ligne, chacune brouillait l'autre :
                  le parent tombait sur « à partir de 1 600 € », le directeur
                  sur « Gratuit ». C'est le même découpage que sur /formations,
                  et il doit le rester. */}
              {gratuites.length > 0 ? (
                <div className="mt-16 space-y-6">
                  <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                      <span className="eyebrow">Conçues et tenues par ADéPA</span>
                      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                        Les mini-formations gratuites
                      </h2>
                      <p className="mt-2 text-muted-foreground">
                        Une compétence par parcours, quatre modules, une fiche A4 à imprimer.
                        Sans carte bancaire.
                      </p>
                    </div>
                    <Button asChild variant="outline">
                      <Link href="/formations">
                        {/* Pas « Voir les {n} parcours » : `highlights` renvoie
                            une SÉLECTION de dix formations, dont sept gratuites
                            aujourd'hui. Le compte affiché serait celui du
                            carrousel, pas celui du catalogue, un chiffre faux
                            sur la première page se vérifie en un clic, et c'est
                            le clic suivant. */}
                        Tous les parcours gratuits <ArrowRight />
                      </Link>
                    </Button>
                  </Reveal>
                  <Reveal delay={100}>
                    <OfferCarousel items={gratuites} basePath="/formations" />
                  </Reveal>
                </div>
              ) : null}

              {payantes.length > 0 ? (
                <div className="mt-16 space-y-6">
                  <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                      <span className="eyebrow">Qualiopi · finançable OPCO</span>
                      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                        Nos formations en intra
                      </h2>
                    </div>
                    <Button asChild variant="outline">
                      <Link href="/formations">
                        Toutes les formations <ArrowRight />
                      </Link>
                    </Button>
                  </Reveal>
                  <Reveal delay={100}>
                    <OfferCarousel items={payantes} basePath="/formations" />
                  </Reveal>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ============ LEX & LE GAP, TROIS BLOCS DEVENUS UN ============

            L’essai, le détail de l’offre puis le GAP se suivaient en trois
            sections : trois titres, trois respirations, trois fois la même
            promesse. Ensemble ils poussaient le catalogue si bas que plus
            personne n’y arrivait. Tout tient ici, sur la bande claire qui
            sert déjà de repère au milieu du fond charbon. */}
        <section
          id="lex"
          className="scroll-mt-24 border-y border-border bg-gradient-to-b from-primary/[0.07] via-background to-background"
        >
          <div className="section">
            <Reveal>
              <span className="eyebrow">LEX · l’assistant IA du médico-social</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
                Décrivez un besoin. La séance est écrite en quinze secondes.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Écrits professionnels, séances, appui scolaire, analyse de pratique.
                Quatre outils, un seul compteur de crédits.
              </p>
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

        {/* ============ APERÇU DU PRODUIT ============ */}
        <ApercuProduit />

        {/* ============ TARIFS ============ */}
        <section id="tarifs" className="scroll-mt-24 bg-card">
          <div className="section">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Tarifs</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                La mise en relation est gratuite. Pour tout le monde.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Renforts et ateliers, jusqu’au{" "}
                <strong className="font-semibold text-foreground">contrat</strong> et à la{" "}
                <strong className="font-semibold text-foreground">facture</strong> : gratuit des deux
                côtés, sans commission. Seuls les{" "}
                <strong className="font-semibold text-foreground">formations Qualiopi</strong> et{" "}
                <strong className="font-semibold text-foreground">LEX</strong> se paient.
              </p>
            </Reveal>

            <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
              {[
                {
                  nom: 'Mise en relation & contractualisation',
                  sous: 'Renforts et ateliers, de la publication au contrat signé.',
                  prix: '0 €',
                  prixSous: 'Gratuit, pour toujours, 0 % de commission',
                  points: [
                    'RenforTeam : diffusion en cascade, jusqu’au CDD généré',
                    'Ateliers : devis sous 48 h, contrat et facture automatiques',
                    'L’intervenant touche son tarif intégralement',
                    'Planning, équipe, conformité et messagerie inclus',
                  ],
                  href: '/register',
                  action: 'Créer un compte',
                  ruban: 'Le cœur du service',
                  bordure: 'border-primary/45',
                  fond: 'bg-gradient-to-br from-primary/20 via-card to-card',
                  lisere: 'bg-primary',
                  halo: 'bg-primary/30',
                  pastille: 'bg-primary text-primary-foreground',
                  puce: 'text-primary',
                  bouton: 'bg-primary text-primary-foreground hover:bg-primary/90',
                },
                {
                  nom: 'Formations Qualiopi',
                  sous: 'Facturées par l’association, sous sa certification.',
                  prix: 'Sur devis',
                  prixSous: 'Facturées par l’association ADéPA, finançables OPCO',
                  points: [
                    'Animées par les formateurs du réseau Les Extras',
                    'Certifiées Qualiopi, finançables par votre OPCO',
                    'Émargement, attestations et justificatifs automatiques',
                    'Devis en ligne, réponse sous 48 h',
                  ],
                  href: '/formations',
                  // « Demander un devis » menait au CATALOGUE des formations,
                  // pas à un formulaire. Le devis se demande depuis la fiche
                  // d'une formation précise — c'est le bon ordre : on choisit,
                  // puis on demande. Le libellé dit maintenant ce qu'il fait.
                  action: 'Voir les formations',
                  ruban: 'Sur devis',
                  bordure: 'border-secondary/45',
                  fond: 'bg-gradient-to-br from-secondary/20 via-card to-card',
                  lisere: 'bg-secondary',
                  halo: 'bg-secondary/30',
                  pastille: 'bg-secondary text-secondary-foreground',
                  puce: 'text-secondary',
                  bouton: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
                },
                {
                  nom: 'LEX, l’assistant IA',
                  sous: 'Payant seulement au-delà de la dotation gratuite.',
                  prix: 'Gratuit, puis 19 €',
                  prixSous: '15 générations offertes chaque mois, sans carte bancaire.',
                  points: [
                    '15 générations par mois, reportables trois mois',
                    'Assistant d’écriture : notes brutes → écrits professionnels',
                    'Générateur d’activités éducatives et thérapeutiques',
                    'Au-delà : 19 €/mois pour 200 générations, 49 € pour 600',
                  ],
                  href: '/register',
                  // ⚠ MÊME DESTINATION, MÊME LIBELLÉ. Ce bouton disait
                  // « Découvrir LEX » et menait au formulaire d'inscription :
                  // il promettait une découverte et livrait un formulaire.
                  // C'est le motif exact corrigé le 12/08, revenu par la
                  // porte de derrière. La règle « un libellé par destination »
                  // n'est pas cosmétique : dix libellés menaient tous à
                  // /register, et le visiteur croyait à dix destinations.
                  action: 'Créer un compte',
                  ruban: 'À crédits',
                  bordure: 'border-amber-500/45',
                  fond: 'bg-gradient-to-br from-amber-500/20 via-card to-card',
                  lisere: 'bg-amber-500',
                  halo: 'bg-amber-500/30',
                  pastille: 'bg-amber-500 text-amber-950',
                  puce: 'text-amber-600',
                  bouton: 'bg-amber-500 text-amber-950 hover:bg-amber-500/90',
                },
              ].map((offre, i) => (
                <Reveal key={offre.nom} delay={i * 110} className="h-full">
                  <div
                    className={cn(
                      'group relative flex h-full flex-col overflow-hidden rounded-2xl border p-8 shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl',
                      offre.bordure,
                      offre.fond,
                    )}
                  >
                    <span className={cn('absolute inset-x-0 top-0 h-1', offre.lisere)} aria-hidden />
                    <span
                      className={cn(
                        'pointer-events-none absolute -right-10 -top-14 size-36 rounded-full blur-3xl',
                        offre.halo,
                      )}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        'relative w-fit rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                        offre.pastille,
                      )}
                    >
                      {offre.ruban}
                    </span>
                    <h3 className="relative mt-5 text-xl font-bold tracking-tight">{offre.nom}</h3>
                    <p className="relative mt-2 text-sm text-muted-foreground">{offre.sous}</p>
                    <p className="relative mt-6 text-4xl font-bold tracking-tight">{offre.prix}</p>
                    <p className="relative mt-1 text-sm text-muted-foreground">{offre.prixSous}</p>
                    <div className="relative my-6 h-px bg-border" />
                    <ul className="relative flex-1 space-y-2.5">
                      {offre.points.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle2 className={cn('mt-0.5 size-4 shrink-0', offre.puce)} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant="primary" className={cn('relative mt-8 w-full', offre.bouton)}>
                      <Link href={offre.href}>{offre.action}</Link>
                    </Button>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={120}>
              <p className="mt-8 text-center text-sm text-muted-foreground">
                Montants HT. Formations Qualiopi finançables par votre OPCO.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ============ CATALOGUE & CONTACT : les formulaires du site historique ============ */}
        <section id="catalogue-contact" className="scroll-mt-24">
          <div className="section">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">On reste en contact</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Recevez le catalogue, posez vos questions
              </h2>
              <p className="mt-4 text-muted-foreground">
                Sans créer de compte.
              </p>
            </Reveal>

            <Reveal className="mt-12">
              <CartesContact />
            </Reveal>
          </div>
        </section>

        {/* ============ CTA FINAL ============ */}
        <section className="section">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bloc-nuit bg-[hsl(222,21%,15%)] px-6 py-16 text-center text-foreground shadow-card ring-1 ring-border md:px-16">
              <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
              <div
                className="absolute -right-16 -top-16 size-64 rounded-full bg-secondary/20 blur-3xl"
                aria-hidden
              />
              <div className="relative mx-auto max-w-2xl">
                {/* « Sereinement » revenait ici et dans le pied de page : un
                    adverbe qui ne promet rien et qu'on lit deux fois. */}
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-balance">
                  Ouvrez un compte, regardez, décidez ensuite
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Compte gratuit, sans engagement.
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
