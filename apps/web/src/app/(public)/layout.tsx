// Layout des pages publiques (ateliers, formations, Édublog, établissements…).
//
// Il réutilise le MÊME en-tête et le MÊME pied de page que la page d'accueil :
// une navigation qui change d'une page à l'autre fait douter le visiteur d'avoir
// changé de site. Toute évolution du menu se fait donc dans SiteHeader, à un
// seul endroit.
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-12">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
