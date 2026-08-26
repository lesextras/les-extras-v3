import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, ACTIVE_ACCOUNT_COOKIE } from "@/lib/session";

/**
 * SORTIE PROPRE QUAND LE JETON N’EST PLUS VALABLE (26/08/2026).
 *
 * Un cookie de session peut survivre au jeton qu’il transporte : l’API a
 * change ses regles le 25/08/2026, et les jetons emis avant ce jour sont
 * refuses. Le navigateur, lui, continuait de les envoyer — chaque appel
 * repondait 401 et chaque bloc du tableau de bord affichait « Un probleme
 * est survenu ». Sans effacer le cookie, la situation ne se resolvait
 * jamais toute seule.
 *
 * Next n’autorise l’ecriture d’un cookie que dans une route ou une action,
 * jamais pendant le rendu d’une page : d’ou cette route, vers laquelle
 * `fetchApi` renvoie des qu’elle voit un 401.
 *
 * Elle vit sous /api a dessein : le middleware ne s’y applique pas. Ailleurs,
 * il aurait vu le cookie encore present, renvoye vers /login, qui renvoie au
 * tableau de bord quand une session existe — une boucle.
 */
export const dynamic = "force-dynamic";

/** Un chemin venu de l’URL reste une entree : on n’accepte que l’interne. */
function cheminSur(valeur: string | null): string {
  if (!valeur) return "";
  const interne = /^\/(?!\/)[\w\-./[\]]*$/.test(valeur);
  return interne && valeur !== "/login" ? valeur : "";
}

export async function GET(request: NextRequest) {
  const suite = cheminSur(request.nextUrl.searchParams.get("next"));

  const destination = new URL("/login", request.nextUrl.origin);
  destination.searchParams.set("expiree", "1");
  if (suite) destination.searchParams.set("next", suite);

  const reponse = NextResponse.redirect(destination);
  for (const nom of [SESSION_COOKIE, ACTIVE_ACCOUNT_COOKIE]) {
    reponse.cookies.set(nom, "", { path: "/", maxAge: 0 });
  }
  return reponse;
}
