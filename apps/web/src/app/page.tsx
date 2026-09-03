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
        alt: 'LES EXTRAS — ateliers éducatifs, formations Qualiopi et renfort d’équipe pour le médico-social',
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
  const { data: unes } = await fetchPublic<{ ateliers: OfferCard[]; formations: OfferCard[] }>(
    '/public/highlights',
  );

  // Le même partage que sur /formations : les mini-formations gratuites de la
  // maison d'un côté, les formations Qualiopi vendues en intra de l'autre.
  // Voir le commentaire des deux blocs, plus bas.
  const gratuites = (unes?.formations ?? []).filter(
    (f) => f.freeOnline && estMaison(f.account?.name),
  );
  const payantes = (unes?.formations ?? []).filter(
    (f) => !(f.freeOnline && estMaison(f.account?.name)),
  );


  return (
    <div className="theme-sombre flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* ============ HERO — scindé, style grande plateforme ============ */}
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
                  concret — ce qu'on vient chercher, et à quel prix. */}
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

              {/* Recherches populaires — vraies catégories du catalogue */}
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
                    généraliste, c'est le dossier de conformité — identité,
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

            {/* Colonne visuelle — composition avec cartes flottantes.
                Attention : Reveal applique un `transform`, ce qui en fait le
                bloc conteneur de tout enfant `absolute`. Le positionnement
                doit donc vivre SUR le Reveal, pas dans son enfant — sinon les
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
                    <p className="text-sm font-semibold text-foreground">{catalogueTotal} interventions</p>
                    {/* « notées après mission » promettait des avis qui n'existent
                        pas encore : tant que les premières notes ne sont pas là,
                        on met en avant ce qui est vrai dès aujourd'hui. */}
                    {/* Même correction : « vérifiées par ADéPA » annonçait une
                        relecture qui n'a pas lieu. Les FORMATIONS certifiantes,
                        elles, sont bien relues avant diffusion sous la
                        certification Qualiopi de l'association — c'est écrit
                        et verrouillé côté serveur. C'est cela qu'on dit. */}
                    <p className="text-xs text-muted-foreground">
                      au catalogue, proposées par le réseau
                    </p>
                  </div>
                </div>
              </Reveal>

              {/* Pastille « en activité » : le seul élément qui pulse, et il
                  porte une information réelle — la plateforme tourne. */}
              <Reveal delay={440} className="absolute -bottom-4 right-8 z-10">
                <div className="flex items-center gap-2.5 rounded-full border border-border/70 bg-card/95 py-2 pl-3 pr-4 shadow-card backdrop-blur">
                  <span className="relative grid size-2.5 place-items-center">
                    <span className="animate-anneau absolute size-2.5 rounded-full bg-success" />
                    <span className="size-2.5 rounded-full bg-success" />
                  </span>
                  {/* Le réseau réel est aujourd'hui francilien : promettre la
                      France entière déçoit le premier établissement breton qui
                      s'inscrit. Assumer le territoire convertit mieux. */}
                  <span className="text-xs font-medium text-foreground">
                    Réseau actif — Île-de-France, et bientôt partout
                  </span>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============ DOMAINES — cartes photo + texte (style annonce) ============ */}
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
                texte: 'Médiations éducatives clés en main, animées chez vous par un intervenant du réseau, dossier de conformité à jour.',
                href: '/ateliers',
                image: wp('/wp-content/uploads/2023/02/cerf-volant-game-enfant-400x400.jpg'),
                action: 'Parcourir les ateliers',
              },
              {
                titre: 'Nos parcours de formations certifiés Qualiopi',
                texte: 'Montée en compétences des équipes, finançable par votre OPCO.',
                href: '/formations',
                image: wp('/wp-content/uploads/2025/02/lever-vous-400x400.jpeg'),
                action: 'Voir les formations',
              },
              {
                titre: 'Le renfort d’équipe et parental',
                texte: 'Un professionnel disponible vite, pour absorber l’absence ou le surcroît.',
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
                  Vous voyez les offres, vous réservez ou vous demandez un devis — sans intermédiaire et
                  sans frais supplémentaire. La mise en relation est{' '}
                  <strong className="font-semibold text-foreground">
                    directe entre l’intervenant et l’établissement
                  </strong>
                  , et l’association ne prélève{' '}
                  <strong className="font-semibold text-foreground">aucune commission</strong> au passage :
                  ADéPA est une association au service du bon accompagnement.
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

              {(unes?.ateliers?.length ?? 0) > 0 ? (
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
                    <OfferCarousel items={unes!.ateliers} basePath="/ateliers" />
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
                        Une compétence précise par parcours, quatre modules et une fiche récap A4
                        à imprimer. Gratuites du premier au dernier module, sans carte bancaire.
                      </p>
                    </div>
                    <Button asChild variant="outline">
                      <Link href="/formations">
                        Voir les {gratuites.length} parcours <ArrowRight />
                      </Link>
                    </Button>
                  </Reveal>
                  <Reveal delay={100}>
                    <OfferCarousel items={gratuites} basePath="/formations" useSlug />
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
                    <OfferCarousel items={payantes} basePath="/formations" useSlug />
                  </Reveal>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ============ LEX & LE GAP — TROIS BLOCS DEVENUS UN ============

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
                L’assistant conçu pour le médico-social : écrits professionnels, séances,
                appui scolaire, analyse de pratique. Quatre outils, un seul compteur de
                crédits. Moins de paperasse, plus d’accompagnement.
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
                Publier un renfort, proposer ou réserver un atelier, jusqu’au{" "}
                <strong className="font-semibold text-foreground">contrat</strong> et à la{" "}
                <strong className="font-semibold text-foreground">facture</strong> : gratuit, pour les
                établissements comme pour les intervenants, sans commission. Deux services seulement
                se paient : les <strong className="font-semibold text-foreground">formations
                Qualiopi</strong>, facturées au devis par l’association, et{" "}
                <strong className="font-semibold text-foreground">LEX</strong>, l’assistant IA à
                crédits.
              </p>
            </Reveal>

            <div className="mt-14 grid items-start gap-6 lg:grid-cols-3">
              {[
                {
                  nom: 'Mise en relation & contractualisation',
                  sous: 'Renforts et ateliers, de la publication au contrat signé. Pour les deux côtés.',
                  prix: '0 €',
                  prixSous: 'Gratuit, pour toujours — 0 % de commission',
                  points: [
                    'RenforTeam : diffusion en cascade, jusqu’au CDD généré',
                    'Ateliers : catalogue, devis sous 48 h, contrat et facture automatiques',
                    'L’établissement paie le tarif de l’intervenant, qui le touche intégralement',
                    'Planning, équipe, conformité et messagerie inclus, sans limite',
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
                  sous: 'Le seul service facturé par l’association, sous sa certification Qualiopi.',
                  prix: 'Sur devis',
                  prixSous: 'Facturées par l’association ADéPA — finançables OPCO',
                  points: [
                    'L’association fait appel aux formateurs du réseau Les Extras',
                    'Parcours certifiés Qualiopi, finançables par votre OPCO',
                    'Émargement, attestations et justificatifs générés automatiquement',
                    'Demande de devis en ligne, réponse sous 48 h',
                  ],
                  href: '/formations',
                  action: 'Demander un devis',
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
                  sous: 'Le second service payant — et seulement au-delà de la dotation gratuite.',
                  prix: 'Gratuit, puis 19 €',
                  prixSous: '15 générations offertes chaque mois, sans carte bancaire. Abonnement à partir de 19 €/mois.',
                  points: [
                    '15 générations par mois offertes, reportables jusqu’à trois mois',
                    'Assistant d’écriture : notes brutes → écrits professionnels',
                    'Générateur d’activités éducatives et thérapeutiques',
                    'Au-delà : 19 €/mois pour 200 générations, 49 €/mois pour 600',
                  ],
                  href: '/register',
                  action: 'Découvrir LEX',
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

        {/* ============ CATALOGUE & CONTACT — les formulaires du site historique ============ */}
        <section id="catalogue-contact" className="scroll-mt-24">
          <div className="section">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">On reste en contact</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Recevez le catalogue, posez vos questions
              </h2>
              <p className="mt-4 text-muted-foreground">
                Sans créer de compte. Le catalogue complet par e-mail, et l’équipe répond à vos questions.
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
            <div className="relative overflow-hidden rounded-3xl bloc-nuit bg-[hsl(222,22%,13%)] px-6 py-16 text-center text-foreground shadow-card ring-1 ring-border md:px-16">
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
                  Compte gratuit, sans engagement. La mise en relation ne se paie pas — seuls les formations Qualiopi et LEX se facturent.
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/register">
                      Créer mon compte
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
