import { AccountRole, AccountType, MembershipStatus } from '@prisma/client';
import { AuthService } from './auth.service';

/**
 * REJOINDRE SON ÉTABLISSEMENT NE DOIT PAS EN CRÉER UN DOUZIÈME.
 *
 * ⚠⚠ LE DOUBLON D'ÉTABLISSEMENT EST LE PLUS COÛTEUX DES TROIS DOUBLONS DU
 * PRODUIT, et il s'écrivait tout seul à chaque inscription.
 *
 * Reconnaître son établissement dans la liste (« c'est le mien ») créait quand
 * même un compte ESTABLISHMENT — avec le nom EXACT de l'autre, donc un slug
 * suffixé — PUIS demandait le rattachement au vrai. Douze salariés d'une même
 * MECS produisaient douze maisons : douze organigrammes d'une personne, douze
 * catalogues, une équipe coupée en douze. Et ces homonymes réapparaissaient
 * aussitôt dans la liste censée les éviter, si bien que le treizième ne savait
 * plus lequel choisir.
 *
 * Ces tests verrouillent la réparation : quand l'établissement est reconnu,
 * AUCUN compte n'est créé, et la personne devient membre NON VÉRIFIÉ de
 * l'existant.
 */

const BASE = {
  email: 'camille@exemple.fr',
  password: 'motdepasse1',
  firstName: 'Camille',
  lastName: 'Durand',
  phone: '0601020304',
  accountType: AccountType.ESTABLISHMENT,
};

function harnais(options: { etablissement?: { id: string; name: string } | null } = {}) {
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
      // La recherche de l'établissement à rejoindre.
      findFirst: jest.fn().mockResolvedValue(options.etablissement ?? null),
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

describe('inscription — rejoindre un établissement existant', () => {
  it('ne crée AUCUN compte quand l’établissement est reconnu', async () => {
    const { service, tx } = harnais({
      etablissement: { id: 'etab-reel', name: 'MECS Les Tilleuls' },
    });

    await service.register({ ...BASE, rejoindreEtablissementId: 'etab-reel' } as never);

    expect(tx.account.create).not.toHaveBeenCalled();
  });

  it('rattache la personne au compte existant, NON VÉRIFIÉE', async () => {
    const { service, tx } = harnais({
      etablissement: { id: 'etab-reel', name: 'MECS Les Tilleuls' },
    });

    await service.register({ ...BASE, rejoindreEtablissementId: 'etab-reel' } as never);

    expect(tx.membership.create).toHaveBeenCalledTimes(1);
    const data = tx.membership.create.mock.calls[0][0].data;
    expect(data.accountId).toBe('etab-reel');
    expect(data.role).toBe(AccountRole.MEMBER);
    expect(data.status).toBe(MembershipStatus.ACTIVE);
    // ⚠ Le rattachement n'est pas vérifié : personne n'a encore attesté que
    // cette personne travaille là. C'est un collègue qui confirmera.
    expect(data.verifie).toBe(false);
    // ⚠ Et surtout PAS propriétaire : ce n'est pas sa maison.
    expect(data.role).not.toBe(AccountRole.OWNER);
  });

  it('prévient ceux qui peuvent confirmer le rattachement', async () => {
    const { service, prisma } = harnais({
      etablissement: { id: 'etab-reel', name: 'MECS Les Tilleuls' },
    });
    prisma.membership.findMany.mockResolvedValue([{ userId: 'u-directrice' }]);

    await service.register({ ...BASE, rejoindreEtablissementId: 'etab-reel' } as never);

    expect(prisma.notification.createMany).toHaveBeenCalled();
    const lignes = prisma.notification.createMany.mock.calls[0][0].data;
    expect(lignes[0].userId).toBe('u-directrice');
    expect(lignes[0].body).toMatch(/MECS Les Tilleuls/);
  });

  it('ne dote pas en crédits un compte qu’on n’a pas créé', async () => {
    const { service, tx } = harnais({
      etablissement: { id: 'etab-reel', name: 'MECS Les Tilleuls' },
    });

    await service.register({ ...BASE, rejoindreEtablissementId: 'etab-reel' } as never);

    expect(tx.creditLedger.create).not.toHaveBeenCalled();
  });

  /**
   * ⚠ NE PAS « RÉPARER » CE TEST en refusant l'inscription. Le champ vient
   * d'une liste cliquée ; un identifiant périmé ou trafiqué ne doit jamais
   * empêcher quelqu'un d'ouvrir son compte — on retombe sur la création
   * normale, qui est le comportement d'avant.
   */
  it('retombe sur la création normale si l’identifiant est inconnu', async () => {
    const { service, tx } = harnais({ etablissement: null });

    await service.register({
      ...BASE,
      organizationName: 'MECS Les Tilleuls',
      rejoindreEtablissementId: 'inexistant',
    } as never);

    expect(tx.account.create).toHaveBeenCalledTimes(1);
    expect(tx.membership.create.mock.calls[0][0].data.role).toBe(AccountRole.OWNER);
  });

  it('crée le compte comme avant quand on ne rejoint rien', async () => {
    const { service, tx } = harnais({ etablissement: null });

    await service.register({
      ...BASE,
      organizationName: 'MECS Les Tilleuls',
    } as never);

    expect(tx.account.create).toHaveBeenCalledTimes(1);
    expect(tx.account.create.mock.calls[0][0].data.name).toBe('MECS Les Tilleuls');
  });
});
