import { numeroSuivant, prefixeAnnee } from './numerotation';

/**
 * Ce que ces tests protègent est une obligation fiscale, pas une convention
 * d'affichage : l'article 242 nonies A de l'annexe II au code général des
 * impôts impose une séquence chronologique continue et sans rupture.
 *
 * Le défaut corrigé ici était réel : le numéro se calculait en comptant les
 * factures de l'année. Annulez la troisième, créez-en une nouvelle, et vous
 * obtenez à nouveau INV-2026-00003 — un numéro déjà attribué. La contrainte
 * d'unicité faisait échouer l'écriture, et si elle n'avait pas été là, deux
 * factures auraient porté le même numéro.
 */

describe('numérotation des factures', () => {
  it('commence à un la première fois', () => {
    expect(numeroSuivant(2026, null)).toBe('INV-2026-00001');
    expect(numeroSuivant(2026, undefined)).toBe('INV-2026-00001');
  });

  it('suit le dernier numéro attribué', () => {
    expect(numeroSuivant(2026, 'INV-2026-00001')).toBe('INV-2026-00002');
    expect(numeroSuivant(2026, 'INV-2026-00042')).toBe('INV-2026-00043');
  });

  it('ne réutilise pas le numéro d’une facture annulée', () => {
    // Trois factures émises, la deuxième annulée : il en reste deux en base,
    // mais le prochain numéro est le quatrième, pas le troisième.
    const dernier = 'INV-2026-00003';
    expect(numeroSuivant(2026, dernier)).toBe('INV-2026-00004');
  });

  it('repart de un à chaque année', () => {
    expect(numeroSuivant(2027, 'INV-2026-00987')).toBe('INV-2027-00001');
  });

  it('résiste à un numéro illisible plutôt que de produire NaN', () => {
    expect(numeroSuivant(2026, 'INV-2026-XXXXX')).toBe('INV-2026-00001');
    expect(numeroSuivant(2026, 'facture manuelle')).toBe('INV-2026-00001');
  });

  it('franchit le passage à cinq chiffres sans perdre le rembourrage', () => {
    expect(numeroSuivant(2026, 'INV-2026-00099')).toBe('INV-2026-00100');
    expect(numeroSuivant(2026, 'INV-2026-09999')).toBe('INV-2026-10000');
  });

  it('garde un tri alphabétique cohérent avec le tri numérique', () => {
    // La requête qui cherche le dernier numéro trie par ordre alphabétique
    // décroissant. Le rembourrage à cinq chiffres est ce qui rend ce tri juste :
    // sans lui, « INV-2026-9 » passerait après « INV-2026-10 ».
    const numeros = ['INV-2026-00002', 'INV-2026-00010', 'INV-2026-00009'];
    expect([...numeros].sort().reverse()[0]).toBe('INV-2026-00010');
  });

  it('expose le préfixe utilisé pour la recherche', () => {
    expect(prefixeAnnee(2026)).toBe('INV-2026-');
  });
});
