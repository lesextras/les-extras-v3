// « Mes renforts RenforTeam » — les renforts pourvus, seuls, avec leur contrat.
import type { Metadata } from "next";
import { VueReservations, TITRE_VUE } from "../vue-reservations";

export const metadata: Metadata = { title: TITRE_VUE.renforts.titre };

export default function ReservationsRenfortsPage() {
  return <VueReservations vue="renforts" />;
}
