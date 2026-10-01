import { choisirDate, cycleAnnuel, etatEtape, lireSuivi, marquerSuivi } from './chemin-suivi';
import { ordonnerEtapes, prochaineEtape } from './chemin-obligations';
import { ETAPES_CHEMIN, PARTIES_CHEMIN } from '../association/chemin';
import { ETAPES_ACADEMIE } from '../academie/chemin';

/**
 * Les deux chemins ont gagné des étapes le 01/10/2026 : ce qui revient chaque
 * année, et ce qui dépend de l'activité. Les coches déjà enregistrées portent
 * les slugs des douze premières étapes : ils ne doivent jamais bouger.
 */
const SLUGS_ASSOCIATION_HISTORIQUES = [
  'declarer-l-association',
  'obtenir-le-siret',
  'les-cinq-pieces-d-identite',
  'le-compte-bancaire-et-l-assurance',
  'les-adherents-et-les-cotisations',
  'tenir-des-comptes-simples',
  'la-premiere-assemblee-generale',
  'le-projet-en-une-page',
  'le-premier-budget',
  'trouver-le-premier-financeur',
  'constituer-et-deposer-le-dossier',
  'rendre-compte',
];
const SLUGS_ACADEMIE_HISTORIQUES = [
  'est-ce-de-la-formation',
  'porteur-juridique',
  'siret-et-ape',
  'premiere-convention',
  'declaration-dreets',
  'documents-socles',
  'referents',
  'premiere-fiche-programme',
  'dossier-qualiopi',
  'choisir-certificateur',
  'passer-audit',
  'ouvrir-financements',
];

describe('Les chemins et leurs nouvelles étapes', () => {
  // Depuis le rangement par priorité (01/10/2026), les numéros peuvent bouger
  // dans une partie ; les slugs, jamais, et les douze premiers restent en tête.
  it('garde les douze premiers slugs de l’association, en tête du chemin', () => {
    expect([...ETAPES_CHEMIN.slice(0, 12).map((e) => e.slug)].sort()).toEqual([...SLUGS_ASSOCIATION_HISTORIQUES].sort());
  });

  it('garde les douze premiers slugs de l’académie, en tête du chemin', () => {
    expect([...ETAPES_ACADEMIE.slice(0, 12).map((e) => e.slug)].sort()).toEqual([...SLUGS_ACADEMIE_HISTORIQUES].sort());
  });

  it.each([
    ['association', ETAPES_CHEMIN],
    ['académie', ETAPES_ACADEMIE],
  ] as const)('numérote le chemin %s de 1 à N sans trou, avec des slugs uniques', (_nom, etapes) => {
    expect(etapes.map((e) => e.numero)).toEqual(etapes.map((_, i) => i + 1));
    expect(new Set(etapes.map((e) => e.slug)).size).toBe(etapes.length);
  });

  it('range les étapes de l’association dans l’ordre des parties', () => {
    const ordre = PARTIES_CHEMIN.map((p) => p.code);
    const rangs = ETAPES_CHEMIN.map((e) => ordre.indexOf(e.partie));
    expect(rangs.every((r) => r >= 0)).toBe(true);
    expect([...rangs].sort((a, b) => a - b)).toEqual(rangs);
    for (const e of ETAPES_CHEMIN) {
      if (e.partie === 'CHAQUE_ANNEE') expect(e.chaqueAnnee).toBe(true);
      if (e.partie === 'SELON_ACTIVITE' || e.partie === 'EVENEMENT' || e.partie === 'AGREMENTS') expect(e.peutNePasConcerner).toBe(true);
    }
  });

  it('n’écrit aucun tiret long dans le texte visible des nouvelles étapes', () => {
    const texte = JSON.stringify([ETAPES_CHEMIN.slice(12), ETAPES_ACADEMIE.slice(12), PARTIES_CHEMIN]);
    expect(texte).not.toContain('—');
  });

  it('compte 35 étapes pour l’association et 26 pour l’académie', () => {
    expect(ETAPES_CHEMIN).toHaveLength(35);
    expect(ETAPES_ACADEMIE).toHaveLength(26);
  });

  it('range les agréments dans leur partie, avec des slugs stables', () => {
    const agrements = ETAPES_CHEMIN.filter((e) => e.partie === 'AGREMENTS').map((e) => e.slug);
    expect([...agrements].sort()).toEqual(
      [
        'agrement-education-nationale',
        'agrement-espace-de-vie-sociale',
        'agrement-esus',
        'agrement-jeunesse-education-populaire',
        'agrement-service-civique',
        'agrement-sport',
        'habilitation-bafa-bafd',
        'rescrit-interet-general',
        'services-a-la-personne',
      ].sort(),
    );
    expect(JSON.stringify(ETAPES_CHEMIN.filter((e) => e.partie === 'AGREMENTS'))).not.toContain('—');
  });

  it.each([
    ['association', ETAPES_CHEMIN],
    ['académie', ETAPES_ACADEMIE],
  ] as const)('donne une priorité à chaque étape du chemin %s, et les range par priorité dans chaque partie', (_nom, etapes) => {
    for (const e of etapes) {
      expect([1, 2, 3]).toContain(e.priorite);
      // Une étape obligatoire pour tous ne peut pas être « Pas concerné » ; toutes les autres le peuvent.
      expect(Boolean(e.peutNePasConcerner)).toBe(e.nature !== 'OBLIGATOIRE');
      for (const d of e.debloque ?? []) expect(d.trim()).toBeTruthy();
    }
    // Un prérequis de la même partie passe toujours avant.
    const rang = new Map(etapes.map((e, i) => [e.slug, i]));
    for (const e of etapes) for (const p of e.prerequis ?? []) if (rang.get(p)! > rang.get(e.slug)!) {
      const a = etapes[rang.get(p)!] as { partie?: string };
      expect(a.partie ?? 'x').not.toBe((e as { partie?: string }).partie ?? 'y');
    }
  });

  it.each([
    ['association', ETAPES_CHEMIN],
    ['académie', ETAPES_ACADEMIE],
  ] as const)('dit pour chaque étape du chemin %s si elle est obligatoire, et ce qu’il faut avant', (_nom, etapes) => {
    const slugs = new Set(etapes.map((e) => e.slug));
    for (const e of etapes) {
      expect(['OBLIGATOIRE', 'CONSEILLE', 'SI_CONCERNE']).toContain(e.nature);
      // Une étape « Si concerné » dit toujours ce qui la déclenche.
      if (e.nature === 'SI_CONCERNE') expect(e.declencheur?.trim()).toBeTruthy();
      for (const p of e.prerequis ?? []) {
        expect(slugs.has(p)).toBe(true);
        expect(p).not.toBe(e.slug);
      }
      if (e.echeance) {
        expect(e.echeance.texte.trim()).toBeTruthy();
        if (e.echeance.dateFixe) {
          expect(e.echeance.dateFixe).toMatch(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);
        }
      }
      const visible = JSON.stringify([e.declencheur, e.echeance]);
      expect(visible).not.toContain('—');
    }
  });

  it('met l’agrément ESUS puis le Carif-Oref (Dokelio) en tête de « Être finançable »', () => {
    const slugs = ETAPES_ACADEMIE.slice(22).map((e) => e.slug);
    expect(slugs.slice(0, 2)).toEqual(['agrement-esus', 'carif-oref-et-france-travail']);
    const carif = ETAPES_ACADEMIE.find((e) => e.slug === 'carif-oref-et-france-travail');
    expect(carif?.liens?.map((l) => l.lien)).toContain('https://dokelio.iledefrance.fr/');
    const esus = ETAPES_CHEMIN.find((e) => e.slug === 'agrement-esus');
    expect(esus).toMatchObject({ partie: 'AGREMENTS', nature: 'SI_CONCERNE', peutNePasConcerner: true });
  });

  it('garde la date du BPF prudente : un repère, pas une certitude', () => {
    const bpf = ETAPES_ACADEMIE.find((e) => e.slug === 'bilan-pedagogique-et-financier');
    expect(bpf?.echeance).toMatchObject({ dateFixe: '04-30', indicative: true });
    expect(bpf?.echeance?.texte).toContain('date fixée par le ministère');
  });

  it('ne renvoie que vers des adresses https', () => {
    const liens = [
      ...ETAPES_CHEMIN.flatMap((e) => [...e.documents.map((d) => d.lien), ...e.renvois.map((r) => r.lien)]),
      ...ETAPES_ACADEMIE.flatMap((e) => (e.liens ?? []).map((l) => l.lien)),
    ].filter((l) => !l.startsWith('/'));
    for (const l of liens) expect(l).toMatch(/^https:\/\//);
  });
});

describe('Le suivi des étapes', () => {
  const annuelle = { slug: 'ag', chaqueAnnee: true };
  const selon = { slug: 'salarie', peutNePasConcerner: true };
  const simple = { slug: 'siret' };

  it('laisse faite une étape ancienne cochée sans date', () => {
    expect(etatEtape(simple, ['siret'], {})).toEqual({ faite: true, pasConcerne: false, faiteLe: null, cycle: null, echeanceLe: null, dateChoisie: null });
  });

  it('compte une étape annuelle faite seulement pendant l’année où elle a été cochée', () => {
    const { faites, suivi } = marquerSuivi([], {}, 'ag', true, false, new Date('2026-03-10T10:00:00Z'));
    expect(etatEtape(annuelle, faites, suivi, new Date('2026-12-31T12:00:00Z')).faite).toBe(true);
    expect(etatEtape(annuelle, faites, suivi, new Date('2027-01-01T12:00:00Z')).faite).toBe(false);
  });

  it('juge l’année à l’heure de Paris', () => {
    // 31/12/2026 à 23 h 30 UTC, c'est déjà le 1er janvier 2027 à Paris.
    const { faites, suivi } = marquerSuivi([], {}, 'ag', true, false, new Date('2026-12-31T23:30:00Z'));
    expect(etatEtape(annuelle, faites, suivi, new Date('2027-06-01T12:00:00Z')).faite).toBe(true);
  });

  it('refuse de compter une étape annuelle cochée sans date', () => {
    expect(etatEtape(annuelle, ['ag'], {}).faite).toBe(false);
  });

  it('garde « Pas concerné » comme une étape faite, avec son drapeau', () => {
    const { faites, suivi } = marquerSuivi([], {}, 'salarie', true, true);
    expect(etatEtape(selon, faites, suivi)).toMatchObject({ faite: true, pasConcerne: true });
    const decochee = marquerSuivi(faites, suivi, 'salarie', false, false);
    expect(decochee.faites).toEqual([]);
    expect(decochee.suivi).toEqual({});
  });

  it('ignore un suivi mal formé', () => {
    expect(lireSuivi(null)).toEqual({});
    expect(lireSuivi([1, 2])).toEqual({});
    expect(lireSuivi({ a: { le: 'pas une date' }, b: { le: '2026-01-02T00:00:00.000Z', pasConcerne: 'oui' } })).toEqual({
      b: { le: '2026-01-02T00:00:00.000Z' },
    });
  });
});

describe('Le cycle des étapes annuelles', () => {
  const ag = { slug: 'ag', chaqueAnnee: true, dateChoisie: { libelle: "Date de l'AG" } };
  const bpf = { slug: 'bpf', chaqueAnnee: true, echeance: { dateFixe: '04-30' } };

  it('garde l’année civile sans date', () => {
    expect(cycleAnnuel(null, null, null, new Date('2026-10-01T10:00:00Z'))).toEqual({ cycle: 2026, echeance: null });
  });

  it('passe à l’année suivante une fois la date passée, si l’étape est faite pour ce cycle', () => {
    const { faites, suivi } = marquerSuivi([], {}, 'bpf', true, false, new Date('2026-04-10T10:00:00Z'), 2026);
    const avant = etatEtape(bpf, faites, suivi, new Date('2026-04-20T10:00:00Z'));
    expect(avant).toMatchObject({ faite: true, cycle: 2026, echeanceLe: '2026-04-30' });
    const apres = etatEtape(bpf, faites, suivi, new Date('2026-05-02T10:00:00Z'));
    expect(apres).toMatchObject({ faite: false, cycle: 2027, echeanceLe: '2027-04-30' });
  });

  it('reste en retard sur le même cycle tant que l’étape n’est pas faite', () => {
    expect(etatEtape(bpf, [], {}, new Date('2026-06-01T10:00:00Z'))).toMatchObject({ faite: false, cycle: 2026, echeanceLe: '2026-04-30' });
  });

  it('suit la date choisie par la structure, et la garde quand on décoche', () => {
    let suivi = choisirDate({}, 'ag', '2027-03-10');
    expect(etatEtape(ag, [], suivi, new Date('2026-10-01T10:00:00Z'))).toMatchObject({ cycle: 2027, echeanceLe: '2027-03-10', dateChoisie: '2027-03-10' });
    const coche = marquerSuivi([], suivi, 'ag', true, false, new Date('2027-03-10T18:00:00Z'), 2027);
    expect(etatEtape(ag, coche.faites, coche.suivi, new Date('2027-03-10T20:00:00Z')).faite).toBe(true);
    // Le lendemain de l'AG : le cycle 2028 commence, à la même date.
    expect(etatEtape(ag, coche.faites, coche.suivi, new Date('2027-03-11T10:00:00Z'))).toMatchObject({ faite: false, cycle: 2028, echeanceLe: '2028-03-10' });
    const decoche = marquerSuivi(coche.faites, coche.suivi, 'ag', false, false);
    expect(decoche.suivi).toEqual({ ag: { date: '2027-03-10' } });
    suivi = choisirDate(decoche.suivi, 'ag', null);
    expect(suivi).toEqual({});
  });

  it('garde « Pas concerné » d’une année sur l’autre', () => {
    const regle = { slug: 'recus', chaqueAnnee: true, peutNePasConcerner: true };
    const { faites, suivi } = marquerSuivi([], {}, 'recus', true, true, new Date('2025-03-01T10:00:00Z'), 2025);
    expect(etatEtape(regle, faites, suivi, new Date('2026-10-01T10:00:00Z'))).toMatchObject({ faite: true, pasConcerne: true });
  });

  it('lit la date choisie seule, sans coche', () => {
    expect(lireSuivi({ ag: { date: '2026-06-15' }, x: { date: '2026-02-30' } })).toEqual({ ag: { date: '2026-06-15' } });
  });
});

describe('La priorité', () => {
  it('range par priorité sans passer devant un prérequis, puis renumérote', () => {
    const etapes = [
      { slug: 'a', numero: 1, priorite: 2 as const },
      { slug: 'b', numero: 2, priorite: 1 as const, prerequis: ['a'] },
      { slug: 'c', numero: 3, priorite: 1 as const },
    ];
    expect(ordonnerEtapes(etapes, () => 'g').map((e) => `${e.numero}${e.slug}`)).toEqual(['1c', '2a', '3b']);
  });

  it('propose la prochaine étape par priorité, prérequis faits', () => {
    const etapes = [
      { slug: 'a', numero: 1, priorite: 2 },
      { slug: 'b', numero: 2, priorite: 1, prerequis: ['a'] },
      { slug: 'c', numero: 3, priorite: 1 },
    ];
    expect(prochaineEtape(etapes, () => false)?.slug).toBe('c');
    expect(prochaineEtape(etapes, (s) => s === 'c')?.slug).toBe('a');
    expect(prochaineEtape(etapes, (s) => s !== 'b')?.slug).toBe('b');
  });
});
