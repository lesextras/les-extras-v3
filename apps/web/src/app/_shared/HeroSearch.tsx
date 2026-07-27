"use client";

// Barre de recherche du hero — reprise du site historique les-extras.fr, où
// c'était l'élément d'entrée le plus utilisé. Deux champs seulement : ce que
// l'on cherche, et où. Le reste du tri se fait sur la page catalogue.
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSearch() {
  const router = useRouter();

  function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const qs = new URLSearchParams();
    const q = String(f.get("search") || "").trim();
    const ville = String(f.get("city") || "").trim();
    if (q) qs.set("search", q);
    if (ville) qs.set("city", ville);
    router.push(`/ateliers${qs.toString() ? `?${qs}` : ""}`);
  }

  return (
    <form
      onSubmit={soumettre}
      className="mt-8 flex w-full flex-col gap-2 rounded-2xl border border-border bg-card p-2 shadow-card sm:flex-row sm:items-center"
      role="search"
      aria-label="Rechercher un atelier ou une formation"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          name="search"
          placeholder="Mots-clés : violence, estime de soi, théâtre…"
          aria-label="Mots-clés"
          className="h-12 w-full rounded-xl border-0 bg-transparent pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>
      <div className="relative flex-1 sm:max-w-[16rem] sm:border-l sm:border-border">
        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          name="city"
          placeholder="Localisation"
          aria-label="Localisation"
          className="h-12 w-full rounded-xl border-0 bg-transparent pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        />
      </div>
      <Button type="submit" size="lg" className="h-12 shrink-0 rounded-xl px-6">
        Rechercher
      </Button>
    </form>
  );
}
