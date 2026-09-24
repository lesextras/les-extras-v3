import { PseudonymiseurService, lettrePersonne } from './pseudonymiseur.service';

/**
 * LES FUITES TROUVÉES LE 24/09/2026, VERROUILLÉES.
 *
 * 1. Au-delà de 26 personnes, la lettre repartait à A : la table écrasait la
 *    première valeur et la restauration rendait le mauvais nom.
 * 2. Des prénoms passaient en clair selon leur place : composés
 *    (« Jean-Pierre » → « Pierre »), entre parenthèses, collés à « : »,
 *    de deux lettres, ou tout en capitales sans voisin.
 */
describe('Pseudonymiseur : fuites du 24/09/2026', () => {
  const svc = new PseudonymiseurService();

  it('numérote sans jamais reboucler : A…Z, AA, AB…', () => {
    expect(lettrePersonne(0)).toBe('A');
    expect(lettrePersonne(25)).toBe('Z');
    expect(lettrePersonne(26)).toBe('AA');
    expect(lettrePersonne(27)).toBe('AB');
    expect(lettrePersonne(701)).toBe('ZZ');
    expect(lettrePersonne(702)).toBe('AAA');
    const vus = new Set(Array.from({ length: 1000 }, (_, i) => lettrePersonne(i)));
    expect(vus.size).toBe(1000);
  });

  it('au-delà de 26 personnes, chacune garde son jeton et son nom au retour', () => {
    const prenoms = [
      'Adam', 'Alice', 'Arthur', 'Camille', 'Chloé', 'Clara', 'Emma', 'Enzo', 'Ethan', 'Eva',
      'Gabriel', 'Hugo', 'Inès', 'Jade', 'Jules', 'Julie', 'Kevin', 'Léa', 'Léo', 'Lina',
      'Louis', 'Lucas', 'Manon', 'Maxime', 'Nathan', 'Nina', 'Noah', 'Paul', 'Sarah', 'Yanis',
    ];
    const original = `Présents ce matin : ${prenoms.join(', ')}.`;
    const { texte, table } = svc.masquer(original);
    for (const p of prenoms) expect(texte).not.toContain(p);
    const jetons = [...table.vers.keys()].filter((j) => j.startsWith('[PERSONNE-'));
    expect(new Set(jetons).size).toBe(prenoms.length);
    expect(svc.restaurer(texte, table)).toBe(original);
  });

  it.each([
    ['Ce matin, Jean-Pierre est arrivé en retard.', ['Jean', 'Pierre']],
    ['Réunion avec Anne-Sophie Martin-Durand demain.', ['Anne', 'Sophie', 'Martin', 'Durand']],
    ['Il a vu son frère (Kevin) dans la cour.', ['Kevin']],
    ['Il a dit:Yanis était là.', ['Yanis']],
    ['Aujourd’hui Jo et Ed ont joué.', ['Jo ', 'Ed ']],
    ['Il a frappé KEVIN hier.', ['KEVIN']],
    ['Liste : [Inès] et /Lucas.', ['Inès', 'Lucas']],
  ])('ne laisse rien passer : %s', (phrase, interdits) => {
    const { texte, table } = svc.masquer(phrase);
    for (const mot of interdits) expect(texte).not.toContain(mot);
    expect(svc.restaurer(texte, table)).toBe(phrase);
  });

  it('épargne toujours les sigles métier et le vocabulaire courant', () => {
    const { texte } = svc.masquer('Le SESSAD et la MECS ont tenu la réunion de synthèse.');
    expect(texte).toContain('SESSAD');
    expect(texte).toContain('MECS');
    expect(texte).toContain('réunion');
  });
});
