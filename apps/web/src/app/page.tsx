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
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* ============ HERO — clair, typographique, épuré ============ */}
        <section className="relative isolate overflow-hidden bg-warm-gradient">
          <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
          {/* halos décoratifs en mouvement lent */}
          <div
            className="absolute -left-24 top-24 -z-10 size-[420px] rounded-full bg-secondary/10 blur-3xl animate-float"
            aria-hidden
          />
          <div
            className="absolute -right-28 bottom-0 -z-10 size-[480px] rounded-full bg-primary/10 blur-3xl animate-float [animation-delay:-3.5s]"
            aria-hidden
          />

          <div className="relative mx-auto max-w-[1200px] px-6 pb-14 pt-20 text-center md:pb-20 md:pt-28">
            <span className="eyebrow animate-fade-in-up inline-flex">
              <Sparkles className="size-3.5" />
              Le dispositif de l’association ADéPA — depuis 2012
            </span>

            <h1 className="mx-auto mt-6 max-w-4xl text-[2.6rem] font-bold leading-[1.04] tracking-tight text-foreground text-balance sm:text-6xl lg:text-[4.4rem]">
              <span className="block animate-fade-in-up stagger-1">Des interventions à fort impact,</span>
              <span className="block animate-fade-in-up stagger-2 text-secondary">
                portées par ceux qui font le terrain.
              </span>
            </h1>

            <p className="animate-fade-in-up stagger-3 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-balance">
              Ateliers éducatifs, formations Qualiopi et renfort d’équipe, animés par des
              indépendants vérifiés du médico-social. Devis, contrat et facture générés
              automatiquement.
            </p>

            <div className="animate-fade-in-up stagger-3 mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="shadow-card">
                <Link href="/ateliers">
                  Explorer les ateliers
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/catalogue">Demander notre catalogue</Link>
              </Button>
            </div>

            <div className="animate-fade-in-up stagger-4 mx-auto mt-9 w-full max-w-3xl rounded-2xl bg-card p-2 shadow-card ring-1 ring-border/60">
              <HeroSearch />
            </div>

            <dl className="animate-fade-in-up stagger-4 mx-auto mt-10 grid w-full max-w-2xl grid-cols-3 divide-x divide-border">
              {[
                { k: `${catalogueTotal}`, v: 'interventions au catalogue' },
                { k: 'Qualiopi', v: 'formations finançables OPCO' },
                { k: '48 h', v: 'pour recevoir votre devis' },
              ].map((st) => (
                <div key={st.v} className="px-4">
                  <dt className="text-2xl font-bold tracking-tight text-foreground [font-variant-numeric:tabular-nums] md:text-3xl">
                    {st.k}
                  </dt>
                  <dd className="mt-1 text-xs text-muted-foreground md:text-[13px]">{st.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* la photo du réseau : large, chaleureuse, en couleurs réelles */}
          <Reveal className="relative mx-auto max-w-[1200px] px-6 pb-16 md:pb-20">
            <div className="relative aspect-[21/9] overflow-hidden rounded-3xl shadow-card">
              <Image
                src="https://les-extras.fr/wp-content/uploads/2023/04/cropped-groupe-id-3-1.jpg"
                alt="Le réseau des intervenants Les Extras"
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
                className="object-cover object-[center_35%]"
                unoptimized
              />
            </div>
          </Reveal>
        </section>

        {/* ============ CONFIANCE — bande défilante en continu ============ */}
        <section className="border-y border-border/60 bg-card">
          <div className="mx-auto max-w-[1360px] py-8">
            <p className="px-6 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ils nous font confiance dans toute la France
            </p>
            <div
              className="marquee-hover mt-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"
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

        {/* ============ DOMAINES — trois portes d'entrée ============ */}
        <section className="section">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Trois portes d’entrée</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Nos domaines d’actions
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
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
                <Link href={d.href} className="group relative block overflow-hidden rounded-3xl">
                  <div className="relative aspect-[3/4] w-full bg-muted md:aspect-[4/5]">
                    <Image
                      src={d.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized
                    />
                    <span className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-7">
                      <span className="block text-2xl font-bold leading-tight text-white text-balance">
                        {d.titre}
                      </span>
                      <span className="mt-2 block text-sm leading-relaxed text-white/75">{d.texte}</span>
                      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                        {d.action}
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ============ QUI NOUS SOMMES + COMMENT ÇA MARCHE ============ */}
        <section id="comment" className="bg-primary-soft/50">
          <div className="mx-auto max-w-[1000px] px-6 py-16 text-center md:py-24">
            <Reveal>
              <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
                Vous reconnaissez-vous ?
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-lg text-muted-foreground text-balance">
                Violences, décrochage, tensions d’équipe, conduites à risque, difficultés
                parentales, épuisement… Le quotidien complexe, on le connaît.
              </p>
              <p className="mx-auto mt-7 max-w-3xl text-base leading-relaxed text-foreground/85 md:text-lg">
                Les Extras est le dispositif de l’association{' '}
                <strong className="font-semibold text-foreground">ADéPA</strong>, engagée depuis
                2012 pour l’insertion sociale des enfants, des adolescents et des familles par
                l’éducation, la prévention et l’animation.
              </p>
            </Reveal>

            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                { n: '01', t: 'Visualisez les offres et les profils d’experts de notre réseau', i: <Users className="size-5" /> },
                { n: '02', t: 'Réservez en ligne ou faites une demande de devis', i: <HeartHandshake className="size-5" /> },
                { n: '03', t: 'La mission est réalisée. Consultez son compte rendu', i: <CheckCircle2 className="size-5" /> },
              ].map((e, i) => (
                <Reveal key={e.n} delay={i * 110}>
                  <li className="flex flex-col items-center gap-3">
                    <span className="relative grid size-14 place-items-center rounded-2xl bg-card text-primary shadow-soft">
                      {e.i}
                      <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                        {e.n}
                      </span>
                    </span>
                    <p className="max-w-[15rem] text-sm font-medium text-foreground text-balance">{e.t}</p>
                  </li>
                </Reveal>
              ))}
            </ol>

            <Reveal delay={120} className="mt-10">
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/formations">Le centre de formation</Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/notre-histoire">Découvrir l’association</Link>
                </Button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ============ LA PLATEFORME, PRODUIT PAR PRODUIT ============ */}
        <section id="produits" className="bg-card">
          <div className="section">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Visite guidée</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
                Tout ce que la plateforme fait pour vous
              </h2>
              <p className="mt-4 text-muted-foreground">
                Six services, un seul compte. Pour chacun : à quoi il sert, et comment il
                s’utilise en trois gestes.
              </p>
            </Reveal>

            <div className="mt-16 space-y-24 md:space-y-28">
              {[
                {
                  titre: 'Les ateliers éducatifs',
                  pour: 'Établissements',
                  texte:
                    'Quinze médiations clés en main — psycho-boxe, slam, socio-esthétique, théâtre, musicothérapie… — animées chez vous par un intervenant vérifié. Une demi-journée, un budget de fonctionnement, une décision immédiate.',
                  image: 'https://les-extras.fr/wp-content/uploads/2025/02/musicotherapie.jpg',
                  tuto: [
                    'Parcourez le catalogue et filtrez par public, ville ou budget.',
                    'Demandez un devis — même sans compte — ou réservez en ligne.',
                    'L’intervention a lieu ; le compte rendu vous revient avec des recommandations.',
                  ],
                  href: '/ateliers',
                  lien: 'Parcourir les ateliers',
                },
                {
                  titre: 'Les formations certifiées Qualiopi',
                  pour: 'Équipes & responsables formation',
                  texte:
                    'Analyse des pratiques, prévention, spécialisations métier — en intra, dans votre structure. Portées par la certification Qualiopi d’ADéPA, donc finançables par votre OPCO.',
                  image: 'https://les-extras.fr/wp-content/uploads/2025/02/lever-vous.jpeg',
                  tuto: [
                    'Choisissez le parcours et la session adaptés à votre plan de compétences.',
                    'Nous vous aidons à monter le dossier de financement OPCO.',
                    'Émargement en ligne, attestations et certificats produits automatiquement.',
                  ],
                  href: '/formations',
                  lien: 'Voir les formations',
                },
                {
                  id: 'renfort',
                  titre: 'Le SOS Renfort',
                  pour: 'Urgences de personnel',
                  texte:
                    'Une absence ce soir, un surcroît la semaine prochaine : publiez le besoin, la plateforme le diffuse en cascade — votre équipe d’abord, puis les intervenants déjà venus chez vous, enfin le réseau.',
                  image: 'https://les-extras.fr/wp-content/uploads/2026/04/etoile-mec.jpeg',
                  tuto: [
                    'Décrivez la mission : poste, dates, horaires, public accueilli.',
                    'La diffusion en cascade privilégie ceux qui connaissent déjà votre maison.',
                    'Premier accepté = mission pourvue. Contrat et facture suivent tout seuls.',
                  ],
                  href: '/register',
                  lien: 'Publier un renfort',
                },
                {
                  titre: 'L’assistant d’écriture IA',
                  pour: 'Tous les professionnels',
                  texte:
                    'Vos notes brutes deviennent des écrits professionnels : notes d’observation, rapports de situation, transmissions. Les noms sont masqués avant tout traitement, vos notes ne sont jamais stockées.',
                  image: 'https://les-extras.fr/wp-content/uploads/2026/04/school.jpeg',
                  tuto: [
                    'Choisissez le type d’écrit, puis dictez ou tapez vos notes comme elles viennent.',
                    'L’assistant structure : faits d’un côté, hypothèses prudentes de l’autre.',
                    'Vous relisez, corrigez et validez — vous restez l’auteur du document.',
                  ],
                  href: '/register',
                  lien: 'Essayer l’assistant',
                },
                {
                  titre: 'L’Édublog',
                  pour: 'Visibilité du réseau',
                  texte:
                    'Chaque compte peut publier articles et actualités sur le fil public, et les partager sur LinkedIn en un clic — votre travail devient votre meilleure publicité.',
                  image: 'https://les-extras.fr/wp-content/uploads/2025/02/prev-reseaux-sociaux.jpg',
                  tuto: [
                    'Écrivez dans l’éditeur : mise en forme simple, images, relecture.',
                    'Publiez — l’article est lisible par tous, sans compte.',
                    'Connectez LinkedIn une fois, puis partagez chaque article en un clic.',
                  ],
                  href: '/edublog',
                  lien: 'Lire l’Édublog',
                },
                {
                  titre: 'La gestion sans papier',
                  pour: 'Administratif',
                  texte:
                    'Devis chiffrés en ligne, contrats à double signature, factures PDF, pointage des heures validé, coffre-fort de conformité. Tout ce qui prenait des soirées se fait dans le même espace.',
                  image: 'https://les-extras.fr/wp-content/uploads/2023/03/video-atelier.webp',
                  tuto: [
                    'Le devis accepté devient réservation, puis contrat signé en ligne.',
                    'Les heures déclarées par l’intervenant sont validées par vous.',
                    'La facture PDF tombe dans votre espace ; la conformité est suivie avec ses échéances.',
                  ],
                  href: '/register',
                  lien: 'Ouvrir un compte',
                },
              ].map((prod, idx) => (
                <article
                  key={prod.titre}
                  id={prod.id}
                  className={cn(
                    'grid items-center gap-10 scroll-mt-24 lg:grid-cols-2 lg:gap-20',
                    idx % 2 === 1 && 'lg:[&>*:first-child]:order-2',
                  )}
                >
                  <Reveal>
                    <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-card">
                      <Image
                        src={prod.image}
                        alt={prod.titre}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        unoptimized
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                        {prod.pour}
                      </span>
                    </div>
                  </Reveal>
                  <Reveal delay={120}>
                    <h3 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">{prod.titre}</h3>
                    <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{prod.texte}</p>
                    <ol className="mt-7 space-y-4">
                      {prod.tuto.map((etape, i) => (
                        <li key={etape} className="flex gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                            {i + 1}
                          </span>
                          <span className="pt-1 text-[15px] leading-relaxed text-foreground">{etape}</span>
                        </li>
                      ))}
                    </ol>
                    <Button asChild size="lg" className="mt-8">
                      <Link href={prod.href}>
                        {prod.lien}
                        <ArrowRight />
                      </Link>
                    </Button>
                  </Reveal>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============ MARKETPLACE EN ACCÈS LIBRE ============ */}
        {(unes?.ateliers?.length ?? 0) > 0 || (unes?.formations?.length ?? 0) > 0 ? (
          <section id="marketplace" className="section">
            {(unes?.ateliers?.length ?? 0) > 0 ? (
              <div className="space-y-6">
                <Reveal className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-2xl">
                    <span className="eyebrow">Sans compte, sans engagement</span>
                    <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
                      Les ateliers les mieux notés
                    </h2>
                    <p className="mt-2 text-muted-foreground">
                      Réservables en ligne ou sur devis, animés par des intervenants vérifiés.
                    </p>
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
                    <p className="mt-2 text-muted-foreground">
                      Sessions datées, attestation et certificat délivrés, émargement inclus.
                    </p>
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
          </section>
        ) : null}

        {/* ============ REJOINDRE LE RÉSEAU (vidéo à la demande) ============ */}
        <section className="bg-card">
          <div className="section">
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
              <Reveal>
                <span className="eyebrow">Être ou ne pas être ?</span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                  Rejoindre le réseau des Extras
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  Éducateurs spécialisés, moniteurs-éducateurs, AES, psychologues : ce que change
                  le fait de travailler en indépendant, raconté par ceux qui le font.
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
              </Reveal>
            </div>
          </div>
        </section>

        {/* ============ TARIFS ============ */}
        <section id="tarifs" className="scroll-mt-24">
          <div className="section">
            <Reveal className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Tarifs</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Vous ne payez que ce que vous utilisez
              </h2>
              <p className="mt-4 text-muted-foreground">
                Pas de frais d’entrée, pas d’engagement. Le prix de chaque atelier est affiché sur
                sa fiche, et l’intervenant touche l’intégralité de son tarif.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {[
                {
                  nom: 'À la prestation',
                  sous: 'Pour un besoin ponctuel, sans compte payant.',
                  prix: 'Prix de la fiche',
                  prixSous: 'Affiché sur chaque atelier et chaque formation',
                  points: [
                    'Devis chiffré sous 48 h',
                    'Contrat et facture générés automatiquement',
                    '0 % de commission prélevée sur l’intervenant',
                    'Paiement en ligne ou sur facture',
                  ],
                  href: '/ateliers',
                  action: 'Voir les prix du catalogue',
                  variant: 'outline' as const,
                  vedette: false,
                },
                {
                  nom: 'Crédits d’intervention',
                  sous: 'Un crédit = une réservation d’atelier. Valables sans limite de durée.',
                  prix: 'dès 7 €',
                  prixSuffixe: ' / crédit',
                  points: [
                    'Pack Découverte — 10 crédits, 90 €',
                    'Pack Équipe — 25 crédits, 200 € (8 €/crédit)',
                    'Pack Établissement — 60 crédits, 420 € (7 €/crédit)',
                    'Rechargement en ligne, facture immédiate',
                  ],
                  href: '/register',
                  action: 'Créer un compte',
                  variant: 'primary' as const,
                  vedette: true,
                },
                {
                  nom: 'Abonnement',
                  sous: 'Gérez aussi vos remplacements, ateliers et formations en interne.',
                  prix: '149 €',
                  prixSuffixe: ' / mois',
                  prixSous: 'Essentiel · Pro à 299 € / mois',
                  points: [
                    'Essentiel : 5 crédits offerts / mois, marketplace complète',
                    'Pro : 15 crédits offerts / mois, support prioritaire, statistiques',
                    'Planning, équipe, multi-unités et pointage',
                    'Coffre-fort de conformité et registre Qualiopi',
                  ],
                  href: '/contact',
                  action: 'Parler à l’équipe',
                  variant: 'outline' as const,
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

        {/* ============ PREUVE — une association, pas une startup ============ */}
        <section className="relative isolate overflow-hidden bg-neutral-950">
          <Image
            src="https://les-extras.fr/wp-content/uploads/2023/02/cerf-volant-game-enfant.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-25"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/85" aria-hidden />
          <div className="relative mx-auto max-w-[1100px] px-6 py-20 text-center md:py-28">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90">
                Une association, pas une startup
              </span>
              <blockquote className="mx-auto mt-8 max-w-3xl text-2xl font-semibold leading-snug text-white text-balance md:text-3xl">
                « Créer des dispositifs éducatifs innovants pour sécuriser les accompagnements,
                soutenir les professionnels et renforcer les compétences psychosociales des
                jeunes. »
              </blockquote>
              <p className="mt-4 text-sm text-white/70">La mission de l’ADéPA, depuis 2012</p>
            </Reveal>
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3 sm:divide-x sm:divide-white/15">
              {[
                { k: 'Depuis 2012', v: 'association loi 1901, active en France, au Maroc et au Sénégal' },
                { k: 'Qualiopi', v: 'organisme de formation certifié — vos formations sont finançables' },
                { k: '15 ateliers', v: 'documentés et animés par des intervenants du terrain' },
              ].map((f, i) => (
                <Reveal key={f.k} delay={i * 110}>
                  <div className="px-6">
                    <p className="text-2xl font-bold text-white">{f.k}</p>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{f.v}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal delay={150}>
              <Button asChild size="lg" variant="secondary" className="mt-12">
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
                  <p className="mt-3 max-w-xl text-muted-foreground">
                    Retours d’expérience, projets d’établissements, pratiques éducatives. En accès
                    libre, sans compte.
                  </p>
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

        {/* ============ GARANTIES + CTA FINAL ============ */}
        <section className="section">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Profils vérifiés', text: 'Diplômes et documents contrôlés, coffre-fort conformité.' },
              { icon: GraduationCap, title: 'Qualiopi', text: 'Formations certifiées, finançables par votre OPCO.' },
              { icon: Users, title: 'Multi-comptes', text: 'Gérez plusieurs structures et invitez vos équipes.' },
              { icon: HeartHandshake, title: 'Humain d’abord', text: 'Un outil pensé pour le soin, pas contre lui.' },
            ].map((v, i) => (
              <Reveal key={v.title} delay={i * 90} className="h-full">
                <div className="group h-full rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-card">
                  <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground transition-transform duration-300 group-hover:scale-105">
                    <v.icon className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-16">
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground shadow-card md:px-16">
              <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
              <div
                className="absolute -right-16 -top-16 size-64 rounded-full bg-secondary/20 blur-3xl animate-float"
                aria-hidden
              />
              <div className="relative mx-auto max-w-2xl">
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-balance">
                  Prêt à renforcer vos équipes, sereinement ?
                </h2>
                <p className="mt-4 text-primary-foreground/80">
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
                    className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
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
    </div>
  );
}
