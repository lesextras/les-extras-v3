import { ForbiddenException, GoneException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { CreditsService } from './credits.service';
import { EnveloppesService } from './enveloppes.service';

/**
 * ENVELOPPES LEX — ce qui ne doit jamais casser :
 *  1. l'enveloppe paie AVANT le solde de la personne, et c'est le payeur qui
 *     est débité, avec l'auteur et l'enveloppe au grand livre ;
 *  2. le plafond du mois atteint, on retombe sur le solde de la personne ;
 *  3. un échec de génération rembourse le PAYEUR, pas la personne ;
 *  4. une invitation ne s'accepte qu'avec l'adresse invitée, confirmée ;
 *  5. le jeton n'est jamais gardé en clair, l'aperçu public masque l'adresse.
 */

function banque(opts: { consomme?: number; plafond?: number; soldePayeur?: number } = {}) {
  const ecritures: any[] = [];
  const comptes: Record<string, { credits: number; isMember: boolean }> = {
    moi: { credits: 15, isMember: false },
    mecs: { credits: opts.soldePayeur ?? 100, isMember: false },
  };
  const enveloppe = { id: 'env1', payeurAccountId: 'mecs', plafondMensuel: opts.plafond ?? 20, statut: 'ACTIVE' };
  const prisma: any = {
    account: {
      findUnique: jest.fn(({ where }: any) => Promise.resolve(comptes[where.id])),
      findUniqueOrThrow: jest.fn(({ where }: any) => Promise.resolve(comptes[where.id])),
      updateMany: jest.fn(({ where, data }: any) => {
        const c = comptes[where.id];
        if (c.credits < where.credits.gte) return Promise.resolve({ count: 0 });
        c.credits -= data.credits.decrement;
        return Promise.resolve({ count: 1 });
      }),
      update: jest.fn(({ where, data }: any) => {
        comptes[where.id].credits += data.credits.increment;
        return Promise.resolve(comptes[where.id]);
      }),
    },
    enveloppeLex: {
      findMany: jest.fn().mockResolvedValue(
        (opts.soldePayeur ?? 100) > 0 ? [{ id: 'env1', payeurAccountId: 'mecs', plafondMensuel: enveloppe.plafondMensuel }] : [],
      ),
      findUnique: jest.fn().mockResolvedValue(enveloppe),
    },
    creditLedger: {
      create: jest.fn(({ data }: any) => {
        ecritures.push(data);
        return Promise.resolve(data);
      }),
      aggregate: jest.fn().mockResolvedValue({ _sum: { delta: -(opts.consomme ?? 0) } }),
    },
  };
  prisma.$transaction = jest.fn((fn: any) => fn(prisma));
  return { service: new CreditsService(prisma), prisma, comptes, ecritures };
}

describe('Enveloppe LEX : qui paie la génération', () => {
  it("l'enveloppe paie d'abord : le payeur est débité, l'auteur et l'enveloppe sont au grand livre", async () => {
    const { service, comptes, ecritures } = banque();
    await service.avecCredit('moi', 'LEX_ECRIT', async () => 'ok', { userId: 'u1', label: 'Synthèse' });
    expect(comptes.mecs.credits).toBe(99);
    expect(comptes.moi.credits).toBe(15);
    expect(ecritures[0]).toMatchObject({ accountId: 'mecs', delta: -1, userId: 'u1', enveloppeId: 'env1' });
  });

  it('plafond du mois atteint : on retombe sur le solde de la personne', async () => {
    const { service, comptes, ecritures } = banque({ consomme: 20, plafond: 20 });
    await service.avecCredit('moi', 'LEX_ECRIT', async () => 'ok', { userId: 'u1' });
    expect(comptes.mecs.credits).toBe(100);
    expect(comptes.moi.credits).toBe(14);
    expect(ecritures[0]).toMatchObject({ accountId: 'moi', delta: -1 });
    expect(ecritures[0].enveloppeId).toBeUndefined();
  });

  it('un échec de génération rembourse le PAYEUR, sur la même enveloppe', async () => {
    const { service, comptes, ecritures } = banque();
    await expect(
      service.avecCredit('moi', 'LEX_ECRIT', async () => {
        throw new Error('moteur');
      }, { userId: 'u1' }),
    ).rejects.toThrow('moteur');
    expect(comptes.mecs.credits).toBe(100);
    expect(ecritures[1]).toMatchObject({ accountId: 'mecs', delta: 1, enveloppeId: 'env1' });
  });

  it('sans auteur (appel technique), aucune enveloppe n’est lue', async () => {
    const { service, prisma } = banque();
    await service.avecCredit('moi', 'LEX_ECRIT', async () => 'ok');
    expect(prisma.enveloppeLex.findMany).not.toHaveBeenCalled();
  });
});

function invitations(etat: Partial<{ email: string; verifie: boolean; expire: Date; statut: string }> = {}) {
  const jeton = 'j'.repeat(43);
  const enveloppe = {
    id: 'env1',
    payeurAccountId: 'mecs',
    email: etat.email ?? 'educ@exemple.fr',
    plafondMensuel: 30,
    partageTrames: true,
    statut: etat.statut ?? 'INVITEE',
    jetonHash: createHash('sha256').update(jeton).digest('hex'),
    jetonExpireLe: etat.expire ?? new Date(Date.now() + 86_400_000),
    creeParId: 'chef',
  };
  const prisma: any = {
    enveloppeLex: {
      findUnique: jest.fn(({ where }: any) =>
        Promise.resolve(where.jetonHash === enveloppe.jetonHash ? enveloppe : null),
      ),
      update: jest.fn(({ data }: any) => Promise.resolve({ ...enveloppe, ...data })),
      create: jest.fn(({ data }: any) => Promise.resolve({ id: 'env2', ...data })),
      count: jest.fn().mockResolvedValue(0),
      findMany: jest.fn().mockResolvedValue([]),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ firstName: 'Nadia', lastName: 'B.', email: 'chef@mecs.fr' }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ emailVerified: etat.verifie ?? true }),
    },
    account: { findUnique: jest.fn().mockResolvedValue({ name: 'MECS Les Tilleuls' }) },
  };
  const mail = { webUrl: 'https://les-extras.fr', sendEnveloppeLex: jest.fn().mockResolvedValue(undefined) };
  const notifications = { create: jest.fn().mockResolvedValue(undefined) };
  const service = new EnveloppesService(prisma, mail as never, notifications as never);
  return { service, prisma, mail, jeton };
}

const chef = { id: 'chef', email: 'chef@mecs.fr', role: 'USER' } as any;
const compteChef = { id: 'mecs', role: 'OWNER', type: 'ESTABLISHMENT', membershipId: 'm' } as any;

describe('Enveloppe LEX : invitations', () => {
  it("invite : garde l'empreinte, jamais le jeton, et envoie le lien à l'adresse", async () => {
    const { service, prisma, mail } = invitations();
    prisma.enveloppeLex.findUnique.mockResolvedValueOnce(null);
    const r = await service.inviter(chef, compteChef, { email: 'Educ@Exemple.fr', plafondMensuel: 30 });
    const data = prisma.enveloppeLex.create.mock.calls[0][0].data;
    expect(data.email).toBe('educ@exemple.fr');
    expect(data.jetonHash).toHaveLength(64);
    expect(JSON.stringify(data)).not.toContain(r.lien.split('jeton=')[1]);
    expect(mail.sendEnveloppeLex).toHaveBeenCalledWith('educ@exemple.fr', expect.objectContaining({ plafond: 30 }));
  });

  it('refuse un compte dont on n’est pas titulaire, et sa propre adresse', async () => {
    const { service } = invitations();
    await expect(service.inviter(chef, { ...compteChef, role: 'MEMBER' }, { email: 'a@b.fr', plafondMensuel: 5 })).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.inviter(chef, compteChef, { email: 'chef@mecs.fr', plafondMensuel: 5 })).rejects.toThrow();
  });

  it("n'accepte qu'avec l'adresse invitée, confirmée", async () => {
    const { service, jeton } = invitations();
    await expect(service.accepter({ id: 'u9', email: 'autre@exemple.fr', role: 'USER' } as any, jeton)).rejects.toBeInstanceOf(ForbiddenException);
    const nonVerifie = invitations({ verifie: false });
    await expect(nonVerifie.service.accepter({ id: 'u1', email: 'educ@exemple.fr', role: 'USER' } as any, nonVerifie.jeton)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("accepte : l'enveloppe devient active et le jeton est effacé", async () => {
    const { service, prisma, jeton } = invitations();
    await service.accepter({ id: 'u1', email: 'educ@exemple.fr', role: 'USER' } as any, jeton);
    expect(prisma.enveloppeLex.update.mock.calls[0][0].data).toMatchObject({ beneficiaireId: 'u1', statut: 'ACTIVE', jetonHash: null });
  });

  it("l'aperçu public masque l'adresse ; un lien expiré est refusé", async () => {
    const { service, jeton } = invitations();
    const a = await service.apercu(jeton);
    expect(a.emailMasque).toBe('ed…@exemple.fr');
    expect(JSON.stringify(a)).not.toContain('educ@');
    const expire = invitations({ expire: new Date(Date.now() - 1000) });
    await expect(expire.service.apercu(expire.jeton)).rejects.toBeInstanceOf(GoneException);
  });
});
