import { MembershipStatus } from '@prisma/client';
import { reservableParCompte, visibleParCompte } from './portee-salarie';

/**
 * CE QU'UN SALARIÉ PUBLIE NE SORT PAS DE SA MAISON.
 *
 * Deux erreurs possibles, opposées : exposer au marché la fiche d'un salarié —
 * il recevrait des demandes qu'il ne peut pas honorer — ou la cacher à
 * l'établissement qui l'emploie, alors qu'elle n'existe que pour lui.
 */

describe('Visibilité des fiches', () => {
  it('la vitrine publique ne montre que les indépendants', () => {
    expect(visibleParCompte()).toEqual({ account: { profilSalarie: false } });
  });

  it("un lecteur identifié voit les indépendants ET les salariés qui lui sont rattachés", () => {
    const filtre = visibleParCompte('acc-mecs');
    expect(filtre.OR).toHaveLength(2);
    expect(filtre.OR![0]).toEqual({ account: { profilSalarie: false } });
    expect(filtre.OR![1]).toEqual({
      account: {
        profilSalarie: true,
        owner: {
          memberships: {
            some: { accountId: 'acc-mecs', status: MembershipStatus.ACTIVE },
          },
        },
      },
    });
  });

  it('un rattachement suspendu ne suffit pas : seul ACTIF ouvre la fiche', () => {
    const filtre = visibleParCompte('acc-mecs');
    const parRattachement = filtre.OR![1] as {
      account: { owner: { memberships: { some: { status: MembershipStatus } } } };
    };
    expect(parRattachement.account.owner.memberships.some.status).toBe(MembershipStatus.ACTIVE);
  });
});

describe('Qui peut réserver', () => {
  function prismaQuiTrouve(trouve: boolean) {
    return {
      service: { findFirst: jest.fn(async () => (trouve ? { id: 's1' } : null)) },
    };
  }

  it("laisse réserver quand la fiche est dans la portée du réservant", async () => {
    const prisma = prismaQuiTrouve(true);
    expect(await reservableParCompte(prisma as never, 's1', 'acc-mecs')).toBe(true);
  });

  it('refuse quand elle ne l’est pas', async () => {
    const prisma = prismaQuiTrouve(false);
    expect(await reservableParCompte(prisma as never, 's1', 'acc-autre')).toBe(false);
  });

  it('interroge bien la fiche demandée, avec le filtre de portée du réservant', async () => {
    const prisma = prismaQuiTrouve(true);
    await reservableParCompte(prisma as never, 's1', 'acc-mecs');
    expect(prisma.service.findFirst).toHaveBeenCalledWith({
      where: { id: 's1', ...visibleParCompte('acc-mecs') },
      select: { id: true },
    });
  });
});
