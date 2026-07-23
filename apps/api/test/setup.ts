/**
 * Setup global Jest (e2e / unit) — LES EXTRAS v3, lane QA-Security.
 *
 * - Fige les secrets de test pour un JWT reproductible.
 * - Réduit le bruit console pendant les tests.
 * - Rallonge le timeout par défaut (boot Nest + supertest).
 *
 * NB : aucune connexion Postgres réelle n'est ouverte. Les specs e2e
 * remplacent `PrismaService` par le mock in-memory (`utils/prisma-mock.ts`).
 */
process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-do-not-use-in-prod';
process.env.SESSION_SECRET = process.env.SESSION_SECRET ?? 'test-session-secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test?schema=public';

jest.setTimeout(30000);
