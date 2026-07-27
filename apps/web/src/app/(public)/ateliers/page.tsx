// Catalogue PUBLIC des ateliers (consultable sans connexion).
import type { Metadata } from "next";
import { CatalogView } from "../_catalog";

export const metadata: Metadata = {
  title: "Ateliers",
  description:
    "Découvrez le catalogue public des ateliers, médiations, art-thérapie et actions de prévention proposés sur Les Extras.",
};

export default function AteliersCatalogPage({
  searchParams,
}: {
  searchParams?: { search?: string; category?: string };
}) {
  return (
    <CatalogView
      type="atelier"
      basePath="/ateliers"
      title="Nos ateliers"
      subtitle="Ateliers éducatifs, médiation, art-thérapie, prévention… un catalogue d'interventions clé en main, animées par des intervenants vérifiés."
      searchPlaceholder="Rechercher un atelier…"
      emptyTitle="Catalogue d'ateliers en préparation"
      searchParams={searchParams}
    />
  );
}
