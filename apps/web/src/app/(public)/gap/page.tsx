// Le GAP vit sur le site, pas dans le tableau de bord.
//
// Une seule adresse, deux visages : le visiteur découvre ce qu'est un GAP et
// pourquoi il est fermé ; le membre connecté arrive directement dans le fil
// des situations. C'est exactement le fonctionnement du catalogue d'ateliers —
// la même page pour tout le monde, sauf que celle-ci demande un compte pour
// livrer son contenu.
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { GapVitrine } from "../../_shared/GapVitrine";
import { GapFil } from "../../_shared/GapFil";

export const metadata: Metadata = {
  title: "Le GAP — Groupe d’Analyse de Pratique en ligne",
  description:
    "Déposez une situation de terrain, recevez les retours de professionnels du médico-social. Anonyme, entre pairs, réservé aux membres.",
  alternates: { canonical: "/gap" },
};

export default async function GapPage({
  searchParams,
}: {
  searchParams?: { search?: string; metier?: string; publicVise?: string; tri?: string };
}) {
  const session = await getSession();
  if (!session) return <GapVitrine />;
  return <GapFil searchParams={searchParams} />;
}
