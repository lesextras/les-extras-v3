// L'Entraide est devenue le GAP. On redirige vers sa vitrine publique — et
// non vers l'espace connecté, qui renverrait un visiteur sur un écran de
// connexion sans lui avoir expliqué ce qu'il allait y trouver.
import { redirect } from "next/navigation";

export default function EntraideRedirect() {
  redirect("/gap");
}
