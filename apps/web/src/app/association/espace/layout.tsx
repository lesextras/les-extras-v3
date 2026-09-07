import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { sessionAssociation } from '../_session';
import { NavigationEspace } from './NavigationEspace';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mon espace',
  robots: { index: false, follow: false },
};

export default async function EspaceLayout({ children }: { children: ReactNode }) {
  const { compte } = await sessionAssociation();
  return (
    <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <NavigationEspace nomCompte={compte.name} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
