import { totauxDevis, totalLigneHt } from './totaux';
import { figerPartie, relirePartiesFigees } from './parties';

/**
 * LE DEVIS EST LA PIÈCE QUI CONTRACTUALISE.
 *
 * Dans ce métier, ce n'est pas la facture qui engage — elle ne fait que
 * constater après coup. C'est le devis accepté qui lie les deux parties. Ce
 * qui est testé ici n'est donc pas un détail d'affichage : c'est l'exactitude
 * d'un engagement financier, et la stabilité de ce sur quoi une signature
 * porte.
 */
describe('Devis — les totaux', () => {
  it('somme les lignes hors taxes, sans TVA quand aucune ligne n en porte', () => {
    const t = totauxDevis([
      { quantity: 3, unitPrice: 120 },
      { quantity: 1, unitPrice: 60 },
    ]);
    expect(t.totalHt).toBe(420);
    expect(t.totalTva).toBe(0);
    expect(t.totalTtc).toBe(420);
  });

  it('applique un taux différent par ligne, et ventile par taux', () => {
    const t = totauxDevis([
      { quantity: 2, unitPrice: 100, vatRate: 20 },
      { quantity: 1, unitPrice: 100, vatRate: 10 },
      { quantity: 1, unitPrice: 50, vatRate: 0 },
    ]);
    expect(t.totalHt).toBe(350);
    expect(t.totalTva).toBe(50); // 40 + 10 + 0
    expect(t.totalTtc).toBe(400);
    expect(t.ventilation).toEqual([
      { taux: 0, baseHt: 50, tva: 0 },
      { taux: 10, baseHt: 100, tva: 10 },
      { taux: 20, baseHt: 200, tva: 40 },
    ]);
  });

  /**
   * Un client qui rajoute lui-même la colonne doit retrouver le total. Sinon
   * c'est le document qui a tort à ses yeux — et il a raison.
   */
  it('le total est exactement la somme des lignes imprimées', () => {
    const lignes = [
      { quantity: 3, unitPrice: 33.33 },
      { quantity: 7, unitPrice: 12.155 },
      { quantity: 1.5, unitPrice: 80.01 },
    ];
    const t = totauxDevis(lignes);
    const sommeDesLignesImprimees = lignes.reduce((s, l) => s + totalLigneHt(l), 0);
    expect(t.totalHt).toBeCloseTo(sommeDesLignesImprimees, 2);
  });

  /** 0,1 + 0,2 ne fait pas 0,3 en virgule flottante. */
  it('ne laisse pas filer les centimes sur des montants récurrents', () => {
    const t = totauxDevis(Array.from({ length: 300 }, () => ({ quantity: 1, unitPrice: 0.1 })));
    expect(t.totalHt).toBe(30);
  });

  it('traite une ligne sans taux comme non soumise — cas des devis antérieurs', () => {
    const t = totauxDevis([{ quantity: 1, unitPrice: 200 }]);
    expect(t.totalTva).toBe(0);
    expect(t.totalTtc).toBe(t.totalHt);
  });

  it('refuse de fabriquer un total à partir de rien', () => {
    const t = totauxDevis([]);
    expect(t.totalTtc).toBe(0);
    expect(t.ventilation).toEqual([]);
  });
});

describe("Devis — l'identité des parties est figée", () => {
  const compte = {
    name: 'MECS Le Coteau',
    legalName: 'Association Le Coteau',
    siret: '11111111100011',
    address: '3 rue des Tilleuls',
    postalCode: '77000',
    city: 'Melun',
    contactEmail: 'direction@lecoteau.example',
    phone: '0100000000',
    vatMention: null,
  };

  it('recopie les champs qui engagent', () => {
    const fige = figerPartie(compte);
    expect(fige.legalName).toBe('Association Le Coteau');
    expect(fige.siret).toBe('11111111100011');
  });

  /**
   * C'est tout l'intérêt de l'instantané : une correction de profil ne doit
   * pas réécrire un devis déjà accepté, ni rendre fausse l'empreinte de la
   * signature qui portait sur le texte d'origine.
   */
  it("ne suit pas une modification ultérieure du compte", () => {
    const fige = figerPartie(compte);
    const modifie = { ...compte, legalName: 'Association Le Coteau — nouvelle raison sociale' };
    expect(figerPartie(modifie).legalName).not.toBe(fige.legalName);
    expect(fige.legalName).toBe('Association Le Coteau');
  });

  it('relit un instantané stocké', () => {
    const stocke = { provider: compte, client: compte };
    const relu = relirePartiesFigees(stocke);
    expect(relu?.provider.siret).toBe('11111111100011');
    expect(relu?.client.city).toBe('Melun');
  });

  /**
   * Les devis antérieurs à cette version n'ont pas d'instantané. On renvoie
   * `null` pour que l'appelant retombe sur les profils courants : c'est moins
   * bon, mais c'est ce qui existait, et un document imparfait vaut mieux qu'un
   * document vide.
   */
  it('renvoie null sur un devis antérieur, sans lever', () => {
    expect(relirePartiesFigees(null)).toBeNull();
    expect(relirePartiesFigees(undefined)).toBeNull();
    expect(relirePartiesFigees({})).toBeNull();
    expect(relirePartiesFigees({ provider: compte })).toBeNull();
    expect(relirePartiesFigees('nimporte quoi')).toBeNull();
  });
});
