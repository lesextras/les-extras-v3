import { AccountType, MembershipStatus } from '@prisma/client';
import {
  racineDuChemin,
  routeOuverteSansRattachement,
  salarieEnAttente,
} from './rattachement';

/**
 * LE COMPTE SALARIÉ QUI ATTEND SON RATTACHEMENT.
 *
 * Deux façons de se tromper, symétriques et toutes deux coûteuses : laisser
 * passer quelqu'un qui devrait attendre, ou enfermer quelqu'un qui a le droit
 * de travailler. Les deux sont couvertes ici.
 */

describe('Racine du chemin', () => {
  it('ignore le préfixe global de l’API', () => {
    expect(racineDuChemin('/api/services/abc')).toBe('services');
    expect(racineDuChemin('/services/abc')).toBe('services');
  });

  it('ignore la chaîne de requête', () => {
    expect(racineDuChemin('/api/assistant/generer?trame=BILAN')).toBe('assistant');
  });

  it('ne confond pas une racine avec un préfixe de chaîne', () => {
    // `services` est fermé ; `servicesXYZ` ne doit pas s'ouvrir parce qu'il
    // commence pareil, et l'inverse non plus.
    expect(routeOuverteSansRattachement('/api/assistantXYZ/generer')).toBe(false);
    expect(routeOuverteSansRattachement('/api/assistant/generer')).toBe(true);
  });
});

describe('Ce qui reste ouvert pendant l’attente', () => {
  it('ouvre LEX, les crédits, la demande de rattachement et son propre dossier', () => {
    for (const route of [
      '/api/assistant/generer',
      '/api/billing/utilisation',
      '/api/attachment-requests',
      '/api/attachment-requests/mine',
      '/api/users/me',
      '/api/accounts/etablissements/recherche?q=mecs',
      '/api/notifications',
      '/api/files/upload',
      '/api/invitations/accept',
    ]) {
      expect([route, routeOuverteSansRattachement(route)]).toEqual([route, true]);
    }
  });

  it('ferme tout ce qui suppose un établissement derrière soi', () => {
    for (const route of [
      '/api/services',
      '/api/missions',
      '/api/bookings/bk1/accept',
      '/api/quotes',
      '/api/invoices',
      '/api/formations',
      '/api/contrats',
      '/api/vivier',
      '/api/conformite',
      '/api/gap',
      '/api/reviews',
      '/api/conversations',
    ]) {
      expect([route, routeOuverteSansRattachement(route)]).toEqual([route, false]);
    }
  });
});

describe('Qui est en attente', () => {
  const prismaAvecRattachement = {
    membership: { findFirst: jest.fn(async () => ({ id: 'm1' })) },
  } as never;
  const prismaSansRattachement = {
    membership: { findFirst: jest.fn(async () => null) },
  } as never;

  const salarie = { type: AccountType.FREELANCE, profilSalarie: true };
  const independant = { type: AccountType.FREELANCE, profilSalarie: false };
  const etablissement = { type: AccountType.ESTABLISHMENT, profilSalarie: false };

  it('un salarié sans aucun rattachement attend', async () => {
    expect(await salarieEnAttente(prismaSansRattachement, 'u1', salarie)).toBe(true);
  });

  it('un seul rattachement actif suffit à ouvrir le compte', async () => {
    expect(await salarieEnAttente(prismaAvecRattachement, 'u1', salarie)).toBe(false);
  });

  it('un intervenant indépendant n’attend jamais : il exerce pour son compte', async () => {
    expect(await salarieEnAttente(prismaSansRattachement, 'u1', independant)).toBe(false);
  });

  it('un établissement ne se rattache à personne', async () => {
    expect(await salarieEnAttente(prismaSansRattachement, 'u1', etablissement)).toBe(false);
  });

  it('cherche un rattachement ACTIF à un ÉTABLISSEMENT, pas au compte actif', async () => {
    const prisma = { membership: { findFirst: jest.fn(async () => null) } };
    await salarieEnAttente(prisma as never, 'u1', salarie);
    expect(prisma.membership.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: 'u1',
          status: MembershipStatus.ACTIVE,
          account: { type: AccountType.ESTABLISHMENT },
        },
        select: { id: true },
      }),
    );
  });
});
