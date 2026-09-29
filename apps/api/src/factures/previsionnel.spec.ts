import { comparer, nombre, parserPrevisionnel, rubriqueRecette, tauxAtteinte } from './previsionnel';
import { fusionnerRealise } from './previsionnel.service';

/**
 * PRÉVU / RÉALISÉ : ce que le dossier validé engageait, face à ce qui a été fait.
 * Ces tests verrouillent la lecture (rien d'inventé, les totaux écartés), la
 * comparaison à deux chiffres, et le report du réalisé quand on relit un dossier.
 */
describe('Prévu / réalisé : lecture du dossier', () => {
  it('lit les nombres écrits à la française', () => {
    expect(nombre('1 200,50 €')).toBe(1200.5);
    expect(nombre('12.500')).toBe(12500);
    expect(nombre('n/c')).toBeNull();
    expect(nombre(null)).toBeNull();
  });

  it('garde les lignes du budget, écarte les totaux et les comptes hors rubrique', () => {
    const p = parserPrevisionnel(
      'Voici : ```json {"intitule":"Ateliers du mercredi","periodeDebut":"2026-01-01","periodeFin":"2026-12-31",' +
        '"charges":[{"code":"606","libelle":"Fournitures","montant":"1 200"},{"code":"64","libelle":"Salaires","montant":8000},{"code":"","libelle":"Total des charges","montant":9200},{"code":"74","libelle":"égaré","montant":1}],' +
        '"produits":[{"code":"74","libelle":"Subvention CAF","montant":5000},{"code":"756","libelle":"Cotisations","montant":null}],' +
        '"objectifs":[{"intitule":"Tenir 30 ateliers","indicateur":"Feuilles de présence","cible":30,"unite":"ateliers"},{"intitule":""}],' +
        '"publics":[{"categorie":"Enfants 6-11 ans","nombre":40}],"remarque":null} ```',
    );
    expect(p.intitule).toBe('Ateliers du mercredi');
    expect(p.charges.map((c) => [c.code, c.prevu])).toEqual([['606', 1200], ['64', 8000]]);
    expect(p.produits.map((c) => [c.code, c.prevu])).toEqual([['74', 5000], ['756', null]]);
    expect(p.objectifs).toHaveLength(1);
    expect(p.objectifs[0].cible).toBe(30);
    expect(p.publics[0]).toEqual({ categorie: 'Enfants 6-11 ans', prevu: 40 });
  });

  it('dit quand le moteur ne rend rien de lisible, sans rien inventer', () => {
    const p = parserPrevisionnel('Je ne peux pas lire ce document.');
    expect(p.charges).toEqual([]);
    expect(p.remarque).toMatch(/à la main/);
  });
});

describe('Prévu / réalisé : comparaison', () => {
  it('regroupe le détail du dossier à deux chiffres et ajoute le réalisé saisi à la main', () => {
    const l = comparer(
      [
        { code: '606', libelle: 'Fournitures', prevu: 1000 },
        { code: '604', libelle: 'Prestations', prevu: 500 },
        { code: '64', libelle: 'Salaires', prevu: 8000, realiseManuel: 7600 },
      ],
      { '60': 1650, '62': 300 },
      15,
    );
    const par = Object.fromEntries(l.map((x) => [x.code, x]));
    expect(par['60']).toMatchObject({ prevu: 1500, realise: 1650, ecart: 150, ecartPct: 10, aExpliquer: false });
    expect(par['64']).toMatchObject({ prevu: 8000, realiseCalcule: 0, realiseManuel: 7600, realise: 7600, ecartPct: -5, aExpliquer: false });
    // Dépensé sans avoir été prévu : toujours à expliquer.
    expect(par['62']).toMatchObject({ prevu: 0, realise: 300, nonPrevue: true, aExpliquer: true, ecartPct: null });
  });

  it('signale un écart au-delà du seuil, dans les deux sens', () => {
    const l = comparer([{ code: '61', libelle: 'Loyer', prevu: 1000 }, { code: '62', libelle: 'Déplacements', prevu: 1000 }], { '61': 1200, '62': 700 }, 15);
    expect(l.map((x) => x.aExpliquer)).toEqual([true, true]);
    expect(comparer([{ code: '61', libelle: 'Loyer', prevu: 1000 }], { '61': 1200 }, 25)[0].aExpliquer).toBe(false);
  });

  it('calcule le taux d’atteinte seulement quand cible et réalisé existent', () => {
    expect(tauxAtteinte(30, 24)).toBe(80);
    expect(tauxAtteinte(null, 24)).toBeNull();
    expect(tauxAtteinte(30, null)).toBeNull();
    expect(tauxAtteinte(0, 5)).toBeNull();
  });

  it('range les recettes du relevé par nature', () => {
    expect(rubriqueRecette('Subvention')).toBe('74');
    expect(rubriqueRecette('Ventes')).toBe('70');
    expect(rubriqueRecette('Dons')).toBe('75');
    expect(rubriqueRecette(null)).toBe('75');
  });
});

describe('Prévu / réalisé : relire un dossier', () => {
  it('ne perd pas le réalisé déjà saisi', () => {
    const ancien = {
      intitule: null, periodeDebut: null, periodeFin: null, remarque: null,
      charges: [{ code: '64', libelle: 'Salaires', prevu: 8000, realiseManuel: 7600, commentaire: 'Un départ en juin' }],
      produits: [],
      objectifs: [{ intitule: 'Tenir 30 ateliers', indicateur: null, cible: 30, unite: 'ateliers', realise: 27 }],
      publics: [{ categorie: 'Enfants 6-11 ans', prevu: 40, realise: 36 }],
    };
    const nouveau = {
      ...ancien,
      charges: [{ code: '64', libelle: 'Rémunérations', prevu: 8200 }],
      objectifs: [{ intitule: 'tenir 30 ateliers ', indicateur: 'Présences', cible: 30, unite: 'ateliers' }],
      publics: [{ categorie: 'Enfants 6-11 ans', prevu: 45 }],
    };
    const f = fusionnerRealise(nouveau, ancien);
    expect(f.charges[0]).toMatchObject({ prevu: 8200, realiseManuel: 7600, commentaire: 'Un départ en juin' });
    expect(f.objectifs[0]).toMatchObject({ indicateur: 'Présences', realise: 27 });
    expect(f.publics[0]).toMatchObject({ prevu: 45, realise: 36 });
  });
});
