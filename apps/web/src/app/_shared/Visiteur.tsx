'use client';

/**
 * ÉTAT DU VISITEUR, CÔTÉ NAVIGATEUR.
 *
 * Contrepartie client de `app/api/visiteur/route.ts` : une seule requête après
 * l'affichage, partagée par l'en-tête public et par les cœurs « mis de côté »
 * du catalogue. Lire l'en-tête de ce fichier-là pour le pourquoi.
 *
 * TROIS ÉTATS, PAS DEUX — c'est ce qui évite le clignotement.
 *
 *   `null`                  on ne sait pas encore
 *   `{connecte: false}`     visiteur anonyme
 *   `{connecte: true, …}`   visiteur connecté
 *
 * Tant qu'on ne sait pas, l'en-tête n'affiche NI « Se connecter » NI le
 * prénom : il réserve la place et ne montre rien. Afficher « Se connecter »
 * par défaut ferait clignoter le bouton chez toute personne déjà connectée —
 * exactement le défaut qu'on avait corrigé en lisant la session côté serveur,
 * et qu'il ne s'agit pas de réintroduire.
 */
import * as React from 'react';
import type { Visiteur } from '@/app/api/visiteur/route';

const Contexte = React.createContext<Visiteur | null>(null);

export function VisiteurProvider({ children }: { children: React.ReactNode }) {
  const [visiteur, setVisiteur] = React.useState<Visiteur | null>(null);

  React.useEffect(() => {
    let vivant = true;
    fetch('/api/visiteur', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((v: Visiteur | null) => {
        // Une réponse qui n'arrive pas laisse l'état à « on ne sait pas ».
        // C'est volontaire : mieux vaut un en-tête sobre qu'un en-tête faux.
        if (vivant && v) setVisiteur(v);
      })
      .catch(() => {});
    return () => {
      vivant = false;
    };
  }, []);

  return <Contexte.Provider value={visiteur}>{children}</Contexte.Provider>;
}

/** `null` = pas encore connu. Ne pas confondre avec « non connecté ». */
export function useVisiteur(): Visiteur | null {
  return React.useContext(Contexte);
}
