'use client';

import { useSyncExternalStore, type ReactNode } from 'react';

/**
 * DEUX SITES, UN SEUL DÉPLOIEMENT.
 *
 * Les compagnons de Les Extras (bandeau cookies, invitation à installer
 * l'application, mesure d'audience…) n'ont rien à faire sur
 * association.toulali.fr, servi par le même serveur. Ils ne se rendent que
 * côté client, après hydratation : on peut donc les retenir d'après le nom
 * d'hôte sans toucher au rendu serveur ni à la mise en cache des pages.
 *
 * `useSyncExternalStore` avec un instantané serveur à `false` garantit un
 * HTML identique des deux côtés, puis un second rendu qui retire les enfants
 * sur le domaine association.
 */
const HOTE_ASSOCIATION = 'association.toulali.fr';

const abonner = () => () => {};
// Les cartes à intégrer (`/integration/...`) vivent dans l'iframe d'un autre
// site : ni bandeau de cookies, ni invitation à installer l'application.
const surAssociation = () =>
  window.location.hostname === HOTE_ASSOCIATION || window.location.pathname.startsWith('/integration/');
const surServeur = () => false;

export function SaufAssociation({ children }: { children: ReactNode }) {
  const retenir = useSyncExternalStore(abonner, surAssociation, surServeur);
  return retenir ? null : <>{children}</>;
}
