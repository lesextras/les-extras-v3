// « Mes réservations » — la vue complète : renforts, ateliers et formations.
//
// L'adresse nue reste NON filtrée : les notifications et les courriels
// pointent vers `/dashboard/reservations#<id>` sans savoir de quelle famille
// relève la ligne visée. Voir l'en-tête de `vue-reservations.tsx`.
import type { Metadata } from "next";
import { requireSession } from "../../../_shared/server";
import { VueReservations, TITRE_VUE } from "./vue-reservations";

// Le titre de l'onglet suit le compte, comme celui de la page : un
// intervenant ne « réserve » pas, on lui parle de ses interventions.
export async function generateMetadata(): Promise<Metadata> {
  const session = await requireSession();
  return {
    title: session.account.type === "FREELANCE" ? "Mes interventions" : TITRE_VUE.tout.titre,
  };
}

export default function ReservationsPage() {
  return <VueReservations vue="tout" />;
}
