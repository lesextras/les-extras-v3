import { NotFoundException } from '@nestjs/common';
import { ContratsService } from './contrats.service';

/**
 * LA PERSONNE ENGAGÉE LIT SON CONTRAT (24/09/2026).
 *
 * La notification « Un contrat vous a été transmis » mène à
 * `/dashboard/contrats/:id`, ouvert depuis le compte de la personne engagée.
 * Le contrat appartient au compte de l'établissement : sans la seconde voie
 * de lecture, le lien aboutissait à « introuvable ».
 */
function monter(trouve: Record<string, unknown> | null) {
  const prisma = {
    contratCDD: { findFirst: jest.fn().mockResolvedValue(trouve) },
  };
  const service = new ContratsService(prisma as never, {} as never, {} as never, {} as never);
  return { service, prisma };
}

describe('Lecture d’un contrat CDD', () => {
  it('cherche le contrat du compte actif OU de la personne engagée', async () => {
    const { service, prisma } = monter(null);
    await expect(service.get('compte-perso', 'c1', 'u-salarie')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(prisma.contratCDD.findFirst.mock.calls[0][0].where).toEqual({
      id: 'c1',
      OR: [{ accountId: 'compte-perso' }, { userId: 'u-salarie' }],
    });
  });

  it('sans personne désignée, seul le compte actif compte (appels internes)', async () => {
    const { service, prisma } = monter(null);
    await expect(service.get('etab', 'c1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.contratCDD.findFirst.mock.calls[0][0].where).toEqual({
      id: 'c1',
      OR: [{ accountId: 'etab' }],
    });
  });
});
