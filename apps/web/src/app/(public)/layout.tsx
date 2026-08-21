// Layout des pages publiques (ateliers, formations, Édublog, intervenants…).
//
// Il réutilise le MÊME en-tête, le MÊME pied de page et le MÊME thème sombre
// que la page d'accueil : une navigation ou une couleur qui change d'une page
// à l'autre fait douter le visiteur d'avoir changé de site. Toute évolution du
// menu se fait donc dans SiteHeader, à un seul endroit.
/**
 * PAGES PUBLIQUES STATIQUES, RÉGÉNÉRÉES TOUTES LES CINQ MINUTES (ISR).
 *
 * Jusqu'au 21/08/2026, ce layout était `force-dynamic`, et pour une bonne
 * raison à l'époque : le build Docker n'atteignait pas l'API, et Next aurait
 * gravé « aucun contenu » dans du HTML statique. Ce verrou est tombé :
 * `NEXT_PUBLIC_API_URL` est un argument de BUILD (Dockerfile + Coolify) qui
 * pointe l'API publique — `next build` pré-rend donc avec de vraies données.
 *
 * Conséquences :
 *  - une page éditoriale (aide, mode d'emploi, frais, vitrines…) se sert
 *    comme un fichier : plus de rendu serveur par visiteur, plus de
 *    `no-store` — c'est le temps de première réponse de tout le site public
 *    qui change, campagne publicitaire comprise ;
 *  - les pages qui lisent `searchParams` (catalogue filtré, Édublog, GAP)
 *    redeviennent dynamiques D'ELLES-MÊMES à la requête : Next le déduit,
 *    rien à déclarer ;
 *  - les fiches ([id], [slug]) se génèrent à la première visite puis se
 *    servent statiques, avec la même fenêtre de cinq minutes.
 *
 * Si l'API est injoignable pendant un build, `fetchPublic` renvoie une erreur
 * sans jeter : la page sort dégradée, et la première régénération — au plus
 * tard cinq minutes après le déploiement, en pratique dès le healthcheck — la
 * complète. Aucune page publique ne lit la session : c'est la condition de
 * tout ceci, et elle est documentée plus bas.
 */
export const revalidate = 300;

import type { ReactNode } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { ChatBot } from '../_shared/ChatBot';
import { RetourHaut } from '../_shared/RetourHaut';
import { SiteFooter } from "@/components/marketing/site-footer";

// ⚠️ CE LAYOUT NE DOIT PLUS LIRE LA SESSION.
//
// Il le faisait, pour une seule chose : afficher le prénom dans l'en-tête.
// Lire un cookie pendant le rendu rend TOUTES les pages qu'il enveloppe
// personnalisées, donc non cachables — et c'est ce qui coûtait 0,44 s à 0,90 s
// de temps de réponse sur chaque visite du catalogue et de l'Édublog.
// L'en-tête interroge désormais `/api/visiteur` depuis le navigateur.
// Remettre un `getSession()` ici annulerait le gain d'un coup.
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="theme-sombre flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-12">
        {children}
      </main>
      <SiteFooter />
      <ChatBot mode="public" />
      <RetourHaut />
    </div>
  );
}
