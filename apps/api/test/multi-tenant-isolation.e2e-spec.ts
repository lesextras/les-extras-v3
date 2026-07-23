/**
 * ISOLATION MULTI-TENANT (e2e) — cœur de la lane QA-Security.
 *
 * Invariant testé : un membre du compte A ne doit JAMAIS lire, modifier ou
 * supprimer les données du compte B (missions, bookings, invoices, memberships),
 * même s'il connaît l'ID de la ressource (IDOR) ou usurpe le header x-account-id.
 *
 * Le compte actif est porté par `x-account-id`. Un utilisateur ne peut activer
 * qu'un compte où il possède un `Membership ACTIVE`. Toute lecture liste doit
 * être scoppée sur ce compte ; toute lecture/écriture d'une ressource par ID
 * doit vérifier l'appartenance au compte actif → sinon 403/404.
 *
 * Ces tests sont volontairement STRICTS : si le backend renvoie 200 sur une
 * ressource d'un autre tenant, le test échoue (= fuite de données à corriger).
 */
import * as request from 'supertest';

import { createTestApp, TestContext } from './utils/test-app';
import { seedTwoTenants } from './utils/factories';

describe('Isolation multi-tenant (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });
  afterAll(async () => {
    await ctx.app.close();
  });
  beforeEach(() => ctx.prisma.$reset());

  const server = () => ctx.app.getHttpServer();

  /** Helper : requête authentifiée en tant que user, sur le compte actif donné. */
  const as = (
    method: 'get' | 'post' | 'patch' | 'put' | 'delete',
    url: string,
    user: { id: string; role?: string },
    accountId?: string,
  ) => {
    let req = request(server())[method](url).set('Authorization', `Bearer ${ctx.tokenFor(user)}`);
    if (accountId) req = req.set('x-account-id', accountId);
    return req;
  };

  describe('Activation de compte (x-account-id)', () => {
    it('refuse d\'activer un compte où l\'on n\'est pas membre (403)', async () => {
      const { memberA, accountB } = await seedTwoTenants(ctx.prisma);
      // memberA appartient à A, tente d'agir sur B.
      const res = await as('get', '/api/missions', memberA, accountB.id);
      expect([403, 404]).toContain(res.status);
    });

    it('accepte un compte où l\'on est membre (2xx)', async () => {
      const { memberA, accountA } = await seedTwoTenants(ctx.prisma);
      const res = await as('get', '/api/missions', memberA, accountA.id);
      expect(res.status).toBeLessThan(300);
    });
  });

  describe('Missions', () => {
    it('la liste ne renvoie QUE les missions du compte actif', async () => {
      const { memberA, accountA, missionA, missionB } = await seedTwoTenants(ctx.prisma);
      const res = await as('get', '/api/missions', memberA, accountA.id);

      expect(res.status).toBe(200);
      const items: any[] = res.body.items ?? res.body.data ?? res.body;
      const ids = items.map((m) => m.id);
      expect(ids).toContain(missionA.id);
      expect(ids).not.toContain(missionB.id); // pas de fuite du compte B
    });

    it('GET mission d\'un autre compte par ID → 403/404 (IDOR)', async () => {
      const { memberA, accountA, missionB } = await seedTwoTenants(ctx.prisma);
      const res = await as('get', `/api/missions/${missionB.id}`, memberA, accountA.id);
      expect([403, 404]).toContain(res.status);
    });

    it('PATCH mission d\'un autre compte → 403/404 et donnée inchangée', async () => {
      const { memberA, accountA, missionB } = await seedTwoTenants(ctx.prisma);
      const res = await as('patch', `/api/missions/${missionB.id}`, memberA, accountA.id).send({
        title: 'HACKED',
      });
      expect([403, 404]).toContain(res.status);

      const stored = ctx.prisma.$store.get('reliefMission')!.find((m) => m.id === missionB.id);
      expect(stored!.title).not.toBe('HACKED');
    });

    it('DELETE mission d\'un autre compte → 403/404 et donnée conservée', async () => {
      const { memberA, accountA, missionB } = await seedTwoTenants(ctx.prisma);
      const res = await as('delete', `/api/missions/${missionB.id}`, memberA, accountA.id);
      expect([403, 404]).toContain(res.status);
      expect(ctx.prisma.$store.get('reliefMission')!.some((m) => m.id === missionB.id)).toBe(true);
    });

    it('création de mission → rattachée au compte actif, pas à un accountId injecté', async () => {
      const { ownerA, accountA, accountB } = await seedTwoTenants(ctx.prisma);
      const res = await as('post', '/api/missions', ownerA, accountA.id).send({
        title: 'Nouvelle mission',
        description: 'desc',
        category: 'RENFORT',
        startDate: '2026-10-01T09:00:00Z',
        accountId: accountB.id, // tentative d'injection de tenant
      });

      if (res.status < 300) {
        const created = ctx.prisma.$store
          .get('reliefMission')!
          .find((m) => m.title === 'Nouvelle mission');
        expect(created!.accountId).toBe(accountA.id);
        expect(created!.accountId).not.toBe(accountB.id);
      }
    });
  });

  describe('Bookings', () => {
    it('GET booking d\'un autre compte par ID → 403/404', async () => {
      const { memberA, accountA, bookingB } = await seedTwoTenants(ctx.prisma);
      const res = await as('get', `/api/bookings/${bookingB.id}`, memberA, accountA.id);
      expect([403, 404]).toContain(res.status);
    });

    it('changement de statut d\'un booking d\'un autre compte → refusé', async () => {
      const { memberA, accountA, bookingB } = await seedTwoTenants(ctx.prisma);
      const res = await as('patch', `/api/bookings/${bookingB.id}`, memberA, accountA.id).send({
        status: 'CONFIRMED',
      });
      expect([403, 404]).toContain(res.status);
      const stored = ctx.prisma.$store.get('booking')!.find((b) => b.id === bookingB.id);
      expect(stored!.status).not.toBe('CONFIRMED');
    });
  });

  describe('Invoices', () => {
    it('la liste des factures est scoppée au compte actif', async () => {
      const { memberA, accountA, invoiceB } = await seedTwoTenants(ctx.prisma);
      const res = await as('get', '/api/invoices', memberA, accountA.id);
      expect(res.status).toBe(200);
      const items: any[] = res.body.items ?? res.body.data ?? res.body;
      expect(items.map((i) => i.id)).not.toContain(invoiceB.id);
    });

    it('GET/download facture d\'un autre compte → 403/404 (fuite financière)', async () => {
      const { memberA, accountA, invoiceB } = await seedTwoTenants(ctx.prisma);
      const res = await as('get', `/api/invoices/${invoiceB.id}`, memberA, accountA.id);
      expect([403, 404]).toContain(res.status);
    });
  });

  describe('Memberships', () => {
    it('lister les membres d\'un autre compte → refusé', async () => {
      const { memberA, accountA, accountB } = await seedTwoTenants(ctx.prisma);
      // On demande explicitement les membres de B tout en étant actif sur A.
      const res = await as('get', `/api/accounts/${accountB.id}/memberships`, memberA, accountA.id);
      expect([403, 404]).toContain(res.status);
    });

    it('supprimer un membre d\'un autre compte → refusé, membership conservé', async () => {
      const { memberA, accountA, ownerB, accountB } = await seedTwoTenants(ctx.prisma);
      const targetMembership = ctx.prisma.$store
        .get('membership')!
        .find((m) => m.userId === ownerB.id && m.accountId === accountB.id)!;
      const res = await as(
        'delete',
        `/api/memberships/${targetMembership.id}`,
        memberA,
        accountA.id,
      );
      expect([403, 404]).toContain(res.status);
      expect(ctx.prisma.$store.get('membership')!.some((m) => m.id === targetMembership.id)).toBe(
        true,
      );
    });
  });

  describe('Header x-account-id manquant', () => {
    it('endpoint scoppé sans x-account-id → 400/403 (pas de fallback silencieux)', async () => {
      const { memberA } = await seedTwoTenants(ctx.prisma);
      const res = await as('get', '/api/missions', memberA);
      expect([400, 403]).toContain(res.status);
    });
  });
});
