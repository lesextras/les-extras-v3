import { MatchingService } from './matching.service';

/**
 * L'ADRESSE E-MAIL DES INTERVENANTS : DEUX SORTIES, DEUX RÈGLES.
 *
 * Le classement des candidats sert deux usages qui n'ont pas les mêmes
 * droits. L'écran de l'établissement n'a aucun besoin de l'adresse — prénom,
 * métier, ville et note suffisent pour choisir, et le contact passe par la
 * messagerie de la plateforme. La diffusion RenforTeam, elle, envoie des
 * e-mails : sans adresse, elle ne prévient personne.
 *
 * Retirer l'adresse des DEUX sorties, comme ce fut le cas, protégeait la
 * donnée et éteignait le produit. Ces tests tiennent les deux bouts.
 */
function prismaMock() {
  return {
    reliefMission: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'm1',
        title: 'Renfort internat',
        accountId: 'etab',
        job: 'Éducateur spécialisé',
        category: null,
        description: null,
        city: 'Melun',
        postalCode: '77000',
        startDate: new Date('2026-09-01'),
        endDate: null,
      }),
    },
    account: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'compte-freelance',
          name: 'Camille Roux',
          updatedAt: new Date(),
          owner: {
            id: 'user-1',
            firstName: 'Camille',
            lastName: 'Roux',
            email: 'camille@example.fr',
            avatarUrl: null,
            lastLoginAt: new Date(),
            profile: {
              job: 'Éducateur spécialisé',
              city: 'Melun',
              postalCode: '77000',
              skills: ['Internat'],
              available: true,
              radiusKm: 30,
            },
          },
        },
      ]),
    },
    review: { groupBy: jest.fn().mockResolvedValue([]) },
    shift: { groupBy: jest.fn().mockResolvedValue([]) },
  };
}

describe('MatchingService — ce qui sort vers le front, ce qui sort vers la diffusion', () => {
  it('la liste destinée à l’écran ne porte AUCUNE adresse e-mail', async () => {
    const service = new MatchingService(prismaMock() as never);
    const { candidates } = await service.candidatesForMission('m1', 'etab');
    expect(candidates).toHaveLength(1);
    // Pas « email: null » : la clé n'existe pas dans l'objet sérialisé.
    expect(Object.keys(candidates[0])).not.toContain('email');
    expect(JSON.stringify(candidates)).not.toContain('camille@example.fr');
  });

  it('la liste interne, elle, porte l’adresse — sans quoi la diffusion n’écrit à personne', async () => {
    const service = new MatchingService(prismaMock() as never);
    const { candidates } = await service.candidatesForMissionInterne('m1', 'etab');
    expect(candidates).toHaveLength(1);
    expect(candidates[0].email).toBe('camille@example.fr');
    // Le reste du classement est identique : une seule mécanique de score.
    expect(candidates[0].accountId).toBe('compte-freelance');
    expect(candidates[0].total).toBeGreaterThan(0);
  });
});
