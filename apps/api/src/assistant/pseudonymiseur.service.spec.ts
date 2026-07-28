import { PseudonymiseurService } from './pseudonymiseur.service';

/**
 * La pseudonymisation est la garantie centrale de l'assistant : ces tests
 * verrouillent qu'aucun identifiant direct ne part vers le fournisseur d'IA
 * et que la restauration reproduit exactement le texte attendu.
 */
describe('PseudonymiseurService', () => {
  const svc = new PseudonymiseurService();

  it('masque un prénom en milieu de phrase et le restaure', () => {
    const source = 'Ce matin, Kevin a refusé de se lever. Kevin s’est calmé vers 9h.';
    const { texte, table } = svc.masquer(source);
    expect(texte).not.toContain('Kevin');
    expect(texte).toMatch(/\[PERSONNE-A\]/);
    // Jeton stable : les deux occurrences portent le même code.
    expect(texte.match(/\[PERSONNE-A\]/g)?.length).toBe(2);
    expect(svc.restaurer(texte, table)).toBe(source);
  });

  it('masque civilité + nom (Mme Martin)', () => {
    const { texte } = svc.masquer('Entretien avec Mme Martin au sujet du planning.');
    expect(texte).not.toContain('Martin');
  });

  it('masque e-mails, téléphones et dates de naissance', () => {
    const source = 'Joindre la référente au 06 12 34 56 78 ou ref@ase77.fr. Né le 12/03/2011.';
    const { texte, table } = svc.masquer(source);
    expect(texte).not.toContain('06 12 34 56 78');
    expect(texte).not.toContain('ref@ase77.fr');
    expect(texte).not.toContain('12/03/2011');
    expect(svc.restaurer(texte, table)).toBe(source);
  });

  it('ne masque pas les mots courants en tête de phrase', () => {
    const { texte } = svc.masquer('Le groupe a bien participé. Après le repas, tout était calme.');
    expect(texte).toContain('Le groupe');
    expect(texte).toContain('Après le repas');
  });

  it('résume ce qui a été protégé', () => {
    const { table } = svc.masquer('Kevin a appelé sa mère au 06 11 22 33 44 le 01/02/2020.');
    const r = svc.resume(table);
    expect(r.personnes).toBeGreaterThanOrEqual(1);
    expect(r.contacts).toBe(1);
    expect(r.dates).toBe(1);
  });
});

describe('PseudonymiseurService — prénom en tête de phrase', () => {
  const svc = new PseudonymiseurService();

  it('masque un prénom du dictionnaire qui ouvre une phrase', () => {
    const source = 'Medhi a son rdv dentiste demain. Yanis était calme.';
    const { texte, table } = svc.masquer(source);
    expect(texte).not.toContain('Medhi');
    expect(texte).not.toContain('Yanis');
    expect(svc.restaurer(texte, table)).toBe(source);
  });

  it('ne masque pas un verbe capitalisé en tête de phrase', () => {
    const { texte } = svc.masquer('Prévoir un accompagnement. Surveiller le sommeil.');
    expect(texte).toContain('Prévoir');
    expect(texte).toContain('Surveiller');
  });
});
