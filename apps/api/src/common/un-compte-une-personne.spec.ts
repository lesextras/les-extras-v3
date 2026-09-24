import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AccountRole, AccountType, MembershipStatus } from '@prisma/client';
import { AccountGuard } from './guards/account.guard';
import { OptionalAccountGuard } from './guards/optional-account.guard';
import {
  FILTRE_RATTACHEMENTS_ACCESSIBLES,
  MESSAGE_COMPTE_D_UNE_AUTRE_PERSONNE,
  rattachementDonneAcces,
} from './roles';
import { AccountsService } from '../accounts/accounts.service';
import { AuthService } from '../auth/auth.service';

/**
 * SUR LES EXTRAS, SEUL LE TITULAIRE OUVRE SON COMPTE (24/09/2026).
 *
 * « 1 compte = 1 personne » : les anciens rattachements d'équipe (ADMIN,
 * MANAGER, MEMBER) sur un compte établissement, intervenant ou particulier
 * restent en base mais n'ouvrent plus rien. Les espaces Piloter (association,
 * académie) gardent leurs membres et leurs rôles.
 */

function contexte(accountId: string) {
  const request: Record<string, unknown> = {
    user: { id: 'u1' },
    headers: { 'x-account-id': accountId },
    url: '/api/missions',
    method: 'GET',
  };
  return {
    request,
    ctx: { switchToHttp: () => ({ getRequest: () => request }) } as unknown as ExecutionContext,
  };
}

function prismaAvec(role: AccountRole, type: AccountType) {
  return {
    membership: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'mb1',
        accountId: 'acc1',
        role,
        status: MembershipStatus.ACTIVE,
        account: { type },
      }),
    },
  } as never;
}

describe('Accès à un compte : le titulaire seul sur Les Extras', () => {
  it.each([AccountType.ESTABLISHMENT, AccountType.FREELANCE, AccountType.PARTICULIER])(
    'AccountGuard refuse un ancien membre (non OWNER) d’un compte %s',
    async (type) => {
      for (const role of [AccountRole.ADMIN, AccountRole.MANAGER, AccountRole.MEMBER]) {
        const { ctx, request } = contexte('acc1');
        const garde = new AccountGuard(prismaAvec(role, type));
        await expect(garde.canActivate(ctx)).rejects.toThrow(MESSAGE_COMPTE_D_UNE_AUTRE_PERSONNE);
        await expect(garde.canActivate(ctx)).rejects.toBeInstanceOf(ForbiddenException);
        expect(request.account).toBeUndefined();
      }
    },
  );

  it('AccountGuard laisse passer le titulaire (OWNER) d’un établissement', async () => {
    const { ctx, request } = contexte('acc1');
    const garde = new AccountGuard(prismaAvec(AccountRole.OWNER, AccountType.ESTABLISHMENT));
    await expect(garde.canActivate(ctx)).resolves.toBe(true);
    expect(request.account).toMatchObject({ id: 'acc1', role: AccountRole.OWNER });
  });

  it.each([AccountType.ASSOCIATION, AccountType.ACADEMIE])(
    'AccountGuard laisse passer un membre d’un espace Piloter (%s)',
    async (type) => {
      const { ctx } = contexte('acc1');
      const garde = new AccountGuard(prismaAvec(AccountRole.MEMBER, type));
      await expect(garde.canActivate(ctx)).resolves.toBe(true);
    },
  );

  it('OptionalAccountGuard applique la même règle', async () => {
    const { ctx } = contexte('acc1');
    const garde = new OptionalAccountGuard(prismaAvec(AccountRole.MEMBER, AccountType.ESTABLISHMENT));
    await expect(garde.canActivate(ctx)).rejects.toThrow(MESSAGE_COMPTE_D_UNE_AUTRE_PERSONNE);
  });

  it('la règle, écrite une fois', () => {
    expect(rattachementDonneAcces('ESTABLISHMENT', 'OWNER')).toBe(true);
    expect(rattachementDonneAcces('ESTABLISHMENT', 'ADMIN')).toBe(false);
    expect(rattachementDonneAcces('FREELANCE', 'MEMBER')).toBe(false);
    expect(rattachementDonneAcces('ACADEMIE', 'MEMBER')).toBe(true);
    expect(rattachementDonneAcces('ASSOCIATION', 'MANAGER')).toBe(true);
  });
});

describe('Listes de comptes : seuls les comptes ouvrables', () => {
  it('findMine filtre sur OWNER ou espace Piloter, sans rien modifier', async () => {
    const prisma = {
      membership: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const service = new AccountsService(prisma as never);
    await expect(service.findMine('u1')).resolves.toEqual([]);
    const where = prisma.membership.findMany.mock.calls[0][0].where;
    expect(where).toMatchObject({ userId: 'u1', status: MembershipStatus.ACTIVE });
    expect(where.OR).toEqual(FILTRE_RATTACHEMENTS_ACCESSIBLES.OR);
  });

  it('switchAccount refuse un ancien membre d’un établissement', async () => {
    const service = new AccountsService(prismaAvec(AccountRole.MEMBER, AccountType.ESTABLISHMENT));
    await expect(service.switchAccount('u1', 'acc1')).rejects.toThrow(
      MESSAGE_COMPTE_D_UNE_AUTRE_PERSONNE,
    );
  });

  it('/auth/me et le jeton : filtre appliqué, et zéro compte ne fait rien planter', async () => {
    const findUniqueOrThrow = jest.fn().mockResolvedValue({
      id: 'u1',
      email: 'ancien.membre@exemple.fr',
      role: 'USER',
      memberships: [],
      profile: null,
    });
    const findUnique = jest.fn().mockResolvedValue({ onboardingStep: 3, memberships: [] });
    const signAsync = jest.fn().mockResolvedValue('jeton');
    const service = new AuthService(
      { user: { findUniqueOrThrow, findUnique } } as never,
      { signAsync } as never,
      { get: jest.fn() } as never,
      {} as never,
    );

    const me = await service.me('u1');
    expect(me.memberships).toEqual([]);
    expect(findUniqueOrThrow.mock.calls[0][0].select.memberships.where.OR).toEqual(
      FILTRE_RATTACHEMENTS_ACCESSIBLES.OR,
    );

    await (service as unknown as {
      signAccessToken: (a: string, b: string, c: string) => Promise<string>;
    }).signAccessToken('u1', 'ancien.membre@exemple.fr', 'USER');
    expect(findUnique.mock.calls[0][0].select.memberships.where.OR).toEqual(
      FILTRE_RATTACHEMENTS_ACCESSIBLES.OR,
    );
    const charge = signAsync.mock.calls[0][0];
    expect(charge.accounts).toEqual([]);
    expect(charge.account).toBeNull();
  });
});
