import { AgendaService } from './agenda.service';

/**
 * CE QUE CES TESTS PROTÈGENT.
 *
 * L'agenda ne détient presque rien : il projette des dates que d'autres écrans
 * tiennent déjà. Toute la valeur — et tout le risque — est dans cette
 * projection. Trois choses doivent rester vraies :
 *
 *  1. Une date choisie DANS un formulaire devient un rendez-vous visible. C'est
 *     le point que la fondatrice a demandé nommément (« interconnecte le
 *     calendrier avec […] les formulaires et les rdv ») et c'est aussi le plus
 *     facile à casser : la réponse est du JSON libre, la question est du JSON
 *     libre, et rien dans la base ne dit que l'une répond à l'autre.
 *  2. Une réponse hors de la fenêtre demandée ne remonte pas. Sans quoi ouvrir
 *     le mois de mars afficherait les rendez-vous de décembre.
 *  3. Les quatre dates d'un dossier de financement donnent quatre entrées
 *     distinctes et nommées : « déposer » et « rendre le compte rendu » ne sont
 *     pas le même événement, et les confondre ferait rater une échéance.
 */

const DU = '2026-10-01T00:00:00.000Z';
const AU = '2026-10-31T23:59:59.000Z';

/** Prisma réduit à ce que l'agrégateur consulte. */
function prismaMock(over: Record<string, unknown> = {}) {
  const vide = { findMany: jest.fn(async () => []) };
  return {
    rendezVous: { findMany: jest.fn(async () => []) },
    formationSession: { findMany: jest.fn(async () => []) },
    classeVirtuelle: { findMany: jest.fn(async () => []) },
    formulaire: { findMany: jest.fn(async () => []) },
    reponseFormulaire: { findMany: jest.fn(async () => []) },
    organisation: { findUnique: jest.fn(async () => null) },
    membership: { findMany: jest.fn(async () => []) },
    contactAssociation: { findMany: jest.fn(async () => []) },
    dossierFinancement: vide,
    pieceAssociation: vide,
    actionAssociation: vide,
    ...over,
  } as never;
}

describe('AgendaService — la projection', () => {
  it('fait d’une date choisie dans un formulaire un rendez-vous de l’agenda', async () => {
    const prisma = prismaMock({
      formulaire: {
        findMany: jest.fn(async () => [
          {
            id: 'f1',
            titre: 'Permanence du mardi',
            slug: 'permanence',
            statut: 'PUBLIE',
            fermeLe: null,
            champs: [
              { id: 'q1', type: 'TEXTE', libelle: 'Votre nom', obligatoire: true },
              { id: 'q2', type: 'DATE', libelle: 'Le jour qui vous arrange', obligatoire: true },
            ],
          },
        ]),
      },
      reponseFormulaire: {
        findMany: jest.fn(async () => [
          {
            id: 'r1',
            formulaireId: 'f1',
            email: 'lea@exemple.fr',
            valeurs: { q1: 'Léa Martin', q2: '2026-10-14' },
            createdAt: new Date('2026-09-20T10:00:00Z'),
          },
        ]),
      },
    });

    const service = new AgendaService(prisma);
    const evenements = await service.evenements('acc_1', DU, AU);

    expect(evenements).toHaveLength(1);
    const e = evenements[0];
    expect(e.source).toBe('REPONSE_FORMULAIRE');
    // Le nom vient de la question qui parle de nom, pas de l'adresse.
    expect(e.titre).toBe('Léa Martin — Permanence du mardi');
    expect(e.detail).toBe('Le jour qui vous arrange');
    expect(e.debut.toISOString().slice(0, 10)).toBe('2026-10-14');
    // Elle vit dans le formulaire : on ne la modifie pas depuis l'agenda.
    expect(e.modifiable).toBe(false);
  });

  it('laisse dehors les réponses qui tombent hors de la période affichée', async () => {
    const prisma = prismaMock({
      formulaire: {
        findMany: jest.fn(async () => [
          {
            id: 'f1',
            titre: 'Permanence',
            slug: 'p',
            statut: 'PUBLIE',
            fermeLe: null,
            champs: [{ id: 'q2', type: 'DATE', libelle: 'Quel jour ?', obligatoire: true }],
          },
        ]),
      },
      reponseFormulaire: {
        findMany: jest.fn(async () => [
          { id: 'r1', formulaireId: 'f1', email: null, valeurs: { q2: '2026-12-03' }, createdAt: new Date() },
          { id: 'r2', formulaireId: 'f1', email: null, valeurs: { q2: '2026-10-08' }, createdAt: new Date() },
        ]),
      },
    });

    const evenements = await new AgendaService(prisma).evenements('acc_1', DU, AU);
    expect(evenements.map((e) => e.debut.toISOString().slice(0, 10))).toEqual(['2026-10-08']);
  });

  it('donne à chaque date d’un dossier de financement sa propre ligne, nommée', async () => {
    const prisma = prismaMock({
      organisation: { findUnique: jest.fn(async () => ({ id: 'org_1' })) },
      dossierFinancement: {
        findMany: jest.fn(async () => [
          {
            id: 'd1',
            intitule: 'Fonds de développement de la vie associative',
            financeur: 'FDVA',
            dateLimiteDepot: new Date('2026-10-05T00:00:00Z'),
            dateDepot: null,
            dateDecision: null,
            dateCompteRendu: new Date('2026-10-28T00:00:00Z'),
          },
        ]),
      },
      pieceAssociation: { findMany: jest.fn(async () => []) },
      actionAssociation: { findMany: jest.fn(async () => []) },
    });

    const evenements = await new AgendaService(prisma).evenements('acc_1', DU, AU);
    expect(evenements.map((e) => e.titre)).toEqual([
      'Dépôt au plus tard — Fonds de développement de la vie associative',
      'Compte rendu à rendre — Fonds de développement de la vie associative',
    ]);
    // Rangées dans l'ordre du temps, pas dans celui de la base.
    expect(evenements[0].debut.getTime()).toBeLessThan(evenements[1].debut.getTime());
  });

  it('n’interroge pas les tables d’association quand le compte n’en est pas une', async () => {
    const dossiers = { findMany: jest.fn(async () => []) };
    const prisma = prismaMock({
      organisation: { findUnique: jest.fn(async () => null) },
      dossierFinancement: dossiers,
    });
    await new AgendaService(prisma).evenements('acc_1', DU, AU);
    expect(dossiers.findMany).not.toHaveBeenCalled();
  });
});

describe('AgendaService — qui on peut convier', () => {
  it('réunit l’équipe et le répertoire, sans doublon, en deux groupes', async () => {
    const prisma = prismaMock({
      membership: {
        findMany: jest.fn(async () => [
          { role: 'OWNER', user: { firstName: 'Sihame', lastName: 'Younous', email: 's@x.fr' } },
          { role: 'MEMBER', user: { firstName: 'Karim', lastName: 'Belaïd', email: 'k@x.fr' } },
          // Sans nom : on retombe sur l'adresse plutôt que sur rien.
          { role: 'MEMBER', user: { firstName: null, lastName: null, email: 'stagiaire@x.fr' } },
        ]),
      },
      organisation: { findUnique: jest.fn(async () => ({ id: 'org_1' })) },
      contactAssociation: {
        findMany: jest.fn(async () => [
          { prenom: 'Karim', nom: 'Belaïd', poste: null, structure: 'Mairie' }, // déjà dans l'équipe
          { prenom: 'Aline', nom: 'Roche', poste: 'Trésorière', structure: null },
        ]),
      },
    });

    const liste = await new AgendaService(prisma).personnes('acc_1');

    expect(liste.map((p) => p.nom)).toEqual([
      'Sihame Younous',
      'Karim Belaïd',
      'stagiaire@x.fr',
      'Aline Roche',
    ]);
    expect(liste[0]).toMatchObject({ groupe: 'EQUIPE', detail: 'Responsable' });
    expect(liste[3]).toMatchObject({ groupe: 'CONTACT', detail: 'Trésorière' });
  });

  it('ne propose que l’équipe quand le compte n’est pas une association', async () => {
    const contacts = { findMany: jest.fn(async () => []) };
    const prisma = prismaMock({
      membership: {
        findMany: jest.fn(async () => [
          { role: 'OWNER', user: { firstName: 'Sihame', lastName: 'Younous', email: 's@x.fr' } },
        ]),
      },
      organisation: { findUnique: jest.fn(async () => null) },
      contactAssociation: contacts,
    });

    const liste = await new AgendaService(prisma).personnes('acc_1');
    expect(liste).toHaveLength(1);
    expect(contacts.findMany).not.toHaveBeenCalled();
  });
});
