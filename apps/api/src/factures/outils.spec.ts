import { lireCsvReleve, nettoyerIban, normaliserNom, scoreRapprochement, devinerPoste, natureRecette } from './outils';

/**
 * MES FACTURES, LA SUITE : ce qui protège la lecture d'un relevé et l'alerte RIB.
 */
describe('Outils de Mes factures', () => {
  it('lit un export CSV de banque française (date, libellé, débit, crédit)', () => {
    const csv = 'Date;Libellé;Débit;Crédit\n12/03/2026;PRLV SEPA EDF CLIENTS;"1 234,56";\n15/03/2026;VIR SEPA CAF 77 SUBVENTION;;2500,00\n';
    const l = lireCsvReleve(csv);
    expect(l).toEqual([
      { date: '2026-03-12', libelle: 'PRLV SEPA EDF CLIENTS', montant: -1234.56 },
      { date: '2026-03-15', libelle: 'VIR SEPA CAF 77 SUBVENTION', montant: 2500 },
    ]);
  });

  it('lit un CSV à montant signé et sans en-tête parlant', () => {
    const csv = 'date,label,amount\n2026-04-02,CB AMAZON EU,-49.9\n2026-04-03,REMISE CHEQUE,120\n';
    expect(lireCsvReleve(csv).map((x) => x.montant)).toEqual([-49.9, 120]);
  });

  it("vérifie un IBAN par sa clé et refuse un IBAN mal lu", () => {
    expect(nettoyerIban('FR76 3000 6000 0112 3456 7890 189')).toBe('FR7630006000011234567890189');
    expect(nettoyerIban('FR76 3000 6000 0112 3456 7890 180')).toBeNull();
    expect(nettoyerIban('pas un iban')).toBeNull();
  });

  it('normalise un nom de fournisseur sans sa forme juridique', () => {
    expect(normaliserNom('SAS Électricité de France')).toBe('electricite de france');
    expect(normaliserNom('EDF')).toBe(normaliserNom('E.D.F.'));
  });

  it('rapproche une sortie et une facture au montant exact, à une date qui colle, et pas au-delà', () => {
    const f = { fournisseur: 'Bureau Vallée', montantTTC: 89.9, dateFacture: new Date('2026-03-01'), dateEcheance: null };
    expect(scoreRapprochement({ date: new Date('2026-03-10'), libelle: 'CB BUREAU VALLEE MELUN', montant: -89.9 }, f)).toBe(3);
    expect(scoreRapprochement({ date: new Date('2026-03-10'), libelle: 'CB INCONNU', montant: -89.9 }, f)).toBe(2);
    expect(scoreRapprochement({ date: new Date('2026-09-10'), libelle: 'CB BUREAU VALLEE', montant: -89.9 }, f)).toBe(0);
    expect(scoreRapprochement({ date: new Date('2026-03-10'), libelle: 'CB BUREAU VALLEE', montant: -90 }, f)).toBe(0);
  });

  it('classe les libellés courants sans moteur', () => {
    expect(devinerPoste('PRLV SEPA MAIF ASSURANCES')).toBe('Assurance');
    expect(devinerPoste('CB SNCF CONNECT')).toBe('Déplacements');
    expect(natureRecette('VIR CAF SEINE ET MARNE')).toBe('Subvention');
    expect(natureRecette('VIR HELLOASSO DON')).toBe('Dons');
  });
});
