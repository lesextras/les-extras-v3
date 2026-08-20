// « Mes réservations formation » — les inscriptions nominatives aux sessions.
import type { Metadata } from "next";
import { VueReservations, TITRE_VUE } from "../vue-reservations";

export const metadata: Metadata = { title: TITRE_VUE.formations.titre };

export default function ReservationsFormationsPage() {
  return <VueReservations vue="formations" />;
}
