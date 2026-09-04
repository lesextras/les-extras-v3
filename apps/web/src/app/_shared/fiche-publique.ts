import "server-only";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

/**
 * PANNE D'API ET FICHE SUPPRIMÉE NE SE DISENT PAS PAREIL À GOOGLE.
 *
 * Les cinq fiches publiques — atelier, formation, mission, intervenant,
 * article — faisaient exactement la même chose de toute absence de donnée :
 *
 *     const { data } = await fetchPublic(...);
 *     if (!data) notFound();                       // « cette page n'existe pas »
 *     if (!data) return { robots: { index: false } } // « ne l'indexe plus »
 *
 * Or `fetchPublic` renvoie `undefined` aussi bien pour un 404 que pour une API
 * injoignable. Pendant les deux à trois minutes que dure un redéploiement, tout
 * le catalogue répondait donc « supprimé » à un robot — et un désindexage se
 * répare en semaines, pas en minutes. C'est le genre de panne qu'on ne voit
 * jamais en la vivant : personne ne recharge le site à cet instant-là, et le
 * trafic ne baisse que trois semaines plus tard.
 *
 * Ces deux fonctions posent la distinction une seule fois, à partir du statut
 * HTTP que `fetchPublic` conserve désormais :
 *
 *  - vraie disparition (404 / 410) → `notFound()` et `noindex`, comme avant ;
 *  - panne (0, 500, 502, 503…)     → on lève. Next rend sa page d'erreur, le
 *    contenu n'est pas remplacé par un « introuvable », et RIEN ne dit au robot
 *    que la fiche a disparu. Il repassera.
 */

interface Reponse<T> {
  data?: T;
  error?: string;
  introuvable?: boolean;
  status?: number;
}

/** Dans le composant de page : 404 si supprimée, erreur si l'API est muette. */
export function exigerFiche<T>(res: Reponse<T>, quoi: string): T {
  if (res.data) return res.data;
  if (res.introuvable) notFound();
  throw new Error(
    `${quoi} : l'API n'a pas répondu (${res.status || "réseau"}). ${res.error ?? ""}`.trim(),
  );
}

/**
 * Dans `generateMetadata` : `noindex` UNIQUEMENT sur une vraie disparition.
 * Sur une panne on renvoie `null` — l'appelant laisse alors les métadonnées du
 * gabarit racine s'appliquer et ne prononce aucune consigne d'indexation.
 */
export function metaIntrouvable<T>(res: Reponse<T>, titre: string): Metadata | null {
  if (res.data) return null;
  if (res.introuvable) return { title: titre, robots: { index: false, follow: false } };
  return { title: titre };
}
