// Correspondance onglet ↔ segment d'URL de « Mon établissement / Mon compte ».
//
// POURQUOI CE FICHIER EXISTE — ne pas le refusionner dans `OngletsCompte.tsx`.
//
// `OngletsCompte.tsx` porte la directive `"use client"`. En React Server
// Components, TOUS les exports d'un module client — y compris une fonction
// pure qui ne touche ni au DOM ni à un hook — sont remplacés à la compilation
// par des *références client*. Les appeler depuis un Server Component lève
// « Attempted to call ongletDepuisUrl() from the server » (en production :
// « TypeError: o is not a function », masqué derrière « An error occurred in
// the Server Components render »).
//
// C'est exactement ce qui est arrivé : `page.tsx` appelait `ongletDepuisUrl()`
// importé de `OngletsCompte.tsx`. La page « Mon établissement » renvoyait donc
// « Une erreur est survenue » à chaque ouverture, du 3 août au 20 août 2026.
//
// La règle : une fonction partagée entre le serveur et le client vit dans son
// propre module SANS `"use client"`. Le module client peut l'importer ;
// l'inverse est interdit.

/** Valeur d'onglet interne → segment lisible dans l'URL. */
export const VERS_URL: Record<string, string> = {
  profile: "profil",
  services: "services",
  settings: "parametres",
};

/** Segment d'URL (ou valeur interne, tolérée) → valeur d'onglet. */
export function ongletDepuisUrl(brut?: string | null): string {
  switch ((brut ?? "").toLowerCase()) {
    case "services":
      return "services";
    case "parametres":
    case "settings":
      return "settings";
    case "profil":
    case "profile":
      return "profile";
    default:
      return "profile";
  }
}
