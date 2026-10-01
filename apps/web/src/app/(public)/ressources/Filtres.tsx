"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

/**
 * LES FILTRES EN MENUS DÉROULANTS (01/10/2026).
 *
 * Quatre listes au lieu de quarante puces : thème, pour qui, métier, format.
 * Choisir une valeur relance la page tout de suite ; sans JavaScript, le
 * bouton « Chercher » envoie le même formulaire.
 */
export interface Choix {
  id: string;
  label: string;
}

export interface Valeurs {
  categorie?: string;
  public?: string;
  metier?: string;
  format?: string;
  q?: string;
}

const CHAMPS: { cle: keyof Valeurs; titre: string; tous: string }[] = [
  { cle: "categorie", titre: "Thème", tous: "Tous les thèmes" },
  { cle: "public", titre: "Pour qui", tous: "Tout le monde" },
  { cle: "metier", titre: "Votre métier", tous: "Tous les métiers" },
  { cle: "format", titre: "Format", tous: "Tous les formats" },
];

export function FiltresRessources({
  valeurs,
  listes,
}: {
  valeurs: Valeurs;
  listes: Record<"categorie" | "public" | "metier" | "format", Choix[]>;
}) {
  const router = useRouter();

  function aller(change: Partial<Valeurs>) {
    const suite = { ...valeurs, ...change };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(suite)) if (v) p.set(k, v);
    const q = p.toString();
    router.push(q ? `/ressources?${q}` : "/ressources", { scroll: false });
  }

  const select =
    "h-11 w-full appearance-none rounded-lg border border-border bg-card pl-3 pr-9 text-sm font-medium outline-none transition focus:border-foreground/40 " +
    "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'><path d='m6 9 6 6 6-6'/></svg>\")] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat";

  return (
    <form action="/ressources" method="get" role="search" className="space-y-3">
      <div className="flex max-w-2xl gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Rechercher un outil</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={valeurs.q ?? ""}
            placeholder="Rechercher : planning, émotions, autorisation…"
            className="h-11 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-foreground/40"
          />
        </label>
        <button
          type="submit"
          className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Chercher
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CHAMPS.map((c) => (
          <label key={c.cle} className="flex flex-col gap-1 text-xs font-semibold text-muted-foreground">
            {c.titre}
            <select
              name={c.cle}
              value={valeurs[c.cle] ?? ""}
              onChange={(e) => aller({ [c.cle]: e.target.value || undefined })}
              className={`${select} ${valeurs[c.cle] ? "border-foreground/50 text-foreground" : "text-foreground"}`}
            >
              <option value="">{c.tous}</option>
              {listes[c.cle as "categorie" | "public" | "metier" | "format"].map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </form>
  );
}
