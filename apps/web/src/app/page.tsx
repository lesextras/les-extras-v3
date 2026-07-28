import Link from 'next/link';
import Image from 'next/image';
import {
  GraduationCap,
  ShieldCheck,
  HeartHandshake,
  Users,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Newspaper,
  Siren,
  PenLine,
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
import type { CatalogItem } from './(public)/_catalog';
import { OfferCarousel, type OfferCard } from './_shared/OfferCarousel';
import { HeroSearch } from './_shared/HeroSearch';
import { VideoFacade } from './_shared/VideoFacade';
import { Reveal } from './_shared/Reveal';
import { ChatBot } from './_shared/ChatBot';
import { CatalogueRequestForm } from './_shared/CatalogueRequestForm';
import { ContactForm } from './_shared/ContactForm';

export default async function LandingPage() {
  // Compteur réel du catalogue public (affiché dans le hero).
  const { data: featured } = await fetchPublic<{ items: CatalogItem[]; total?: number }>(
    '/public/catalog?type=all&take=3',
  );
  const catalogueTotal = featured?.total ?? featured?.items?.length ?? 0;

  // Marketplace visible sans compte : les mieux notés, directement en accueil.
  const { data: unes } = await fetchPublic<{ ateliers: OfferCard[]; formations: OfferCard[] }>(
    '/public/highlights',
  );

  // Édublog : trois dernières publications, pour montrer que le réseau vit.
  const { data: fluxArticles } = await fetchPublic<{
    items: { id: string; slug: string; title: string; excerpt?: string | null; coverUrl?: string | null; publishedAt?: string | null }[];
  }>('/articles/feed?take=3');
  const articles = fluxArticles?.items ?? [];

  return (
    <div className="theme-sombre flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* ============ HERO — scindé, style grande plateforme ============ */}
        <section className="relative isolate overflow-hidden bg-warm-gradient">
          <div className="mx-auto grid max-w-[1360px] items-center gap-12 px-6 pb-16 pt-14 md:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pb-24 lg:pt-20">
            {/* Colonne texte */}
            <div>
              <span className="eyebrow animate-fade-in-up inline-flex">
                <Sparkles className="size-3.5" />
                Le dispositif de l’association ADéPA — depuis 2012
              </span>
              <h1 className="animate-fade-in-up stagger-1 mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-foreground text-balance sm:text-5xl xl:text-6xl">
                Des interventions à fort impact,{' '}
                <span className="text-secondary">portées par ceux qui font le terrain.</span>
              </h1>
              <p className="animate-fade-in-up stagger-2 mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Ateliers éducatifs, formations Qualiopi et renfort d’équipe, animés par des
                indépendants vérifiés du médico-social.
              </p>

              <div className="animate-fade-in-up stagger-3 mt-7 max-w-xl">
                <HeroSearch />
              </div>

              {/* Recherches populaires — vraies catégories du catalogue */}
              <div className="animate-fade-in-up stagger-4 mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">Populaire :</span>
                {['Psycho-boxe', 'Slam', 'Théâtre', 'Musicothérapie', 'Socio-esthétique'].map((c) => (
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

            {/* Colonne visuelle — composition avec cartes flottantes */}
            <div className="relative hidden lg:block">
              <Reveal>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-card">
                  <Image
                    src="/images/reseau-les-extras.jpg"
                    alt="Le réseau des intervenants Les Extras"
                    fill
                    priority
                    sizes="(max-width: 1024px) 0px, 45vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </Reveal>
              <Reveal delay={200}>
                <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-card backdrop-blur">
                  <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
                    <FileCheck className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Devis sous 48 h</p>
                    <p className="text-xs text-muted-foreground">contrat et facture automatiques</p>
                  </div>
                </div>
              </Reveal>
              <Reveal delay={320}>
                <div className="absolute right-5 top-5 flex items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-card backdrop-blur">
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary-soft text-secondary">
                    <GraduationCap className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{catalogueTotal} interventions</p>
                    <p className="text-xs text-muted-foreground">au catalogue, notées après mission</p>
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============ CONFIANCE — bande défilante ============ */}
        <section className="border-y border-border/60 bg-card">
          <div className="mx-auto max-w-[1360px] py-7">
            <p className="px-6 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ils nous font confiance dans toute la France
            </p>
            <div
              className="marquee-hover mt-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
              aria-hidden
            >
              <div className="animate-marquee flex w-max items-center gap-14 pr-14">
                {[...Array(2)].flatMap((_, dup) =>
                  ['MECS', 'IME', 'ITEP', 'EHPAD', 'SESSAD', 'Foyers de vie', 'Protection de l’enfance', 'Prévention spécialisée'].map((t) => (
                    <span
                      key={`${dup}-${t}`}
                      className="flex items-center gap-14 text-lg font-bold tracking-tight text-foreground/55"
                    >
                      {t}
                      <span className="size-1.5 rounded-full bg-secondary/50" />
                    </span>
                  )),
                )}
              </div>
            </div>
            <p className="sr-only">
              MECS, IME, ITEP, EHPAD, SESSAD, foyers de vie, protection de l’enfance, prévention
              spécialisée.
            </p>
          </div>
        </section>

        {/* ============ DOMAINES — cartes photo + texte (style annonce) ============ */}
        <section className="section">
          <Reveal className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="eyebrow">Trois portes d’entrée</span>
              <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                Nos domaines d’actions
              </h2>
            </div>
            <Button asChild variant="outline">
              <Link href="/ateliers">
                Tout explorer <ArrowRight />
              </Link>
            </Button>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                titre: 'Les ateliers de notre réseau',
                texte: 'Médiations éducatives clés en main, animées chez vous par un intervenant vérifié.',
                href: '/ateliers',
                image: 'https://les-extras.fr/wp-content/uploads/2023/02/cerf-volant-game-enfant-400x400.jpg',
                action: 'Parcourir les ateliers',
              },
              {
                titre: 'Nos parcours de formations certifiés Qualiopi',
                texte: 'Montée en compétences des équipes, finançable par votre OPCO.',
                href: '/formations',
                image: 'https://les-extras.fr/wp-content/uploads/2025/02/lever-vous-400x400.jpeg',
                action: 'Voir les formations',
              },
              {
                titre: 'Le renfort d’équipe et parental',
                texte: 'Un professionnel disponible vite, pour absorber l’absence ou le surcroît.',
                href: '/#renfort',
                image: 'https://les-extras.fr/wp-content/uploads/2025/02/mineur-protection-de-lenfance.jpg',
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
                      unoptimized
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

        {/* ============ BANDEAU DE CHIFFRES — fond bleu nuit ============ */}
        <section className="border-y border-border bg-[hsl(222,24%,10%)]">
          <div className="mx-auto grid max-w-[1360px] grid-cols-2 gap-8 px-6 py-12 text-center md:grid-cols-4 md:px-10 md:py-14">
            {[
              { k: `${catalogueTotal}`, v: 'interventions au catalogue' },
              { k: '2012', v: 'année de création de l’ADéPA' },
              { k: 'Qualiopi', v: 'organisme de formation certifié' },
              { k: '48 h', v: 'pour recevoir votre devis' },
            ].map((st, i) => (
              <Reveal key={st.v} delay={i * 90}>
                <p className="text-3xl font-bold tracking-tight text-primary [font-variant-numeric:tabular-nums] md:text-4xl">
                  {st.k}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{st.v}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ============ BENTO — tout ce que la plateforme fait ============ */}
        <section id="produits" className="bg-card">
          <div className="section">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">La plateforme</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
                Tout ce qu’elle fait pour vous
              </h2>
              <p className="mt-4 text-muted-foreground">
                Six services, un seul compte — du premier devis jusqu’au compte rendu.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {/* Ateliers — grande tuile avec photo */}
              <Reveal className="md:col-span-2">
                <Link
                  href="/ateliers"
                  className="group grid h-full overflow-hidden rounded-3xl bg-[hsl(160,30%,13%)] shadow-soft transition-shadow duration-300 hover:shadow-card sm:grid-cols-2"
                >
                  <div className="flex flex-col p-7 md:p-8">
                    <span className="grid size-11 place-items-center rounded-xl bg-card text-primary shadow-soft">
                      <Sparkles className="size-5" />
                    </span>
                    <h3 className="mt-4 text-xl font-semibold">Les ateliers éducatifs</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      Quinze médiations clés en main — psycho-boxe, slam, théâtre,
                      musicothérapie… Réservables en ligne, avec compte rendu après chaque
                      intervention.
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      Parcourir le catalogue
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                  <div className="relative min-h-52 bg-muted">
                    <Image
                      src="https://les-extras.fr/wp-content/uploads/2025/02/musicotherapie.jpg"
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                </Link>
              </Reveal>

              {/* SOS Renfort — tuile bleu nuit */}
              <Reveal delay={100}>
                <div
                  id="renfort"
                  className="flex h-full scroll-mt-24 flex-col rounded-3xl bg-[hsl(14,32%,14%)] p-7 shadow-soft transition-shadow duration-300 hover:shadow-card md:p-8"
                >
                  <span className="grid size-11 place-items-center rounded-xl bg-card text-secondary shadow-soft">
                    <Siren className="size-5" />
                  </span>
                  <h3 className="mt-4 text-xl font-semibold">SOS Renfort</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-foreground/75">
                    Une absence ce soir ? Publiez le besoin : diffusion en cascade — votre équipe,
                    puis les intervenants déjà venus, enfin le réseau. Le premier qui accepte est
                    engagé, contrat généré.
                  </p>
                  <Link
                    href="/register"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:underline"
                  >
                    Publier un renfort
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Reveal>

              {/* Formations */}
              <Reveal>
                <div className="flex h-full flex-col rounded-3xl bg-[hsl(217,36%,15%)] p-7 shadow-soft transition-shadow duration-300 hover:shadow-card md:p-8">
                  <span className="grid size-11 place-items-center rounded-xl bg-card text-primary shadow-soft">
                    <GraduationCap className="size-5" />
                  </span>
                  <h3 className="mt-4 text-xl font-semibold">Formations Qualiopi</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    En intra, finançables OPCO. Émargement en ligne, attestations et certificats
                    générés automatiquement.
                  </p>
                  <Link
                    href="/formations"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary"
                  >
                    Voir les formations
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Reveal>

              {/* Assistant IA — grande tuile avec photo */}
              <Reveal delay={100} className="md:col-span-2">
                <Link
                  href="/register"
                  className="group grid h-full overflow-hidden rounded-3xl bg-[hsl(266,24%,15%)] shadow-soft transition-shadow duration-300 hover:shadow-card sm:grid-cols-2"
                >
                  <div className="relative order-2 min-h-52 bg-muted sm:order-1">
                    <Image
                      src="https://les-extras.fr/wp-content/uploads/2026/04/school.jpeg"
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <div className="order-1 flex flex-col p-7 sm:order-2 md:p-8">
                    <span className="flex items-center gap-2">
                      <span className="grid size-11 place-items-center rounded-xl bg-card text-primary shadow-soft">
                        <PenLine className="size-5" />
                      </span>
                      <Badge variant="soft">LEX · Adhérents</Badge>
                    </span>
                    <h3 className="mt-4 text-xl font-semibold">LEX, l’assistant d’écriture</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                      Vos notes brutes deviennent des écrits professionnels. Noms masqués avant
                      traitement, notes jamais stockées, relecture obligatoire : vous restez
                      l’auteur.
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      Essayer l’assistant
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>

              {/* Gestion sans papier */}
              <Reveal>
                <div className="flex h-full flex-col rounded-3xl bg-[hsl(40,26%,13%)] p-7 shadow-soft transition-shadow duration-300 hover:shadow-card md:p-8">
                  <span className="grid size-11 place-items-center rounded-xl bg-card text-accent-foreground shadow-soft">
                    <FileCheck className="size-5" />
                  </span>
                  <h3 className="mt-4 text-xl font-semibold">La gestion sans papier</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    Devis, contrats à double signature, factures PDF, pointage validé, coffre-fort
                    de conformité avec alertes d’échéance.
                  </p>
                  <Link
                    href="/register"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                  >
                    Ouvrir un compte
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </Reveal>

              {/* Édublog */}
              <Reveal delay={100} className="md:col-span-2">
                <Link
                  href="/edublog"
                  className="group flex h-full flex-col justify-between gap-6 rounded-3xl bg-[hsl(190,28%,13%)] p-7 shadow-soft transition-shadow duration-300 hover:shadow-card sm:flex-row sm:items-center md:p-8"
                >
                  <div>
                    <span className="grid size-11 place-items-center rounded-xl bg-card text-secondary shadow-soft">
                      <Newspaper className="size-5" />
                    </span>
                    <h3 className="mt-4 text-xl font-semibold">L’Édublog</h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                      Le fil public du réseau : retours d’expérience, projets, pratiques
                      éducatives. Publiez, puis partagez sur LinkedIn en un clic.
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary">
                    Lire l’Édublog
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============ COMMENT ÇA MARCHE — trois grandes étapes ============ */}
        <section id="comment" className="scroll-mt-24">
          <div className="section">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Comment ça marche</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Trois étapes, zéro friction
              </h2>
              <p className="mt-4 text-muted-foreground">
                Les Extras est porté par l’association <strong className="font-semibold text-foreground">ADéPA</strong>,
                engagée depuis 2012 pour l’insertion sociale par l’éducation, la prévention et
                l’animation.
              </p>
            </Reveal>
            <div className="mt-14 grid gap-10 md:grid-cols-3">
              {[
                {
                  t: 'Visualisez les offres',
                  d: 'Parcourez le catalogue et les profils d’experts du réseau — sans compte.',
                  i: <Users className="size-6" />,
                },
                {
                  t: 'Réservez ou demandez un devis',
                  d: 'En ligne, en quelques clics. Le devis accepté devient contrat, tout seul.',
                  i: <HeartHandshake className="size-6" />,
                },
                {
                  t: 'La mission est réalisée',
                  d: 'Compte rendu, facture et avis vous attendent dans votre espace.',
                  i: <CheckCircle2 className="size-6" />,
                },
              ].map((e, i) => (
                <Reveal key={e.t} delay={i * 110}>
                  <div className="relative">
                    <span className="pointer-events-none absolute -top-6 left-0 text-7xl font-bold text-primary/10">
                      {i + 1}
                    </span>
                    <span className="relative grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
                      {e.i}
                    </span>
                    <h3 className="relative mt-4 text-lg font-semibold">{e.t}</h3>
                    <p className="relative mt-2 text-sm leading-relaxed text-muted-foreground">{e.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={120} className="mt-12 text-center">
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/ateliers">
                    Explorer le catalogue
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/notre-histoire">Découvrir l’association</Link>
                </Button>
              </div>
            </Reveal>
          </div>
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
                      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                        Les ateliers les mieux notés
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

        {/* ============ REJOINDRE LE RÉSEAU ============ */}
        <section className="section">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <span className="eyebrow">Être ou ne pas être ?</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Rejoindre le réseau des Extras
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Éducateurs spécialisés, moniteurs-éducateurs, AES, psychologues : ce que change le
                fait de travailler en indépendant, raconté par ceux qui le font.
              </p>
              <Button asChild size="lg" className="mt-7">
                <Link href="/register">
                  Proposer mes services
                  <ArrowRight />
                </Link>
              </Button>
            </Reveal>
            <Reveal delay={120}>
              <VideoFacade id="8dXRvZU5TQY" titre="Comment rejoindre Les Extras freelances" />
              <a
                href="https://youtu.be/8dXRvZU5TQY"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Ouvrir la vidéo sur YouTube
                <ArrowRight className="size-3.5" />
              </a>
            </Reveal>
          </div>
        </section>

        {/* ============ TARIFS ============ */}
        <section id="tarifs" className="scroll-mt-24 bg-card">
          <div className="section">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Tarifs</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Gratuit en interne, payant seulement quand on travaille pour vous
              </h2>
              <p className="mt-4 text-muted-foreground">
                Le principe est simple : organiser votre <strong className="font-semibold text-foreground">équipe interne</strong> sur
                la plateforme ne coûte rien, et ne coûtera jamais rien. Vous ne payez que dans
                deux cas — quand un <strong className="font-semibold text-foreground">intervenant externe</strong> vient
                chez vous (facturé à la prestation, prix affiché sur chaque fiche), ou si vous
                choisissez l’<strong className="font-semibold text-foreground">adhésion</strong> pour débloquer les
                outils d’intelligence artificielle LEX.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {[
                {
                  nom: 'Usage interne',
                  sous: 'Votre équipe salariée, sur la plateforme, sans limite.',
                  prix: '0 €',
                  prixSous: 'Gratuit, pour toujours',
                  points: [
                    'Missions de renfort diffusées à vos salariés',
                    'Formation interne animée par vos référents',
                    'Planning, équipe, multi-unités et pointage',
                    'Coffre-fort de conformité et devis illimités',
                  ],
                  href: '/register',
                  action: 'Créer un compte gratuit',
                  variant: 'outline' as const,
                  vedette: false,
                },
                {
                  nom: 'Prestations externes',
                  sous: 'Un intervenant du réseau vient chez vous : vous payez la prestation, rien d’autre.',
                  prix: 'Prix de la fiche',
                  prixSous: 'ou crédits dès 7 € (packs 10/90 €, 25/200 €, 60/420 €)',
                  points: [
                    'Ateliers et formations réservables en ligne ou sur devis (48 h)',
                    'SOS Renfort : le réseau prend le relais de votre équipe',
                    'Contrat et facture générés automatiquement',
                    '0 % de commission prélevée sur l’intervenant',
                  ],
                  href: '/ateliers',
                  action: 'Voir les prix du catalogue',
                  variant: 'outline' as const,
                  vedette: false,
                },
                {
                  nom: 'Adhésion',
                  sous: 'Les outils d’intelligence artificielle LEX, pour toute votre équipe.',
                  prix: '149 €',
                  prixSuffixe: ' / mois',
                  prixSous: 'Essentiel · Pro à 299 € / mois — montants HT',
                  points: [
                    'LEX Assistant d’écriture : notes brutes → écrits professionnels',
                    'LEX Générateur d’activités éducatives et thérapeutiques',
                    'LEX Bot d’aide intégré à votre espace',
                    'Crédits offerts chaque mois (5 en Essentiel, 15 en Pro)',
                  ],
                  href: '/register',
                  action: 'Devenir adhérent',
                  variant: 'primary' as const,
                  vedette: true,
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
                      <p className="mt-6 text-3xl font-bold tracking-tight">
                        {offre.prix}
                        {offre.prixSuffixe ? (
                          <span className="text-base font-normal text-muted-foreground">{offre.prixSuffixe}</span>
                        ) : null}
                      </p>
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
                Montants hors taxes. Les formations portées par la certification Qualiopi d’ADéPA
                sont finançables par votre OPCO.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ============ PREUVE — bandeau bleu nuit, épuré ============ */}
        <section className="border-y border-border bg-[hsl(222,24%,10%)]">
          <div className="mx-auto max-w-[1100px] px-6 py-20 text-center md:py-24">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/90">
                Une association, pas une startup
              </span>
              <blockquote className="mx-auto mt-8 max-w-3xl text-2xl font-semibold leading-snug text-foreground text-balance md:text-3xl">
                « Créer des dispositifs éducatifs innovants pour sécuriser les accompagnements,
                soutenir les professionnels et renforcer les compétences psychosociales des
                jeunes. »
              </blockquote>
              <p className="mt-4 text-sm text-muted-foreground">La mission de l’ADéPA, depuis 2012</p>
            </Reveal>
            <Reveal delay={150}>
              <Button asChild size="lg" variant="secondary" className="mt-10">
                <Link href="/notre-histoire">
                  Découvrir notre histoire
                  <ArrowRight />
                </Link>
              </Button>
            </Reveal>
          </div>
        </section>

        {/* ============ ÉDUBLOG ============ */}
        {articles.length > 0 ? (
          <section className="bg-card">
            <div className="section">
              <Reveal className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <span className="eyebrow">
                    <Newspaper className="size-3.5" />
                    L’Édublog
                  </span>
                  <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                    Ce que publie le réseau
                  </h2>
                </div>
                <Button asChild variant="outline">
                  <Link href="/edublog">
                    Tous les articles
                    <ArrowRight />
                  </Link>
                </Button>
              </Reveal>

              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {articles.map((a, i) => (
                  <Reveal key={a.id} delay={i * 110} className="h-full">
                    <Link href={`/edublog/${a.slug}`} className="group block h-full">
                      <Card className="h-full overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-card">
                        {a.coverUrl ? (
                          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                            <Image
                              src={a.coverUrl}
                              alt=""
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                              unoptimized
                            />
                          </div>
                        ) : null}
                        <CardContent className="space-y-2 p-5">
                          <h3 className="line-clamp-2 font-semibold text-foreground">{a.title}</h3>
                          {a.excerpt ? (
                            <p className="line-clamp-3 text-sm text-muted-foreground">{a.excerpt}</p>
                          ) : null}
                          <span className="inline-flex items-center gap-1 pt-1 text-sm font-medium text-primary">
                            Lire l’article
                            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* ============ CATALOGUE & CONTACT — les formulaires du site historique ============ */}
        <section id="catalogue-contact" className="scroll-mt-24">
          <div className="section">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">On reste en contact</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Recevez le catalogue, posez vos questions
              </h2>
              <p className="mt-4 text-muted-foreground">
                Sans créer de compte : le catalogue complet des ateliers et formations vous est
                envoyé par e-mail, et l’équipe répond à toutes vos questions.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <Reveal className="h-full">
                <div className="flex h-full flex-col rounded-3xl bg-[hsl(217,36%,15%)] p-7 md:p-9">
                  <h3 className="text-xl font-semibold">Recevoir notre catalogue</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                    Les 15 interventions détaillées — publics, objectifs, tarifs — dans votre
                    boîte mail.
                  </p>
                  <div className="mt-6">
                    <CatalogueRequestForm />
                  </div>
                </div>
              </Reveal>
              <Reveal delay={120} className="h-full">
                <div className="flex h-full flex-col rounded-3xl bg-[hsl(40,26%,13%)] p-7 md:p-9">
                  <h3 className="text-xl font-semibold">Nous écrire</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/70">
                    Une question sur un atelier, une formation, un renfort ou un partenariat ?
                    Réponse de l’équipe ADéPA.
                  </p>
                  <div className="mt-6">
                    <ContactForm />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============ CTA FINAL ============ */}
        <section className="section">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl bg-[hsl(222,22%,13%)] px-6 py-16 text-center text-foreground shadow-card ring-1 ring-border md:px-16">
              <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
              <div
                className="absolute -right-16 -top-16 size-64 rounded-full bg-secondary/20 blur-3xl"
                aria-hidden
              />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-balance">
                  Prêt à renforcer vos équipes, sereinement ?
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Rejoignez les établissements et professionnels qui font confiance à LES EXTRAS.
                  Création de compte gratuite, sans engagement.
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
    </div>
  );
}
