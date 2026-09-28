import { PublicService } from './public.service';
import { FICHES_RETIREES_DU_CATALOGUE, HORS_FICHES_RETIREES } from './fiches-retirees';

/**
 * LES QUATRE FICHES DE FORMATION NE SORTENT PLUS DU CATALOGUE PUBLIC.
 *
 * Audit du 28/09/2026 : quatre formations étaient restées rangées parmi les
 * ateliers. Les formations vivent désormais sur adepa77.fr ; la décision doit
 * tenir même si personne n'archive les fiches en base. On vérifie donc la
 * REQUÊTE envoyée à la base, lecture par lecture, et non un résultat simulé.
 */

function service() {
  const vues: any[] = [];
  const prisma: any = {
    service: {
      findMany: jest.fn((args: any) => {
        vues.push(args.where);
        return Promise.resolve([]);
      }),
      findFirst: jest.fn((args: any) => {
        vues.push(args.where);
        return Promise.resolve(null);
      }),
      count: jest.fn().mockResolvedValue(0),
    },
    formation: { findMany: jest.fn().mockResolvedValue([]) },
    review: { groupBy: jest.fn().mockResolvedValue([]) },
    inscription: { groupBy: jest.fn().mockResolvedValue([]) },
    $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
  };
  return { svc: new PublicService(prisma, {} as any, {} as any, {} as any), prisma, vues };
}

const porteLeFiltre = (where: any) =>
  JSON.stringify(where?.AND ?? []).includes(JSON.stringify(HORS_FICHES_RETIREES));

describe('Fiches de formation retirées du catalogue public', () => {
  it('liste exactement les quatre adresses décidées, sans doublon', () => {
    expect([...FICHES_RETIREES_DU_CATALOGUE].sort()).toEqual([
      'accompagnement-des-jeunes-majeurs',
      'accueil-du-public-difficile-et-ou-en-difficulte-sociale',
      'analyse-des-pratiques-professionnelles',
      'gestion-de-la-violence-anticiper-et-gerer-les-conflits',
    ]);
  });

  it('garde les fiches sans slug : un NOT IN seul les ferait disparaître', () => {
    expect(HORS_FICHES_RETIREES.OR).toContainEqual({ slug: null });
  });

  it('les écarte du catalogue, y compris pendant une recherche', async () => {
    const { svc, vues } = service();
    await svc.catalog({ search: 'violence' } as any);
    expect(vues.length).toBeGreaterThan(0);
    for (const where of vues) expect(porteLeFiltre(where)).toBe(true);
    // La recherche pose son propre OR : il ne doit pas avoir écrasé le filtre.
    expect(vues[0].OR).toBeDefined();
  });

  it('les écarte des mises en avant de l’accueil', async () => {
    const { svc, vues } = service();
    await svc.highlights();
    expect(porteLeFiltre(vues[0])).toBe(true);
  });

  it('ne renvoie plus aucune formation dans les mises en avant, clé conservée', async () => {
    const { svc, prisma } = service();
    const reponse = await svc.highlights();
    expect(reponse.formations).toEqual([]);
    expect(prisma.formation.findMany).not.toHaveBeenCalled();
  });

  it('refuse la fiche détaillée, par son adresse comme par son identifiant', async () => {
    const { svc, vues } = service();
    await expect(svc.detail('gestion-de-la-violence-anticiper-et-gerer-les-conflits')).rejects.toThrow();
    expect(porteLeFiltre(vues[0])).toBe(true);
  });
});
