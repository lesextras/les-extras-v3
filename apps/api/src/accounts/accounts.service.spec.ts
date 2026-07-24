import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AccountType, MembershipStatus } from '@prisma/client';
import { AccountsService } from './accounts.service';

/**
 * Mock de PrismaService : uniquement les délégués/méthodes réellement
 * appelés par les cas testés. Typé `any` pour rester découplé du client Prisma.
 */
function createPrismaMock() {
  return {
    membership: {
      findUnique: jest.fn(),
    },
    account: {
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    creditLedger: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('AccountsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: AccountsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new AccountsService(prisma as any);
  });

  describe('adjustCredits', () => {
    it('en mode NON platformAdmin, refuse (ForbiddenException) sans membership actif', async () => {
      // requireMembership -> membership introuvable
      prisma.membership.findUnique.mockResolvedValue(null);

      await expect(
        service.adjustCredits('user-1', 'account-1', 100, false),
      ).rejects.toBeInstanceOf(ForbiddenException);

      expect(prisma.membership.findUnique).toHaveBeenCalledTimes(1);
      // On ne va jamais jusqu'à la lecture du compte.
      expect(prisma.account.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('refuse (BadRequestException) un solde résultant négatif', async () => {
      // platformAdmin = true court-circuite le contrôle d'appartenance.
      prisma.account.findUniqueOrThrow.mockResolvedValue({
        type: AccountType.ESTABLISHMENT,
        credits: 5,
      });

      await expect(
        service.adjustCredits('user-1', 'account-1', -10, true),
      ).rejects.toBeInstanceOf(BadRequestException);

      // Aucune écriture transactionnelle ne doit avoir lieu.
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('en mode platformAdmin, ne consulte pas les memberships', async () => {
      prisma.account.findUniqueOrThrow.mockResolvedValue({
        type: AccountType.ESTABLISHMENT,
        credits: 100,
      });
      prisma.$transaction.mockResolvedValue([{ id: 'account-1', credits: 150 }]);

      const result = await service.adjustCredits('user-1', 'account-1', 50, true);

      expect(prisma.membership.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual({ id: 'account-1', credits: 150 });
    });
  });

  describe('debitCredits', () => {
    it('lève BadRequestException « Crédits insuffisants » si le solde est inférieur au montant', async () => {
      // $transaction reçoit un callback : on l'exécute avec un tx mické.
      const tx = {
        account: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({ credits: 5 }),
          update: jest.fn(),
        },
        creditLedger: { create: jest.fn() },
      };
      prisma.$transaction.mockImplementation((cb: any) => cb(tx));

      await expect(
        service.debitCredits('account-1', 10, 'BOOKING'),
      ).rejects.toThrow('Crédits insuffisants');

      // Le solde est vérifié avant toute mutation.
      expect(tx.account.update).not.toHaveBeenCalled();
      expect(tx.creditLedger.create).not.toHaveBeenCalled();
    });

    it('refuse (BadRequestException) un montant nul ou négatif', async () => {
      await expect(
        service.debitCredits('account-1', 0, 'BOOKING'),
      ).rejects.toBeInstanceOf(BadRequestException);
      // Court-circuité avant toute transaction.
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('débite et écrit le grand livre quand le solde est suffisant', async () => {
      const tx = {
        account: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({ credits: 100 }),
          update: jest
            .fn()
            .mockResolvedValue({ id: 'account-1', credits: 90 }),
        },
        creditLedger: { create: jest.fn().mockResolvedValue({}) },
      };
      prisma.$transaction.mockImplementation((cb: any) => cb(tx));

      const result = await service.debitCredits('account-1', 10, 'BOOKING', {
        bookingId: 'b1',
      });

      expect(result).toEqual({ id: 'account-1', credits: 90 });
      expect(tx.account.update).toHaveBeenCalledTimes(1);
      expect(tx.creditLedger.create).toHaveBeenCalledTimes(1);
    });
  });

  // Sanity check : le contrôle d'appartenance passe quand le membership est actif.
  describe('requireMembership (via adjustCredits)', () => {
    it('poursuit quand le membership est ACTIVE avec un rôle autorisé', async () => {
      prisma.membership.findUnique.mockResolvedValue({
        status: MembershipStatus.ACTIVE,
        role: 'OWNER',
      });
      prisma.account.findUniqueOrThrow.mockResolvedValue({
        type: AccountType.ESTABLISHMENT,
        credits: 20,
      });
      prisma.$transaction.mockResolvedValue([{ id: 'account-1', credits: 30 }]);

      const result = await service.adjustCredits('user-1', 'account-1', 10, false);

      expect(prisma.membership.findUnique).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ id: 'account-1', credits: 30 });
    });
  });
});
