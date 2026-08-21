import type { Metadata } from 'next';
import { SOCLE_OG } from '@/lib/meta';

// La page est un composant client (formulaire) : elle ne peut pas exporter de
// metadata. Ce layout minimal porte le titre — sans lui, /login gardait le
// titre générique du site dans l'onglet, les partages et les résultats Google.
export const metadata: Metadata = {
  title: 'Se connecter',
  description:
    'Connectez-vous à votre espace LES EXTRAS : renforts, ateliers, formations et gestion de votre activité.',
  // /login figure dans le sitemap mais ne déclarait aucune canonique : Google
  // était libre d'indexer /login?next=… comme autant de pages distinctes.
  alternates: { canonical: '/login' },
  // `SOCLE_OG` : cet objet remplace celui du layout racine au lieu de le
  // compléter (fusion en surface), il faut donc y réémettre l'image de
  // partage, le `siteName`, la locale et le `type`. Voir `lib/meta.ts`.
  openGraph: { ...SOCLE_OG, url: '/login', title: 'Se connecter' },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
