import type { Metadata } from 'next';
import { SOCLE_OG } from '@/lib/meta';

// Même cas que /login : la page est un composant client, elle ne peut pas
// exporter de metadata. Sans ce layout, « Mot de passe oublié » portait le
// titre générique du site dans l’onglet, dans les partages et dans les
// résultats de recherche, et n’annonçait aucune canonique. La page reste en
// noindex : la directive vient du layout du groupe (auth), et la fusion de
// Next la conserve champ par champ.
export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  description:
    'Recevez un lien pour choisir un nouveau mot de passe et retrouver l’accès à votre espace LES EXTRAS.',
  alternates: { canonical: '/mot-de-passe-oublie' },
  openGraph: {
    ...SOCLE_OG,
    url: '/mot-de-passe-oublie',
    title: 'Mot de passe oublié',
  },
};

export default function MotDePasseOublieLayout({ children }: { children: React.ReactNode }) {
  return children;
}
