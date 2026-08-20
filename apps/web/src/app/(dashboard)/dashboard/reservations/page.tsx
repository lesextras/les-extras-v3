// « Mes réservations » — la vue complète : renforts, ateliers et formations.
//
// L'adresse nue reste NON filtrée : les notifications et les courriels
// pointent vers `/dashboard/reservations#<id>` sans savoir de quelle famille
// relève la ligne visée. Voir l'en-tête de `vue-reservations.tsx`.
import type { Metadata } from "next";
import { VueReservations, TITRE_VUE } from "./vue-reservations";

export const metadata: Metadata = { title: TITRE_VUE.tout.titre };

export default function ReservationsPage() {
  return <VueReservations vue="tout" />;
}
