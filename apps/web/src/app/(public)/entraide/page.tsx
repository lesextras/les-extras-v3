// L'Entraide est devenue le GAP, et n'est plus publique : on redirige vers
// l'espace connecté pour ne casser aucun lien déjà partagé.
import { redirect } from "next/navigation";

export default function EntraideRedirect() {
  redirect("/dashboard/gap");
}
