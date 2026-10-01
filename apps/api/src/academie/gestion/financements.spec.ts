import { EtapeProspect, StatutPriseEnCharge } from '@prisma/client';
import {
  PIECES_PAR_DEFAUT,
  actionEnRetard,
  dateLimiteParDefaut,
  etatDossier,
  montantDemande,
  resumeDossiers,
  resumeProspects,
} from './financements';

const J = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('Financements et prospects : les règles', () => {
  it('calcule le montant demandé : stagiaires × heures × tarif horaire, en centimes', () => {
    expect(montantDemande(3, 14, 4500)).toBe(189_000); // 3 × 14 h × 45 € = 1 890 €
    expect(montantDemande(1, 7.5, 3333)).toBe(24_998); // arrondi au centime
    expect(montantDemande(0, 14, 4500)).toBe(0);
    expect(montantDemande(2, 0, 4500)).toBe(0);
  });

  it('fixe la date limite de dépôt à début − 15 jours', () => {
    expect(dateLimiteParDefaut(J('2026-11-16'))?.toISOString()).toBe('2026-11-01T00:00:00.000Z');
    expect(dateLimiteParDefaut(J('2026-03-10'))?.toISOString()).toBe('2026-02-23T00:00:00.000Z');
    expect(dateLimiteParDefaut(null)).toBeNull();
  });

  it('repère un dépôt proche, un dépôt dépassé, et ignore un dossier déjà déposé', () => {
    const maintenant = new Date('2026-10-01T10:00:00.000Z');
    const base = { dateFacturation: null };
    expect(etatDossier({ ...base, statut: StatutPriseEnCharge.A_DEPOSER, dateLimiteDepot: J('2026-10-05') }, maintenant)).toMatchObject({
      joursAvantDepot: 4,
      depotProche: true,
      depotEnRetard: false,
      enRetard: false,
    });
    // Le jour même n'est pas encore en retard.
    expect(etatDossier({ ...base, statut: StatutPriseEnCharge.A_DEPOSER, dateLimiteDepot: J('2026-10-01') }, maintenant).depotEnRetard).toBe(false);
    expect(etatDossier({ ...base, statut: StatutPriseEnCharge.A_DEPOSER, dateLimiteDepot: J('2026-09-30') }, maintenant)).toMatchObject({
      joursAvantDepot: -1,
      depotEnRetard: true,
      enRetard: true,
    });
    expect(etatDossier({ ...base, statut: StatutPriseEnCharge.A_DEPOSER, dateLimiteDepot: J('2026-10-20') }, maintenant).depotProche).toBe(false);
    expect(etatDossier({ ...base, statut: StatutPriseEnCharge.DEPOSE, dateLimiteDepot: J('2026-09-01') }, maintenant).enRetard).toBe(false);
  });

  it('signale une facture au financeur impayée après 45 jours', () => {
    const maintenant = new Date('2026-10-01T10:00:00.000Z');
    const d = { statut: StatutPriseEnCharge.FACTURE, dateLimiteDepot: null };
    expect(etatDossier({ ...d, dateFacturation: J('2026-08-01') }, maintenant).paiementEnRetard).toBe(true);
    expect(etatDossier({ ...d, dateFacturation: J('2026-09-01') }, maintenant).paiementEnRetard).toBe(false);
    expect(etatDossier({ ...d, statut: StatutPriseEnCharge.PAYE, dateFacturation: J('2026-06-01') }, maintenant).paiementEnRetard).toBe(false);
  });

  it('résume les montants et les retards, sans compter les dossiers refusés ou annulés', () => {
    const maintenant = new Date('2026-10-01T10:00:00.000Z');
    const r = resumeDossiers(
      [
        { statut: 'A_DEPOSER', dateLimiteDepot: J('2026-09-20'), dateFacturation: null, montantDemandeCents: 100_000, montantAccordeCents: null },
        { statut: 'ACCORDE', dateLimiteDepot: null, dateFacturation: null, montantDemandeCents: 200_000, montantAccordeCents: 150_000 },
        { statut: 'FACTURE', dateLimiteDepot: null, dateFacturation: J('2026-07-01'), montantDemandeCents: 50_000, montantAccordeCents: null },
        { statut: 'PAYE', dateLimiteDepot: null, dateFacturation: J('2026-05-01'), montantDemandeCents: 80_000, montantAccordeCents: 70_000 },
        { statut: 'REFUSE', dateLimiteDepot: null, dateFacturation: null, montantDemandeCents: 999_999, montantAccordeCents: null },
      ],
      maintenant,
    );
    expect(r).toMatchObject({
      total: 5,
      enCours: 3,
      demandeCents: 430_000,
      accordeCents: 270_000,
      payeCents: 70_000,
      depotsEnRetard: 1,
      paiementsEnRetard: 1,
      enRetard: 2,
    });
  });

  it('pré-remplit huit pièces, dans l’ordre du dossier', () => {
    expect(PIECES_PAR_DEFAUT).toHaveLength(8);
    expect(PIECES_PAR_DEFAUT[0]).toBe('Devis signé');
    expect(PIECES_PAR_DEFAUT[7]).toBe('Facture envoyée au financeur');
  });

  it('compte les prospects par étape et les actions en retard', () => {
    const maintenant = new Date('2026-10-01T10:00:00.000Z');
    expect(actionEnRetard({ etape: EtapeProspect.CONTACTE, dateProchaineAction: J('2026-09-30') }, maintenant)).toBe(true);
    expect(actionEnRetard({ etape: EtapeProspect.CONTACTE, dateProchaineAction: J('2026-10-01') }, maintenant)).toBe(false);
    expect(actionEnRetard({ etape: EtapeProspect.GAGNE, dateProchaineAction: J('2026-09-01') }, maintenant)).toBe(false);
    const r = resumeProspects(
      [
        { etape: 'NOUVEAU', montantEstimeCents: 100_000, dateProchaineAction: J('2026-09-15') },
        { etape: 'DEVIS_ENVOYE', montantEstimeCents: 250_000, dateProchaineAction: null },
        { etape: 'GAGNE', montantEstimeCents: 300_000, dateProchaineAction: J('2026-09-01') },
        { etape: 'PERDU', montantEstimeCents: 50_000, dateProchaineAction: null },
      ],
      maintenant,
    );
    expect(r.parEtape).toEqual({ NOUVEAU: 1, CONTACTE: 0, DEVIS_ENVOYE: 1, GAGNE: 1, PERDU: 1 });
    expect(r.enCoursCents).toBe(350_000);
    expect(r.gagneCents).toBe(300_000);
    expect(r.actionsEnRetard).toBe(1);
  });
});
