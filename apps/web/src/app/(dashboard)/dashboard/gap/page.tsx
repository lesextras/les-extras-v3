// Le GAP a quitté le tableau de bord pour le site : il n'est pas un outil de
// gestion, c'est un lieu où l'on entre. On redirige pour ne casser ni les
// liens déjà partagés, ni les favoris.
import { redirect } from "next/navigation";

export default function GapDashboardRedirect() {
  redirect("/gap");
}
