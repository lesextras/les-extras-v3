// « Mes réservations ateliers » — les ateliers commandés et ceux qu'on anime.
import type { Metadata } from "next";
import { VueReservations, TITRE_VUE } from "../vue-reservations";

export const metadata: Metadata = { title: TITRE_VUE.ateliers.titre };

export default function ReservationsAteliersPage() {
  return <VueReservations vue="ateliers" />;
}
