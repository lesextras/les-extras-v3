import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { VivierService } from './vivier.service';

/**
 * LE VIVIER.
 *
 * Ce que ces tests protègent tient en une phrase : on ne rappelle que des gens
 * qu'on connaît, et sur une offre qu'ils peuvent voir.
 *
 * Les deux garde-fous ne sont pas décoratifs. Sans le premier, la route de
 * rappel devient un canal de démarchage vers n'importe quel compte de la
 * plateforme. Sans le second, on invite quelqu'un sur une mission encore
 * réservée aux salariés — il reçoit une notification, clique, et tombe sur une
 * page qu'il n'a pas le droit de voir.
 */

function service(overrides: Record<string, unknown> = {}) {
  const prisma = {
    poolMember: {
      findMany: jest.fn(async () => []),
      findUnique: jest.fn(async () => null),
      upsert: jest.fn(async (a: { create: Record<string, unknown> }) => ({ id: 'pm_1', ...a.create })),
      delete: jest.fn(async () => ({ id: 'pm_1' })),
    },
    booking: { findMany: jest.fn(async () => []) },
    account: {
      findUnique: jest.fn(async () => ({
        id: 'acc_freelance',
        type: 'FREELANCE',
        name: 'Awa Diallo',
        ownerId: 'u_awa',
      })),
      findMany: jest.fn(async () => []),
    },
    review: { groupBy: jest.fn(async () => []) },
    reliefMission: { findFirst: jest.fn(async () => null) },
    ...overrides,
  } as never;
  const notifications = { create: jest.fn(async () => undefined) } as never;
  return { svc: new VivierService(prisma, notifications), prisma: prisma as never };
}

describe('vivier — qui peut y entrer', () => {
  it('accepte un compte intervenant', async () => {
    const { svc } = service();

    await expect(svc.retenir('acc_etab', 'acc_freelance', 'u_chef')).resolves.toBeDefined();
  });

  it('refuse un établissement — un vivier réunit des intervenants', async () => {
    const { svc } = service({
      account: {
        findUnique: jest.fn(async () => ({
          id: 'acc_autre',
          type: 'ESTABLISHMENT',
          name: 'IME du Val',
          ownerId: 'u_x',
        })),
        findMany: jest.fn(async () => []),
      },
    });

    await expect(svc.retenir('acc_etab', 'acc_autre', 'u_chef')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuse un compte de se retenir lui-même', async () => {
    const { svc } = service();

    await expect(svc.retenir('acc_etab', 'acc_etab', 'u_chef')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuse un compte inexistant', async () => {
    const { svc } = service({
      account: { findUnique: jest.fn(async () => null), findMany: jest.fn(async () => []) },
    });

    await expect(svc.retenir('acc_etab', 'acc_fantome', 'u_chef')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("prévient l'intervenant qu'il a été retenu", async () => {
    // La transparence minimale : savoir qu'une structure compte sur vous.
    const notifications = { create: jest.fn(async () => undefined) };
    const prisma = {
      poolMember: {
        upsert: jest.fn(async () => ({ id: 'pm_1' })),
      },
      account: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'acc_freelance',
            type: 'FREELANCE',
            name: 'Awa Diallo',
            ownerId: 'u_awa',
          })
          .mockResolvedValueOnce({ name: 'IME du Val' }),
      },
    } as never;
    const svc = new VivierService(prisma, notifications as never);

    await svc.retenir('acc_etab', 'acc_freelance', 'u_chef', 'connaît le groupe des ados');

    expect(notifications.create).toHaveBeenCalledWith(
      'u_awa',
      expect.objectContaining({ type: 'VIVIER_AJOUT' }),
    );
  });
});

describe('vivier — le retrait', () => {
  it('refuse de retirer quelqu’un qui n’y figure pas', async () => {
    const { svc } = service();

    await expect(svc.retirer('acc_etab', 'acc_freelance')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('retire sans prévenir personne', async () => {
    // Annoncer un retrait transformerait une décision d'organisation en
    // jugement personnel. On ne notifie pas.
    const notifications = { create: jest.fn(async () => undefined) };
    const prisma = {
      poolMember: {
        findUnique: jest.fn(async () => ({ id: 'pm_1' })),
        delete: jest.fn(async () => ({ id: 'pm_1' })),
      },
    } as never;
    const svc = new VivierService(prisma, notifications as never);

    await svc.retirer('acc_etab', 'acc_freelance');

    expect(notifications.create).not.toHaveBeenCalled();
  });
});

describe('vivier — le rappel sur une mission', () => {
  const mission = (visibility: string) => ({
    id: 'm_1',
    title: 'Nuit du samedi',
    startDate: new Date('2026-09-12T00:00:00Z'),
    startTime: '21h00',
    city: 'Melun',
    visibility,
    account: { name: 'IME du Val' },
  });

  function serviceAvecVivier(visibility: string, membres: string[]) {
    const notifications = { create: jest.fn(async () => undefined) };
    const prisma = {
      reliefMission: { findFirst: jest.fn(async () => mission(visibility)) },
      poolMember: {
        findMany: jest.fn(async () =>
          membres.map((id) => ({
            intervenantAccountId: id,
            note: null,
            createdAt: new Date(),
            addedBy: null,
            intervenantAccount: {
              id,
              name: id,
              slug: id,
              city: null,
              logoUrl: null,
              points: 0,
              owner: { id: `u_${id}`, firstName: null, lastName: null, email: 'x@y.fr', avatarUrl: null, profile: null },
            },
          })),
        ),
      },
      booking: { findMany: jest.fn(async () => []) },
      account: {
        findMany: jest.fn(async (a: { where: { id: { in: string[] } } }) =>
          a.where.id.in.map((id) => ({ id, ownerId: `u_${id}` })),
        ),
      },
      review: { groupBy: jest.fn(async () => []) },
    } as never;
    return { svc: new VivierService(prisma, notifications as never), notifications };
  }

  it('prévient les intervenants du vivier', async () => {
    const { svc, notifications } = serviceAvecVivier('RESERVED', ['acc_a', 'acc_b']);

    const r = await svc.rappeler('acc_etab', 'm_1', ['acc_a', 'acc_b']);

    expect(r.notifies).toBe(2);
    expect(notifications.create).toHaveBeenCalledTimes(2);
  });

  it('écarte silencieusement les comptes hors vivier', async () => {
    // Sans ce filtre, la route deviendrait un canal de démarchage vers
    // n'importe quel compte de la plateforme.
    const { svc } = serviceAvecVivier('PUBLIC', ['acc_a']);

    const r = await svc.rappeler('acc_etab', 'm_1', ['acc_a', 'acc_inconnu']);

    expect(r.notifies).toBe(1);
    expect(r.ignores).toBe(1);
  });

  it('refuse quand aucun destinataire n’appartient au vivier', async () => {
    const { svc } = serviceAvecVivier('PUBLIC', ['acc_a']);

    await expect(svc.rappeler('acc_etab', 'm_1', ['acc_inconnu'])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuse une mission encore réservée aux salariés', async () => {
    // L'intervenant recevrait une notification, cliquerait, et tomberait sur
    // une offre qu'il n'a pas le droit de voir.
    const { svc } = serviceAvecVivier('SALARIES', ['acc_a']);

    await expect(svc.rappeler('acc_etab', 'm_1', ['acc_a'])).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuse une mission qui n’appartient pas à l’établissement', async () => {
    const prisma = {
      reliefMission: { findFirst: jest.fn(async () => null) },
    } as never;
    const svc = new VivierService(prisma, { create: jest.fn() } as never);

    await expect(svc.rappeler('acc_etab', 'm_autre', ['acc_a'])).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('vivier — réservé aux établissements', () => {
  it('refuse un compte intervenant', () => {
    const { svc } = service();

    expect(() => svc.assertEtablissement('FREELANCE' as never)).toThrow(ForbiddenException);
  });

  it('accepte un établissement', () => {
    const { svc } = service();

    expect(() => svc.assertEtablissement('ESTABLISHMENT' as never)).not.toThrow();
  });
});
