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

  // Images de couverture pour les trois domaines d'action, prises dans le
  // catalogue réel plutôt que dans une banque d'images.
  const visuels = featuredItems.map((i) => i.images?.[0]).filter(Boolean) as string[];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main id="main" className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden bg-warm-gradient">
          <div className="absolute inset-0 bg-grid opacity-60" aria-hidden />
          <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-20 md:py-28 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="animate-fade-in">
              <span className="eyebrow">
                <Sparkles className="size-3.5" />
                Ateliers &amp; formations courtes pour le médico-social
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-foreground text-balance md:text-5xl lg:text-6xl">
                Des interventions prêtes à réserver,
                <span className="text-gradient-brand"> pour vos publics et vos équipes.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground text-balance">
                Analyse des pratiques, médiation, prévention, spécialisations métier : un
                catalogue d’ateliers et de formations animés par des intervenants vérifiés.
                Réservation en ligne, devis chiffré en 48 h, contrat et facture automatiques.
                Et quand l’urgence arrive, le SOS Renfort prend le relais.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/ateliers">
                    Explorer le catalogue
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/#renfort">Besoin d’un renfort urgent ?</Link>
                </Button>
              </div>

              <HeroSearch />
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
                {[
                  { k: `${catalogueTotal}`, v: 'interventions au catalogue' },
                  { k: 'Qualiopi', v: 'formations finançables OPCO' },
                  { k: '48 h', v: 'pour recevoir votre devis' },
                ].map((s, i) => (
                  <div
                    key={s.k}
                    className={cn(
                      'animate-fade-in-up border-l border-border/70 pl-4 first:border-l-0 first:pl-0',
                      i === 1 && 'stagger-1',
                      i === 2 && 'stagger-2',
                    )}
                  >
                    <dt className="text-2xl font-bold tracking-tight text-foreground [font-variant-numeric:tabular-nums]">
                      {s.k}
                    </dt>
                    <dd className="mt-1 text-xs text-muted-foreground">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Carte visuelle "mission" */}
            <div className="relative animate-scale-in">
              <Card className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">
                      <Siren className="size-3" />
                      SOS Renfort
                    </Badge>
                    <span className="text-xs font-medium text-muted-foreground">Publié il y a 12 min</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">Éducateur spécialisé — nuit</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    MECS Les Tilleuls · Melun (77) · dès ce soir 21 h
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="soft">Internat</Badge>
                    <Badge variant="soft">Adolescents</Badge>
                    <Badge variant="soft">3 nuits</Badge>
                  </div>
                  <div className="mt-5 space-y-2 rounded-xl bg-muted/60 p-3">
                    {['Diffusion aux salariés', 'Puis réseau réservé', 'Enfin, ouverture publique'].map(
                      (step, i) => (
                        <div key={step} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className={i === 0 ? 'size-4 text-success' : 'size-4 text-muted-foreground'} />
                          <span className={i === 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                            {step}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                  <Button asChild className="mt-5 w-full">
                    <Link href="/register">Répondre à la mission</Link>
                  </Button>
                </CardContent>
              </Card>
              <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-border bg-card p-4 shadow-soft sm:block">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary-soft text-secondary">
                    <Star className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Booking confirmé</p>
                    <p className="text-xs text-muted-foreground">Contrat généré automatiquement</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONFIANCE */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 px-6 py-8 text-center">
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

        {/* NOS DOMAINES D'ACTIONS — reprise du site historique : trois portes
            d'entrée visuelles, avant tout discours. */}
        <section className="section">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Trois portes d’entrée</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Nos domaines d’actions
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                titre: 'Les ateliers de notre réseau',
                texte: 'Médiations éducatives clés en main, animées chez vous par un intervenant vérifié.',
                href: '/ateliers',
                icone: <Palette className="size-5" />,
                image: visuels[0],
              },
              {
                titre: 'Nos parcours de formations certifiés Qualiopi',
                texte: 'Montée en compétences des équipes, finançable par votre OPCO.',
                href: '/formations',
                icone: <GraduationCap className="size-5" />,
                image: visuels[1],
              },
              {
                titre: 'Le renfort d’équipe et parental',
                texte: 'Un professionnel disponible vite, pour absorber l’absence ou le surcroît.',
                href: '/#renfort',
                icone: <Megaphone className="size-5" />,
                image: visuels[2],
              },
            ].map((d) => (
              <Link key={d.titre} href={d.href} className="group block">
                <Card className="h-full overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-card">
                  <div className="relative aspect-[4/3] bg-muted">
                    {d.image ? (
                      <Image
                        src={d.image}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        unoptimized
                      />
                    ) : null}
                    <span className="absolute inset-0 bg-gradient-to-t from-primary/85 via-primary/25 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15 text-white backdrop-blur">
                        {d.icone}
                      </span>
                      <span className="text-lg font-bold leading-tight text-white text-balance">
                        {d.titre}
                      </span>
                    </span>
                  </div>
                  <CardContent className="flex items-center justify-between gap-3 p-5">
                    <p className="text-sm text-muted-foreground">{d.texte}</p>
                    <ArrowRight className="size-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* VOUS RECONNAISSEZ-VOUS ? — le bloc qui dit qui nous sommes et d'où
            l'on parle. C'est ce que le site historique faisait de mieux. */}
        <section id="association" className="bg-primary-soft/50">
          <div className="mx-auto max-w-[1000px] px-6 py-16 text-center md:py-24">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Vous reconnaissez-vous ?</h2>
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
