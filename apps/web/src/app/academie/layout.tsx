import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { Fraunces, Nunito } from 'next/font/google';
import { getSession } from '@/lib/session';
import { Coque, NOM_SITE, ORIGINE_SITE } from './_ui';
import { COOKIE_ESPACE } from './_session';
import { cookies, headers } from 'next/headers';
import type { CompteAffiche, EspaceAffiche } from './BarreLaterale';

/**
 * PILOTER MON ACADÉMIE — pilote.toulali.fr/academie
 *
 * Le même déploiement, le même domaine et la même session que l'espace
 * association : ce qui change, c'est le compte actif (de type ACADEMIE) et la
 * couleur. La coque lit la session : les pages sont rendues à la demande.
 */

export const dynamic = 'force-dynamic';

const nunito = Nunito({ subsets: ['latin'], weight: ['400', '600', '700', '800'], variable: '--font-pilote', display: 'swap' });
const fraunces = Fraunces({ subsets: ['latin'], style: ['italic'], weight: ['600'], variable: '--font-pilote-serif', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(ORIGINE_SITE),
  title: {
    absolute: `${NOM_SITE}, par Toulali`,
    template: `%s · ${NOM_SITE}`,
  },
  description:
    "Déclarer ton organisme de formation, obtenir Qualiopi, ouvrir tes financements : douze étapes expliquées simplement, avec les preuves à réunir. Gratuit.",
  keywords: [
    'organisme de formation',
    'Qualiopi',
    'déclaration d\'activité',
    'NDA formation',
    'référentiel national qualité',
    'bilan pédagogique et financier',
    'EDOF CPF',
    'OPCO',
  ],
  applicationName: NOM_SITE,
  manifest: null,
  appleWebApp: { capable: false, title: NOM_SITE },
  icons: {
    icon: [
      { url: '/academie/favicon.svg', type: 'image/svg+xml' },
      { url: '/academie/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/academie/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/academie/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/academie/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/academie/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    siteName: NOM_SITE,
    locale: 'fr_FR',
    type: 'website',
    title: `${NOM_SITE}, par Toulali`,
    description:
      "Déclarer son organisme, obtenir Qualiopi, ouvrir ses financements : douze étapes expliquées simplement. Gratuit.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#1E9E6A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

/**
 * OÙ LES MENTIONS S'AFFICHENT.
 *
 * Le pied de page légal — qui porte l'outil, ce qu'il ne délivre pas, le don —
 * n'a de sens qu'aux endroits où l'on arrive : le tableau de bord, le chemin,
 * et le profil. Ailleurs, il alourdit un écran de travail. On le pose donc à
 * partir de l'adresse demandée, lue dans l'en-tête posé par le middleware.
 */
const PAGES_AVEC_MENTIONS = ['/academie', '/academie/mon-profil'];

function avecMentions(chemin: string) {
  if (PAGES_AVEC_MENTIONS.includes(chemin)) return true;
  return chemin === '/academie/chemin' || chemin.startsWith('/academie/chemin/');
}

export default async function AcademieLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const chemin = (await headers()).get('x-chemin') ?? '';
  let compte: CompteAffiche | null = null;

  if (session) {
    const tous = (session.accounts ?? []).length ? session.accounts! : session.account ? [session.account] : [];
    const academies = tous.filter((c) => (c.type as string) === 'ACADEMIE');
    // La préférence d'espace, si elle désigne bien l'une des académies.
    const voulu = (await cookies()).get(COOKIE_ESPACE)?.value;
    const active = (voulu ? academies.find((c) => c.id === voulu) : null) ?? academies[0] ?? null;

    const espaces: EspaceAffiche[] = tous
      .filter((c) => ['ACADEMIE', 'ASSOCIATION'].includes(c.type as string))
      .map((c) => ({ id: c.id, nom: c.name, type: c.type as string }));

    compte = {
      nom: active?.name ?? session.user.firstName ?? session.user.email,
      prenom: session.user.firstName ?? session.user.email.split('@')[0],
      espaceOuvert: Boolean(active),
      espaces,
      active: active?.id ?? null,
      administration: session.user.role === 'ADMIN',
    };
  }

  return (
    <div className={`${nunito.variable} ${fraunces.variable}`}>
      <Coque compte={compte} mentions={avecMentions(chemin)}>
        {children}
      </Coque>
    </div>
  );
}
