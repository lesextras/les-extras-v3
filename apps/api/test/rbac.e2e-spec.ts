/**
 * RBAC intra-compte (e2e) — lane QA-Security.
 *
 * Les permissions dépendent du `AccountRole` DANS le compte actif (pas du role
 * global). Hiérarchie : OWNER > ADMIN > MANAGER > MEMBER.
 *
 * Règles testées :
 *  - Gestion des membres (inviter / révoquer / supprimer) réservée OWNER & ADMIN.
 *  - Un MEMBER (ou MANAGER) ne peut PAS inviter ni supprimer de membres.
 *  - Un MEMBER ne peut pas changer le rôle d'un autre membre (escalade).
 *  - Seul OWNER peut transférer/supprimer le compte (si exposé).
 *
 * Décorateur attendu : `@AccountRoles('OWNER','ADMIN')` + `AccountGuard`.
 */
import * as request from 'supertest';

import { createTestApp, TestContext } from './utils/test-app';
import { makeUser, makeAccount, makeMembership } from './utils/factories';

describe('RBAC intra-compte (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(() => ctx.prisma.$reset());

  const server = () => ctx.app.getHttpServer();

  const as = (
    method: 'get' | 'post' | 'patch' | 'delete',
    url: string,
    user: { id: string; role?: string },
    accountId: string,
  ) =>
    request(server())
      [method](url)
      .set('Authorization', `Bearer ${ctx.tokenFor(user)}`)
      .set('x-account-id', accountId);

  async function seedRoles() {
    const owner = await makeUser(ctx.prisma, { email: 'owner@rbac.fr' });
    const admin = await makeUser(ctx.prisma, { email: 'admin@rbac.fr' });
    const manager = await makeUser(ctx.prisma, { email: 'manager@rbac.fr' });
    const member = await makeUser(ctx.prisma, { email: 'member@rbac.fr' });
    const account = makeAccount(ctx.prisma, owner.id);
    makeMembership(ctx.prisma, owner.id, account.id, 'OWNER');
    makeMembership(ctx.prisma, admin.id, account.id, 'ADMIN');
    makeMembership(ctx.prisma, manager.id, account.id, 'MANAGER');
    const memberMembership = makeMembership(ctx.prisma, member.id, account.id, 'MEMBER');
    return { owner, admin, manager, member, account, memberMembership };
  }

  describe('Inviter un membre', () => {
    it('OWNER peut inviter (2xx)', async () => {
      const { owner, account } = await seedRoles();
      const res = await as('post', '/api/invitations', owner, account.id).send({
        email: 'new@rbac.fr',
        role: 'MEMBER',
      });
      expect(res.status).toBeLessThan(300);
    });

    it('ADMIN peut inviter (2xx)', async () => {
      const { admin, account } = await seedRoles();
      const res = await as('post', '/api/invitations', admin, account.id).send({
        email: 'new2@rbac.fr',
        role: 'MEMBER',
      });
      expect(res.status).toBeLessThan(300);
    });

    it('MANAGER ne peut PAS inviter (403)', async () => {
      const { manager, account } = await seedRoles();
      const res = await as('post', '/api/invitations', manager, account.id).send({
        email: 'nope@rbac.fr',
        role: 'MEMBER',
      });
      expect(res.status).toBe(403);
    });

    it('MEMBER ne peut PAS inviter (403)', async () => {
      const { member, account } = await seedRoles();
      const res = await as('post', '/api/invitations', member, account.id).send({
        email: 'nope2@rbac.fr',
        role: 'MEMBER',
      });
      expect(res.status).toBe(403);
    });

    it('un MEMBER ne peut pas inviter quelqu\'un en OWNER/ADMIN (escalade)', async () => {
      const { member, account } = await seedRoles();
      const res = await as('post', '/api/invitations', member, account.id).send({
        email: 'evil@rbac.fr',
        role: 'OWNER',
      });
      expect(res.status).toBe(403);
    });
  });

  describe('Supprimer / révoquer un membre', () => {
    it('MEMBER ne peut PAS supprimer un autre membre (403)', async () => {
      const { member, account } = await seedRoles();
      const otherMembership = ctx.prisma.$store
        .get('membership')!
        .find((m) => m.accountId === account.id && m.role === 'ADMIN')!;
      const res = await as('delete', `/api/memberships/${otherMembership.id}`, member, account.id);
      expect(res.status).toBe(403);
    });

    it('ADMIN peut supprimer un MEMBER (2xx)', async () => {
      const { admin, account, memberMembership } = await seedRoles();
      const res = await as('delete', `/api/memberships/${memberMembership.id}`, admin, account.id);
      expect(res.status).toBeLessThan(300);
    });

    it('personne ne peut supprimer/rétrograder l\'OWNER via l\'API membres', async () => {
      const { admin, account } = await seedRoles();
      const ownerMembership = ctx.prisma.$store
        .get('membership')!
        .find((m) => m.accountId === account.id && m.role === 'OWNER')!;
      const del = await as('delete', `/api/memberships/${ownerMembership.id}`, admin, account.id);
      expect([403, 409]).toContain(del.status);
    });
  });

  describe('Changer le rôle d\'un membre', () => {
    it('MEMBER ne peut pas se promouvoir ADMIN (403, escalade verticale)', async () => {
      const { member, account, memberMembership } = await seedRoles();
      const res = await as('patch', `/api/memberships/${memberMembership.id}`, member, account.id).send({
        role: 'ADMIN',
      });
      expect(res.status).toBe(403);
      const stored = ctx.prisma.$store.get('membership')!.find((m) => m.id === memberMembership.id);
      expect(stored!.role).toBe('MEMBER');
    });
  });
});
