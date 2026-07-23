// Catalogue PUBLIC des formations (consultable sans connexion).
import type { Metadata } from "next";
import { CatalogView } from "../_catalog";

export const metadata: Metadata = {
  title: "Formations · Les Extras",
  description:
    "Parcourez le catalogue public des formations du secteur médico-social proposées sur Les Extras.",
};

export default function FormationsCatalogPage({
  searchParams,
}: {
  searchParams?: { search?: string; category?: string };
}) {
  return (
    <CatalogView
      type="formation"
      basePath="/formations"
      title="Nos formations"
      subtitle="Montez en compétences avec des formations pensées pour les professionnels du médico-social : analyse des pratiques, prévention, spécialisations métier."
      searchPlaceholder="Rechercher une formation…"
      emptyTitle="Catalogue de formations en préparation"
      searchParams={searchParams}
    />
  );
}
