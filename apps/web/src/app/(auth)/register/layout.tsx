import type { Metadata } from 'next';

// La page est un composant client (formulaire) : elle ne peut pas exporter de
// metadata. Ce layout minimal porte le titre — sans lui, /register gardait le
// titre générique du site dans l'onglet, les partages et les résultats Google.
export const metadata: Metadata = {
  title: 'Créer un compte',
  description:
    'Créez votre compte gratuit LES EXTRAS — établissement, professionnel indépendant ou salarié du médico-social.',
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
