import { ForbiddenException } from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesService } from './invoices.service';
import { numeroSuivant, prefixeAnnee } from './numerotation';

/**
 * ÉMETTEUR ET PAYEUR.
 *
 * Une facture a deux côtés, et les confondre a des conséquences très
 * concrètes : c'est le SIRET de l'émetteur qui engage le document, et c'est le
 * payeur qui doit pouvoir le lire et le régler. Le module formations mettait le
 * PAYEUR comme titulaire de la facture — l'organisme certifié ne pouvait donc
 * ni l'émettre ni la télécharger, et le PDF imprimait l'établissement comme
 * émetteur de sa propre facture.
 *
 * Ce que ces tests protègent :
 *   1. Le payeur voit la facture et peut la télécharger.
 *   2. Le payeur ne peut PAS l'émettre, l'encaisser ni l'annuler.
 *   3. Un tiers ne voit rien.
 *   4. La numérotation reste continue, y compris après une annulation.
 */

const EMETTEUR = 'compte-adepa';
const PAYEUR = 'compte-mecs';

function facture(over: Record<string, unknown> = {}) {
  return {
    id: 'f1',
    accountId: EMETTEUR,
    payerAccountId: PAYEUR,
    number: 'INV-2026-00007',
    amount: { toString: () => '1600.00' },
    status: InvoiceStatus.DRAFT,
    account: { id: EMETTEUR, owner: { email: 'adepa@ex.fr' } },
    payer: { id: PAYEUR, name: 'MECS', owner: { email: 'mecs@ex.fr' } },
    booking: null,
    ...over,
  };
}

function monter(f = facture()) {
  const prisma: any = {
    invoice: {
      findUnique: jest.fn().mockResolvedValue(f),
      findFirst: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn((args: any) => Promise.resolve({ ...f, ...args.data })),
      create: jest.fn((args: any) => Promise.resolve({ id: 'nouvelle', ...args.data })),
      count: jest.fn().mockResolvedValue(0),
    },
  };
  const mail = { sendInvoiceIssued: jest.fn().mockResolvedValue(undefined) };
  const service = new InvoicesService(prisma, mail as any);
  return { service, prisma, mail };
}

describe('InvoicesService — émetteur et payeur', () => {
  it('le payeur peut lire la facture qui lui est adressée', async () => {
    const { service } = monter();
    await expect(service.findOne('f1', PAYEUR)).resolves.toMatchObject({ id: 'f1' });
  });

  it('un tiers ne voit rien', async () => {
    const { service } = monter();
    await expect(service.findOne('f1', 'compte-inconnu')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it("le payeur ne peut pas émettre la facture", async () => {
    const { service, prisma } = monter();
    await expect(service.issue('f1', PAYEUR)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.invoice.update).not.toHaveBeenCalled();
  });

  it('le payeur ne peut ni encaisser ni annuler', async () => {
    const emise = monter(facture({ status: InvoiceStatus.ISSUED }));
    await expect(emise.service.markPaid('f1', PAYEUR)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(emise.service.cancel('f1', PAYEUR)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("l'émetteur émet la facture et pose sa date", async () => {
    const { service, prisma } = monter();
    const r: any = await service.issue('f1', EMETTEUR);
    expect(r.status).toBe(InvoiceStatus.ISSUED);
    expect(prisma.invoice.update.mock.calls[0][0].data.issuedAt).toBeInstanceOf(Date);
  });

  it("l'e-mail d'émission part au PAYEUR, pas à l'émetteur", async () => {
    // Il partait à l'émetteur, qui la connaissait déjà : personne n'était
    // prévenu, et la facture restait sans réponse.
    const { service, mail } = monter();
    await service.issue('f1', EMETTEUR);
    expect(mail.sendInvoiceIssued).toHaveBeenCalledTimes(1);
    expect(mail.sendInvoiceIssued.mock.calls[0][0]).toBe('mecs@ex.fr');
  });

  it('sans payeur désigné, on retombe sur le client de la réservation', async () => {
    const { service, mail } = monter(
      facture({
        payerAccountId: null,
        payer: null,
        booking: { accountId: 'compte-client', account: { owner: { email: 'client@ex.fr' } } },
      }),
    );
    await service.issue('f1', EMETTEUR);
    expect(mail.sendInvoiceIssued.mock.calls[0][0]).toBe('client@ex.fr');
  });

  it('la liste rend les factures émises ET celles reçues', async () => {
    const { service, prisma } = monter();
    await service.findAllByAccount(PAYEUR);
    expect(prisma.invoice.findMany.mock.calls[0][0].where).toEqual({
      OR: [{ accountId: PAYEUR }, { payerAccountId: PAYEUR }],
    });
  });
});

describe('Numérotation — la règle que le module formations ignorait', () => {
  it('repart du DERNIER numéro, jamais du nombre de factures', () => {
    // Trois factures dont une annulée : compter donnerait 00003, ce qui est
    // déjà attribué. La séquence légale doit continuer à 00004.
    expect(numeroSuivant(2026, 'INV-2026-00003')).toBe('INV-2026-00004');
  });

  it('la séquence est annuelle', () => {
    expect(numeroSuivant(2027, 'INV-2026-00987')).toBe('INV-2027-00001');
    expect(prefixeAnnee(2027)).toBe('INV-2027-');
  });
});

describe('Numérotation — scopée par émetteur', () => {
  // Une séquence globale mélangeait les factures de personnes morales
  // distinctes : deux établissements sans aucun lien recevaient des numéros
  // qui se suivaient dans la MÊME suite — non conforme à l'art. 242 nonies A
  // de l'annexe II au CGI, qui exige une séquence continue PAR ÉMETTEUR.
  it('interroge le dernier numéro filtré sur le compte émetteur', async () => {
    const { service, prisma } = monter();
    await service.create(EMETTEUR, { amount: 100 });
    expect(prisma.invoice.findFirst).toHaveBeenCalledTimes(1);
    expect(prisma.invoice.findFirst.mock.calls[0][0].where).toMatchObject({
      accountId: EMETTEUR,
    });
  });

  it('deux émetteurs différents peuvent chacun avoir leur propre INV-2026-00001', async () => {
    const { service: serviceA } = monter();
    const { service: serviceB } = monter();
    // Aucun des deux comptes n'a encore de facture cette année : chacun
    // reçoit légitimement le même premier numéro, dans sa propre séquence.
    const a: any = await serviceA.create('compte-a', { amount: 50 });
    const b: any = await serviceB.create('compte-b', { amount: 50 });
    expect(a.number).toBe(b.number);
  });
});
