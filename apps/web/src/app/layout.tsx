import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'LES EXTRAS — Le renfort médico-social, sereinement',
    template: '%s · LES EXTRAS',
  },
  description:
    'La marketplace qui relie les établissements médico-sociaux aux professionnels indépendants : SOS Renfort en urgence et ateliers d’intervention. Simple, humain, fiable.',
  keywords: [
    'renfort médico-social',
    'remplacement éducateur',
    'MECS',
    'IME',
    'ITEP',
    'EHPAD',
    'freelance médico-social',
    'ateliers éducatifs',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    title: 'LES EXTRAS — Le renfort médico-social, sereinement',
    description:
      'SOS Renfort en urgence et catalogue d’ateliers. La marketplace du secteur médico-social.',
    siteName: 'LES EXTRAS',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#0D7377',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-card focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Aller au contenu
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
