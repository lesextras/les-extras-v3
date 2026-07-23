/**
 * BOOKINGS lifecycle (e2e) — lane QA-Security.
 *
 * Vérifie les transitions de statut légitimes et l'interdiction des sauts
 * illégaux, tout en restant dans le périmètre du compte actif.
 *
 * Cycle attendu (schema BookingStatus) :
 *   REQUESTED → ACCEPTED → CONFIRMED → IN_PROGRESS → COMPLETED
 *   (CANCELLED atteignable depuis les états non terminaux).
 *
 * Routes supposées :
 *   POST  /api/bookings                 (créer, x-account-id)
 *   GET   /api/bookings/:id
 *   PATCH /api/bookings/:id             ({ status } ou actions dédiées)
 */
import * as request from 'supertest';

import { createTestApp, TestContext } from './utils/test-app';
import { makeUser, makeAccount, makeMembership, makeMission, makeBooking } from './utils/factories';

describe('Bookings lifecycle (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(() => ctx.prisma.$reset());

  const server = () => ctx.app.getHttpServer();

  async function seed() {
    const owner = await makeUser(ctx.prisma, { email: 'owner@book.fr' });
    const account = makeAccount(ctx.prisma, owner.id, { type: 'ESTABLISHMENT' });
    makeMembership(ctx.prisma, owner.id, account.id, 'OWNER');
    const mission = makeMission(ctx.prisma, account.id, { status: 'PUBLISHED' });
    return { owner, account, mission };
  }

  const patch = (id: string, user: any, account: string, body: any) =>
    request(server())
      .patch(`/api/bookings/${id}`)
      .set('Authorization', `Bearer ${ctx.tokenFor(user)}`)
      .set('x-account-id', account)
      .send(body);

  it('crée un booking en statut initial REQUESTED', async () => {
    const { owner, account, mission } = await seed();
    const res = await request(server())
      .post('/api/bookings')
      .set('Authorization', `Bearer ${ctx.tokenFor(owner)}`)
      .set('x-account-id', account.id)
      .send({ missionId: mission.id });

    expect(res.status).toBeLessThan(300);
    const created = ctx.prisma.$store.get('booking')!.find((b) => b.missionId === mission.id);
    expect(created).toBeDefined();
    expect(created!.status).toBe('REQUESTED');
  });

  it('transition légitime REQUESTED → ACCEPTED', async () => {
    const { owner, account } = await seed();
    const booking = makeBooking(ctx.prisma, account.id, { status: 'REQUESTED' });
    const res = await patch(booking.id, owner, account.id, { status: 'ACCEPTED' });
    expect(res.status).toBeLessThan(300);
    const stored = ctx.prisma.$store.get('booking')!.find((b) => b.id === booking.id);
    expect(stored!.status).toBe('ACCEPTED');
  });

  it('saut de statut illégal REQUESTED → COMPLETED refusé (400/409)', async () => {
    const { owner, account } = await seed();
    const booking = makeBooking(ctx.prisma, account.id, { status: 'REQUESTED' });
    const res = await patch(booking.id, owner, account.id, { status: 'COMPLETED' });
    expect([400, 409]).toContain(res.status);
    const stored = ctx.prisma.$store.get('booking')!.find((b) => b.id === booking.id);
    expect(stored!.status).toBe('REQUESTED');
  });

  it('un booking COMPLETED (état terminal) ne peut plus changer de statut', async () => {
    const { owner, account } = await seed();
    const booking = makeBooking(ctx.prisma, account.id, { status: 'COMPLETED' });
    const res = await patch(booking.id, owner, account.id, { status: 'IN_PROGRESS' });
    expect([400, 409]).toContain(res.status);
  });

  it('annulation possible depuis un état non terminal (→ CANCELLED)', async () => {
    const { owner, account } = await seed();
    const booking = makeBooking(ctx.prisma, account.id, { status: 'ACCEPTED' });
    const res = await patch(booking.id, owner, account.id, {
      status: 'CANCELLED',
      cancelReason: 'Mission pourvue en interne',
    });
    expect(res.status).toBeLessThan(300);
    const stored = ctx.prisma.$store.get('booking')!.find((b) => b.id === booking.id);
    expect(stored!.status).toBe('CANCELLED');
  });

  it('valeur de statut inconnue rejetée par la validation (400)', async () => {
    const { owner, account } = await seed();
    const booking = makeBooking(ctx.prisma, account.id, { status: 'REQUESTED' });
    const res = await patch(booking.id, owner, account.id, { status: 'NOT_A_STATUS' });
    expect(res.status).toBe(400);
  });
});
