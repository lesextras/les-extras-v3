// Éducat'heures — page retirée.
//
// Elle affichait le catalogue d'ateliers sous un titre de « banque d'heures »
// (doublon trompeur relevé à l'audit du 3 août 2026). En attendant une vraie
// banque d'heures, l'entrée a disparu du menu ; cette redirection évite qu'un
// ancien lien ou favori tombe sur une page vide.
import { redirect } from "next/navigation";

export default function AdminEducatheuresRedirect() {
  redirect("/admin/ateliers");
}
