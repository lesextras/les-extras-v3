"use client";

// Onglets de « Mon compte », synchronisés avec l'URL (?onglet=…).
//
// Deux impasses refermées : le lien profond /dashboard/account?onglet=services
// (utilisé par la checklist de prise en main) arrivait sur l'onglet Profil,
// et l'onglet choisi à la main ne se reflétait jamais dans l'URL — impossible
// de partager ou de rouvrir la page au bon endroit.
import type { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";

/** Valeur d'onglet interne → segment lisible dans l'URL. */
const VERS_URL: Record<string, string> = {
  profile: "profil",
  services: "services",
  settings: "parametres",
};

/** Segment d'URL (ou valeur interne, tolérée) → valeur d'onglet. */
export function ongletDepuisUrl(brut?: string | null): string {
  switch ((brut ?? "").toLowerCase()) {
    case "services":
      return "services";
    case "parametres":
    case "settings":
      return "settings";
    case "profil":
    case "profile":
      return "profile";
    default:
      return "profile";
  }
}

export function OngletsCompte({
  defaultValue,
  className,
  children,
}: {
  defaultValue: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Tabs
      defaultValue={defaultValue}
      className={className}
      onValueChange={(valeur) => {
        const segment = VERS_URL[valeur] ?? valeur;
        // replace + scroll:false : l'URL suit l'onglet sans empiler
        // l'historique ni faire sauter la page.
        router.replace(`${pathname}?onglet=${segment}`, { scroll: false });
      }}
    >
      {children}
    </Tabs>
  );
}
