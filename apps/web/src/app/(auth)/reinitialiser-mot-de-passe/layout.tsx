import type { Metadata } from 'next';
import { SOCLE_OG } from '@/lib/meta';

// Même montage que /login et que /mot-de-passe-oublie : la page est un
// composant client, elle ne peut pas exporter de metadata, et sans ce layout
// elle portait le titre générique du site. La canonique compte ici plus
// qu’ailleurs : l’adresse porte un jeton en paramètre, et chaque lien envoyé
// par courriel formait sinon une adresse distincte aux yeux d’un robot.
export const metadata: Metadata = {
  title: 'Choisir un nouveau mot de passe',
  description:
    'Choisissez un nouveau mot de passe pour votre espace LES EXTRAS à partir du lien reçu par courriel.',
  alternates: { canonical: '/reinitialiser-mot-de-passe' },
  openGraph: {
    ...SOCLE_OG,
    url: '/reinitialiser-mot-de-passe',
    title: 'Choisir un nouveau mot de passe',
  },
};

export default function ReinitialiserMotDePasseLayout({ children }: { children: React.ReactNode }) {
  return children;
}
