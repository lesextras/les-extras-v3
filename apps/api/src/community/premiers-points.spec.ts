import { PointReason } from '@prisma/client';
import { CommunityService } from './community.service';

/**
 * LE PREMIER POINT SE FÊTE — ET SEULEMENT LE PREMIER.
 *
 * La règle : au premier gain positif d'un compte, son propriétaire reçoit une
 * notification (cloche + téléphone). Aux suivants, silence — le compteur
 * parle. Et la fête ne bloque jamais le crédit : une notification qui échoue
 * laisse les points intacts.
 */

function fauxPrisma(dejaGagnes: number) {
  return {
    loyaltyPoint: {
      count: jest.fn(async () => dejaGagnes),
      create: jest.fn(async ({ data }: { data: object }) => ({ id: 'lp1', ...data })),
    },
    account: {
      update: jest.fn(async () => ({})),
      findUnique: jest.fn(async () => ({ ownerId: 'user-1' })),
    },
    $transaction: jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

const fauxNotifications = () => ({ create: jest.fn(async () => ({})) });

/** La notification part après la réponse : on laisse la boucle d'événements la dérouler. */
const microtache = () => new Promise((r) => setTimeout(r, 0));

describe('CommunityService.crediter — célébration des premiers points', () => {
  it('notifie le propriétaire au tout premier gain', async () => {
    const prisma = fauxPrisma(0);
    const notifications = fauxNotifications();
    const svc = new CommunityService(prisma as never, notifications as never);

    const ligne = await svc.crediter('acc-1', PointReason.MISSION, 'Prestation terminée');
    await microtache();

    expect(ligne).toBeTruthy();
    expect(notifications.create).toHaveBeenCalledTimes(1);
    const [userId, payload] = notifications.create.mock.calls[0] as unknown as [
      string,
      { type: string; title: string; link: string },
    ];
    expect(userId).toBe('user-1');
    expect(payload.type).toBe('PREMIERS_POINTS');
    expect(payload.title).toContain('50'); // BAREME.MISSION
    expect(payload.link).toBe('/dashboard/points');
  });

  it('reste silencieux dès le deuxième gain', async () => {
    const prisma = fauxPrisma(3);
    const notifications = fauxNotifications();
    const svc = new CommunityService(prisma as never, notifications as never);

    await svc.crediter('acc-1', PointReason.AVIS, 'Avis déposé');
    await microtache();

    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('ne crédite rien — et ne fête rien — pour un montant nul', async () => {
    const prisma = fauxPrisma(0);
    const notifications = fauxNotifications();
    const svc = new CommunityService(prisma as never, notifications as never);

    const ligne = await svc.crediter('acc-1', PointReason.MISSION, 'Rien', 0);
    await microtache();

    expect(ligne).toBeNull();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(notifications.create).not.toHaveBeenCalled();
  });

  it('une notification qui échoue laisse les points intacts', async () => {
    const prisma = fauxPrisma(0);
    const notifications = { create: jest.fn(async () => Promise.reject(new Error('push KO'))) };
    const svc = new CommunityService(prisma as never, notifications as never);

    const ligne = await svc.crediter('acc-1', PointReason.MISSION, 'Prestation terminée');
    await microtache();

    expect(ligne).toBeTruthy();
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
