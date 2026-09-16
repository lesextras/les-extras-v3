import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';
import { PwaRegister } from './_shared/PwaRegister';
import { BandeauCookies } from './_shared/BandeauCookies';
import { CaptureSource } from './_shared/CaptureSource';
import { CompteurVues } from './_shared/CompteurVues';
import { MesureAudience } from './_shared/MesureAudience';
import { InstallPrompt } from './_shared/InstallPrompt';
import { SaufAssociation } from './_shared/SaufAssociation';

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
    default: 'LES EXTRAS, Ateliers et formations pour le médico-social',
    template: '%s · LES EXTRAS',
  },
  // Description de l'accueil (et repli des pages qui n'en posent pas).
  //
  // ⚠ 155 CARACTÈRES MAXIMUM, ET LE COMPTE SE VÉRIFIE. Le commentaire précédent
  // annonçait 155 ; la phrase en faisait 171, et Google la coupait en plein
  // milieu de « dossier de conformité par interv… ». Celle-ci en fait 145,
  // mesurés. Elle dit aussi ce qui nous distingue vraiment — 0 % de commission —
  // là où l'ancienne vantait la « réservation en ligne », que tout le monde a.
  description:
    'Ateliers et formations courtes pour le médico-social : devis en 48 h, contrat et facture automatiques, 0 % de commission. Et le renfort d’équipe.',
  keywords: [
    'atelier médico-social',
    'formation médico-social',
    'analyse des pratiques professionnelles',
    'intervention MECS IME ITEP',
    'formation Qualiopi médico-social',
    'renfort médico-social',
    'remplacement éducateur',
    'EHPAD',
    /*
      ⚠ « FREELANCE » A ÉTÉ RETIRÉ D'ICI LE 16/09/2026, ET NE DOIT PAS REVENIR.

      C'est le vocabulaire que le Conseil d'État a écarté le 11/02/2025
      (n° 491128) : un remplacement de poste en établissement ne se fait pas
      sous statut d'indépendant. On écrit « remplaçant en CDD » pour le renfort
      et « intervenant » pour les ateliers — partout, y compris dans les
      métadonnées que personne ne lit. Une balise `keywords` ne pèse rien pour
      Google depuis 2009 ; le mot, lui, pèse le jour où quelqu'un cite la page.
    */
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    // PAS d'`url` ici. Ce champ ne se recalcule pas par page : toute page qui
    // ne pose pas le sien héritait de « / » et annonçait donc l'accueil comme
    // adresse canonique de partage — vingt-deux pages le faisaient, dont les
    // six pages ville et les deux calculateurs, c'est-à-dire précisément
    // celles qu'on partage. L'accueil pose le sien dans `app/page.tsx`.
    title: 'LES EXTRAS, Ateliers et formations pour le médico-social',
    description:
      'Ateliers et formations courtes réservables en ligne, devis en 48 h, dossier de conformité par intervenant. Et le renfort d’équipe quand l’urgence arrive.',
    siteName: 'LES EXTRAS',
    // Carte de partage 1200×630. Sans elle, LinkedIn et Facebook affichent un
    // rectangle gris à la place du lien — le pire format possible pour une
    // annonce payante, dont le visuel est justement ce qui arrête le regard.
    images: [
      {
        url: '/images/partage-les-extras.jpg',
        width: 1200,
        height: 630,
        alt: 'LES EXTRAS, ateliers éducatifs, formations Qualiopi et renfort d’équipe pour le médico-social',
      },
    ],
  },
  twitter: {
    // « summary » affiche une vignette minuscule ; le grand format double la
    // surface cliquable dans un fil.
    card: 'summary_large_image',
    title: 'LES EXTRAS, Ateliers et formations pour le médico-social',
    description:
      'Ateliers et formations courtes réservables en ligne, devis en 48 h, dossier de conformité par intervenant.',
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
      // `sameAs` est le champ par lequel Google relie une entité à ses comptes
      // officiels. Tant qu'il ne déclarait qu'adepa77.fr, le site et les autres
      // propriétés de l'association étaient, pour Google, sans rapport entre
      // elles — y compris LinkedIn, d'où vient la totalité du trafic social.
      //
      // Chaque adresse ci-dessous a été VÉRIFIÉE en direct : les trois sites
      // répondent, le profil LinkedIn est celui que le pied de page
      // d'adepa77.fr publie déjà, et l'adresse de la Page entreprise a été
      // relevée depuis son administration (Page 85858241) — pas devinée.
      sameAs: [
        'https://adepa77.fr',
        'https://toulali.fr',
        'https://a2pa.fr',
        'https://www.linkedin.com/company/les-extras-adepa/',
        'https://www.linkedin.com/in/association-adepa-b98ba5405/',
      ],
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
            basculer : un clignotement désagréable à chaque navigation.

            Tant que personne n'a choisi, on ne pose RIEN : chaque espace garde
            alors son fond d'origine : charbon pour l'accueil, ivoire pour
            l'espace connecté. L'attribut n'apparaît qu'après un clic sur la
            bascule, et il vaut alors pour tout le site. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=localStorage.getItem('lesextras-theme');if(c==='clair'||c==='sombre'){document.documentElement.dataset.theme=c;}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {/* Identité schema.org du site : voir IDENTITE_STRUCTUREE ci-dessus.
            Elle décrit LES EXTRAS : elle n'a pas sa place sur association.toulali.fr. */}
        <SaufAssociation>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(IDENTITE_STRUCTUREE) }}
          />
        </SaufAssociation>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-card focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Aller au contenu
        </a>
        <Providers>
          {children}
          {/* Les compagnons de Les Extras ne s'affichent pas sur
              association.toulali.fr, servi par ce même déploiement. */}
          <SaufAssociation>
            <PwaRegister />
            <InstallPrompt />
            <BandeauCookies />
            <CaptureSource />
            <MesureAudience />
            <CompteurVues />
          </SaufAssociation>
        </Providers>
      </body>
    </html>
  );
}
