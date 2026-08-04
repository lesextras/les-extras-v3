// Cette page était un annuaire des établissements partenaires. Elle
// interrogeait une route publique qui n'a jamais existé, affichait donc
// « Annuaire en construction » en permanence, et ses fiches pointaient vers une
// page absente. Aucun lien du site n'y menait : seuls y arrivaient les moteurs
// de recherche et les visiteurs munis d'une vieille adresse — c'est-à-dire
// exactement ceux qu'il ne faut pas accueillir par une page vide.
//
// L'annuaire n'est d'ailleurs pas souhaitable en l'état : publier la liste des
// structures clientes n'apporte rien commercialement et pose une question de
// discrétion que personne n'a tranchée. On redirige donc vers la page qui
// s'adresse vraiment aux établissements et qui, elle, convertit.
import { redirect } from "next/navigation";

export default function EtablissementsRedirect() {
  redirect("/sos-renfort");
}
