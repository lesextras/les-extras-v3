// Catalogue PUBLIC des ateliers (consultable sans connexion).
import type { Metadata } from "next";
import { CatalogView } from "../_catalog";
import { metaPublique } from "@/lib/meta";

export const metadata: Metadata = metaPublique({
  title: "Ateliers éducatifs, médiation et prévention",
  description:
    "Découvrez le catalogue public des ateliers, médiations, art-thérapie et actions de prévention proposés sur Les Extras.",
  path: "/ateliers",
});

export default async function AteliersCatalogPage({
  searchParams: searchParamsPromesse,
}: {
  searchParams?: Promise<{ search?: string; category?: string }>;
}) {
  const searchParams = await searchParamsPromesse;
  return (
    <CatalogView
      type="atelier"
      basePath="/ateliers"
      title="Nos ateliers"
      subtitle="Ateliers éducatifs, médiation, art-thérapie, prévention… un catalogue d'interventions clé en main, animées par les intervenants du réseau."
      searchPlaceholder="Rechercher un atelier…"
      emptyTitle="Catalogue d'ateliers en préparation"
      searchParams={searchParams}
    />
  );
}
