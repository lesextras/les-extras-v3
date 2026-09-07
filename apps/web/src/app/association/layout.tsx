import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Nunito } from 'next/font/google';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { Coque, NOM_SITE, ORIGINE_SITE } from './_ui';
import { COOKIE_ESPACE } from './_session';
import type { CompteAffiche, EspaceAffiche } from './BarreLaterale';

/**
 * PILOTER MON ASSOCIATION — pilote.toulali.fr
 *
 * Ce groupe de routes est servi sous son propre domaine par le middleware.
 * La coque lit la session (pour afficher qui est connecté) : les pages sont
 * donc rendues à la demande. Tout ce qui est public le reste.
 */

export const dynamic = 'force-dynamic';

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800'], variable: '--font-pilote', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], style: ['italic'], weight: ['600'], variable: '--font-pilote-serif', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(ORIGINE_SITE),
  title: {
    absolute: `${NOM_SITE} — par Toulali`,
    template: `%s · ${NOM_SITE}`,
  },
  description:
    "Le chemin étape par étape pour faire naître ton association, la faire vivre et demander une subvention : chaque étape expliquée simplement, avec les formulaires CERFA et des documents exemples. Gratuit.",
  keywords: ['subvention association', 'dossier de subvention', 'créer une association', 'SIRET association', 'RNA', 'FDVA', 'CERFA 12156', 'appel à projets association'],
  applicationName: NOM_SITE,
  manifest: null,
  appleWebApp: { capable: false, title: NOM_SITE },
  icons: {
    icon: [
      { url: '/association/favicon.svg', type: 'image/svg+xml' },
      { url: '/association/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/association/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/association/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/association/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/association/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    siteName: NOM_SITE,
    locale: 'fr_FR',
    type: 'website',
    title: `${NOM_SITE} — par Toulali`,
    description:
      "Faire naître ton association, la faire vivre, demander une subvention : douze étapes expliquées simplement, avec les CERFA et des documents exemples. Gratuit.",
    images: [
      {
        url: '/association/partage-piloter.png',
        width: 1200,
        height: 630,
        alt: 'Piloter mon association, par Toulali : le chemin étape par étape jusqu’à la subvention.',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/association/partage-piloter.png'],
    title: `${NOM_SITE} — par Toulali`,
    description: 'Douze étapes expliquées simplement, jusqu’à la première subvention. Gratuit.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#4F46E5',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function AssociationLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  let compte: CompteAffiche | null = null;
  if (session) {
    const tous = (session.accounts ?? []).length ? session.accounts! : session.account ? [session.account] : [];
    const associations = tous.filter((c) => (c.type as string) === 'ASSOCIATION');
    // La préférence d'espace, si elle désigne bien l'une des associations.
    const voulu = (await cookies()).get(COOKIE_ESPACE)?.value;
    const association = (voulu ? associations.find((c) => c.id === voulu) : null) ?? associations[0] ?? null;

    // Tous ses espaces, associations ET académies : le menu du haut les liste.
    const espaces: EspaceAffiche[] = tous
      .filter((c) => ['ASSOCIATION', 'ACADEMIE'].includes(c.type as string))
      .map((c) => ({ id: c.id, nom: c.name, type: c.type as string }));

    compte = {
      nom: association?.name ?? session.user.firstName ?? session.user.email,
      prenom: session.user.firstName ?? session.user.email.split('@')[0],
      espaceOuvert: Boolean(association),
      espaces,
      active: association?.id ?? null,
    };
  }
  return (
    <div className={`${nunito.variable} ${fraunces.variable}`}>
      <Coque compte={compte}>{children}</Coque>
    </div>
  );
}
