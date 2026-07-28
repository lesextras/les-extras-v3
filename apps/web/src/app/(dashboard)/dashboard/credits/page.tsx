// Les crédits ont disparu au profit du paiement à la prestation : l'ancienne
// adresse redirige vers l'adhésion, pour ne casser aucun lien existant.
import { redirect } from "next/navigation";

export default function CreditsRedirect() {
  redirect("/dashboard/adhesion");
}
