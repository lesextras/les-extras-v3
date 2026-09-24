import { ForbiddenException } from '@nestjs/common';
import { AccountRole, AccountType, InvitationStatus } from '@prisma/client';
import { InvitationsService } from './invitations.service';
import { MembershipsService } from '../memberships/memberships.service';

/**
 * LES INVITATIONS NE SERVENT PLUS QUE PILOTER (24/09/2026).
 *
 * Sur Les Extras, « 1 compte = 1 personne » : un établissement, un intervenant
 * ou un particulier n'invite personne dans son compte. Les espaces Piloter
 * (association, académie) gardent leurs droits d'accès, gérés par la direction
 * (OWNER) et l'administration (ADMIN).
 */

function harnais() {
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(null) },
    membership: { findUnique: jest.fn().mockResolvedValue(null) },
    invitation: {
      findUnique: jest.fn().mockResolvedValue(null),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'inv1', ...data })),
      update: jest.fn().mockResolvedValue({}),
    },
    account: { findUniqueOrThrow: jest.fn().mockResolvedValue({ name: 'Académie Test' }) },
    $transaction: jest.fn(),
  };
  const mail = { sendInvitation: jest.fn().mockResolvedValue(undefined) };
  const config = { get: jest.fn().mockReturnValue(7) };
  const service = new InvitationsService(prisma as never, mail as never, config as never);
  return { service, prisma, mail };
}

const invitant = { id: 'u-owner', email: 'owner@exemple.fr', role: 'USER' } as never;
const compte = (type: AccountType, role: AccountRole = AccountRole.OWNER) =>
  ({ id: 'acc1', role, type, membershipId: 'm1' }) as never;

describe('Invitations : espaces Piloter seulement', () => {
  it.each([AccountType.ESTABLISHMENT, AccountType.FREELANCE, AccountType.PARTICULIER])(
    'refuse d’inviter depuis un compte Les Extras (%s), même OWNER',
    async (type) => {
      const { service, prisma, mail } = harnais();
      await expect(
        service.create(compte(type), invitant, { email: 'collegue@exemple.fr' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.create(compte(type), invitant, { email: 'collegue@exemple.fr' }),
      ).rejects.toThrow(/un compte correspond à une seule personne/);
      expect(prisma.invitation.create).not.toHaveBeenCalled();
      expect(mail.sendInvitation).not.toHaveBeenCalled();
    },
  );

  it('refuse aussi de lister, renvoyer et révoquer sur un établissement', async () => {
    const { service } = harnais();
    const etab = compte(AccountType.ESTABLISHMENT);
    await expect(service.list(etab, invitant)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.resend(etab, invitant, 'inv1')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.revoke(etab, invitant, 'inv1')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([AccountType.ASSOCIATION, AccountType.ACADEMIE])(
    'autorise la direction d’un espace %s à inviter',
    async (type) => {
      const { service, prisma, mail } = harnais();
      await service.create(compte(type, AccountRole.OWNER), invitant, {
        email: 'Collegue@Exemple.fr',
        role: AccountRole.ADMIN,
      });
      expect(prisma.invitation.create).toHaveBeenCalledTimes(1);
      const data = prisma.invitation.create.mock.calls[0][0].data;
      expect(data.email).toBe('collegue@exemple.fr');
      expect(data.role).toBe(AccountRole.ADMIN);
      // Plus de niveau, de droits ni de service écrits.
      expect(data.niveau).toBeUndefined();
      expect(data.capacites).toBeUndefined();
      expect(data.orgUnitId).toBeUndefined();
      expect(mail.sendInvitation).toHaveBeenCalled();
    },
  );

  it('autorise l’administration (ADMIN) d’un espace Piloter', async () => {
    const { service, prisma } = harnais();
    await service.create(compte(AccountType.ACADEMIE, AccountRole.ADMIN), invitant, {
      email: 'x@exemple.fr',
    });
    expect(prisma.invitation.create.mock.calls[0][0].data.role).toBe(AccountRole.MEMBER);
  });

  it.each([AccountRole.MANAGER, AccountRole.MEMBER])(
    'refuse un %s d’un espace Piloter',
    async (role) => {
      const { service, prisma } = harnais();
      await expect(
        service.create(compte(AccountType.ASSOCIATION, role), invitant, { email: 'x@exemple.fr' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.invitation.create).not.toHaveBeenCalled();
    },
  );

  it('une invitation restée en attente sur un établissement ne crée plus de sous-compte', async () => {
    const { service, prisma } = harnais();
    prisma.invitation.findUnique.mockResolvedValue({
      id: 'inv-ancienne',
      email: 'collegue@exemple.fr',
      accountId: 'etab1',
      role: AccountRole.MEMBER,
      status: InvitationStatus.PENDING,
      expiresAt: new Date(Date.now() + 86_400_000),
      invitedById: 'u-owner',
      account: { type: AccountType.ESTABLISHMENT },
    });
    await expect(
      service.accept({ id: 'u2', email: 'collegue@exemple.fr', role: 'USER' } as never, 'jeton'),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('Gestion des membres : espaces Piloter seulement', () => {
  function monter() {
    const prisma = {
      membership: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'mb2',
          accountId: 'acc1',
          userId: 'u2',
          role: AccountRole.MEMBER,
          account: { ownerId: 'u-owner' },
        }),
        delete: jest.fn().mockResolvedValue({}),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const service = new MembershipsService(prisma as never, { log: jest.fn() } as never, {} as never);
    return { service, prisma };
  }

  it('refuse de retirer, suspendre ou changer le rôle sur un établissement', async () => {
    const { service, prisma } = monter();
    const etab = compte(AccountType.ESTABLISHMENT);
    await expect(service.remove(etab, 'mb2')).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.setStatus(etab, 'mb2', 'SUSPENDED' as never)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.changeRole(etab, 'mb2', AccountRole.ADMIN)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.membership.delete).not.toHaveBeenCalled();
    expect(prisma.membership.update).not.toHaveBeenCalled();
  });

  it('laisse la direction d’une académie retirer un membre', async () => {
    const { service, prisma } = monter();
    await service.remove(compte(AccountType.ACADEMIE), 'mb2');
    expect(prisma.membership.delete).toHaveBeenCalled();
  });
});
