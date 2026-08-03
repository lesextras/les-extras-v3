/**
 * Pagination — une seule définition pour toute l'API.
 *
 * Les listes rendues à l'écran doivent être bornées, sans exception : une
 * requête sans limite ne se voit pas en démonstration et se voit très bien
 * le jour où un client a deux ans d'historique. Et une troncature muette est
 * pire qu'une liste longue — l'utilisateur croit avoir tout vu. D'où le
 * `total` renvoyé systématiquement à côté des éléments.
 */

export const PAGINATION_DEFAUT = 25;
export const PAGINATION_MAX = 200;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pages: number;
}

/** Normalise les paramètres de page reçus du client. */
export function bornes(params: { page?: number | string; perPage?: number | string } = {}) {
  const page = Math.max(1, Math.trunc(Number(params.page) || 1));
  const perPage = Math.min(
    PAGINATION_MAX,
    Math.max(1, Math.trunc(Number(params.perPage) || PAGINATION_DEFAUT)),
  );
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

/** Assemble une page à partir des éléments et du total. */
export function page<T>(items: T[], total: number, page: number, perPage: number): Page<T> {
  return { items, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) };
}
