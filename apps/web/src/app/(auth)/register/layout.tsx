import type { Metadata } from 'next';
import { SOCLE_OG } from '@/lib/meta';

// La page est un composant client (formulaire) : elle ne peut pas exporter de
// metadata. Ce layout minimal porte le titre — sans lui, /register gardait le
// titre générique du site dans l'onglet, les partages et les résultats Google.
export const metadata: Metadata = {
  title: 'Créer un compte',
  description:
    'Créez votre compte gratuit LES EXTRAS — établissement, professionnel indépendant ou salarié du médico-social.',
  alternates: { canonical: '/register' },
  // `SOCLE_OG` : cet objet remplace celui du layout racine au lieu de le
  // compléter (fusion en surface), il faut donc y réémettre l'image de
  // partage, le `siteName`, la locale et le `type`. Voir `lib/meta.ts`.
  openGraph: { ...SOCLE_OG, url: '/register', title: 'Créer un compte' },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
