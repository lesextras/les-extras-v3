/**
 * AUDIT EXPÉRIENCE CLIENT — les trous refermés le 4/09/2026.
 *
 * Trois d'entre eux se ressemblent : une règle écrite quelque part, et un
 * chemin qui ne la lisait pas. Ils ne se voient pas en relisant le fichier
 * fautif, seulement en jouant le scénario. C'est ce que fait ce fichier.
 */
import { QuotesService } from '../quotes/quotes.service';
import { CiblageService } from '../missions/ciblage.service';
import { MissionVisibility, CibleDiffusion } from '@prisma/client';

describe('Devis : le compte actif décide, pas la simple appartenance', () => {
  /**
   * LE SCÉNARIO EXACT DE L'ÉLÉVATION DE PRIVILÈGE.
   *
   * Un éducateur est MEMBER de la MECS et OWNER de son propre compte
   * intervenant. Le garde de rôle du contrôleur ne juge que le compte ACTIF :
   * connecté sur son compte perso, il est OWNER, il passe. Le service, lui,
   * ne regardait que les appartenances de la personne — il trouvait la MECS et
   * laissait accepter un devis de 900 € au nom de l'établissement.
   */
  const devis = {
    id: 'devis',
    clientAccountId: 'mecs',
    providerAccountId: 'intervenant-tiers',
    status: 'SENT',
  };

  function prismaAvec(membershipTrouve: boolean) {
    return {
      quote: {
        findUnique: jest.fn().mockResolvedValue(devis),
        update: jest.fn(),
      },
      membership: {
        findFirst: jest
          .fn()
          .mockResolvedValue(membershipTrouve ? { accountId: 'mecs' } : null),
      },
    } as never;
  }

  it("refuse quand le compte actif n'est pas partie au devis", async () => {
    const prisma = prismaAvec(true);
    const quotes = new QuotesService(prisma, {} as never, {} as never);

    // Le compte actif est son compte intervenant perso — étranger au devis.
    await expect(quotes.accept('educateur', 'devis', 'compte-perso')).rejects.toThrow(
      /compte sur lequel vous êtes connecté/i,
    );
    expect((prisma as never as { quote: { update: jest.Mock } }).quote.update)
      .not.toHaveBeenCalled();
  });

  it("refuse aussi si le compte actif est partie au devis mais que la personne n'y appartient pas", async () => {
    const prisma = prismaAvec(false);
    const quotes = new QuotesService(prisma, {} as never, {} as never);

    await expect(quotes.accept('intrus', 'devis', 'mecs')).rejects.toThrow(/Accès refusé/i);
  });
});

describe('SOS Renfort : le palier SALARIES hérité est lu comme RESERVED', () => {
  /**
   * `SALARIES` était le premier palier de la cascade (l'équipe interne
   * d'abord). Il n'existe plus depuis le 24/09/2026 (« 1 compte = 1
   * personne ») : une mission qui le porte encore est lue comme RESERVED. Le
   * réseau connu de l'établissement répond, les autres attendent
   * l'élargissement, et plus personne n'est laissé passer au titre d'un
   * rattachement.
   */
  const mission = {
    id: 'm1',
    accountId: 'mecs',
    visibility: MissionVisibility.SALARIES,
    cibleDiffusion: CibleDiffusion.RESEAU,
    destinatairesIntervenants: [],
  } as never;

  function service(connus: string[]) {
    const prisma = {
      account: {
        findUnique: jest.fn().mockResolvedValue({ ownerId: 'personne', interets: [] }),
      },
      membership: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const s = new CiblageService(prisma as never);
    // Le ciblage nominatif et le dossier ne sont pas le sujet de ce test.
    jest.spyOn(s, 'assertCiblageRespecte').mockResolvedValue(undefined as never);
    jest.spyOn(s, 'intervenantsConnus').mockResolvedValue(connus);
    jest.spyOn(s as unknown as { blocageDossier: () => Promise<null> }, 'blocageDossier').mockResolvedValue(null);
    return s;
  }

  it('laisse répondre un intervenant du réseau connu', async () => {
    await expect(
      service(['compte-habitue']).assertReponseAutorisee(mission, 'compte-habitue'),
    ).resolves.toBeUndefined();
  });

  it('refuse celui qui n’est pas du réseau, avec le message du palier réservé', async () => {
    await expect(
      service(['compte-habitue']).assertReponseAutorisee(mission, 'compte-etranger'),
    ).rejects.toThrow(/réservée au réseau/i);
  });
});
