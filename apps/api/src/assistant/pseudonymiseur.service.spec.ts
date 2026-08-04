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

/**
 * NOMS EN CAPITALES.
 *
 * Presque toutes les trames d'établissement écrivent le patronyme en
 * capitales : « Nom et prénom : Kevin MARTIN ». Avant correction, le prénom
 * était masqué et le nom de famille partait en clair juste à côté — la fuite
 * la plus visible qu'on puisse imaginer sur un rapport d'enfant placé.
 *
 * L'équilibre à tenir : masquer ces patronymes SANS toucher aux intitulés de
 * sections ni aux sigles métier, qui sont eux aussi en capitales et qui sont
 * précisément ce qu'on cherche à apprendre d'un modèle d'écrit.
 */
describe('PseudonymiseurService — noms de famille en capitales', () => {
  const service = new PseudonymiseurService();

  it('masque le patronyme accolé à un prénom', () => {
    const { texte } = service.masquer('Le jeune Kevin MARTIN est arrivé en septembre.');
    expect(texte).not.toContain('MARTIN');
    expect(texte).not.toContain('Kevin');
  });

  it('masque le patronyme après une civilité', () => {
    const { texte } = service.masquer("Entretien avec Mme DUBOIS, la mère, au sujet du séjour.");
    expect(texte).not.toContain('DUBOIS');
  });

  it("ne touche PAS aux intitulés de sections d'une trame", () => {
    const modele = [
      'RAPPORT DE SITUATION',
      'I. IDENTIFICATION',
      'II. RAPPEL DE LA MESURE',
      'III. VIE QUOTIDIENNE ET SOCIALISATION',
      'VII. SYNTHESE ET PRECONISATIONS',
    ].join('\n');
    const { texte } = service.masquer(modele);
    expect(texte).toContain('RAPPORT DE SITUATION');
    expect(texte).toContain('IDENTIFICATION');
    expect(texte).toContain('VIE QUOTIDIENNE ET SOCIALISATION');
  });

  it('conserve les sigles du métier', () => {
    const { texte } = service.masquer(
      'Orientation vers un SESSAD étudiée avec la MDPH ; retour ASE attendu. Le jeune Kevin MARTIN est concerné.',
    );
    expect(texte).toContain('SESSAD');
    expect(texte).toContain('MDPH');
    expect(texte).toContain('ASE');
    expect(texte).not.toContain('MARTIN');
  });

  it("garde lisibles les étiquettes de formulaire d'une trame", () => {
    const { texte } = service.masquer(
      'Nom et prénom du jeune : Kevin MARTIN\nDate de naissance : 12/03/2011\nRéférent éducatif : Sarah DUBOIS',
    );
    // Les intitulés doivent survivre, sinon le squelette appris est illisible.
    expect(texte).toContain('Nom et prénom du jeune');
    expect(texte).toContain('Date de naissance');
    expect(texte).toContain('Référent éducatif');
    // Mais aucune identité ne doit passer.
    for (const nom of ['Kevin', 'MARTIN', 'Sarah', 'DUBOIS', '12/03/2011']) {
      expect(texte).not.toContain(nom);
    }
  });

  it('un aller-retour rend le texte intact', () => {
    const original = 'Nom : Kevin MARTIN. Référente : Mme DUBOIS. Né le 12/03/2011.';
    const { texte, table } = service.masquer(original);
    expect(service.restaurer(texte, table)).toBe(original);
  });
});
