"use client";

// Recherche dans le centre d'aide.
//
// Tout le contenu tient en quelques dizaines d'articles : il est filtré dans le
// navigateur, sans aller-retour serveur. La recherche répond donc à la frappe,
// et elle continue de fonctionner si l'API est indisponible — ce qui est
// précisément le moment où l'on cherche de l'aide.
import * as React from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";

interface Entree {
  slug: string;
  question: string;
  reponse: string[];
  rubriqueSlug: string;
  rubriqueTitre: string;
}

/** Sans accents et en minuscules : « emargement » doit trouver « émargement ». */
function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function RechercheAide({ entrees }: { entrees: Entree[] }) {
  const [terme, setTerme] = React.useState("");

  const resultats = React.useMemo(() => {
    const q = normaliser(terme.trim());
    if (q.length < 2) return [];
    const mots = q.split(/\s+/);
    return entrees
      .filter((e) => {
        const foin = normaliser(`${e.question} ${e.reponse.join(" ")} ${e.rubriqueTitre}`);
        return mots.every((m) => foin.includes(m));
      })
      .slice(0, 8);
  }, [terme, entrees]);

  return (
    <div className="mx-auto mt-8 max-w-xl">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={terme}
          onChange={(e) => setTerme(e.target.value)}
          placeholder="Rechercher une question…"
          aria-label="Rechercher dans le centre d’aide"
          className="h-12 w-full rounded-xl border border-input bg-card pl-11 pr-11 text-[15px] text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        {terme ? (
          <button
            type="button"
            onClick={() => setTerme("")}
            aria-label="Effacer la recherche"
            className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {terme.trim().length >= 2 ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card">
          {resultats.length === 0 ? (
            <p className="px-4 py-5 text-sm text-muted-foreground">
              Aucune réponse pour « {terme} ». Écrivez-nous, on répond sous 48 h ouvrées.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {resultats.map((r) => (
                <li key={`${r.rubriqueSlug}-${r.slug}`}>
                  <Link
                    href={`/aide/${r.rubriqueSlug}#${r.slug}`}
                    className="block px-4 py-3 transition-colors hover:bg-accent"
                  >
                    <span className="block text-sm font-medium text-foreground">{r.question}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {r.rubriqueTitre}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
