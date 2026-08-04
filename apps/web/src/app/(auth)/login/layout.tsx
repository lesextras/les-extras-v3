import type { Metadata } from 'next';

// La page est un composant client (formulaire) : elle ne peut pas exporter de
// metadata. Ce layout minimal porte le titre — sans lui, /login gardait le
// titre générique du site dans l'onglet, les partages et les résultats Google.
export const metadata: Metadata = {
  title: 'Se connecter',
  description:
    'Connectez-vous à votre espace LES EXTRAS : renforts, ateliers, formations et gestion de votre activité.',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
