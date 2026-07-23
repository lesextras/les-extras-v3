import Link from 'next/link';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SiteHeader } from '@/components/marketing/site-header';
import { SiteFooter } from '@/components/marketing/site-footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function LandingPage() {
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
                Le renfort médico-social, sereinement
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-foreground text-balance md:text-5xl lg:text-6xl">
                Trouvez le bon renfort,
                <span className="text-gradient-brand"> au bon moment.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg text-muted-foreground text-balance">
                LES EXTRAS relie les établissements (MECS, IME, ITEP, EHPAD, SESSAD) aux
                professionnels indépendants du secteur. Publiez un besoin urgent, réservez un
                atelier, gérez tout depuis un seul espace.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/register">
                    Commencer gratuitement
                    <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/#comment">Voir comment ça marche</Link>
                </Button>
              </div>
              <dl className="mt-10 grid max-w-lg grid-cols-3 gap-6">
                {[
                  { k: '48 h', v: 'délai moyen pour être renforcé' },
                  { k: '1 200+', v: 'professionnels qualifiés' },
                  { k: '4,8/5', v: 'satisfaction établissements' },
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

        {/* DEUX PILIERS : Renfort + Ateliers */}
        <section id="renfort" className="section">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">Deux services, un seul espace</span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Répondez à l’urgence, enrichissez l’accompagnement
            </h2>
            <p className="mt-4 text-muted-foreground">
              Que vous cherchiez un remplacement de dernière minute ou un atelier thématique, LES
              EXTRAS couvre tous vos besoins de renfort.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
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
                  href="/register"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-transform group-hover:translate-x-0.5"
                >
                  Explorer le catalogue <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
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

        {/* CTA FINAL */}
        <section id="tarifs" className="section pt-0">
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
