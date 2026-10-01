import { etatEtape, lireSuivi, marquerSuivi } from './chemin-suivi';
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
  it('garde les douze premiers slugs de l’association, aux mêmes numéros', () => {
    expect(ETAPES_CHEMIN.slice(0, 12).map((e) => e.slug)).toEqual(SLUGS_ASSOCIATION_HISTORIQUES);
  });

  it('garde les douze premiers slugs de l’académie, aux mêmes numéros', () => {
    expect(ETAPES_ACADEMIE.slice(0, 12).map((e) => e.slug)).toEqual(SLUGS_ACADEMIE_HISTORIQUES);
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
      if (e.partie === 'SELON_ACTIVITE' || e.partie === 'EVENEMENT') expect(e.peutNePasConcerner).toBe(true);
    }
  });

  it('n’écrit aucun tiret long dans le texte visible des nouvelles étapes', () => {
    const texte = JSON.stringify([ETAPES_CHEMIN.slice(12), ETAPES_ACADEMIE.slice(12), PARTIES_CHEMIN]);
    expect(texte).not.toContain('—');
  });

  it('compte 26 étapes pour l’association et 25 pour l’académie', () => {
    expect(ETAPES_CHEMIN).toHaveLength(26);
    expect(ETAPES_ACADEMIE).toHaveLength(25);
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
    expect(etatEtape(simple, ['siret'], {})).toEqual({ faite: true, pasConcerne: false, faiteLe: null });
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
