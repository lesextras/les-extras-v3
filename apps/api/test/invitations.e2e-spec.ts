/**
 * INVITATIONS (e2e) — lane QA-Security.
 *
 * Cycle de vie : créer → (email) → accepter → membership créé.
 * Plus les abus : token guessing, expiry, replay (double acceptation),
 * révocation, invitation d'un compte croisé, escalade de rôle.
 *
 * Routes supposées :
 *  POST   /api/invitations              (x-account-id, rôle OWNER/ADMIN)
 *  GET    /api/invitations              (liste du compte actif)
 *  POST   /api/invitations/accept       { token }  (auth = user qui accepte)
 *  DELETE /api/invitations/:id          (révoquer, OWNER/ADMIN)
 */
import * as request from 'supertest';

import { createTestApp, TestContext } from './utils/test-app';
import { makeUser, makeAccount, makeMembership, makeInvitation } from './utils/factories';

describe('Invitations (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(() => ctx.prisma.$reset());

  const server = () => ctx.app.getHttpServer();

  async function seedAccountWithOwner() {
    const owner = await makeUser(ctx.prisma, { email: 'owner@inv.fr' });
    const account = makeAccount(ctx.prisma, owner.id);
    makeMembership(ctx.prisma, owner.id, account.id, 'OWNER');
    return { owner, account };
  }

  describe('Création', () => {
    it('OWNER crée une invitation PENDING avec token + expiry', async () => {
      const { owner, account } = await seedAccountWithOwner();
      const res = await request(server())
        .post('/api/invitations')
        .set('Authorization', `Bearer ${ctx.tokenFor(owner)}`)
        .set('x-account-id', account.id)
        .send({ email: 'invitee@inv.fr', role: 'MEMBER' });

      expect(res.status).toBeLessThan(300);
      const stored = ctx.prisma.$store.get('invitation')!.find((i) => i.email === 'invitee@inv.fr');
      expect(stored).toBeDefined();
      expect(stored!.status).toBe('PENDING');
      expect(stored!.token).toBeTruthy();
      expect(new Date(stored!.expiresAt).getTime()).toBeGreaterThan(Date.now());
      // Le token ne doit pas être un simple incrément devinable.
      expect(String(stored!.token).length).toBeGreaterThanOrEqual(16);
    });

    it('empêche deux invitations PENDING pour le même email/compte (contrainte @@unique)', async () => {
      const { owner, account } = await seedAccountWithOwner();
      makeInvitation(ctx.prisma, account.id, owner.id, { email: 'dup@inv.fr' });
      const res = await request(server())
        .post('/api/invitations')
        .set('Authorization', `Bearer ${ctx.tokenFor(owner)}`)
        .set('x-account-id', account.id)
        .send({ email: 'dup@inv.fr', role: 'MEMBER' });
      expect([400, 409]).toContain(res.status);
    });
  });

  describe('Acceptation', () => {
    it('accepter un token valide crée un Membership et passe l\'invite ACCEPTED', async () => {
      const { owner, account } = await seedAccountWithOwner();
      const invitee = await makeUser(ctx.prisma, { email: 'joiner@inv.fr' });
      const inv = makeInvitation(ctx.prisma, account.id, owner.id, { email: 'joiner@inv.fr' });

      const res = await request(server())
        .post('/api/invitations/accept')
        .set('Authorization', `Bearer ${ctx.tokenFor(invitee)}`)
        .send({ token: inv.token });

      expect(res.status).toBeLessThan(300);
      const membership = ctx.prisma.$store
        .get('membership')!
        .find((m) => m.userId === invitee.id && m.accountId === account.id);
      expect(membership).toBeDefined();
      const stored = ctx.prisma.$store.get('invitation')!.find((i) => i.id === inv.id);
      expect(stored!.status).toBe('ACCEPTED');
    });

    it('token inconnu / deviné → 404/400 (anti token-guessing)', async () => {
      const invitee = await makeUser(ctx.prisma, { email: 'guess@inv.fr' });
      const res = await request(server())
        .post('/api/invitations/accept')
        .set('Authorization', `Bearer ${ctx.tokenFor(invitee)}`)
        .send({ token: 'tok_devine_1234567890' });
      expect([400, 404]).toContain(res.status);
    });

    it('token expiré → refusé (400/410) et pas de membership', async () => {
      const { owner, account } = await seedAccountWithOwner();
      const invitee = await makeUser(ctx.prisma, { email: 'late@inv.fr' });
      const inv = makeInvitation(ctx.prisma, account.id, owner.id, {
        email: 'late@inv.fr',
        expiresAt: new Date(Date.now() - 3600 * 1000), // déjà expiré
      });
      const res = await request(server())
        .post('/api/invitations/accept')
        .set('Authorization', `Bearer ${ctx.tokenFor(invitee)}`)
        .send({ token: inv.token });

      expect([400, 410]).toContain(res.status);
      expect(
        ctx.prisma.$store.get('membership')!.some((m) => m.userId === invitee.id),
      ).toBe(false);
    });

    it('replay : accepter deux fois le même token échoue la 2e fois', async () => {
      const { owner, account } = await seedAccountWithOwner();
      const invitee = await makeUser(ctx.prisma, { email: 'replay@inv.fr' });
      const inv = makeInvitation(ctx.prisma, account.id, owner.id, { email: 'replay@inv.fr' });

      const first = await request(server())
        .post('/api/invitations/accept')
        .set('Authorization', `Bearer ${ctx.tokenFor(invitee)}`)
        .send({ token: inv.token });
      const second = await request(server())
        .post('/api/invitations/accept')
        .set('Authorization', `Bearer ${ctx.tokenFor(invitee)}`)
        .send({ token: inv.token });

      expect(first.status).toBeLessThan(300);
      expect(second.status).toBeGreaterThanOrEqual(400);
      // Un seul membership créé (pas de double rattachement).
      const count = ctx.prisma.$store
        .get('membership')!
        .filter((m) => m.userId === invitee.id && m.accountId === account.id).length;
      expect(count).toBe(1);
    });

    it('une invitation révoquée ne peut plus être acceptée', async () => {
      const { owner, account } = await seedAccountWithOwner();
      const invitee = await makeUser(ctx.prisma, { email: 'revoked@inv.fr' });
      const inv = makeInvitation(ctx.prisma, account.id, owner.id, {
        email: 'revoked@inv.fr',
        status: 'REVOKED',
      });
      const res = await request(server())
        .post('/api/invitations/accept')
        .set('Authorization', `Bearer ${ctx.tokenFor(invitee)}`)
        .send({ token: inv.token });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Révocation', () => {
    it('OWNER révoque une invitation PENDING (status → REVOKED)', async () => {
      const { owner, account } = await seedAccountWithOwner();
      const inv = makeInvitation(ctx.prisma, account.id, owner.id);
      const res = await request(server())
        .delete(`/api/invitations/${inv.id}`)
        .set('Authorization', `Bearer ${ctx.tokenFor(owner)}`)
        .set('x-account-id', account.id);
      expect(res.status).toBeLessThan(300);
      const stored = ctx.prisma.$store.get('invitation')!.find((i) => i.id === inv.id);
      expect(['REVOKED']).toContain(stored!.status);
    });

    it('on ne peut pas révoquer l\'invitation d\'un autre compte (cross-tenant)', async () => {
      const { owner, account } = await seedAccountWithOwner();
      const otherOwner = await makeUser(ctx.prisma, { email: 'other@inv.fr' });
      const otherAccount = makeAccount(ctx.prisma, otherOwner.id);
      makeMembership(ctx.prisma, otherOwner.id, otherAccount.id, 'OWNER');
      const foreignInv = makeInvitation(ctx.prisma, otherAccount.id, otherOwner.id);

      const res = await request(server())
        .delete(`/api/invitations/${foreignInv.id}`)
        .set('Authorization', `Bearer ${ctx.tokenFor(owner)}`)
        .set('x-account-id', account.id);
      expect([403, 404]).toContain(res.status);
    });
  });
});
