import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';
import { PwaRegister } from './_shared/PwaRegister';
import { BandeauCookies } from './_shared/BandeauCookies';
import { CaptureSource } from './_shared/CaptureSource';
import { MesureAudience } from './_shared/MesureAudience';
import { InstallPrompt } from './_shared/InstallPrompt';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  // Sans base explicite, Next retombe sur localhost et TOUTES les URL
  // canoniques et images Open Graph du site pointent vers la machine de dev.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.WEB_PUBLIC_URL ??
      'https://les-extras.fr',
  ),
  title: {
    default: 'LES EXTRAS — Ateliers et formations pour le médico-social',
    template: '%s · LES EXTRAS',
  },
  // Description de l'accueil (et repli des pages qui n'en posent pas) : 160
  // caractères au maximum, sinon Google coupe la phrase en plein milieu dans
  // ses résultats. Celle-ci en fait 155 — même offre, dite plus court.
  description:
    'Ateliers et formations courtes pour les établissements médico-sociaux : réservation en ligne, devis en 48 h, intervenants vérifiés. Et le renfort d’équipe.',
  keywords: [
    'atelier médico-social',
    'formation médico-social',
    'analyse des pratiques professionnelles',
    'intervention MECS IME ITEP',
    'formation Qualiopi médico-social',
    'renfort médico-social',
    'remplacement éducateur',
    'EHPAD',
    'freelance médico-social',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    // PAS d'`url` ici. Ce champ ne se recalcule pas par page : toute page qui
    // ne pose pas le sien héritait de « / » et annonçait donc l'accueil comme
    // adresse canonique de partage — vingt-deux pages le faisaient, dont les
    // six pages ville et les deux calculateurs, c'est-à-dire précisément
    // celles qu'on partage. L'accueil pose le sien dans `app/page.tsx`.
    title: 'LES EXTRAS — Ateliers et formations pour le médico-social',
    description:
      'Ateliers et formations courtes réservables en ligne, devis en 48 h, intervenants vérifiés. Et le renfort d’équipe quand l’urgence arrive.',
    siteName: 'LES EXTRAS',
    // Carte de partage 1200×630. Sans elle, LinkedIn et Facebook affichent un
    // rectangle gris à la place du lien — le pire format possible pour une
    // annonce payante, dont le visuel est justement ce qui arrête le regard.
    images: [
      {
        url: '/images/partage-les-extras.jpg',
        width: 1200,
        height: 630,
        alt: 'LES EXTRAS — ateliers éducatifs, formations Qualiopi et renfort d’équipe pour le médico-social',
      },
    ],
  },
  twitter: {
    // « summary » affiche une vignette minuscule ; le grand format double la
    // surface cliquable dans un fil.
    card: 'summary_large_image',
    title: 'LES EXTRAS — Ateliers et formations pour le médico-social',
    description:
      'Ateliers et formations courtes réservables en ligne, devis en 48 h, intervenants vérifiés.',
    images: ['/images/partage-les-extras.jpg'],
  },
  robots: { index: true, follow: true },
  // PWA — l'app doit être installable sur l'écran d'accueil (RenforTeam se
  // consulte au téléphone). Manifeste servi par src/app/manifest.ts.
  applicationName: 'Les Extras',
  manifest: '/manifest.webmanifest',
  // Favicon « LEX » : l'onglet doit être reconnaissable au milieu de vingt autres.
  icons: {
    icon: [
      { url: '/icons/favicon.svg', type: 'image/svg+xml' },
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' }],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Les Extras',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#183767',
  width: 'device-width',
  initialScale: 1,
  // Plein écran sous les encoches (iPhone) en mode standalone.
  viewportFit: 'cover',
  // Le zoom reste autorisé : accessibilité avant tout.
  maximumScale: 5,
  userScalable: true,
};

/**
 * IDENTITÉ STRUCTURÉE DU SITE (schema.org), émise sur TOUTES les pages.
 *
 * Aucune page statique n'émettait de données structurées : Google devait
 * deviner qui édite le site, quel est son logo, et à quel autre site il se
 * rattache. Ces deux blocs répondent à ces trois questions une fois pour
 * toutes :
 *
 * - `Organization` relie le site à l'association qui le porte — et le champ
 *   `sameAs` vers adepa77.fr est la version lisible par machine du lien de
 *   légitimité entre les deux sites : deux propriétés d'un même éditeur, pas
 *   deux inconnus qui se citent.
 * - `WebSite` donne le nom canonique du site (c'est lui que Google affiche
 *   au-dessus du titre dans ses résultats).
 *
 * Tout ici est FACTUEL et déjà public sur /legal — rien d'inventé, rien de
 * promotionnel : les données structurées mensongères valent une pénalité.
 */
const IDENTITE_STRUCTUREE = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://les-extras.fr/#organisation',
      name: 'LES EXTRAS',
      // Identité telle qu'elle figure sur /legal — ni plus, ni moins.
      legalName: 'ADéPA',
      taxID: '82005185200011',
      url: 'https://les-extras.fr',
      logo: 'https://les-extras.fr/icons/icon-512.png',
      email: 'assoc.adepa@gmail.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '7 rue André Malraux',
        addressLocality: 'Melun',
        postalCode: '77000',
        addressCountry: 'FR',
      },
      areaServed: 'FR',
      sameAs: ['https://adepa77.fr'],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://les-extras.fr/#site',
      name: 'LES EXTRAS',
      url: 'https://les-extras.fr',
      inLanguage: 'fr-FR',
      publisher: { '@id': 'https://les-extras.fr/#organisation' },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Le thème est posé AVANT le premier pixel : sans ce script, une
            personne en mode clair verrait la page s'afficher en sombre puis
            basculer — un clignotement désagréable à chaque navigation. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=localStorage.getItem('lesextras-theme');document.documentElement.dataset.theme=(c==='clair')?'clair':'sombre';}catch(e){document.documentElement.dataset.theme='sombre';}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {/* Identité schema.org du site — voir IDENTITE_STRUCTUREE ci-dessus. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(IDENTITE_STRUCTUREE) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-card focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Aller au contenu
        </a>
        <Providers>
          {children}
          <PwaRegister />
          <InstallPrompt />
          <BandeauCookies />
          <CaptureSource />
          <MesureAudience />
        </Providers>
      </body>
    </html>
  );
}
