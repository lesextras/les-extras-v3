import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { GROUPES_DROITS, groupesDroitsProposes } from '../droits';
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
 * Deux façons de la trahir sans s'en apercevoir, et chacune est couverte ici :
 *
 *  1. le défaut bascule un jour vers « complete » — une variable oubliée dans
 *     Coolify, un `.env` recopié — et le renfort salarié se remet en ligne
 *     tout seul ;
 *  2. quelqu'un croit bien faire et SUPPRIME le droit `OUVRIR_RENFORT_CDD` de
 *     la liste au lieu de le masquer. La consigne est explicite : on ne
 *     supprime aucun code, on cesse seulement de l'offrir.
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

describe('Les droits : masqués, jamais supprimés', () => {
  it('garde OUVRIR_RENFORT_CDD dans la liste de référence, quoi qu’il arrive', () => {
    delete process.env[VARIABLE];
    const toutes = GROUPES_DROITS.flatMap((g) => g.droits).map((d) => d.cle);
    expect(toutes).toContain('OUVRIR_RENFORT_CDD');
  });

  it('cesse de le proposer quand le renfort salarié est hors offre', () => {
    delete process.env[VARIABLE];
    const proposes = groupesDroitsProposes().flatMap((g) => g.droits).map((d) => d.cle);
    expect(proposes).not.toContain('OUVRIR_RENFORT_CDD');
    // Et rien d'autre ne disparaît au passage.
    expect(proposes).toContain('DEMANDER_RENFORT_INTERNE');
    expect(proposes).toContain('INVITER_MEMBRES');
  });

  it('le repropose intégralement en offre complète', () => {
    process.env[VARIABLE] = 'complete';
    expect(groupesDroitsProposes()).toEqual(GROUPES_DROITS);
  });

  it('ne laisse jamais un groupe vide, qui afficherait un titre sans cases', () => {
    delete process.env[VARIABLE];
    for (const groupe of groupesDroitsProposes()) {
      expect(groupe.droits.length).toBeGreaterThan(0);
    }
  });
});
