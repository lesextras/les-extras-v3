/**
 * AUTH e2e — register / login / me (lane QA-Security).
 *
 * Couvre le socle d'authentification et quelques abus classiques :
 *  - inscription FREELANCE / ESTABLISHMENT + hash bcrypt (jamais de clair en base),
 *  - login OK / KO, réponse ne divulguant pas l'existence du compte,
 *  - /auth/me protégé par JwtAuthGuard,
 *  - rejet des tokens forgés / signés avec un mauvais secret.
 *
 * Routes supposées (REST, préfixe /api) :
 *  POST /api/auth/register, POST /api/auth/login, GET /api/auth/me.
 * Adapter les chemins ici si le Backend-Core en décide autrement.
 */
import * as jwt from 'jsonwebtoken';
import * as request from 'supertest';

import { createTestApp, TestContext } from './utils/test-app';
import { makeUser } from './utils/factories';

describe('Auth (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  beforeEach(() => ctx.prisma.$reset());

  const server = () => ctx.app.getHttpServer();

  describe('POST /api/auth/register', () => {
    it('crée un compte FREELANCE et ne stocke jamais le mot de passe en clair', async () => {
      const res = await request(server())
        .post('/api/auth/register')
        .send({
          email: 'freelance@test.fr',
          password: 'S3cret!Passw0rd',
          firstName: 'Amina',
          lastName: 'Dupont',
          accountType: 'FREELANCE',
        });

      expect([200, 201]).toContain(res.status);
      // Le body ne doit jamais renvoyer le hash / mot de passe.
      expect(JSON.stringify(res.body)).not.toContain('S3cret!Passw0rd');
      expect(res.body?.password).toBeUndefined();

      const stored = ctx.prisma.$store.get('user')!.find((u) => u.email === 'freelance@test.fr');
      expect(stored).toBeDefined();
      expect(stored!.password).not.toBe('S3cret!Passw0rd');
      expect(stored!.password).toMatch(/^\$2[aby]\$/); // hash bcrypt
    });

    it('refuse un email déjà utilisé (pas de duplication de tenant)', async () => {
      await makeUser(ctx.prisma, { email: 'dup@test.fr' });
      const res = await request(server())
        .post('/api/auth/register')
        .send({ email: 'dup@test.fr', password: 'S3cret!Passw0rd', accountType: 'FREELANCE' });

      expect([400, 409]).toContain(res.status);
    });

    it('valide les entrées (email invalide / mot de passe faible → 400)', async () => {
      const res = await request(server())
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: '123', accountType: 'FREELANCE' });

      expect(res.status).toBe(400);
    });

    it('rejette les champs non déclarés (forbidNonWhitelisted, anti mass-assignment)', async () => {
      const res = await request(server())
        .post('/api/auth/register')
        .send({
          email: 'ma@test.fr',
          password: 'S3cret!Passw0rd',
          accountType: 'FREELANCE',
          role: 'ADMIN', // tentative d'escalade de privilège globale
        });

      // Soit rejeté (400), soit accepté mais role NON pris en compte.
      if (res.status < 300) {
        const stored = ctx.prisma.$store.get('user')!.find((u) => u.email === 'ma@test.fr');
        expect(stored?.role).not.toBe('ADMIN');
      } else {
        expect(res.status).toBe(400);
      }
    });
  });

  describe('POST /api/auth/login', () => {
    it('retourne un token pour des identifiants valides', async () => {
      const user = await makeUser(ctx.prisma, { email: 'login@test.fr', password: 'GoodPass!123' });
      const res = await request(server())
        .post('/api/auth/login')
        .send({ email: user.email, password: 'GoodPass!123' });

      expect(res.status).toBe(200);
      const token = res.body.accessToken ?? res.body.token ?? res.body.access_token;
      expect(typeof token).toBe('string');
    });

    it('rejette un mauvais mot de passe (401) sans divulguer si l\'email existe', async () => {
      const user = await makeUser(ctx.prisma, { email: 'login2@test.fr', password: 'GoodPass!123' });
      const bad = await request(server())
        .post('/api/auth/login')
        .send({ email: user.email, password: 'WrongPass!123' });
      const unknown = await request(server())
        .post('/api/auth/login')
        .send({ email: 'nobody@test.fr', password: 'WrongPass!123' });

      expect(bad.status).toBe(401);
      expect(unknown.status).toBe(401);
      // Même statut → pas d'énumération de comptes.
      expect(bad.status).toBe(unknown.status);
    });
  });

  describe('GET /api/auth/me', () => {
    it('renvoie le profil courant avec un token valide', async () => {
      const user = await makeUser(ctx.prisma, { email: 'me@test.fr' });
      const res = await request(server())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${ctx.tokenFor(user)}`);

      expect(res.status).toBe(200);
      expect(res.body.email ?? res.body.user?.email).toBe('me@test.fr');
      expect(JSON.stringify(res.body)).not.toMatch(/\$2[aby]\$/); // pas de hash exposé
    });

    it('refuse sans token (401)', async () => {
      const res = await request(server()).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('refuse un token signé avec un mauvais secret (401)', async () => {
      const user = await makeUser(ctx.prisma, { email: 'forge@test.fr' });
      const forged = jwt.sign({ sub: user.id, id: user.id, role: 'ADMIN' }, 'attacker-secret');
      const res = await request(server())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${forged}`);

      expect(res.status).toBe(401);
    });

    it('refuse un token expiré (401)', async () => {
      const user = await makeUser(ctx.prisma, { email: 'exp@test.fr' });
      const expired = jwt.sign(
        { sub: user.id, id: user.id, role: 'USER' },
        process.env.JWT_SECRET!,
        { expiresIn: -10 },
      );
      const res = await request(server())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expired}`);

      expect(res.status).toBe(401);
    });
  });
});
