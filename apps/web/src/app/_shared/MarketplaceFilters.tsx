"use client";

// Barre de filtres du marketplace (met à jour les query params -> refetch serveur).
import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TYPES = [
  { value: "all", label: "Tout" },
  { value: "missions", label: "Missions renfort" },
  { value: "services", label: "Ateliers" },
];

const CATEGORIES = [
  { value: "all", label: "Toutes catégories" },
  { value: "RENFORT", label: "Renfort" },
  { value: "REMPLACEMENT", label: "Remplacement" },
  { value: "ATELIER", label: "Atelier" },
  { value: "FORMATION", label: "Formation" },
  { value: "MEDIATION", label: "Médiation" },
];

export function MarketplaceFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <form
        className="flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          const q = new FormData(e.currentTarget).get("q");
          setParam("q", String(q || ""));
        }}
      >
        <Input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder="Rechercher (métier, ville, mot-clé)…"
        />
      </form>
      <Select
        defaultValue={params.get("type") ?? "all"}
        onValueChange={(v) => setParam("type", v)}
      >
        <SelectTrigger className="sm:w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        defaultValue={params.get("category") ?? "all"}
        onValueChange={(v) => setParam("category", v)}
      >
        <SelectTrigger className="sm:w-[190px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {params.toString() ? (
        <Button variant="ghost" onClick={() => router.push(pathname)}>
          Réinitialiser
        </Button>
      ) : null}
    </div>
  );
}
