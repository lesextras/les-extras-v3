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

describe('SOS Renfort : le premier palier existait pour l’équipe et la refusait', () => {
  /**
   * `SALARIES` est le choix PAR DÉFAUT du formulaire et du serveur : pendant
   * six heures, l'annonce est proposée à l'équipe avant de s'ouvrir. Le refus
   * était pourtant inconditionnel, et tombait avant les lignes écrites plus bas
   * pour laisser précisément les salariés rattachés répondre. Personne ne
   * pouvait donc répondre à une mission pendant ses six premières heures.
   */
  const mission = {
    id: 'm1',
    accountId: 'mecs',
    visibility: MissionVisibility.SALARIES,
    cibleDiffusion: CibleDiffusion.RESEAU,
  } as never;

  function service(estMembre: boolean, profilSalarie: boolean) {
    const prisma = {
      account: {
        findUnique: jest.fn().mockResolvedValue({ ownerId: 'personne', profilSalarie }),
      },
      membership: {
        findFirst: jest.fn().mockResolvedValue(estMembre ? { id: 'mb' } : null),
      },
    };
    const s = new CiblageService(prisma as never);
    // Le ciblage nominatif n'est pas le sujet de ce test : il est neutralisé.
    jest.spyOn(s, 'assertCiblageRespecte').mockResolvedValue(undefined as never);
    return s;
  }

  it('laisse répondre le salarié rattaché à la maison', async () => {
    await expect(
      service(true, true).assertReponseAutorisee(mission, 'compte-salarie'),
    ).resolves.toBeUndefined();
  });

  it('refuse toujours celui qui n’est pas de la maison', async () => {
    await expect(
      service(false, false).assertReponseAutorisee(mission, 'compte-etranger'),
    ).rejects.toThrow(/réservée aux salariés/i);
  });
});
