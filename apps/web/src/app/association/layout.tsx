import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Coque, NOM_SITE, ORIGINE_SITE } from './_ui';

/**
 * PILOTER MON ASSOCIATION — association.toulali.fr
 *
 * Ce groupe de routes est servi sous son propre domaine par le middleware.
 * Il ne lit jamais la session : tout ce qui est ici est public.
 */

export const revalidate = 300;

export const metadata: Metadata = {
  metadataBase: new URL(ORIGINE_SITE),
  title: {
    absolute: `${NOM_SITE} — par Toulali`,
    template: `%s · ${NOM_SITE}`,
  },
  description:
    "Vérifiez en une minute si votre association a les pièces qu'un financeur demande, suivez le chemin étape par étape, et trouvez le bon outil pour chaque besoin. Gratuit, sans compte.",
  keywords: ['subvention association', 'dossier de subvention', 'créer une association', 'SIRET association', 'RNA', 'FDVA', 'CERFA 12156'],
  applicationName: NOM_SITE,
  manifest: null,
  appleWebApp: { capable: false, title: NOM_SITE },
  openGraph: {
    siteName: NOM_SITE,
    locale: 'fr_FR',
    type: 'website',
    title: `${NOM_SITE} — par Toulali`,
    description:
      "Vérifiez si votre association a les pièces qu'un financeur demande, suivez le chemin étape par étape, trouvez le bon outil. Gratuit, sans compte.",
  },
  twitter: {
    card: 'summary',
    title: `${NOM_SITE} — par Toulali`,
    description: "Votre association est-elle prête à demander une subvention ? Vérifiez-le en une minute, gratuitement.",
  },
  robots: { index: true, follow: true },
};

export default function AssociationLayout({ children }: { children: ReactNode }) {
  return <Coque>{children}</Coque>;
}
