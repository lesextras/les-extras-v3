import { AccountRole, AccountType, MembershipStatus } from '@prisma/client';
import { AuthService } from './auth.service';

/**
 * UN COMPTE = UNE PERSONNE (24/09/2026, décision de Siham).
 *
 * « Rejoindre un établissement existant » à l'inscription est retiré : il n'y
 * a plus de sous-comptes sur Les Extras. `rejoindreEtablissementId` et
 * `profilSalarie` restent acceptés par le DTO (un ancien écran web ne doit pas
 * recevoir un 400), mais ils sont IGNORÉS.
 *
 * Ces tests verrouillent ce comportement : chaque inscription crée SON compte,
 * dont la personne est OWNER, et aucun rattachement MEMBER n'est écrit chez
 * quelqu'un d'autre.
 */

const BASE = {
  email: 'camille@exemple.fr',
  password: 'motdepasse1',
  firstName: 'Camille',
  lastName: 'Durand',
  phone: '0601020304',
  accountType: AccountType.ESTABLISHMENT,
  organizationName: 'MECS Les Tilleuls',
};

function harnais() {
  const tx = {
    user: { create: jest.fn().mockResolvedValue({ id: 'u1', firstName: 'Camille' }) },
    account: {
      create: jest.fn().mockResolvedValue({ id: 'a-neuf' }),
      update: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue(null),
    },
    creditLedger: { create: jest.fn().mockResolvedValue({}) },
    membership: { create: jest.fn().mockResolvedValue({ id: 'mb1' }) },
  };

  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'u1',
        email: BASE.email,
        firstName: 'Camille',
        lastName: 'Durand',
        role: 'USER',
        memberships: [],
        profile: {},
      }),
    },
    account: {
      // Si le service cherchait encore l'établissement « à rejoindre », il le
      // trouverait : c'est ce qui prouve qu'il ne le cherche plus.
      findFirst: jest.fn().mockResolvedValue({ id: 'etab-reel', name: 'MECS Les Tilleuls' }),
      findUnique: jest.fn().mockResolvedValue(null),
    },
    membership: { findMany: jest.fn().mockResolvedValue([]) },
    notification: { createMany: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  };

  const service = new AuthService(
    prisma as never,
    { signAsync: jest.fn().mockResolvedValue('jeton') } as never,
    { get: jest.fn().mockReturnValue('test') } as never,
    {
      sendEmailVerification: jest.fn().mockResolvedValue(undefined),
      sendBienvenue: jest.fn().mockResolvedValue(undefined),
      sendAlerteInscription: jest.fn().mockResolvedValue(undefined),
    } as never,
  );

  return { service, prisma, tx };
}

describe('inscription : un compte = une personne', () => {
  it('ignore rejoindreEtablissementId et crée son propre compte', async () => {
    const { service, tx } = harnais();

    await service.register({ ...BASE, rejoindreEtablissementId: 'etab-reel' } as never);

    expect(tx.account.create).toHaveBeenCalledTimes(1);
    expect(tx.account.create.mock.calls[0][0].data.name).toBe('MECS Les Tilleuls');
  });

  it('la personne est OWNER de son compte, et de lui seul', async () => {
    const { service, tx } = harnais();

    await service.register({ ...BASE, rejoindreEtablissementId: 'etab-reel' } as never);

    expect(tx.membership.create).toHaveBeenCalledTimes(1);
    const data = tx.membership.create.mock.calls[0][0].data;
    expect(data.accountId).toBe('a-neuf');
    expect(data.accountId).not.toBe('etab-reel');
    expect(data.role).toBe(AccountRole.OWNER);
    expect(data.status).toBe(MembershipStatus.ACTIVE);
    // Aucun MEMBER écrit nulle part.
    const roles = tx.membership.create.mock.calls.map((c) => c[0].data.role);
    expect(roles).not.toContain(AccountRole.MEMBER);
  });

  it('ne prévient personne dans un autre établissement', async () => {
    const { service, prisma } = harnais();

    await service.register({ ...BASE, rejoindreEtablissementId: 'etab-reel' } as never);

    expect(prisma.notification.createMany).not.toHaveBeenCalled();
  });

  it('dote le nouveau compte comme toute inscription', async () => {
    const { service, tx } = harnais();

    await service.register({ ...BASE, rejoindreEtablissementId: 'etab-reel' } as never);

    expect(tx.creditLedger.create).toHaveBeenCalledTimes(1);
  });

  it('ignore profilSalarie : le compte intervenant naît sans ce drapeau', async () => {
    const { service, tx } = harnais();

    await service.register({
      ...BASE,
      accountType: AccountType.FREELANCE,
      organizationName: undefined,
      profilSalarie: true,
    } as never);

    const data = tx.account.create.mock.calls[0][0].data;
    expect(data.profilSalarie).toBeUndefined();
    expect(data.type).toBe(AccountType.FREELANCE);
  });

  it('exige toujours le nom de la structure, même avec rejoindreEtablissementId', async () => {
    const { service } = harnais();

    await expect(
      service.register({
        ...BASE,
        organizationName: undefined,
        rejoindreEtablissementId: 'etab-reel',
      } as never),
    ).rejects.toThrow(/nom de la structure/);
  });

  it('me() renvoie enAttenteRattachement toujours à false (compatibilité)', async () => {
    const { service } = harnais();
    const me = await service.me('u1');
    expect(me.enAttenteRattachement).toBe(false);
  });
});
