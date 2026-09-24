/**
 * Les règles des alertes de recherche.
 *
 * ⚠ CE QUI EST TESTÉ ICI NE SE VOIT PAS EN RELISANT LE FICHIER. Une alerte
 * fautive n'échoue jamais bruyamment : elle envoie simplement le mauvais
 * courriel, tous les jours, à quelqu'un qui finit par se désabonner. Les trois
 * pièges couverts sont la borne de nouveauté (sans elle, les mêmes fiches
 * repartent indéfiniment), les codes de département inconnus (qui ne
 * filtreraient rien du tout) et le résumé affiché, qui doit dire exactement ce
 * que l'alerte surveille.
 */
import { AlertesService } from './alertes.service';
import type { PrismaService } from '../prisma/prisma.service';

const prismaFactice = () => {
  const etat = {
    alerte: null as Record<string, unknown> | null,
    servicesWhere: null as Record<string, unknown> | null,
  };
  const prisma = {
    alerteRecherche: {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        etat.alerte = { id: 'a1', createdAt: new Date('2026-01-01'), dernierEnvoiAt: null, ...data };
        return etat.alerte;
      }),
      findUnique: jest.fn(async () => etat.alerte),
      findFirst: jest.fn(async () => etat.alerte),
      findMany: jest.fn(async () => (etat.alerte ? [etat.alerte] : [])),
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        ...etat.alerte,
        ...data,
      })),
      delete: jest.fn(async () => etat.alerte),
    },
    service: {
      count: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
        etat.servicesWhere = where;
        return 3;
      }),
      findMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
        etat.servicesWhere = where;
        return [];
      }),
    },
  };
  return { prisma: prisma as unknown as PrismaService, etat };
};

describe('AlertesService — le résumé montré à son auteur', () => {
  it('dit « partout » quand aucun département n’est choisi', () => {
    expect(AlertesService.resume({ departements: [] })).toBe('partout');
  });

  it('nomme les départements plutôt que leurs codes', () => {
    const r = AlertesService.resume({ departements: ['77', '94'] });
    expect(r).toContain('Seine-et-Marne');
    expect(r).toContain('Val-de-Marne');
    expect(r).not.toContain('77');
  });

  // Une alerte posée sur toute l'Île-de-France afficherait huit noms sur une
  // ligne de liste : illisible, et la ligne pousse le bouton hors de l'écran.
  it('abrège au-delà de trois départements', () => {
    const r = AlertesService.resume({ departements: ['75', '77', '78', '91', '92'] });
    expect(r).toContain('+3');
  });

  it('reprend la recherche, la catégorie, le public et le budget', () => {
    const r = AlertesService.resume({
      departements: ['77'],
      recherche: 'médiation animale',
      categorie: 'Bien-être',
      publicVise: 'Adolescents',
      budgetMax: 500,
    });
    expect(r).toContain('« médiation animale »');
    expect(r).toContain('Bien-être');
    expect(r).toContain('public : Adolescents');
    expect(r).toContain("jusqu'à 500 €");
  });
});

describe('AlertesService — création', () => {
  it('écarte les codes de département inconnus', async () => {
    const { prisma, etat } = prismaFactice();
    await new AlertesService(prisma).creer('u1', 'c1', { departements: ['77', '999', 'ZZ'] });
    expect((etat.alerte as { departements: string[] }).departements).toEqual(['77']);
  });

  it('dédoublonne et trie les codes', async () => {
    const { prisma, etat } = prismaFactice();
    await new AlertesService(prisma).creer('u1', undefined, {
      departements: ['94', '77', '94'],
    });
    expect((etat.alerte as { departements: string[] }).departements).toEqual(['77', '94']);
  });

  it('retombe sur « all » quand le type est inconnu', async () => {
    const { prisma, etat } = prismaFactice();
    await new AlertesService(prisma).creer('u1', undefined, { type: 'nimporte' });
    expect((etat.alerte as { type: string }).type).toBe('all');
  });

  // Sans ce nombre, une personne pose une alerte sur un critère qui rend déjà
  // trente fiches et attend un courriel qui n'apportera rien de neuf.
  it('annonce combien de fiches correspondent déjà', async () => {
    const { prisma } = prismaFactice();
    const a = await new AlertesService(prisma).creer('u1', undefined, { recherche: 'boxe' });
    expect(a.dejaLa).toBe(3);
  });

  it('ne filtre sur rien quand aucun critère n’est posé', async () => {
    const { prisma, etat } = prismaFactice();
    await new AlertesService(prisma).creer('u1', undefined, {});
    const where = etat.servicesWhere as Record<string, unknown>;
    expect(where.status).toBe('PUBLISHED');
    expect(where.departements).toBeUndefined();
    expect(where.OR).toBeUndefined();
  });
});

describe('AlertesService — les nouveautés', () => {
  // ⚠ LE TEST QUI COMPTE. Sans borne, chaque passage renvoie les mêmes fiches
  // et l'alerte devient le courriel qu'on met en filtre.
  it('borne au dernier envoi quand il existe', async () => {
    const { prisma, etat } = prismaFactice();
    etat.alerte = {
      id: 'a1',
      type: 'all',
      departements: [],
      createdAt: new Date('2026-01-01'),
      dernierEnvoiAt: new Date('2026-06-01'),
    };
    await new AlertesService(prisma).nouveautes('a1');
    const where = etat.servicesWhere as { createdAt: { gt: Date } };
    expect(where.createdAt.gt).toEqual(new Date('2026-06-01'));
  });

  // Au premier passage : on ne signale jamais comme « nouveau » ce qui existait
  // déjà le jour où la personne a posé son alerte.
  it('borne à la création de l’alerte au premier passage', async () => {
    const { prisma, etat } = prismaFactice();
    etat.alerte = {
      id: 'a1',
      type: 'all',
      departements: [],
      createdAt: new Date('2026-03-15'),
      dernierEnvoiAt: null,
    };
    await new AlertesService(prisma).nouveautes('a1');
    const where = etat.servicesWhere as { createdAt: { gt: Date } };
    expect(where.createdAt.gt).toEqual(new Date('2026-03-15'));
  });

  it('ne rend rien pour une alerte disparue', async () => {
    const { prisma, etat } = prismaFactice();
    etat.alerte = null;
    expect(await new AlertesService(prisma).nouveautes('inconnue')).toEqual([]);
  });

  it('reprend tous les critères dans la requête', async () => {
    const { prisma, etat } = prismaFactice();
    etat.alerte = {
      id: 'a1',
      type: 'atelier',
      departements: ['77'],
      categorie: 'Bien-être',
      publicVise: 'Adolescents',
      recherche: 'boxe',
      budgetMax: 400,
      createdAt: new Date('2026-01-01'),
      dernierEnvoiAt: null,
    };
    await new AlertesService(prisma).nouveautes('a1');
    const where = etat.servicesWhere as Record<string, unknown>;
    expect(where.departements).toEqual({ hasSome: ['77'] });
    expect(where.categoryRef).toEqual({ is: { title: 'Bien-être' } });
    expect(where.publicTargets).toEqual({ hasSome: ['Adolescents', 'Adolescent'] });
    expect(where.price).toEqual({ lte: 400 });
    expect(where.OR).toHaveLength(2);
  });
});
