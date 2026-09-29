/**
 * ⚠ UN REDÉPLOIEMENT NE DOIT PAS FAIRE TOMBER LES FICHES PUBLIQUES.
 *
 * Pendant un redéploiement de l'API (ou dans les secondes où le routeur
 * bascule d'un conteneur à l'autre), l'API répond 502/503 ou ne répond pas.
 * Une fiche atelier rendue à cet instant levait (`exigerFiche`) et le visiteur
 * lisait un écran d'incident. Trois filets, du plus fin au plus large :
 *
 *  1. on RÉESSAIE deux fois une panne passagère (réseau, 502, 503, 504), à
 *     0,8 s puis 2 s : la bascule du routeur dure rarement plus ;
 *  2. on garde en mémoire la DERNIÈRE RÉPONSE BONNE de chaque adresse publique
 *     et on la ressert si l'API reste muette : une fiche vue il y a dix minutes
 *     vaut mieux qu'un écran d'erreur, et c'est une donnée publique ;
 *  3. le cache de données de Next (revalidate) sert déjà l'entrée périmée
 *     pendant qu'il revalide en arrière-plan.
 *
 * ⚠ ON NE RESSERT JAMAIS UNE RÉPONSE SUR UN 404 OU UN 410 : une fiche retirée
 * doit disparaître, pas survivre en mémoire. On ne réessaie ni un 4xx ni un
 * 500 : ce n'est pas une panne de bascule, réessayer ne changerait rien et
 * masquerait un vrai défaut.
 *
 * ⚠ RÉSERVÉ AUX LECTURES PUBLIQUES (`fetchPublic`). Une réponse propre à une
 * personne connectée ne se met jamais dans cette mémoire partagée.
 *
 * Module sans `server-only` pour pouvoir être testé ; il n'est importé que
 * par `app/_shared/server.ts`.
 */

export interface LecturePublique<T> {
  data?: T;
  error?: string;
  introuvable?: boolean;
  status?: number;
  /** Vrai quand la donnée est la dernière réponse connue, l'API étant muette. */
  perimee?: boolean;
}

const PANNES_PASSAGERES = new Set([0, 502, 503, 504]);
const ATTENTES_MS = [800, 2000];
const DERNIERES_BONNES = new Map<string, unknown>();
const MAX_DERNIERES_BONNES = 800;

function retenir(cle: string, data: unknown) {
  // Map garde l'ordre d'insertion : on retire la plus ancienne au-delà du plafond.
  DERNIERES_BONNES.delete(cle);
  DERNIERES_BONNES.set(cle, data);
  if (DERNIERES_BONNES.size > MAX_DERNIERES_BONNES) {
    const plusAncienne = DERNIERES_BONNES.keys().next().value;
    if (plusAncienne !== undefined) DERNIERES_BONNES.delete(plusAncienne);
  }
}

/** Réservé aux tests : vide la mémoire des dernières réponses. */
export function _oublierDernieresReponses() {
  DERNIERES_BONNES.clear();
}

export async function lireAvecReprise<T>(
  cle: string,
  appel: () => Promise<T>,
  statutDe: (err: unknown) => number,
  attentes: number[] = ATTENTES_MS,
): Promise<LecturePublique<T>> {
  let message = "Erreur inconnue";
  let status = 0;
  for (let essai = 0; essai <= attentes.length; essai++) {
    try {
      const data = await appel();
      retenir(cle, data);
      return { data };
    } catch (err) {
      message = err instanceof Error ? err.message : "Erreur inconnue";
      // ⚠ « PAS DE DONNÉE » N'EST PAS « N'EXISTE PAS ». Une API en panne
      // pendant un redéploiement ne doit pas faire répondre « cette page
      // n'existe pas » à Google : `introuvable` n'est vrai que sur 404 / 410.
      status = statutDe(err);
      if (status === 404 || status === 410) {
        DERNIERES_BONNES.delete(cle);
        return { error: message, status, introuvable: true };
      }
      if (!PANNES_PASSAGERES.has(status) || essai === attentes.length) break;
      await new Promise((r) => setTimeout(r, attentes[essai]));
    }
  }
  if (PANNES_PASSAGERES.has(status) && DERNIERES_BONNES.has(cle)) {
    return { data: DERNIERES_BONNES.get(cle) as T, status, perimee: true };
  }
  return { error: message, status, introuvable: false };
}
