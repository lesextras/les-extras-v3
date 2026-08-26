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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchPublic } from './_shared/server';
// Les visuels de la médiathèque WordPress passent par `wp()` : ils ont déjà
// déménagé deux fois, et les URL écrites en dur sont celles qui survivent au
// déménagement puis cassent seules. Voir `lib/media.ts`.
import { wp } from '@/lib/media';
import type { CatalogItem } from './(public)/_catalog';
import { OfferCarousel, type OfferCard } from './_shared/OfferCarousel';
import { HeroSearch } from './_shared/HeroSearch';
import { Reveal } from './_shared/Reveal';
import { ChatBot } from './_shared/ChatBot';
import { CartesContact } from './_shared/CartesContact';
import { DemoLex } from './_shared/DemoLex';
import { OffreLex } from './_shared/OffreLex';
import {
  IllustrationEcrit,
  IllustrationReseau,
} from "./_shared/Illustrations";
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
                Les interventions doivent être portées{' '}
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

              {/* Deuxième porte, dès le premier écran. La barre de recherche
                  répond à l’établissement qui cherche quelqu’un ; l’éducateur,
                  lui, ne cherche personne — il cherche à écrire plus vite.
                  L’essai de LEX vit plus bas dans la page : sans ce bouton, il
                  faut sept écrans pour le trouver. */}
              <div className="animate-fade-in-up stagger-4 mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Link
                  href="#lex"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Sparkles className="size-4" />
                  Éducateur ? Essayez LEX
                </Link>
                <span className="text-xs text-muted-foreground">
                  3 essais par heure, sans compte
                </span>
              </div>

              <div className="animate-fade-in-up stagger-4 mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-primary" />
                  Intervenants vérifiés
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
                    <p className="text-xs text-muted-foreground">au catalogue, vérifiées par ADéPA</p>
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

        {/* ============ LES DEUX PORTES ============ */}
        <DeuxPortes />

        {/* ============ UN SEUL FORMULAIRE ============
            L’argument central, posé juste après que le visiteur a dit qui il
            est : ce que déclenche une publication, et ce que LEX prend en
            charge de l’autre côté. Chaque promesse correspond à un
            comportement réel du produit. */}
        <UnSeulFormulaire />

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
                texte: 'Médiations éducatives clés en main, animées chez vous par un intervenant vérifié.',
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

        {/* ============ ESSAYER LEX ============ */}
        <section id="lex" className="section scroll-mt-24">
          <Reveal>
            <span className="eyebrow">LEX · essai libre</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
              Décrivez un besoin, LEX construit la séance
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              L’assistant IA conçu pour le médico-social. Un public, un objectif — une séance complète en quinze secondes. Sans compte.
            </p>
          </Reveal>
          <Reveal className="mt-10">
            <DemoLex />
          </Reveal>

        </section>

        {/* ============ CE QUE LEX FAIT (respiration claire) ============
            Toute la page est sur fond charbon. Une bande ivoire au milieu
            casse l'effet de bloc et sert de repère : c'est ici que l'offre
            se détaille. */}
        <section
          id="offre-lex"
          className="theme-clair scroll-mt-24 bg-background text-foreground"
        >
          <div className="section">
            <Reveal>
              <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr]">
                <div>
                  <span className="eyebrow">Les quatre outils</span>
                  <h3 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl text-balance">
                    Ce que LEX fait pour vous, au-delà de cet essai
                  </h3>
                  <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                    Quatre outils, un seul compteur de crédits. Moins de paperasse, plus d’accompagnement.
                  </p>
                </div>
                <IllustrationEcrit className="mx-auto w-full max-w-md" />
              </div>
            </Reveal>
            <Reveal className="mt-10">
              <OffreLex />
            </Reveal>
          </div>
        </section>

        {/* ============ LE GAP ============ */}
        <section id="gap" className="section scroll-mt-24">
          <Reveal>
            <BlocGap illustration={<IllustrationReseau className="w-full max-w-sm" />} />
          </Reveal>
        </section>

        {/* ============ MARKETPLACE EN ACCÈS LIBRE ============ */}
        {(unes?.ateliers?.length ?? 0) > 0 || (unes?.formations?.length ?? 0) > 0 ? (
          <section id="marketplace" className="bg-card">
            <div className="section">
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

              {(unes?.formations?.length ?? 0) > 0 ? (
                <div className="mt-16 space-y-6">
                  <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div className="max-w-2xl">
                      <span className="eyebrow">Qualiopi · finançable OPCO</span>
                      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                        Nos formations
                      </h2>
                    </div>
                    <Button asChild variant="outline">
                      <Link href="/formations">
                        Toutes les formations <ArrowRight />
                      </Link>
                    </Button>
                  </Reveal>
                  <Reveal delay={100}>
                    <OfferCarousel items={unes!.formations} basePath="/formations" useSlug />
                  </Reveal>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

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

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
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
                  variant: 'outline' as const,
                  vedette: true,
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
                  variant: 'outline' as const,
                  vedette: false,
                },
                {
                  nom: 'LEX, l’assistant IA',
                  sous: 'Le second service payant — et seulement au-delà de la dotation gratuite.',
                  // Deux corrections de fond. D'abord « essai gratuit de 7 jours »
                  // n'existe plus : il a été remplacé par une dotation mensuelle
                  // permanente (voir credits.constants.ts). Ensuite « tarifs dans
                  // votre espace » demandait de créer un compte pour connaître un
                  // prix — la question la plus élémentaire, et la seule à laquelle
                  // la page ne répondait pas. Les montants viennent de
                  // SUBSCRIPTION_PLANS, pas d'une estimation.
                  prix: 'Gratuit, puis 19 €',
                  prixSous: '15 générations offertes chaque mois, sans carte bancaire. Abonnement à partir de 19 €/mois.',
                  points: [
                    // « sans date de fin » etait faux : le serveur reporte le
                    // non-consomme pendant trois mois (ROLLOVER_MONTHS, dans
                    // apps/api/src/billing/credits.constants.ts), et le centre
                    // d'aide le disait deja. C'est la page la plus vue qui
                    // portait l'erreur.
                    '15 générations par mois offertes, reportables jusqu\'à trois mois',
                    'Assistant d’écriture : notes brutes → écrits professionnels',
                    'Générateur d’activités éducatives et thérapeutiques',
                    'Au-delà : 19 €/mois pour 200 générations, 49 €/mois pour 600',
                  ],
                  href: '/register',
                  action: 'Découvrir LEX',
                  variant: 'primary' as const,
                  vedette: false,
                },
              ].map((offre, i) => (
                <Reveal key={offre.nom} delay={i * 110} className="h-full">
                  <Card
                    className={cn(
                      'flex h-full flex-col transition-shadow duration-300 hover:shadow-card',
                      offre.vedette && 'border-primary/40 shadow-card',
                    )}
                  >
                    <CardContent className="flex flex-1 flex-col p-8">
                      {offre.vedette ? <Badge className="w-fit">Le plus choisi</Badge> : null}
                      <h3 className={cn('text-lg font-semibold', offre.vedette && 'mt-3')}>{offre.nom}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{offre.sous}</p>
                      <p className="mt-6 text-3xl font-bold tracking-tight">{offre.prix}</p>
                      {offre.prixSous ? (
                        <p className="mt-1 text-sm text-muted-foreground">{offre.prixSous}</p>
                      ) : null}
                      <ul className="mt-6 flex-1 space-y-2.5">
                        {offre.points.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-sm">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button asChild variant={offre.variant} className="mt-6 w-full">
                        <Link href={offre.href}>{offre.action}</Link>
                      </Button>
                    </CardContent>
                  </Card>
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
