// Layout des pages publiques (freelances, ateliers, établissements).
// Autonome : header + footer légers, sans garde de session.
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
            Les&nbsp;Extras
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <Link href="/etablissements" className="hover:text-foreground">
              Établissements
            </Link>
            <Link href="/marketplace" className="hover:text-foreground">
              Marketplace
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Connexion</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">Inscription</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">{children}</main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Les Extras — Marketplace médico-social</p>
          <div className="flex gap-4">
            <Link href="/etablissements" className="hover:text-foreground">
              Établissements
            </Link>
            <Link href="/marketplace" className="hover:text-foreground">
              Missions
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
