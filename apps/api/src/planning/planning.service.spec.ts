import { BadRequestException } from '@nestjs/common';
import { PlanningService } from './planning.service';

/**
 * Ce que ces tests protègent : le moteur de règles est déjà couvert unitairement,
 * mais il resterait inutile si le service l'appelait après avoir écrit. On vérifie
 * donc le comportement du service, pas l'arithmétique — un créneau qui dépasse un
 * plafond ne doit PAS exister en base, et la décision de passer outre doit laisser
 * une trace datée. C'est cette trace qui protège le responsable en cas de contrôle.
 */

/** Un jour de juillet 2026 : le 6 est un lundi. */
const jour = (i: number) => new Date(Date.UTC(2026, 6, 6) + i * 86_400_000);
const a = (i: number, h: number) => new Date(jour(i).getTime() + h * 3_600_000).toISOString();

/** Prisma réduit à ce que le service touche ici. */
function prismaMock(voisins: { startAt: Date; endAt: Date }[]) {
  const create = jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
    id: 'shift_1',
    ...data,
  }));
  return {
    create,
    prisma: {
      shift: {
        // detectConflicts et controlesReglementaires passent tous deux par findMany.
        // Les conflits cherchent un chevauchement strict ; on n'en fabrique aucun
        // dans ces cas, donc renvoyer les voisins convient aux deux appels tant
        // qu'ils ne se chevauchent pas avec le candidat.
        findMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
          const chevauchement = where.startAt && (where.startAt as { lt?: Date }).lt;
          return chevauchement ? [] : voisins;
        }),
        create,
      },
    } as never,
  };
}

const dto = (extra: Record<string, unknown> = {}) => ({
  title: 'Internat — soirée',
  startAt: a(0, 8),
  endAt: a(0, 20), // 12 h : au-delà du plafond de 10 h, donc bloquant.
  freelanceId: 'user_1',
  ...extra,
}) as never;

describe('PlanningService — plafonds de durée du travail', () => {
  it("refuse d'écrire un créneau qui dépasse un plafond, sans motif", async () => {
    const { prisma, create } = prismaMock([
      // Déjà 10 h ce jour-là chez un autre employeur : le cumul est hors limites.
      { startAt: new Date(a(0, 20)), endAt: new Date(a(1, 6)) },
    ]);
    const service = new PlanningService(prisma);

    await expect(service.createShift('acc_1', dto())).rejects.toBeInstanceOf(BadRequestException);
    expect(create).not.toHaveBeenCalled();
  });

  it('nomme le code de conformité et joint les constats, pour que le front sache quoi afficher', async () => {
    const { prisma } = prismaMock([{ startAt: new Date(a(0, 20)), endAt: new Date(a(1, 6)) }]);
    const service = new PlanningService(prisma);

    await service.createShift('acc_1', dto()).then(
      () => {
        throw new Error('la création aurait dû être refusée');
      },
      (err: BadRequestException) => {
        const payload = err.getResponse() as Record<string, unknown>;
        expect(payload.code).toBe('CONFORMITE_HORAIRE');
        expect(payload.aide).toContain('motif');
        expect(Array.isArray(payload.constats)).toBe(true);
        expect((payload.constats as unknown[]).length).toBeGreaterThan(0);
      },
    );
  });

  it('écrit la trace de la dérogation quand un motif est donné', async () => {
    const { prisma, create } = prismaMock([{ startAt: new Date(a(0, 20)), endAt: new Date(a(1, 6)) }]);
    const service = new PlanningService(prisma);

    const res = await service.createShift(
      'acc_1',
      dto({ derogationMotif: 'Absence imprévue, aucun autre professionnel disponible ce soir.' }),
    );

    expect(create).toHaveBeenCalledTimes(1);
    const data = create.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.derogationMotif).toContain('Absence imprévue');
    expect((data.derogationCodes as string[]).length).toBeGreaterThan(0);
    expect(data.derogationLe).toBeInstanceOf(Date);
    expect(res.warnings?.reglementaires?.length).toBeGreaterThan(0);
  });

  it('ne pose aucune trace de dérogation sur un créneau conforme', async () => {
    const { prisma, create } = prismaMock([]);
    const service = new PlanningService(prisma);

    await service.createShift('acc_1', dto({ startAt: a(0, 9), endAt: a(0, 16) }));

    const data = create.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.derogationMotif).toBeNull();
    expect(data.derogationCodes).toEqual([]);
    expect(data.derogationLe).toBeNull();
  });

  it('ignore les plafonds quand le créneau n’est affecté à personne', async () => {
    const { prisma, create } = prismaMock([{ startAt: new Date(a(0, 20)), endAt: new Date(a(1, 6)) }]);
    const service = new PlanningService(prisma);

    await service.createShift('acc_1', dto({ freelanceId: undefined }));

    expect(create).toHaveBeenCalledTimes(1);
  });
});
