// Layout des pages publiques (ateliers, formations, Édublog, intervenants…).
//
// Il réutilise le MÊME en-tête, le MÊME pied de page et le MÊME thème sombre
// que la page d'accueil : une navigation ou une couleur qui change d'une page
// à l'autre fait douter le visiteur d'avoir changé de site. Toute évolution du
// menu se fait donc dans SiteHeader, à un seul endroit.
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { ChatBot } from '../_shared/ChatBot';
import { RetourHaut } from '../_shared/RetourHaut';
import { SiteFooter } from "@/components/marketing/site-footer";

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
