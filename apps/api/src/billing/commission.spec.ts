import { COMMISSION_DEFAUT, COMMISSION_RENFORT, decomposerPrix, tauxCommission } from './commission';

describe('commission (décision du 01/10/2026 : 0 % sur RenforTeam et les ateliers)', () => {
  it('ne prend rien sur un renfort RenforTeam', () => {
    expect(COMMISSION_RENFORT).toBe(0);
    expect(tauxCommission({ estRenfort: true })).toBe(0);
  });

  it('ne prend rien sur un atelier du catalogue', () => {
    expect(COMMISSION_DEFAUT).toBe(0);
    expect(tauxCommission({ estRenfort: false })).toBe(0);
  });

  it('le client paie exactement le tarif de l’intervenant', () => {
    const d = decomposerPrix(350, tauxCommission({ estRenfort: true }));
    expect(d).toEqual({ tarifIntervenant: 350, commission: 0, tauxCommission: 0, prixClientHt: 350 });
  });

  it('un taux négocié sur le compte prime toujours (chemin conservé)', () => {
    expect(tauxCommission({ estRenfort: true, tauxCompte: 0.1 })).toBe(0.1);
    expect(decomposerPrix(100, 0.1)).toMatchObject({ commission: 10, prixClientHt: 110 });
  });
});
