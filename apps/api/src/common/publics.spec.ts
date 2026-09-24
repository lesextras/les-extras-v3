import { clePublic, regrouperPublics, variantesDe, variantesSimples } from './publics';

describe('publics des ateliers : une grammaire, un filtre', () => {
  it('même clé pour le singulier, le pluriel et les accents', () => {
    expect(clePublic('Enfant')).toBe(clePublic('Enfants'));
    expect(clePublic('Sénior')).toBe(clePublic('Séniors'));
    expect(clePublic('Senior')).toBe(clePublic('Séniors'));
    expect(clePublic('Adolescent')).toBe(clePublic('Adolescents'));
    expect(clePublic('Enfants')).not.toBe(clePublic('Adolescents'));
  });

  it('regroupe les variantes et affiche la forme la plus courante', () => {
    const g = regrouperPublics(['Enfants', 'Enfant', 'Enfants', 'Adolescent', 'Adolescents', 'Séniors', 'Sénior']);
    expect(g.map((x) => x.libelle)).toEqual(['Adolescents', 'Enfants', 'Séniors']);
    expect(g.find((x) => x.libelle === 'Enfants')!.variantes.sort()).toEqual(['Enfant', 'Enfants']);
  });

  it('le filtre cherche toutes les variantes : aucune fiche cachée', () => {
    expect(variantesDe('Enfants', ['Enfant', 'Enfants', 'Adultes']).sort()).toEqual(['Enfant', 'Enfants']);
    expect(variantesSimples('Enfant').sort()).toEqual(['Enfant', 'Enfants']);
    expect(variantesSimples('Enfants').sort()).toEqual(['Enfant', 'Enfants']);
  });
});
