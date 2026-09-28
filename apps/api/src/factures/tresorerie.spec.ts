import { cleRecurrente, detecterRecurrents, prochaineOccurrence, TresorerieService } from './tresorerie.service';

const d = (s: string) => new Date(`${s}T00:00:00.000Z`);

describe('Trésorerie prévisionnelle : les récurrents', () => {
  it('réduit un libellé de banque à ce qui revient chaque mois', () => {
    expect(cleRecurrente('PRLV SEPA MAIF ASSURANCES ASSO REF 2026-09-05 ECH 12345')).toBe('maif assurances asso');
    expect(cleRecurrente('CB SNCF CONNECT 18/09')).toBe('sncf connect');
  });

  it('repère une charge qui revient trois mois sur six au même montant', () => {
    const ops = [
      { date: d('2026-04-05'), libelle: 'PRLV SEPA MAIF ASSURANCES 04/26', montant: -142.3 },
      { date: d('2026-05-05'), libelle: 'PRLV SEPA MAIF ASSURANCES 05/26', montant: -142.3 },
      { date: d('2026-06-06'), libelle: 'PRLV SEPA MAIF ASSURANCES 06/26', montant: -142.3 },
      { date: d('2026-06-12'), libelle: 'CB LEROY MERLIN', montant: -89 },
      { date: d('2026-07-12'), libelle: 'CB LEROY MERLIN', montant: -420 }, // montant trop différent : pas récurrent
    ];
    const r = detecterRecurrents(ops);
    expect(r).toHaveLength(1);
    expect(r[0].montant).toBe(-142.3);
    expect(r[0].jourDuMois).toBe(5);
    expect(r[0].occurrences).toBe(3);
  });

  it('ne retient pas deux occurrences', () => {
    const ops = [
      { date: d('2026-05-05'), libelle: 'PRLV OVH', montant: -12 },
      { date: d('2026-06-05'), libelle: 'PRLV OVH', montant: -12 },
    ];
    expect(detecterRecurrents(ops)).toHaveLength(0);
  });

  it('calcule la prochaine occurrence, jour du mois compris, et le 31 rabattu', () => {
    expect(prochaineOccurrence(d('2026-09-28'), 5, 0).toISOString().slice(0, 10)).toBe('2026-10-05');
    expect(prochaineOccurrence(d('2026-09-03'), 5, 0).toISOString().slice(0, 10)).toBe('2026-09-05');
    expect(prochaineOccurrence(d('2026-09-28'), 31, 2).toISOString().slice(0, 10)).toBe('2026-11-30');
  });
});

describe('Trésorerie prévisionnelle : la courbe', () => {
  function service(donnees: Record<string, unknown>) {
    const prisma = {
      releveBancaire: { findFirst: jest.fn().mockResolvedValue(donnees.releve ?? null) },
      operationBancaire: { findMany: jest.fn().mockResolvedValue(donnees.ops ?? []), groupBy: jest.fn().mockResolvedValue(donnees.recettesEnv ?? []) },
      factureFournisseur: { findMany: jest.fn().mockResolvedValue(donnees.factures ?? []) },
      noteDeFrais: { findMany: jest.fn().mockResolvedValue(donnees.notes ?? []) },
      devisFournisseur: { findMany: jest.fn().mockResolvedValue(donnees.devis ?? []) },
      enveloppeFactures: { findMany: jest.fn().mockResolvedValue(donnees.enveloppes ?? []) },
    };
    const frais = { reglages: jest.fn().mockResolvedValue(donnees.reglages ?? { seuilDoubleValidation: null, soldeBancaire: null, soldeBancaireAu: null }) };
    return new TresorerieService(prisma as never, frais as never);
  }

  it('part du solde saisi, ajoute les lignes de relevé postérieures, retire les factures à leur échéance', async () => {
    const s = service({
      reglages: { soldeBancaire: 1000, soldeBancaireAu: d('2026-09-20') },
      ops: [{ date: d('2026-09-25'), libelle: 'VIR CAF', montant: 500, sens: 'RECETTE', factureId: null }],
      factures: [{ id: 'f1', fournisseur: 'PAPETERIE', montantTTC: 237.36, dateFacture: d('2026-09-20'), dateEcheance: d('2026-10-15') }],
    });
    const p = await s.prevision('a', d('2026-09-28'));
    expect(p.soldeAujourdhui).toBe(1500);
    expect(p.mouvements.find((m) => m.type === 'facture')?.date).toBe('2026-10-15');
    expect(p.soldeFin).toBe(1262.64);
    expect(p.semaines).toHaveLength(13);
    expect(p.alertes).toHaveLength(0);
  });

  it('signale la semaine où le solde passe sous zéro, et les subventions sans date restent hors courbe', async () => {
    const s = service({
      reglages: { soldeBancaire: 100, soldeBancaireAu: d('2026-09-28') },
      factures: [{ id: 'f1', fournisseur: 'LOYER', montantTTC: 600, dateFacture: null, dateEcheance: d('2026-10-03') }],
      enveloppes: [
        { id: 'e1', nom: 'CAF', financeur: null, montantAccorde: 2500, dateVersementPrevu: null },
        { id: 'e2', nom: 'Ville', financeur: 'Melun', montantAccorde: 1000, dateVersementPrevu: d('2026-11-01') },
      ],
      recettesEnv: [{ enveloppeId: 'e1', _sum: { montant: 500 } }],
    });
    const p = await s.prevision('a', d('2026-09-28'));
    expect(p.aPercevoirSansDate).toEqual([{ id: 'e1', nom: 'CAF', montant: 2000 }]);
    expect(p.mouvements.find((m) => m.type === 'subvention')?.montant).toBe(1000);
    expect(p.alertes.some((a) => a.includes('sous zéro'))).toBe(true);
    expect(p.pointBas.montant).toBe(-500);
    expect(p.soldeFin).toBe(500);
  });

  it('sans solde de départ, le dit', async () => {
    const p = await service({}).prevision('a', d('2026-09-28'));
    expect(p.depart).toBeNull();
    expect(p.alertes[0]).toMatch(/solde de départ/);
  });
});
