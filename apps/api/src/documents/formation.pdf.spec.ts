import { emargementPdf, formationPdf } from './formation.pdf';

/**
 * Ces tests ne jugent pas la beauté d'une mise en page — ils vérifient qu'un
 * PDF sort, qu'il en est bien un, et qu'aucune donnée du terrain ne fait
 * tomber la génération.
 *
 * Ce qui casse un rendu PDF, en pratique : un nom absent, une date de fin
 * manquante, une liste vide, un formateur non désigné. Toutes situations
 * ordinaires dans un organisme de formation, et toutes capables de faire
 * remonter une erreur 500 au moment précis où quelqu'un imprime devant un
 * auditeur.
 */

const enTeteFichierPdf = (b: Buffer) => b.subarray(0, 5).toString('latin1');

const inscription = {
  id: 'insc_abcdef12',
  learnerName: null,
  learnerEmail: null,
  learner: { firstName: 'Awa', lastName: 'Diallo', email: 'awa@example.org' },
  emargements: [
    { present: true, slotDate: new Date('2026-09-14T00:00:00Z'), slot: 'MORNING' },
    { present: true, slotDate: new Date('2026-09-14T00:00:00Z'), slot: 'AFTERNOON' },
    { present: false, slotDate: new Date('2026-09-15T00:00:00Z'), slot: 'MORNING' },
  ],
};

const sessionFormation = {
  id: 'sess_12345678',
  startDate: new Date('2026-09-14T00:00:00Z'),
  endDate: new Date('2026-09-15T00:00:00Z'),
  location: 'Melun — salle Jaurès',
  trainer: { firstName: 'Karim', lastName: 'Benali' },
};

const programme = {
  title: 'Prévenir et désamorcer la violence en institution',
  durationHours: 14,
  certifying: true,
  certificationName: 'RS 1234',
  objectives: "Repérer les signaux d'escalade\nMettre en œuvre une désescalade verbale",
  ownerAccount: { name: 'ADéPA', city: 'Melun' },
};

describe('attestation et certificat', () => {
  it('produit un PDF valide pour une attestation', async () => {
    const pdf = await formationPdf(
      { inscription, session: sessionFormation, formation: programme },
      'attestation',
    );

    expect(enTeteFichierPdf(pdf)).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(1000);
  });

  it('produit un PDF valide pour un certificat', async () => {
    const pdf = await formationPdf(
      { inscription, session: sessionFormation, formation: programme },
      'certificat',
    );

    expect(enTeteFichierPdf(pdf)).toBe('%PDF-');
  });

  it('tient debout sans formateur, sans lieu et sans date de fin', async () => {
    // La session d'une journée sans salle attribuée et sans formateur encore
    // désigné : cas parfaitement ordinaire d'un programme qui vient d'ouvrir.
    const pdf = await formationPdf(
      {
        inscription,
        session: { ...sessionFormation, endDate: null, location: null, trainer: null },
        formation: { ...programme, durationHours: null, objectives: null, certificationName: null },
      },
      'attestation',
    );

    expect(enTeteFichierPdf(pdf)).toBe('%PDF-');
  });

  it('tient debout pour un apprenant externe, connu par son seul nom', async () => {
    // L'apprenant qui n'a pas de compte sur la plateforme — le cas majoritaire
    // quand un établissement inscrit ses salariés.
    const pdf = await formationPdf(
      {
        inscription: {
          ...inscription,
          learner: null,
          learnerName: 'Jean Moreau',
          emargements: [],
        },
        session: sessionFormation,
        formation: programme,
      },
      'attestation',
    );

    expect(enTeteFichierPdf(pdf)).toBe('%PDF-');
  });
});

describe("feuille d'émargement", () => {
  const session = {
    ...sessionFormation,
    formation: {
      title: programme.title,
      durationHours: programme.durationHours,
      ownerAccount: programme.ownerAccount,
    },
  };

  it('produit un PDF valide avec plusieurs stagiaires', async () => {
    const pdf = await emargementPdf({
      session,
      inscriptions: [
        { id: 'i1', learnerName: null, learnerEmail: null, learner: inscription.learner },
        { id: 'i2', learnerName: 'Jean Moreau', learnerEmail: null, learner: null },
      ],
      emargements: [
        { inscriptionId: 'i1', slotDate: new Date('2026-09-14'), slot: 'MORNING', present: true },
        { inscriptionId: 'i2', slotDate: new Date('2026-09-14'), slot: 'MORNING', present: false },
      ],
    });

    expect(enTeteFichierPdf(pdf)).toBe('%PDF-');
  });

  it('produit une feuille vierge quand personne n’est encore inscrit', async () => {
    // On imprime souvent la feuille avant que les inscriptions soient closes.
    const pdf = await emargementPdf({ session, inscriptions: [], emargements: [] });

    expect(enTeteFichierPdf(pdf)).toBe('%PDF-');
  });

  it('passe à la page suivante au-delà d’une vingtaine de stagiaires', async () => {
    // Le saut de page est calculé à la main dans le module : une session de
    // trente personnes est exactement le cas où une erreur de calcul se voit.
    const inscriptions = Array.from({ length: 30 }, (_, n) => ({
      id: `i${n}`,
      learnerName: `Stagiaire numéro ${n + 1}`,
      learnerEmail: null,
      learner: null,
    }));

    const pdf = await emargementPdf({ session, inscriptions, emargements: [] });

    expect(enTeteFichierPdf(pdf)).toBe('%PDF-');
    expect(pdf.length).toBeGreaterThan(3000);
  });
});
