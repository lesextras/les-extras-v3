import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PartyPopper, Sparkles, ShieldCheck, CalendarClock, ArrowRight } from 'lucide-react';
import { getSession } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfettisArrivee } from '../../_shared/ConfettisArrivee';

export default async function WelcomePage({
  searchParams,
}: {
  searchParams?: { bienvenue?: string };
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const isEstablishment = session.activeAccount?.type === 'ESTABLISHMENT';
  const firstName = session.user.name?.split(' ')[0];

  return (
    <div className="animate-fade-in">
      <ConfettisArrivee actif={searchParams?.bienvenue === '1'} />
      <span className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
        <PartyPopper className="size-7" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight">
        Bienvenue{firstName ? `, ${firstName}` : ''} !
      </h1>
      <p className="mt-3 max-w-lg text-muted-foreground">
        Votre compte {isEstablishment ? 'établissement' : 'professionnel'} est créé. Encore
        quelques informations et vous serez prêt à{' '}
        {isEstablishment ? 'publier vos premiers renforts' : 'répondre à vos premières missions'}.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Sparkles, title: 'Profil', text: 'Complétez vos informations' },
          { icon: ShieldCheck, title: 'Documents', text: 'Ajoutez vos justificatifs' },
          { icon: CalendarClock, title: 'C’est parti', text: 'Accédez à votre espace' },
        ].map((s, i) => (
          <Card key={s.title}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary-soft text-xs font-bold text-accent-foreground">
                  {i + 1}
                </span>
                <s.icon className="size-4 text-primary" />
              </div>
              <p className="mt-3 text-sm font-semibold">{s.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{s.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/wizard">
            Compléter mon profil
            <ArrowRight />
          </Link>
        </Button>
        <Button asChild size="lg" variant="ghost">
          <Link href="/dashboard">Passer pour l’instant</Link>
        </Button>
      </div>
    </div>
  );
}
