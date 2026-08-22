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

/**
 * FAUX POSITIFS — LE COMPTEUR QUI DÉTRUIT LA CONFIANCE.
 *
 * Sur une saisie qui ne contenait AUCUN prénom (« Public : Adolescents 13-16
 * ans en MECS… »), LEX annonçait cinq identités protégées : l'heuristique
 * « mot capitalisé au milieu d'une phrase = nom propre » prenait les étiquettes
 * de rubrique et le vocabulaire du métier pour des personnes. Un professionnel
 * qui voit ça cesse de croire au reste du dispositif.
 *
 * Ces tests tiennent les DEUX bouts : plus de faux positifs sur le vocabulaire
 * ordinaire, et pas un prénom de moins masqué qu'avant. Le second bout prime :
 * mieux vaut mille fois un mot masqué en trop qu'une identité laissée en clair.
 */
describe('PseudonymiseurService — faux positifs', () => {
  const service = new PseudonymiseurService();

  it("ne voit aucune personne dans une demande d'activité qui n'en nomme aucune", () => {
    const source = [
      'Public : Adolescents 13-16 ans en MECS, groupe mixte',
      'Besoins / difficultés à travailler : conflits au repas et au coucher',
      'Durée disponible : 1h',
      'Effectif : 8 jeunes',
    ].join('\n');
    const { texte, table } = service.masquer(source);
    expect(texte).toBe(source);
    expect(service.resume(table).personnes).toBe(0);
  });

  it('laisse intactes les étiquettes de rubrique et le vocabulaire du métier', () => {
    const source =
      'Objectifs souhaités : Autonomie et Coopération. Contraintes : Salle polyvalente, Budget limité. Support : Théâtre le Mercredi.';
    const { texte, table } = service.masquer(source);
    expect(texte).toBe(source);
    expect(service.resume(table).personnes).toBe(0);
  });

  it('masque toujours un prénom placé exactement là où se produisaient les faux positifs', () => {
    // Même position qu'« Adolescents » ci-dessus : après l'étiquette d'un champ.
    const { texte } = service.masquer('Public : Yassine, 14 ans en MECS, conflits au repas');
    expect(texte).not.toContain('Yassine');
    expect(texte).toMatch(/\[PERSONNE-[A-Z]+\]/);
  });

  it("masque un prénom même entouré de vocabulaire ordinaire", () => {
    const { texte } = service.masquer(
      'Atelier théâtre : Adolescents en MECS. Kevin et Yanis ont participé au repas.',
    );
    expect(texte).toContain('Adolescents');
    expect(texte).not.toContain('Kevin');
    expect(texte).not.toContain('Yanis');
  });

  it('masque le nom que la civilité annonce, même au milieu d’une phrase', () => {
    // Avant correction, « Monsieur » était reconnu comme mot courant et
    // emportait le nom avec lui : l'identité repartait en clair.
    for (const source of [
      'Rendez-vous pris. Ce matin, Monsieur Kevin a refusé le repas.',
      'Note du soir. Ce matin, Madame Zoubida est venue.',
    ]) {
      const { texte } = service.masquer(source);
      expect(texte).not.toContain('Kevin');
      expect(texte).not.toContain('Zoubida');
      expect(texte).toMatch(/\[PERSONNE-[A-Z]+\]/);
    }
  });
});

/**
 * JETONS PARLANTS.
 *
 * Le moteur écrit nettement mieux quand il sait qui est l'enfant, qui est la
 * mère et qui est la collègue. La règle d'or : on n'étiquette QUE lorsqu'on est
 * sûr. Inverser deux rôles dans un rapport lu par un juge coûte infiniment plus
 * cher que d'y laisser une lettre.
 */
describe('PseudonymiseurService — jetons par rôle', () => {
  const service = new PseudonymiseurService();

  it('nomme le rôle quand la phrase le donne avant le nom', () => {
    const { texte } = service.masquer(
      "Le jeune Kevin a refusé de se lever. Sa mère, Mme Martin, avait annulé la visite.",
    );
    expect(texte).toContain('[LE JEUNE]');
    expect(texte).not.toContain('Kevin');
    expect(texte).not.toContain('Martin');
  });

  it('nomme le rôle quand il vient après le nom', () => {
    const { texte } = service.masquer('Entretien ce matin. Lina, sa sœur, attendait dehors.');
    expect(texte).toContain('[LA SŒUR]');
    expect(texte).not.toContain('Lina');
  });

  it('reconnaît un rôle introduit par une apostrophe', () => {
    const { texte } = service.masquer(
      "Point de service. L'éducatrice Sarah est intervenue vers 9h.",
    );
    expect(texte).toContain("[L'ÉDUCATRICE]");
    expect(texte).not.toContain('Sarah');
  });

  it("n'étiquette pas quand deux personnes partagent le même nom", () => {
    // Père et mère portent le même patronyme : leur donner un rôle
    // reviendrait à en attribuer un faux à l'un des deux.
    const { texte } = service.masquer(
      'Entretien avec Mme DUBOIS, sa mère, et M. DUBOIS, son père.',
    );
    expect(texte).not.toContain('[LA MÈRE]');
    expect(texte).not.toContain('[LE PÈRE]');
    expect(texte).toMatch(/\[PERSONNE-[A-Z]+\]/);
    expect(texte).not.toContain('DUBOIS');
  });

  it("n'inverse pas les rôles sur « la mère de X »", () => {
    // Ici c'est l'ENFANT qui est nommé, pas la mère.
    const { texte } = service.masquer("Rendez-vous manqué. La mère de Kevin n'est pas venue.");
    expect(texte).not.toContain('[LA MÈRE]');
    expect(texte).not.toContain('Kevin');
  });

  it('donne deux jetons distincts à deux personnes de même rôle', () => {
    const { texte, table } = service.masquer(
      'Fratrie présente. Le frère Yanis et le frère Medhi étaient là.',
    );
    expect(texte).toContain('[LE FRÈRE]');
    expect(texte).toContain('[LE FRÈRE 2]');
    expect(table.vers.get('[LE FRÈRE]')).not.toBe(table.vers.get('[LE FRÈRE 2]'));
  });

  it('conserve la civilité et restitue le nom complet', () => {
    // Avant correction, « Mme Martin » revenait « Martin » — dans un courrier
    // adressé à une famille, la faute se voit immédiatement.
    const original = 'Suite à notre échange. Mme Martin a confirmé sa venue.';
    const { texte, table } = service.masquer(original);
    expect(texte).toContain('Mme [');
    expect(service.restaurer(texte, table)).toBe(original);
  });

  it('restitue même si le moteur a changé la casse ou les espaces du jeton', () => {
    const { table } = service.masquer('Point du soir. Le jeune Kevin a bien mangé.');
    expect(service.restaurer('Ce midi, [le  jeune] a mangé seul.', table)).toBe(
      'Ce midi, Kevin a mangé seul.',
    );
  });

  it("un aller-retour rend le texte intact, rôles compris", () => {
    const original =
      "Le jeune Kevin a refusé de se lever. Sarah, l'éducatrice, est intervenue. Sa mère, Mme Martin, avait annulé la visite. Lina, sa sœur, attendait.";
    const { texte, table } = service.masquer(original);
    expect(service.restaurer(texte, table)).toBe(original);
  });
});
