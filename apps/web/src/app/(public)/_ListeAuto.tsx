"use client";

import { useRouter } from "next/navigation";

/**
 * UNE LISTE DÉROULANTE QUI FILTRE DÈS QU'ON CHOISIT (01/10/2026).
 * Remplace les nuages de puces « Expert d'un public / d'une technique ».
 */
export function ListeAuto({
  titre,
  param,
  tous,
  options,
}: {
  titre: string;
  param: string;
  tous: string;
  options: string[];
}) {
  const router = useRouter();
  return (
    <label className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
      <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{titre}</span>
      <select
        defaultValue=""
        onChange={(e) => {
          const v = e.target.value;
          if (v) router.push(`?${param}=${encodeURIComponent(v)}`);
        }}
        className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground outline-none focus:border-primary/50"
      >
        <option value="">{tous}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
