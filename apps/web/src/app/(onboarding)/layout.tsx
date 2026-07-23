import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Logo } from '@/components/brand/logo';

/**
 * Layout d'onboarding : nécessite une session valide, sinon renvoie vers /login.
 * Mise en page épurée et centrée.
 */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-warm-gradient">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
        <Logo />
        <span className="text-sm text-muted-foreground">{session.user.email}</span>
      </header>
      <main className="mx-auto flex max-w-2xl flex-col px-6 py-8 md:py-12">{children}</main>
    </div>
  );
}
