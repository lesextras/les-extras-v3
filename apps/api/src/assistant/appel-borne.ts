import { ServiceUnavailableException } from '@nestjs/common';

/**
 * UN APPEL AU MOTEUR NE DOIT JAMAIS POUVOIR PENDRE — 16/09/2026.
 *
 * ⚠⚠ CE FICHIER EXISTE POUR UNE RAISON QUI COÛTE DE L'ARGENT À QUELQU'UN.
 *
 * `CreditsService.avecCredit` débite un crédit, appelle la génération, et
 * rembourse si elle ÉCHOUE. Le remboursement est donc accroché au rejet de la
 * promesse. Or `fetch` sans signal d'abandon n'a AUCUN délai d'expiration en
 * Node : si le fournisseur accepte la connexion puis ne répond plus, la
 * promesse ne se résout ni ne se rejette. Conséquences, dans cet ordre :
 *
 *   1. le crédit est débité et n'est JAMAIS remboursé — personne ne le voit
 *      passer, ni l'utilisateur, ni le grand livre, qui n'enregistre qu'un
 *      débit parfaitement normal ;
 *   2. la requête HTTP de l'utilisateur reste ouverte jusqu'à ce que son
 *      navigateur abandonne : l'écran tourne, sans message ;
 *   3. chaque appel pendu retient une connexion côté serveur.
 *
 * Le défaut ne se voit jamais quand tout va bien, et il se découvre par une
 * réclamation. **Tout nouvel appel sortant vers un moteur passe par ici.**
 *
 * ⚠ LE DÉLAI EST LARGE, ET C'EST VOULU. Une synthèse de deux mille mots met
 * couramment quarante à soixante secondes à s'écrire ; couper à dix secondes
 * remplacerait une panne rare par un échec quotidien, et l'utilisateur
 * relancerait — donc paierait — deux fois. Quatre-vingt-dix secondes laissent
 * passer les générations longues et arrêtent les connexions mortes.
 */
export const DELAI_MOTEUR_MS = 90_000;

/**
 * `fetch` avec un délai d'expiration, qui lève une exception PARLANTE.
 *
 * ⚠ ON N'UTILISE PAS `AbortSignal.timeout()` SEUL. Il existe bien depuis
 * Node 17, mais son rejet est un `TimeoutError` indistinguable d'un abandon
 * venu d'ailleurs, et on veut pouvoir dire à l'utilisateur ce qui s'est passé
 * — et surtout, lui dire que son crédit lui a été rendu. On garde donc le
 * contrôleur explicite et on traduit l'abandon en 503 lisible.
 *
 * ⚠ LE `clearTimeout` EST DANS UN `finally`. Sans lui, un appel rapide laisse
 * un minuteur de quatre-vingt-dix secondes accroché à la boucle d'événements :
 * inoffensif à l'unité, visible sur un serveur qui répond à des milliers de
 * requêtes.
 */
export async function fetchMoteur(
  url: string,
  init: RequestInit,
  nomDuMoteur: string,
  delaiMs: number = DELAI_MOTEUR_MS,
): Promise<Response> {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), delaiMs);
  try {
    return await fetch(url, { ...init, signal: controleur.signal });
  } catch (err) {
    if (controleur.signal.aborted) {
      throw new ServiceUnavailableException(
        'Le service de rédaction a mis trop de temps à répondre. Votre crédit vous a été rendu, vous pouvez réessayer.',
        {
          cause: new Error(
            `${nomDuMoteur} : aucune réponse au bout de ${Math.round(delaiMs / 1000)} s`,
          ),
        },
      );
    }
    // Panne réseau, DNS, TLS : même message pour l'écran, la cause dit quoi.
    throw new ServiceUnavailableException(
      'Le service de rédaction est momentanément indisponible. Réessayez dans un instant.',
      { cause: err instanceof Error ? err : new Error(String(err)) },
    );
  } finally {
    clearTimeout(minuteur);
  }
}
