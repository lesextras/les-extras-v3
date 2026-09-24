import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { perimetreOffre, renfortSalarieVisible } from '../offre';

/**
 * LE PÉRIMÈTRE PUBLIC DE L'OFFRE — ce qui est testé ici est une DÉCISION, pas
 * un réglage.
 *
 * Décision de Siham, 19/09/2026 : le renfort de POSTE — celui qui se conclut
 * en CDD salarié — sort de la vitrine. C'est le pilier que le Conseil d'État a
 * fragilisé le 11/02/2025 (n° 491128) et que l'article 70 de la LFSS 2025
 * plafonne en ESSMS publics depuis le 01/07/2025.
 *
 * La façon de la trahir sans s'en apercevoir : le défaut bascule un jour vers
 * « complete » (une variable oubliée dans Coolify, un `.env` recopié) et le
 * renfort salarié se remet en ligne tout seul.
 *
 * ⚠ Les « droits déclarés » (`lib/droits.ts`) qui portaient aussi ce
 * masquage ont été supprimés le 24/09/2026 : un compte = une personne, il n'y
 * a plus de droits à déclarer dans un compte Les Extras.
 */

const VARIABLE = 'NEXT_PUBLIC_OFFRE_PUBLIQUE';

let valeurInitiale: string | undefined;

beforeEach(() => {
  valeurInitiale = process.env[VARIABLE];
});

afterEach(() => {
  if (valeurInitiale === undefined) delete process.env[VARIABLE];
  else process.env[VARIABLE] = valeurInitiale;
});

describe('Le défaut protège la décision', () => {
  it('masque le renfort salarié quand la variable n’est pas renseignée', () => {
    delete process.env[VARIABLE];
    expect(perimetreOffre()).toBe('independants');
    expect(renfortSalarieVisible()).toBe(false);
  });

  it('masque le renfort salarié sur une valeur vide ou inconnue', () => {
    for (const valeur of ['', '   ', 'oui', 'true', 'CDD', 'independants']) {
      process.env[VARIABLE] = valeur;
      expect(renfortSalarieVisible()).toBe(false);
    }
  });

  it('ne rouvre l’offre complète que sur le mot exact, casse et espaces ignorées', () => {
    for (const valeur of ['complete', 'COMPLETE', '  Complete  ']) {
      process.env[VARIABLE] = valeur;
      expect(perimetreOffre()).toBe('complete');
      expect(renfortSalarieVisible()).toBe(true);
    }
  });
});
