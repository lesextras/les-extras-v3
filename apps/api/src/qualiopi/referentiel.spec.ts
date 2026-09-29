import { planifierReport, REPORT_PROBABLE, REPORT_SUR, RNQ } from './referentiel';

/**
 * Le référentiel doit porter la numérotation OFFICIELLE : la première version
 * rangeait le handicap en 21 et en 32, et un organisme classait ses preuves
 * sous les mauvais numéros sans que rien ne le signale.
 */
describe('Référentiel Qualiopi', () => {
  const numeros = RNQ.flatMap((c) => c.indicators.map((i) => i.n));

  it('porte 32 indicateurs uniques, numérotés de 1 à 32', () => {
    expect(numeros).toHaveLength(32);
    expect([...new Set(numeros)].sort((a, b) => a - b)).toEqual(Array.from({ length: 32 }, (_, i) => i + 1));
  });

  it('range chaque indicateur sous son critère officiel', () => {
    const attendu: Record<number, number[]> = { 1: [1, 3], 2: [4, 8], 3: [9, 16], 4: [17, 20], 5: [21, 22], 6: [23, 29], 7: [30, 32] };
    for (const c of RNQ) {
      const [de, a] = attendu[c.c];
      expect(c.indicators.map((i) => i.n)).toEqual(Array.from({ length: a - de + 1 }, (_, k) => de + k));
    }
  });

  it('met le handicap en 26, les appréciations en 30, les réclamations en 31 et l’amélioration en 32', () => {
    const libelle = (n: number) => RNQ.flatMap((c) => c.indicators).find((i) => i.n === n)!.label;
    expect(libelle(26)).toMatch(/handicap/);
    expect(libelle(30)).toMatch(/appréciations/);
    expect(libelle(31)).toMatch(/réclamations/);
    expect(libelle(32)).toMatch(/amélioration/);
    expect(RNQ.flatMap((c) => c.indicators).filter((i) => /handicap/.test(i.label)).map((i) => i.n)).toEqual([20, 26]);
  });

  it('prévoit un report pour chacun des 32 anciens numéros', () => {
    const couverts = [...Object.keys(REPORT_SUR), ...Object.keys(REPORT_PROBABLE)].map(Number).sort((a, b) => a - b);
    expect(couverts).toEqual(Array.from({ length: 32 }, (_, i) => i + 1));
  });
});

describe('Report des preuves déjà déposées', () => {
  const p = (id: string, ancienNumero: number, status = 'UPLOADED', label: string | null = null, ofAccountId = 'A') => ({ id, ofAccountId, ancienNumero, status, label, documentUrl: null, updatedAt: new Date('2026-09-01') });

  it('déplace la preuve « handicap » de l’ancien 21 vers le 26, et celle des intervenants de l’ancien 22 vers le 21', () => {
    const plan = planifierReport([p('h', 21, 'VALIDATED', 'Référent handicap'), p('f', 22, 'UPLOADED', 'CV des formateurs')]);
    expect(plan.find((r) => r.depuis[0] === 'h')!.numero).toBe(26);
    expect(plan.find((r) => r.depuis[0] === 'f')).toMatchObject({ numero: 21, label: 'CV des formateurs', status: 'UPLOADED' });
  });

  it('signale ce qui n’a qu’un équivalent probable', () => {
    const [r] = planifierReport([p('x', 29, 'UPLOADED', 'Registre des aléas')]);
    expect(r.numero).toBe(31);
    expect(r.label).toMatch(/^\[À vérifier : reportée depuis l’ancien n° 29/);
    expect(r.label).toMatch(/Registre des aléas$/);
  });

  it('ne perd rien quand deux preuves tombent sur le même numéro, et garde la plus sûre', () => {
    const plan = planifierReport([p('a', 29, 'VALIDATED', 'Aléas'), p('r', 30, 'UPLOADED', 'Procédure de réclamation')]);
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({ numero: 31, status: 'UPLOADED' });
    expect(plan[0].label).toMatch(/Procédure de réclamation/);
    expect(plan[0].label).toMatch(/ancien n° 29 : Aléas/);
    expect(plan[0].depuis.sort()).toEqual(['a', 'r']);
  });

  it('ne mélange jamais deux organismes', () => {
    const plan = planifierReport([p('a', 21, 'UPLOADED', null, 'A'), p('b', 21, 'UPLOADED', null, 'B')]);
    expect(plan.map((r) => r.ofAccountId).sort()).toEqual(['A', 'B']);
  });
});
