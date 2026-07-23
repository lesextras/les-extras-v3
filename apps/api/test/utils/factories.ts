/**
 * Factories de données de test (lane QA-Security).
 *
 * Elles écrivent directement dans le mock Prisma via `$seed`, en respectant
 * la forme du schéma (`apps/api/prisma/schema.prisma`). Objectif : monter
 * rapidement deux tenants distincts (compte A vs compte B) pour les tests
 * d'isolation multi-tenant.
 */
import * as bcrypt from 'bcrypt';

import { PrismaMock } from './prisma-mock';

let seq = 0;
const uid = (p: string) => `${p}_${(seq += 1)}`;

export async function hash(pw: string) {
  return bcrypt.hash(pw, 4); // cost faible = tests rapides (jamais en prod)
}

export interface SeededUser {
  id: string;
  email: string;
  password: string; // en clair, pour login
  role: 'USER' | 'ADMIN';
}

export async function makeUser(
  prisma: PrismaMock,
  overrides: Partial<{ email: string; password: string; role: 'USER' | 'ADMIN'; emailVerified: boolean }> = {},
): Promise<SeededUser> {
  const id = uid('user');
  const email = overrides.email ?? `${id}@test.fr`;
  const password = overrides.password ?? 'S3cret!Passw0rd';
  prisma.$seed('user', [
    {
      id,
      email,
      password: await hash(password),
      role: overrides.role ?? 'USER',
      status: 'VERIFIED',
      emailVerified: overrides.emailVerified ?? true,
      firstName: 'Test',
      lastName: 'User',
    },
  ]);
  return { id, email, password, role: overrides.role ?? 'USER' };
}

export function makeAccount(
  prisma: PrismaMock,
  ownerId: string,
  overrides: Partial<{ type: 'ESTABLISHMENT' | 'FREELANCE'; name: string }> = {},
): { id: string; slug: string } {
  const id = uid('acc');
  const slug = `${id}-slug`;
  prisma.$seed('account', [
    {
      id,
      name: overrides.name ?? 'Compte Test',
      type: overrides.type ?? 'ESTABLISHMENT',
      slug,
      ownerId,
      credits: 10,
    },
  ]);
  return { id, slug };
}

export function makeMembership(
  prisma: PrismaMock,
  userId: string,
  accountId: string,
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' = 'MEMBER',
): { id: string } {
  const id = uid('mbr');
  prisma.$seed('membership', [{ id, userId, accountId, role, status: 'ACTIVE' }]);
  return { id };
}

export function makeMission(
  prisma: PrismaMock,
  accountId: string,
  overrides: Partial<{ status: string; visibility: string; title: string }> = {},
): { id: string } {
  const id = uid('mission');
  prisma.$seed('reliefMission', [
    {
      id,
      accountId,
      title: overrides.title ?? 'Renfort MECS week-end',
      description: 'Besoin urgent éducateur spécialisé.',
      category: 'RENFORT',
      startDate: new Date('2026-09-01T09:00:00Z'),
      headcount: 1,
      status: overrides.status ?? 'DRAFT',
      visibility: overrides.visibility ?? 'PUBLIC',
    },
  ]);
  return { id };
}

export function makeBooking(
  prisma: PrismaMock,
  accountId: string,
  overrides: Partial<{ missionId: string; serviceId: string; status: string }> = {},
): { id: string } {
  const id = uid('booking');
  prisma.$seed('booking', [
    {
      id,
      accountId,
      missionId: overrides.missionId ?? null,
      serviceId: overrides.serviceId ?? null,
      status: overrides.status ?? 'REQUESTED',
    },
  ]);
  return { id };
}

export function makeInvoice(
  prisma: PrismaMock,
  accountId: string,
  overrides: Partial<{ number: string; status: string }> = {},
): { id: string } {
  const id = uid('inv');
  prisma.$seed('invoice', [
    {
      id,
      accountId,
      number: overrides.number ?? `F-${id}`,
      amount: '120.00',
      status: overrides.status ?? 'DRAFT',
    },
  ]);
  return { id };
}

export function makeInvitation(
  prisma: PrismaMock,
  accountId: string,
  invitedById: string,
  overrides: Partial<{ email: string; role: string; status: string; token: string; expiresAt: Date }> = {},
): { id: string; token: string } {
  const id = uid('invite');
  const token = overrides.token ?? `tok_${id}`;
  prisma.$seed('invitation', [
    {
      id,
      email: overrides.email ?? `invitee_${id}@test.fr`,
      accountId,
      role: overrides.role ?? 'MEMBER',
      token,
      status: overrides.status ?? 'PENDING',
      invitedById,
      expiresAt: overrides.expiresAt ?? new Date(Date.now() + 7 * 24 * 3600 * 1000),
    },
  ]);
  return { id, token };
}

/**
 * Monte deux tenants complets (A et B), chacun avec owner + membre + données.
 * Base commune de tous les tests d'isolation.
 */
export async function seedTwoTenants(prisma: PrismaMock) {
  const ownerA = await makeUser(prisma, { email: 'owner.a@test.fr' });
  const memberA = await makeUser(prisma, { email: 'member.a@test.fr' });
  const ownerB = await makeUser(prisma, { email: 'owner.b@test.fr' });

  const accountA = makeAccount(prisma, ownerA.id, { name: 'MECS Alpha' });
  const accountB = makeAccount(prisma, ownerB.id, { name: 'IME Beta' });

  makeMembership(prisma, ownerA.id, accountA.id, 'OWNER');
  makeMembership(prisma, memberA.id, accountA.id, 'MEMBER');
  makeMembership(prisma, ownerB.id, accountB.id, 'OWNER');

  const missionA = makeMission(prisma, accountA.id, { title: 'Mission A privée' });
  const missionB = makeMission(prisma, accountB.id, { title: 'Mission B privée' });
  const bookingB = makeBooking(prisma, accountB.id, { missionId: missionB.id });
  const invoiceB = makeInvoice(prisma, accountB.id);

  return { ownerA, memberA, ownerB, accountA, accountB, missionA, missionB, bookingB, invoiceB };
}
