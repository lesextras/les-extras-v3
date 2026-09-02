import { slugDepuisTitre, slugLibre } from './slug-service';

/**
 * Ces tests existent pour une raison précise : c'est exactement cette
 * opération, mal écrite, qui a produit les douze adresses illisibles de
 * l'Édublog (« the-a-tre », « me-dico-social »). Le premier test ci-dessous
 * est celui qui aurait attrapé le défaut.
 */
describe('slugDepuisTitre', () => {
  it("supprime l'accent au lieu de le remplacer par un tiret", () => {
    expect(slugDepuisTitre('Atelier théâtre')).toBe('atelier-theatre');
    expect(slugDepuisTitre('en établissement médico-social')).toBe(
      'en-etablissement-medico-social',
    );
    expect(slugDepuisTitre('Échec scolaire : le décrochage')).toBe(
      'echec-scolaire-le-decrochage',
    );
  });

  it('réduit la ponctuation et les apostrophes à un seul tiret', () => {
    expect(slugDepuisTitre("L'atelier psycho-boxe : canaliser l'agressivité")).toBe(
      'l-atelier-psycho-boxe-canaliser-l-agressivite',
    );
    expect(slugDepuisTitre('  Ça,   c’est l’été ?  ')).toBe('ca-c-est-l-ete');
  });

  it('rend une chaîne vide quand il ne reste rien de lisible', () => {
    expect(slugDepuisTitre('!!! ???')).toBe('');
    expect(slugDepuisTitre('   ')).toBe('');
  });

  it('ne finit jamais par un tiret, même après troncature', () => {
    const long = `${'a'.repeat(119)} suite du titre`;
    const s = slugDepuisTitre(long);
    expect(s.endsWith('-')).toBe(false);
    expect(s.length).toBeLessThanOrEqual(120);
  });
});

describe('slugLibre', () => {
  it('rend le slug nu quand il est libre', async () => {
    expect(await slugLibre('Atelier théâtre', async () => false)).toBe('atelier-theatre');
  });

  it('suffixe comme le fait la migration SQL, sans jamais écraser', async () => {
    const pris = new Set(['atelier-theatre', 'atelier-theatre-2']);
    expect(await slugLibre('Atelier théâtre', async (s) => pris.has(s))).toBe(
      'atelier-theatre-3',
    );
  });

  it('rend null plutôt que d’inventer quand tout est pris', async () => {
    expect(await slugLibre('Atelier théâtre', async () => true)).toBeNull();
  });

  it('rend null sur un titre sans aucun caractère utilisable', async () => {
    expect(await slugLibre('!!!', async () => false)).toBeNull();
  });
});
