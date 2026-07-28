import Link from 'next/link';
import Image from 'next/image';
import {
  Siren,
  GraduationCap,
  ShieldCheck,
  Clock,
  HeartHandshake,
  Users,
  ArrowRight,
  CheckCircle2,
  Star,
  Building2,
  Sparkles,
  Newspaper,
  Megaphone,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchPublic } from './_shared/server';
import { SERVICE_CATEGORY_LABEL, formatMoney } from './_shared/format';
import type { CatalogItem } from './(public)/_catalog';
import { OfferCarousel, type OfferCard } from './_shared/OfferCarousel';
import { HeroSearch } from './_shared/HeroSearch';
import { VideoFacade } from './_shared/VideoFacade';

export default async function LandingPage() {
  // Mise en avant publique de quelques prestations publiées (sans connexion).
  const { data: featured } = await fetchPublic<{ items: CatalogItem[]; total?: number }>(
    '/public/catalog?type=all&take=3',
  );
  const featuredItems = featured?.items ?? [];
  const catalogueTotal = featured?.total ?? featuredItems.length;

  // Marketplace visible sans compte : les mieux notés, directement en page
  // d'accueil. Un visiteur doit voir l'offre avant qu'on lui demande son e-mail.
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
        {/* HERO — reprise du parti pris visuel de les-extras.fr : une grande
            photo sombre du terrain, un titre qui parle métier, la recherche
            immédiatement disponible. */}
        <section className="relative isolate overflow-hidden bg-[hsl(217,62%,12%)]">
          <Image
            src="https://les-extras.fr/wp-content/uploads/2023/04/cropped-groupe-id-3-1.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-40"
            unoptimized
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-[hsl(217,62%,10%)]/80 via-[hsl(217,62%,12%)]/60 to-[hsl(217,62%,14%)]/95"
            aria-hidden
          />
          <div className="relative mx-auto flex min-h-[88vh] max-w-[1100px] flex-col items-center justify-center px-6 py-24 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur">
              <Sparkles className="size-3.5" />
              Le dispositif de l’association ADéPA
            </span>
            <h1 className="mx-auto mt-8 max-w-4xl text-4xl font-bold leading-[1.06] tracking-tight text-white text-balance sm:text-5xl md:text-6xl lg:text-[4.2rem]">
              Des interventions à fort impact,{' '}
              <span className="text-[hsl(14,72%,62%)]">portées par ceux qui font le terrain.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-white/80 text-balance md:text-xl">
              Un réseau d’indépendants du médico-social. Des ateliers et des formations
              spécialisées, ancrés dans le réel de chacun — à réserver en ligne, avec devis,
              contrat et facture générés automatiquement.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="shadow-card">
                <Link href="/ateliers">
                  Explorer les ateliers
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                <Link href="/catalogue">Demander notre catalogue</Link>
              </Button>
            </div>

            <div className="mt-10 w-full max-w-3xl">
              <HeroSearch />
            </div>

            <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-6">
              {[
                { k: `${catalogueTotal}`, v: 'interventions au catalogue' },
                { k: 'Qualiopi', v: 'formations finançables OPCO' },
                { k: '48 h', v: 'pour recevoir votre devis' },
              ].map((st) => (
                <div key={st.k}>
                  <dt className="text-2xl font-bold tracking-tight text-white [font-variant-numeric:tabular-nums] md:text-3xl">
                    {st.k}
                  </dt>
                  <dd className="mt-1 text-xs text-white/70">{st.v}</dd>
                </div>
              ))}
            </dl>
          </div>

        </section>

        {/* CONFIANCE */}
        <section className="bg-card">
          <div className="mx-auto flex max-w-[1360px] flex-col items-center gap-5 px-6 py-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Ils nous font confiance dans toute la France
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
              {['MECS', 'IME', 'ITEP', 'EHPAD', 'SESSAD', 'Foyers de vie'].map((t) => (
                <span key={t} className="text-lg font-bold tracking-tight text-foreground/70">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* NOS DOMAINES D'ACTIONS — trois grandes cartes éditoriales pleine
            image, texte en surimpression : le regard choisit sa porte d'entrée. */}
        <section className="section">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Trois portes d’entrée</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Nos domaines d’actions
            </h2>
          </div>
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
                image: 'https://les-extras.fr/wp-content/uploads/2023/03/adulte-pris-en-charge-400x357.jpg',
                action: 'Comprendre le renfort',
              },
            ].map((d) => (
              <Link key={d.titre} href={d.href} className="group relative block overflow-hidden rounded-3xl">
                <div className="relative aspect-[3/4] w-full bg-muted md:aspect-[4/5]">
                  <Image
                    src={d.image}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-[hsl(217,62%,12%)]/95 via-[hsl(217,62%,14%)]/35 to-transparent" />
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
            ))}
          </div>
        </section>

        {/* VOUS RECONNAISSEZ-VOUS ? — le bloc qui dit qui nous sommes et d'où
            l'on parle. C'est ce que le site historique faisait de mieux. */}
        <section id="association" className="bg-primary-soft/50">
          <div className="mx-auto max-w-[1000px] px-6 py-16 text-center md:py-24">
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">Vous reconnaissez-vous ?</h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg text-muted-foreground text-balance">
              Violences, décrochage, tensions d’équipe, conduites à risque, difficultés parentales,
              épuisement… Le quotidien complexe, on le connaît.
            </p>
            <p className="mx-auto mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Les Extras est le dispositif de l’association <strong className="font-semibold text-foreground">ADéPA</strong>{' '}
              (Association pour le Développement de l’Éducation Par l’Animation). Depuis sa création,
              l’ADéPA œuvre pour l’insertion sociale des enfants, des adolescents et des familles en
              difficulté par l’éducation, la prévention et l’animation. Nous créons des dispositifs
              éducatifs innovants pour sécuriser les accompagnements, soutenir les professionnels et
              renforcer les compétences psychosociales des jeunes.
            </p>

            <ol className="mt-12 grid gap-8 md:grid-cols-3">
              {[
                { n: '01', t: 'Visualisez les offres et les profils d’experts de notre réseau', i: <Users className="size-5" /> },
                { n: '02', t: 'Réservez en ligne ou faites une demande de devis', i: <HeartHandshake className="size-5" /> },
                { n: '03', t: 'La mission est réalisée. Consultez son compte rendu', i: <CheckCircle2 className="size-5" /> },
              ].map((e) => (
                <li key={e.n} className="flex flex-col items-center gap-3">
                  <span className="relative grid size-14 place-items-center rounded-2xl bg-card text-primary shadow-soft">
                    {e.i}
                    <span className="absolute -right-1 -top-1 grid size-6 place-items-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                      {e.n}
                    </span>
                  </span>
                  <p className="max-w-[15rem] text-sm font-medium text-foreground text-balance">{e.t}</p>
                </li>
              ))}
            </ol>

            <p className="mt-10 text-sm text-muted-foreground">
              Quelques étapes suffisent pour réserver votre intervenant.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/formations">Le centre de formation</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/notre-histoire">Découvrir l’association</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* LA PLATEFORME, PRODUIT PAR PRODUIT — chaque service expliqué avec
            son mini-tutoriel en trois gestes. C'est la réponse à « mais que
            fait le logiciel, concrètement ? ». */}
        <section id="produits" className="bg-card">
          <div className="section">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Visite guidée</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
                Tout ce que la plateforme fait pour vous
              </h2>
              <p className="mt-4 text-muted-foreground">
                Six services, un seul compte. Pour chacun : à quoi il sert, et comment il
                s’utilise en trois gestes.
              </p>
            </div>

            <div className="mt-16 space-y-24 md:space-y-32">
              {[
                {
                  titre: 'Les ateliers éducatifs',
                  pour: 'Établissements',
                  texte:
                    'Quinze médiations clés en main — psycho-boxe, slam, socio-esthétique, théâtre, musicothérapie… — animées chez vous par un intervenant vérifié. Le produit d’appel : une demi-journée, un budget de fonctionnement, une décision immédiate.',
                  image: 'https://les-extras.fr/wp-content/uploads/2023/02/PSYCHO-BOXE.png',
                  tuto: [
                    'Parcourez le catalogue et filtrez par public, ville ou budget.',
                    'Demandez un devis — même sans compte — ou réservez en ligne.',
                    'L’intervention a lieu ; le compte rendu vous revient avec des recommandations pour la suite.',
                  ],
                  href: '/ateliers',
                  lien: 'Parcourir les ateliers',
                },
                {
                  titre: 'Les formations certifiées Qualiopi',
                  pour: 'Équipes & responsables formation',
                  texte:
                    'Analyse des pratiques, prévention, spécialisations métier — en intra, dans votre structure. Portées par la certification Qualiopi d’ADéPA, donc finançables par votre OPCO. Émargements, attestations et registre sont générés par la plateforme.',
                  image: 'https://les-extras.fr/wp-content/uploads/2025/02/lever-vous.jpeg',
                  tuto: [
                    'Choisissez le parcours et la session qui correspondent à votre plan de compétences.',
                    'Nous vous aidons à monter le dossier de financement OPCO.',
                    'Pendant la session : émargement en ligne, attestations et certificats produits automatiquement.',
                  ],
                  href: '/formations',
                  lien: 'Voir les formations',
                },
                {
                  titre: 'Le SOS Renfort',
                  pour: 'Urgences de personnel',
                  texte:
                    'Une absence ce soir, un surcroît la semaine prochaine : publiez le besoin, la plateforme le diffuse en cascade — votre équipe d’abord, puis les intervenants déjà venus chez vous, enfin le réseau. Le premier qui accepte est engagé, le contrat est généré.',
                  image: 'https://les-extras.fr/wp-content/uploads/2023/03/adulte-pris-en-charge.jpg',
                  tuto: [
                    'Décrivez la mission : poste, dates, horaires, public accueilli.',
                    'La diffusion en cascade privilégie ceux qui connaissent déjà votre maison.',
                    'Premier accepté = mission pourvue. Contrat et facture suivent tout seuls.',
                  ],
                  href: '/#renfort',
                  lien: 'Comprendre le renfort',
                },
                {
                  titre: 'L’assistant d’écriture IA',
                  pour: 'Tous les professionnels',
                  texte:
                    'Vos notes brutes deviennent des écrits professionnels : notes d’observation, rapports de situation, transmissions, comptes rendus. Les noms sont masqués avant tout traitement, vos notes ne sont jamais stockées, et rien ne part sans votre relecture.',
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
                    'Chaque compte peut publier articles et actualités sur le fil public : retours d’expérience, projets, pratiques éducatives. Et les partager sur LinkedIn en un clic — votre travail devient votre meilleure publicité.',
                  image: 'https://les-extras.fr/wp-content/uploads/2025/02/prev-reseaux-sociaux.jpg',
                  tuto: [
                    'Écrivez dans l’éditeur : mise en forme simple, images, relecture.',
                    'Publiez — l’article apparaît sur l’Édublog, lisible par tous, sans compte.',
                    'Connectez LinkedIn une fois, puis partagez chaque article en un clic.',
                  ],
                  href: '/edublog',
                  lien: 'Lire l’Édublog',
                },
                {
                  titre: 'La gestion sans papier',
                  pour: 'Administratif',
                  texte:
                    'Devis chiffrés en ligne, contrats à double signature, factures PDF, pointage des heures validé par l’établissement, coffre-fort de conformité pour les pièces obligatoires des intervenants. Tout ce qui prenait des soirées se fait dans le même espace.',
                  image: 'https://les-extras.fr/wp-content/uploads/2023/03/video-atelier.webp',
                  tuto: [
                    'Le devis accepté devient réservation, puis contrat signé en ligne.',
                    'Les heures déclarées par l’intervenant sont validées par vous.',
                    'La facture PDF tombe dans votre espace ; les pièces de conformité sont suivies avec leurs échéances.',
                  ],
                  href: '/register',
                  lien: 'Ouvrir un compte',
                },
              ].map((prod, idx) => (
                <article
                  key={prod.titre}
                  className={cn(
                    'grid items-center gap-10 lg:grid-cols-2 lg:gap-20',
                    idx % 2 === 1 && 'lg:[&>*:first-child]:order-2',
                  )}
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted shadow-card">
                    <Image
                      src={prod.image}
                      alt={prod.titre}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                      unoptimized
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      {prod.pour}
                    </span>
                  </div>
                  <div>
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
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ÊTRE OU NE PAS ÊTRE ? — la vidéo du réseau, chargée seulement au clic. */}
        <section className="section">
          <div className="mx-auto max-w-[880px]">
            <div className="text-center">
              <span className="eyebrow">Être ou ne pas être ?</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Rejoindre le réseau des Extras
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Éducateurs spécialisés, moniteurs-éducateurs, AES, psychologues : ce que change le
                fait de travailler en indépendant, raconté par ceux qui le font.
              </p>
            </div>
            <div className="mt-8">
              <VideoFacade id="8dXRvZU5TQY" titre="Comment rejoindre Les Extras freelances" />
            </div>
            <div className="mt-6 text-center">
              <Button asChild variant="outline">
                <Link href="/register">Proposer mes services</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* DEUX PILIERS : Renfort + Ateliers */}
        <section id="renfort" className="section">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Deux services, un seul espace</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Enrichissez l’accompagnement, absorbez l’imprévu
            </h2>
            <p className="mt-4 text-muted-foreground">
              Commencez par un atelier ou une formation courte : planifiable, budgétable,
              réservable en ligne. Le renfort d’urgence est là quand il faut, sur la même
              plateforme et avec les mêmes intervenants.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            <Card id="ateliers" className="group card-interactive overflow-hidden">
              <CardContent className="p-8">
                <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-105">
                  <GraduationCap className="size-6" />
                </span>
                <h3 className="mt-5 text-xl font-semibold">Ateliers & Éducat’heures</h3>
                <p className="mt-2 text-muted-foreground">
                  Un catalogue d’interventions clé en main : ateliers éducatifs, médiation,
                  art-thérapie, prévention, analyse des pratiques.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    'Catalogue thématique filtrable',
                    'Réservation et planification en ligne',
                    'Intervenants vérifiés et notés',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/ateliers"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-transform group-hover:translate-x-0.5"
                >
                  Explorer le catalogue <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>

            <Card className="group card-interactive overflow-hidden">
              <CardContent className="p-8">
                <span className="grid size-12 place-items-center rounded-2xl bg-secondary-soft text-secondary transition-transform duration-300 group-hover:scale-105">
                  <Siren className="size-6" />
                </span>
                <h3 className="mt-5 text-xl font-semibold">SOS Renfort</h3>
                <p className="mt-2 text-muted-foreground">
                  Publiez une mission en 2 minutes. Notre diffusion en cascade
                  (salariés → réseau réservé → public) trouve le bon professionnel, vite.
                </p>
                <ul className="mt-5 space-y-2.5">
                  {[
                    'Remplacements urgents jour & nuit',
                    'Candidatures centralisées et qualifiées',
                    'Contrat et facturation générés automatiquement',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary transition-transform group-hover:translate-x-0.5"
                >
                  Publier un renfort <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* MARKETPLACE EN ACCÈS LIBRE — les mieux notés, sans connexion */}
        {(unes?.ateliers?.length ?? 0) > 0 || (unes?.formations?.length ?? 0) > 0 ? (
          <section id="marketplace" className="section">
            {(unes?.ateliers?.length ?? 0) > 0 ? (
              <div className="space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
                </div>
                <OfferCarousel items={unes!.ateliers} basePath="/ateliers" />
              </div>
            ) : null}

            {(unes?.formations?.length ?? 0) > 0 ? (
              <div className="mt-16 space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
                </div>
                <OfferCarousel items={unes!.formations} basePath="/formations" useSlug />
              </div>
            ) : null}
          </section>
        ) : null}

        {/* CATALOGUES PUBLICS : ateliers & formations, consultables sans compte */}
        <section id="catalogues" className="bg-card">
          <div className="section">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <span className="eyebrow">Consultable sans compte</span>
                <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                  Parcourez nos ateliers & formations
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Un aperçu des interventions et parcours proposés par nos intervenants.
                  Explorez librement, réservez une fois connecté.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href="/ateliers">
                    Tous les ateliers <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/formations">
                    Toutes les formations <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {featuredItems.length > 0 ? (
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {featuredItems.map((item) => (
                  <Card key={item.id} className="group card-interactive flex h-full flex-col">
                    <CardContent className="flex flex-1 flex-col gap-3 p-6">
                      <Badge variant="soft" className="w-fit">
                        {item.categoryRef?.title ?? SERVICE_CATEGORY_LABEL[item.category]}
                      </Badge>
                      <h3 className="text-lg font-semibold leading-snug">{item.title}</h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {item.description}
                      </p>
                      <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4">
                        <span className="font-semibold">{formatMoney(item.price)}</span>
                        <Link
                          href={`/ateliers/${item.id}`}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-transform group-hover:translate-x-0.5"
                        >
                          Voir <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="mt-12 grid gap-6 md:grid-cols-2">
                <Card className="card-interactive">
                  <CardContent className="flex flex-col gap-3 p-8">
                    <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                      <GraduationCap className="size-6" />
                    </span>
                    <h3 className="text-xl font-semibold">Catalogue d’ateliers</h3>
                    <p className="text-muted-foreground">
                      Ateliers éducatifs, médiation, art-thérapie, prévention.
                    </p>
                    <Link
                      href="/ateliers"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                    >
                      Découvrir les ateliers <ArrowRight className="size-4" />
                    </Link>
                  </CardContent>
                </Card>
                <Card className="card-interactive">
                  <CardContent className="flex flex-col gap-3 p-8">
                    <span className="grid size-12 place-items-center rounded-2xl bg-secondary-soft text-secondary">
                      <Sparkles className="size-6" />
                    </span>
                    <h3 className="text-xl font-semibold">Catalogue de formations</h3>
                    <p className="text-muted-foreground">
                      Montez en compétences avec des formations dédiées au médico-social.
                    </p>
                    <Link
                      href="/formations"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary"
                    >
                      Découvrir les formations <ArrowRight className="size-4" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>

        {/* COMMENT ÇA MARCHE */}
        <section id="comment" className="bg-card">
          <div className="section">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Comment ça marche</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Trois étapes, zéro friction
              </h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: Building2,
                  title: 'Créez votre compte',
                  text: 'Établissement ou freelance, complétez votre profil vérifié en quelques minutes.',
                },
                {
                  icon: Siren,
                  title: 'Publiez ou postulez',
                  text: 'Diffusez un besoin de renfort ou répondez aux missions qui vous correspondent.',
                },
                {
                  icon: HeartHandshake,
                  title: 'Collaborez sereinement',
                  text: 'Contrats, planning, messagerie, factures et avis : tout est réuni au même endroit.',
                },
              ].map((step, i) => (
                <div key={step.title} className="group relative">
                  <span className="absolute -top-3 left-0 text-6xl font-bold text-primary/10 transition-colors duration-300 group-hover:text-primary/15">
                    {i + 1}
                  </span>
                  <div className="relative pt-6">
                    <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card">
                      <step.icon className="size-6" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VALEURS / RÉASSURANCE */}
        <section className="section">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Profils vérifiés', text: 'Diplômes et documents contrôlés, coffre-fort conformité.' },
              { icon: Clock, title: 'Réactivité', text: 'Diffusion intelligente pour combler les postes plus vite.' },
              { icon: Users, title: 'Multi-comptes', text: 'Gérez plusieurs structures et invitez vos équipes.' },
              { icon: HeartHandshake, title: 'Humain d’abord', text: 'Un outil pensé pour le soin, pas contre lui.' },
            ].map((v) => (
              <div
                key={v.title}
                className="group rounded-2xl border border-border/70 bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-card"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-accent text-accent-foreground transition-transform duration-300 group-hover:scale-105">
                  <v.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{v.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TARIFS — montants repris de la configuration de facturation reelle
            (packs de credits et plans d'abonnement definis cote API). */}
        <section id="tarifs" className="bg-card">
          <div className="section">
            <div className="mx-auto max-w-2xl text-center">
              <span className="eyebrow">Tarifs</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
                Vous ne payez que ce que vous utilisez
              </h2>
              <p className="mt-4 text-muted-foreground">
                Pas de frais d’entrée, pas d’engagement. Le prix de chaque atelier est affiché
                sur sa fiche, et l’intervenant touche l’intégralité de son tarif.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-3">
              {/* 1. À la prestation */}
              <Card className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-8">
                  <h3 className="text-lg font-semibold">À la prestation</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Pour un besoin ponctuel, sans compte payant.
                  </p>
                  <p className="mt-6 text-3xl font-bold tracking-tight">Prix de la fiche</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Affiché sur chaque atelier et chaque formation
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {[
                      'Devis chiffré sous 48 h',
                      'Contrat et facture générés automatiquement',
                      '0 % de commission prélevée sur l’intervenant',
                      'Paiement en ligne ou sur facture',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="mt-6 w-full">
                    <Link href="/ateliers">Voir les prix du catalogue</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* 2. Crédits */}
              <Card className="flex flex-col border-primary/40 shadow-card">
                <CardContent className="flex flex-1 flex-col p-8">
                  <Badge className="w-fit">Le plus choisi</Badge>
                  <h3 className="mt-3 text-lg font-semibold">Crédits d’intervention</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Un crédit = une réservation d’atelier. Valables sans limite de durée.
                  </p>
                  <p className="mt-6 text-3xl font-bold tracking-tight">
                    dès 7 €<span className="text-base font-normal text-muted-foreground"> / crédit</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {[
                      'Pack Découverte — 10 crédits, 90 €',
                      'Pack Équipe — 25 crédits, 200 € (8 €/crédit)',
                      'Pack Établissement — 60 crédits, 420 € (7 €/crédit)',
                      'Rechargement en ligne, facture immédiate',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="mt-6 w-full">
                    <Link href="/register">Créer un compte</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* 3. Abonnement de gestion interne */}
              <Card className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-8">
                  <h3 className="text-lg font-semibold">Abonnement</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Gérez aussi vos remplacements, ateliers et formations en interne.
                  </p>
                  <p className="mt-6 text-3xl font-bold tracking-tight">
                    149 €<span className="text-base font-normal text-muted-foreground"> / mois</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Essentiel · Pro à 299 € / mois
                  </p>
                  <ul className="mt-6 flex-1 space-y-2.5">
                    {[
                      'Essentiel : 5 crédits offerts / mois, marketplace complète',
                      'Pro : 15 crédits offerts / mois, support prioritaire, statistiques',
                      'Planning, équipe, multi-unités et pointage',
                      'Coffre-fort de conformité et registre Qualiopi',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="outline" className="mt-6 w-full">
                    <Link href="/contact">Parler à l’équipe</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Montants hors taxes. Les formations portées par la certification Qualiopi d’ADéPA
              sont finançables par votre OPCO.
            </p>
          </div>
        </section>

        {/* ÉDUBLOG — le contenu frais, en accès libre. */}
        {articles.length > 0 ? (
          <section className="bg-card">
            <div className="section">
              <div className="flex flex-wrap items-end justify-between gap-4">
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
              </div>

              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {articles.map((a) => (
                  <Link key={a.id} href={`/edublog/${a.slug}`} className="group">
                    <Card className="h-full overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-card">
                      {a.coverUrl ? (
                        <div className="relative aspect-[16/10] bg-muted">
                          <Image
                            src={a.coverUrl}
                            alt=""
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover"
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
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* CTA FINAL */}
        <section className="section pt-0">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground shadow-card md:px-16">
            <div className="absolute inset-0 bg-grid opacity-10" aria-hidden />
            <div
              className="absolute -right-16 -top-16 size-64 rounded-full bg-secondary/20 blur-3xl"
              aria-hidden
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-balance">
                Prêt à renforcer vos équipes, sereinement ?
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
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
