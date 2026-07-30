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

// La valeur "all" est le sentinel « aucun filtre » : setParam la retire des
// query params, ce qui équivaut à une valeur vide côté page.
const TYPES = [
  { value: "all_type", label: "Tous les types" },
  { value: "missions", label: "Missions renfort" },
  { value: "services", label: "Ateliers" },
];

const CATEGORIES = [
  { value: "all_cat", label: "Toutes les catégories" },
  { value: "RENFORT", label: "Renfort" },
  { value: "REMPLACEMENT", label: "Remplacement" },
  { value: "ATELIER_EDUCATIF", label: "Atelier éducatif" },
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
      if (!value || value === "all" || value === "all_type" || value === "all_cat") next.delete(key);
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
        defaultValue={params.get("type") ?? "all_type"}
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
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const cp = String(new FormData(e.currentTarget).get("cp") || "").trim();
          setParam("cp", /^\d{5}$/.test(cp) ? cp : "");
        }}
      >
        <Input
          name="cp"
          inputMode="numeric"
          maxLength={5}
          defaultValue={params.get("cp") ?? ""}
          placeholder="Code postal"
          className="sm:w-[130px]"
        />
      </form>
      <Select
        defaultValue={params.get("rayon") ?? "all"}
        onValueChange={(v) => setParam("rayon", v)}
      >
        <SelectTrigger className="sm:w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Distance : libre</SelectItem>
          <SelectItem value="10">Moins de 10 km</SelectItem>
          <SelectItem value="30">Moins de 30 km</SelectItem>
          <SelectItem value="50">Moins de 50 km</SelectItem>
          <SelectItem value="100">Moins de 100 km</SelectItem>
        </SelectContent>
      </Select>
      <Select
        defaultValue={params.get("category") ?? "all_cat"}
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
