// Layout des pages publiques (ateliers, formations, Édublog, intervenants…).
//
// Il réutilise le MÊME en-tête, le MÊME pied de page et le MÊME thème sombre
// que la page d'accueil : une navigation ou une couleur qui change d'une page
// à l'autre fait douter le visiteur d'avoir changé de site. Toute évolution du
// menu se fait donc dans SiteHeader, à un seul endroit.
/**
 * PAS DE PRÉ-RENDU À LA CONSTRUCTION, et ce n'est pas négociable tant que le
 * build Docker n'atteint pas l'API : `API_BASE_URL` est une variable
 * d'EXÉCUTION posée dans Coolify, absente au moment du `next build`. Sans ce
 * garde-fou, Next verrait des pages sans lecture de cookie ni fetch `no-store`,
 * les jugerait statiques, et graverait « aucun contenu » dans le HTML livré.
 *
 * Ce que le travail du 20/08/2026 a changé, ce n'est donc pas le cache de PAGE
 * mais le cache de DONNÉES : la réponse de l'API est désormais partagée entre
 * tous les visiteurs pendant une minute (`fetchPublic`), et plus aucune page
 * publique ne lit la session. Passer au pré-rendu complet ne demande plus de
 * refonte : seulement de fournir `API_BASE_URL` au build.
 */
export const dynamic = 'force-dynamic';

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
