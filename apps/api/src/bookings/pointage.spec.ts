import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingsService } from './bookings.service';

/**
 * LE POINTAGE DÉCLENCHE LA FACTURATION, et n'avait aucun test.
 *
 * Ce qui est en jeu tient en une règle : après la fin d'une mission, chaque
 * partie dispose de soixante-douze heures pour déclarer ou corriger les heures.
 * Passé ce délai, ce qui n'a pas été contesté est validé d'office et tout se
 * verrouille. C'est ce verrou qui rend une facture opposable — sans lui, on
 * peut rouvrir des heures un mois après avoir payé.
 *
 * Les tests portent donc sur les trois moments : pendant la fenêtre, à sa
 * fermeture, et après. Plus la règle de qui a le droit de déclarer.
 */

const HEURE = 3_600_000;

function service(booking: Record<string, unknown>) {
  const timeEntry = {
    create: jest.fn(async (a: { data: Record<string, unknown> }) => ({ id: 'te_1', ...a.data })),
    updateMany: jest.fn(async () => ({ count: 2 })),
    findUnique: jest.fn(async () => null),
    findMany: jest.fn(async () => []),
  };
  const prisma = {
    booking: { findFirst: jest.fn(async () => booking), findUnique: jest.fn(async () => booking) },
    timeEntry,
  } as never;
  const audit = { log: jest.fn(async () => undefined) } as never;
  const notifications = { creer: jest.fn(async () => undefined), notify: jest.fn(async () => undefined) } as never;
  const mail = { send: jest.fn(async () => undefined) } as never;
  const community = { attribuer: jest.fn(async () => undefined) } as never;
  // L'ordre suit la signature du constructeur : prisma, notifications, mail,
  // audit, community.
  const svc = new BookingsService(prisma, notifications, mail, audit, community);
  return { svc, timeEntry };
}

/** Un booking terminé il y a `heures` heures, appartenant à `acc_freelance`. */
const termineIlYA = (heures: number) => ({
  id: 'b_1',
  accountId: 'acc_freelance',
  completedAt: new Date(Date.now() - heures * HEURE),
  mission: { accountId: 'acc_etablissement' },
  service: null,
});

const creneau = { startedAt: '2026-09-01T09:00:00.000Z', endedAt: '2026-09-01T17:00:00.000Z' };

describe('pointage — la fenêtre de 72 h', () => {
  it('accepte une déclaration pendant la fenêtre', async () => {
    const { svc, timeEntry } = service(termineIlYA(24));

    await svc.addTimeEntry('b_1', 'acc_freelance', creneau as never);

    expect(timeEntry.create).toHaveBeenCalledTimes(1);
  });

  it('accepte encore à la soixante-onzième heure', async () => {
    const { svc, timeEntry } = service(termineIlYA(71));

    await svc.addTimeEntry('b_1', 'acc_freelance', creneau as never);

    expect(timeEntry.create).toHaveBeenCalledTimes(1);
  });

  it('refuse au-delà de soixante-douze heures', async () => {
    const { svc, timeEntry } = service(termineIlYA(73));

    await expect(
      svc.addTimeEntry('b_1', 'acc_freelance', creneau as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(timeEntry.create).not.toHaveBeenCalled();
  });

  it('reste ouvert tant que la mission n’est pas terminée', async () => {
    // Sans date de fin, aucun compte à rebours n'a commencé : on peut déclarer.
    const { svc, timeEntry } = service({ ...termineIlYA(0), completedAt: null });

    await svc.addTimeEntry('b_1', 'acc_freelance', creneau as never);

    expect(timeEntry.create).toHaveBeenCalledTimes(1);
  });
});

describe('pointage — qui déclare', () => {
  it("refuse que l'établissement déclare à la place de l'intervenant", async () => {
    // C'est l'intervenant qui déclare ses heures ; l'établissement les valide
    // ou les refuse. Laisser l'employeur saisir le temps de l'autre, c'est
    // retirer à celui-ci le seul moyen de contester.
    const { svc, timeEntry } = service(termineIlYA(1));

    await expect(
      svc.addTimeEntry('b_1', 'acc_etablissement', creneau as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(timeEntry.create).not.toHaveBeenCalled();
  });
});

describe('pointage — cohérence des créneaux', () => {
  it('refuse une fin antérieure au début', async () => {
    const { svc, timeEntry } = service(termineIlYA(1));

    await expect(
      svc.addTimeEntry('b_1', 'acc_freelance', {
        startedAt: '2026-09-01T17:00:00.000Z',
        endedAt: '2026-09-01T09:00:00.000Z',
      } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(timeEntry.create).not.toHaveBeenCalled();
  });

  it('accepte un créneau ouvert, sans fin déclarée', async () => {
    const { svc, timeEntry } = service(termineIlYA(1));

    await svc.addTimeEntry('b_1', 'acc_freelance', {
      startedAt: '2026-09-01T09:00:00.000Z',
    } as never);

    expect(timeEntry.create.mock.calls[0][0].data.endedAt).toBeNull();
  });
});

describe('pointage — validation à l’échéance', () => {
  it('valide d’office les créneaux en attente une fois la fenêtre close', async () => {
    const { svc, timeEntry } = service(termineIlYA(80));

    await svc.listTimeEntries('b_1', 'acc_etablissement');

    expect(timeEntry.updateMany).toHaveBeenCalledWith({
      where: { bookingId: 'b_1', status: 'PENDING' },
      data: { status: 'VALIDATED' },
    });
  });

  it('ne valide rien tant que la fenêtre est ouverte', async () => {
    const { svc, timeEntry } = service(termineIlYA(10));

    await svc.listTimeEntries('b_1', 'acc_etablissement');

    expect(timeEntry.updateMany).not.toHaveBeenCalled();
  });
});
