'use client';

import { useRouter } from 'next/navigation';
import { ChevronDown, LayoutGrid } from 'lucide-react';

/** Toutes les catégories d'outils, dans une seule liste déroulante (01/10/2026). */
export function ChoixCategorieOutils({ categories }: { categories: { id: string; titre: string; n: number }[] }) {
  const router = useRouter();
  return (
    <label className="relative flex w-full max-w-md items-center">
      <span className="sr-only">Toutes les catégories d’outils</span>
      <LayoutGrid className="pointer-events-none absolute left-4 size-4 text-primary" aria-hidden />
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) router.push(`/ressources?categorie=${e.target.value}`);
        }}
        className="h-12 w-full appearance-none rounded-xl border border-border bg-card pl-11 pr-10 text-sm font-semibold text-foreground shadow-card outline-none transition hover:border-primary/40 focus:border-primary/60"
      >
        <option value="">Toutes les catégories ({categories.reduce((t, c) => t + c.n, 0)} outils)</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.titre} ({c.n})
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 size-4 text-muted-foreground" aria-hidden />
    </label>
  );
}
