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
    default: `${NOM_SITE} — par Toulali`,
    template: `%s · ${NOM_SITE}`,
  },
  description:
    "Vérifiez en une minute si votre association a les pièces qu'un financeur demande, suivez le chemin étape par étape, et trouvez le bon outil pour chaque besoin. Gratuit, sans compte.",
  openGraph: {
    siteName: NOM_SITE,
    locale: 'fr_FR',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function AssociationLayout({ children }: { children: ReactNode }) {
  return <Coque>{children}</Coque>;
}
