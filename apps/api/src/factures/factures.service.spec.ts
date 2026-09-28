import { ForbiddenException } from '@nestjs/common';
import { FacturesService } from './factures.service';
import { parserLecture } from './lecture';

/**
 * MES FACTURES : ce qui protège l'outil premium.
 *  - rien ne se lit sans abonnement actif ;
 *  - le quota se compte par mois, et repart au mois suivant ;
 *  - une hausse de 20 % chez le même fournisseur déclenche l'alerte ;
 *  - la réponse du moteur se lit même entourée de texte, et un montant
 *    illisible ne devient jamais un chiffre.
 */
function service(abonnement: Record<string, unknown> | null, precedente: Record<string, unknown> | null = null) {
  const prisma = {
    abonnementFactures: {
      findUnique: jest.fn(async () => abonnement),
      update: jest.fn(async () => undefined),
    },
    factureFournisseur: {
      findFirst: jest.fn(async () => precedente),
      create: jest.fn(async (args: { data: Record<string, unknown> }) => ({ id: 'f1', createdAt: new Date(), lignes: null, ...args.data })),
    },
  };
  const config = { get: (k: string) => (k === 'PILOTE_FACTURES_PRIX_CENTS' ? undefined : undefined) };
  const frais = { journaliser: jest.fn(async () => undefined), reglages: jest.fn(async () => ({ seuilDoubleValidation: null })) };
  const devis = { rapprocherFacture: jest.fn(async () => null) };
  const s = new FacturesService(prisma as never, {} as never, {} as never, {} as never, config as never, {} as never, frais as never, devis as never);
  return { s, prisma };
}

describe('Mes factures', () => {
  it("refuse la saisie sans abonnement actif", async () => {
    const { s } = service({ statut: 'pending' });
    await expect(s.saisir('a', { fournisseur: 'EDF', montantTTC: 10 })).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("annonce l'état de l'abonnement sans prix tant qu'il n'est pas fixé", async () => {
    const { s } = service(null);
    const a = await s.abonnement('a');
    expect(a.actif).toBe(false);
    expect(a.prixCents).toBeNull();
    expect(a.restantes).toBe(100);
  });

  it('remet le compteur à zéro quand le mois change', async () => {
    const { s } = service({ statut: 'active', quotaMensuel: 100, moisCompteur: '2020-01', luesCeMois: 100 });
    const a = await s.abonnement('a');
    expect(a.luesCeMois).toBe(0);
    expect(a.restantes).toBe(100);
  });

  it('prévient quand un fournisseur augmente de 20 % ou plus', async () => {
    const { s, prisma } = service({ statut: 'active', quotaMensuel: 100, moisCompteur: '', luesCeMois: 0 }, { montantTTC: 100, dateFacture: new Date() });
    const f = await s.saisir('a', { fournisseur: 'EDF', montantTTC: 125 });
    expect(f.variationPct).toBe(25);
    expect(f.alerte).toMatch(/Hausse de 25 %/);
    expect(prisma.factureFournisseur.create).toHaveBeenCalled();
  });

  it('lit la réponse du moteur entourée de texte, et ne chiffre jamais l’illisible', () => {
    const r = parserLecture('Voici : {"fournisseur":"Orange","montantTTC":"abc","poste":"Logiciels et abonnements","lignes":[]} merci');
    expect(r.fournisseur).toBe('Orange');
    expect(r.montantTTC).toBeNull();
    expect(r.poste).toBe('Logiciels et abonnements');
    expect(parserLecture('rien').fournisseur).toBe('');
  });
});
