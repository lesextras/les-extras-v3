import { ACCENTS_SQL, PLATS_SQL, motifRecherche } from './recherche-accents';

/**
 * CHERCHER UN ÉTABLISSEMENT SANS SE SOUCIER DES ACCENTS.
 *
 * ⚠⚠ CE QUE CES TESTS PROTÈGENT. Le 21/09/2026, taper « adepa » dans la
 * recherche d'établissement de l'inscription rendait zéro résultat alors que
 * trois établissements ADéPA y étaient déclarés : le `contains` de Prisma
 * devient un ILIKE, insensible à la casse et jamais aux accents. C'est l'écran
 * dont le seul métier est d'empêcher le doublon d'établissement — celui qui
 * coupe une équipe en deux.
 */

/** Le jumeau JavaScript de `translate(texte, ACCENTS_SQL, PLATS_SQL)`. */
function commeTranslate(texte: string): string {
  return [...texte]
    .map((c) => {
      const i = ACCENTS_SQL.indexOf(c);
      return i === -1 ? c : PLATS_SQL[i];
    })
    .join('');
}

describe('La table de correspondance des accents', () => {
  /**
   * ⚠ LE TEST LE PLUS IMPORTANT DU FICHIER. `translate` associe le n-ième
   * caractère de la source au n-ième de la cible. Deux chaînes de longueurs
   * différentes décalent SILENCIEUSEMENT toutes les correspondances suivantes :
   * « é » deviendrait « c », la recherche rendrait n'importe quoi, et
   * PostgreSQL ne lèverait aucune erreur.
   */
  it('a exactement autant de lettres plates que de lettres accentuées', () => {
    expect([...PLATS_SQL]).toHaveLength([...ACCENTS_SQL].length);
  });

  it('ne contient aucune ligature, qui vaudrait deux lettres', () => {
    for (const ligature of ['œ', 'æ', 'Œ', 'Æ', 'ß']) {
      expect(ACCENTS_SQL).not.toContain(ligature);
    }
  });

  it('ne remplace jamais une lettre accentuée par une autre lettre accentuée', () => {
    for (const c of PLATS_SQL) expect(ACCENTS_SQL).not.toContain(c);
  });

  it('respecte la casse de part et d’autre', () => {
    expect(commeTranslate('É')).toBe('E');
    expect(commeTranslate('é')).toBe('e');
  });
});

describe('Le motif cherché', () => {
  it('retire les accents et passe en minuscules', () => {
    expect(motifRecherche('ADéPA')).toBe('%adepa%');
    expect(motifRecherche('Hôpital Créteil')).toBe('%hopital creteil%');
  });

  /**
   * ⚠ LE CAS QUI A ÉTÉ MESURÉ EN PRODUCTION : la personne tape sans accent, la
   * base porte l'accent. Les deux côtés doivent tomber sur la même forme.
   */
  it('fait tomber la saisie et le nom stocké sur la même forme', () => {
    const stocke = commeTranslate('ADéPA, organisme de formation'.toLowerCase());
    expect(stocke).toContain(motifRecherche('adepa').replaceAll('%', ''));
    expect(stocke).toContain(motifRecherche('ADÉPA').replaceAll('%', ''));
  });

  /**
   * ⚠ LES JOKERS DE `LIKE` SONT ÉCHAPPÉS. Sans cela, « 100 % » ramène tout le
   * catalogue et « foyer_nord » remplace le souligné par n'importe quel
   * caractère. Ce ne sont pas des injections — la valeur reste un paramètre lié
   * — mais des résultats faux, et sur cet écran un résultat faux fait créer un
   * doublon d'établissement.
   */
  it('échappe les jokers de LIKE', () => {
    expect(motifRecherche('100 %')).toBe('%100 \\%%');
    expect(motifRecherche('foyer_nord')).toBe('%foyer\\_nord%');
    expect(motifRecherche('a\\b')).toBe('%a\\\\b%');
  });

  it('tolère une saisie vide sans lever', () => {
    expect(motifRecherche('')).toBe('%%');
    expect(motifRecherche(undefined as unknown as string)).toBe('%%');
  });
});
