/**
 * LE VIVIER OUVERT, ET LE CLOISONNEMENT DES DEUX MONTAGES.
 *
 * ⚠ CE QUI EST TESTÉ ICI NE SE VOIT PAS EN RELISANT LES FICHIERS.
 *
 * Deux choses portent un risque réel et ne se manifestent jamais par une
 * erreur :
 *
 *  1. LE MONTAGE JURIDIQUE. Remplacer quelqu'un sur un poste ne se fait qu'en
 *     CDD salarié (CE 11/02/2025, n° 491128 — affaire Mediflash ; LFSS 2025,
 *     art. 70). Un indépendant qui facturerait un remplacement de poste, c'est
 *     une requalification pour lui et un risque de travail dissimulé pour la
 *     maison. Ça ne casse rien à l'écran, ça se découvre au contrôle.
 *
 *  2. LE CONSENTEMENT. Quelqu'un qui cherche du travail ne doit pas découvrir
 *     qu'il figure dans une liste consultée par des dizaines d'établissements.
 *     Un défaut ici ne lève aucune exception : il expose simplement des gens.
 *
 * ⚠ ET UNE RÈGLE QUI PROTÈGE L'EXISTANT : une liste d'intérêts VIDE ne refuse
 * rien. Tous les comptes créés avant cette liste l'ont vide ; refuser sur une
 * absence de déclaration fermerait RenforTeam à tout le monde d'un coup.
 */
import { AccountType, Capacite, Interet, NiveauResponsabilite } from '@prisma/client';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { DisponibilitesService, LIBELLE_MONTAGE } from './disponibilites.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { RequestAccount, RequestUser } from '../common/types/request-context';

const COMPTE = (type: AccountType = AccountType.FREELANCE) =>
  ({ id: 'c1', type, role: 'OWNER' }) as unknown as RequestAccount;
const UTILISATEUR = { id: 'u1' } as unknown as RequestUser;

function prismaFactice(options?: {
  interets?: Interet[];
  membre?: { niveau: NiveauResponsabilite; niveauValide: boolean; capacites: Capacite[] } | null;
}) {
  const etat = {
    interets: options?.interets ?? [],
    upsert: null as Record<string, unknown> | null,
    where: null as Record<string, unknown> | null,
  };
  const prisma = {
    account: {
      findUnique: jest.fn(async () => ({
        interets: etat.interets,
        disponibilite: null,
      })),
      update: jest.fn(async ({ data }: { data: { interets?: { set: Interet[] } } }) => {
        if (data.interets?.set) etat.interets = data.interets.set;
        return {};
      }),
    },
    membership: {
      findFirst: jest.fn(async () =>
        options?.membre === undefined
          ? {
              id: 'm1',
              accountId: 'c1',
              userId: 'u1',
              niveau: NiveauResponsabilite.SALARIE,
              niveauValide: true,
              capacites: [Capacite.OUVRIR_RENFORT_CDD],
              services: [],
            }
          : options.membre && {
              id: 'm1',
              accountId: 'c1',
              userId: 'u1',
              services: [],
              ...options.membre,
            },
      ),
    },
    complianceDocument: {
      // Dossier complet par défaut : les tests de cette suite portent sur la
      // liste, pas sur la règle du dossier (couverte dans acces-reponse.spec).
      findMany: jest.fn(async () => [
        { userId: 'u9', accountId: 'c9', type: 'IDENTITY', fileId: 'f1', fileUrl: null, issuedAt: null },
        {
          userId: 'u9',
          accountId: 'c9',
          type: 'CRIMINAL_RECORD',
          fileId: 'f2',
          fileUrl: null,
          issuedAt: new Date(),
        },
      ]),
    },
    disponibiliteRenfort: {
      upsert: jest.fn(async (args: Record<string, unknown>) => {
        etat.upsert = args;
        return {};
      }),
      updateMany: jest.fn(async () => ({ count: 1 })),
      findMany: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
        etat.where = where;
        return [
          {
            id: 'd1',
            montages: [Interet.RENFORT_CDD],
            metier: 'Éducateur spécialisé',
            departements: ['77'],
            presentation: null,
            aPartirDu: null,
            confirmeeLe: new Date('2026-09-01'),
            account: {
              id: 'c9',
              name: 'Camille Durand',
              type: AccountType.PARTICULIER,
              slug: 'camille-durand',
              logoUrl: null,
              ownerId: 'u9',
            },
          },
        ];
      }),
    },
  };
  return { prisma: prisma as unknown as PrismaService, etat };
}

describe('Se déclarer disponible', () => {
  it('refuse à un établissement de se déclarer disponible', async () => {
    const { prisma } = prismaFactice();
    const service = new DisponibilitesService(prisma);
    await expect(
      service.declarer(COMPTE(AccountType.ESTABLISHMENT), { actif: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  /**
   * ⚠ UN CONSENTEMENT SANS MONTAGE N'EN EST PAS UN. Se rendre visible sans
   * dire sur quoi produit une ligne que l'établissement ne peut ni lire ni
   * utiliser — et la personne croit s'être proposée.
   */
  it('refuse de rendre visible quelqu’un qui n’a coché aucun montage', async () => {
    const { prisma } = prismaFactice({ interets: [Interet.ATELIERS] });
    const service = new DisponibilitesService(prisma);
    await expect(
      service.declarer(COMPTE(), { interets: [Interet.ATELIERS], actif: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  /**
   * ⚠ ON NE SE DÉCLARE DISPONIBLE QUE POUR CE QU'ON A DIT VOULOIR FAIRE.
   * Sans ce filtre, un écran mal câblé — ou un appel direct à l'API — rendrait
   * quelqu'un joignable pour un montage qu'il n'a jamais accepté.
   */
  it('ne retient que les montages effectivement déclarés', async () => {
    const { prisma, etat } = prismaFactice();
    const service = new DisponibilitesService(prisma);
    await service.declarer(COMPTE(), {
      interets: [Interet.RENFORT_CDD],
      montages: [Interet.RENFORT_CDD, Interet.RENFORT_PERSONNALISE],
      actif: true,
    });
    const update = etat.upsert?.update as { montages?: { set: Interet[] } };
    expect(update.montages?.set).toEqual([Interet.RENFORT_CDD]);
  });

  it('ignore un montage qui n’en est pas un — un atelier n’est pas une disponibilité', async () => {
    const { prisma, etat } = prismaFactice();
    const service = new DisponibilitesService(prisma);
    await service.declarer(COMPTE(), {
      interets: [Interet.ATELIERS, Interet.RENFORT_PERSONNALISE],
      montages: [Interet.ATELIERS, Interet.RENFORT_PERSONNALISE],
      actif: true,
    });
    const update = etat.upsert?.update as { montages?: { set: Interet[] } };
    expect(update.montages?.set).toEqual([Interet.RENFORT_PERSONNALISE]);
  });

  /**
   * Un code inconnu ne fait pas échouer une déclaration entière : il est
   * ignoré, et la personne voit tout de suite ce qui a été retenu. Une
   * exception ici lui ferait perdre tout le reste de sa saisie.
   */
  it('confronte les départements au référentiel, sans faire échouer la saisie', async () => {
    const { prisma, etat } = prismaFactice();
    const service = new DisponibilitesService(prisma);
    await service.declarer(COMPTE(), {
      interets: [Interet.RENFORT_CDD],
      montages: [Interet.RENFORT_CDD],
      departements: ['77', '999', '94', 'zz'],
    });
    const update = etat.upsert?.update as { departements?: { set: string[] } };
    expect(update.departements?.set).toEqual(['77', '94']);
  });

  /**
   * ⚠ SE RETIRER N'EFFACE PAS LA FICHE. Supprimer obligerait à tout
   * ressaisir — métier, territoire, présentation — pour revenir trois semaines
   * plus tard. Éteindre le consentement rend invisible immédiatement, ce qui
   * est la seule chose demandée.
   */
  it('se retirer éteint le consentement, il ne supprime rien', async () => {
    const { prisma } = prismaFactice();
    const service = new DisponibilitesService(prisma);
    await service.retirer(COMPTE());
    const appel = (prisma.disponibiliteRenfort.updateMany as jest.Mock).mock.calls[0][0];
    expect(appel.data).toEqual({ actif: false });
    expect(prisma.disponibiliteRenfort).not.toHaveProperty('deleteCalled');
  });
});

describe('Lire le vivier', () => {
  it('reste fermé à un compte qui n’est pas un établissement', async () => {
    const { prisma } = prismaFactice();
    const service = new DisponibilitesService(prisma);
    await expect(
      service.vivier(COMPTE(AccountType.FREELANCE), UTILISATEUR, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  /**
   * ⚠ UNE LISTE DE PERSONNES EN RECHERCHE DE VACATIONS N'A PAS À ÊTRE
   * FEUILLETÉE PAR TOUT LE MONDE. Le compte d'un établissement, c'est
   * n'importe lequel de ses salariés rattachés.
   */
  it('reste fermé à un salarié sans droit de renfort', async () => {
    const { prisma } = prismaFactice({
      membre: {
        niveau: NiveauResponsabilite.SALARIE,
        niveauValide: true,
        capacites: [],
      },
    });
    const service = new DisponibilitesService(prisma);
    await expect(
      service.vivier(COMPTE(AccountType.ESTABLISHMENT), UTILISATEUR, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('s’ouvre à qui porte le droit d’ouvrir un renfort', async () => {
    const { prisma } = prismaFactice({
      membre: {
        niveau: NiveauResponsabilite.SALARIE,
        niveauValide: true,
        capacites: [Capacite.OUVRIR_RENFORT_CDD],
      },
    });
    const service = new DisponibilitesService(prisma);
    const lignes = await service.vivier(COMPTE(AccountType.ESTABLISHMENT), UTILISATEUR, {});
    expect(lignes).toHaveLength(1);
  });

  /**
   * ⚠ NE JAMAIS LAISSER SORTIR DE COORDONNÉES D'ICI. Un profil, un métier, un
   * territoire, et la messagerie. Une liste de personnes avec leurs numéros
   * s'aspire en une après-midi, et c'est tout le modèle qui sort avec elle.
   */
  it('ne renvoie ni téléphone ni adresse e-mail', async () => {
    const { prisma } = prismaFactice({
      membre: {
        niveau: NiveauResponsabilite.DIRECTION,
        niveauValide: true,
        capacites: [],
      },
    });
    const service = new DisponibilitesService(prisma);
    const [ligne] = await service.vivier(COMPTE(AccountType.ESTABLISHMENT), UTILISATEUR, {});
    const serialise = JSON.stringify(ligne);
    expect(serialise).not.toMatch(/@/);
    expect(ligne.dossier).toEqual({ deposees: 2, total: 2, complet: true });
    expect(Object.keys(ligne)).not.toContain('phone');
    expect(Object.keys(ligne)).not.toContain('email');
  });

  /** Une ligne en veille est périmée : elle ferait perdre son temps. */
  it('n’affiche ni les retirés ni les fiches en veille', async () => {
    const { prisma, etat } = prismaFactice();
    const service = new DisponibilitesService(prisma);
    await service.vivier(COMPTE(AccountType.ESTABLISHMENT), UTILISATEUR, {});
    expect(etat.where).toMatchObject({ actif: true, enVeille: false });
  });

  /**
   * ⚠ L'ÉTIQUETTE DE MONTAGE EST CALCULÉE PAR LE SERVEUR. Deux écrans qui
   * traduiraient chacun l'énumération finiraient par ne plus dire la même
   * chose du même montage juridique.
   */
  it('accompagne chaque personne du montage sur lequel elle s’engage', async () => {
    const { prisma } = prismaFactice();
    const service = new DisponibilitesService(prisma);
    const [ligne] = await service.vivier(COMPTE(AccountType.ESTABLISHMENT), UTILISATEUR, {});
    expect(ligne.montages).toEqual([
      { cle: Interet.RENFORT_CDD, libelle: 'Remplacement · CDD' },
    ]);
  });
});

describe('Les deux libellés de montage', () => {
  /**
   * ⚠ « RENFORT » DÉSIGNE DEUX CHOSES AUX CONTRATS OPPOSÉS, et un chef de
   * service pressé ne lit pas, il clique. Les deux ne doivent jamais
   * s'afficher côte à côte sans leur montage écrit dessus.
   */
  it('disent le contrat, pas seulement la mission', () => {
    expect(LIBELLE_MONTAGE[Interet.RENFORT_CDD]).toContain('CDD');
    expect(LIBELLE_MONTAGE[Interet.RENFORT_PERSONNALISE]).toContain('prestation');
    expect(LIBELLE_MONTAGE[Interet.RENFORT_CDD]).not.toBe(
      LIBELLE_MONTAGE[Interet.RENFORT_PERSONNALISE],
    );
  });
});

describe('La fraîcheur', () => {
  /**
   * La relance part AVANT la mise en veille, sinon elle prévient quelqu'un
   * d'une échéance déjà passée.
   */
  it('relance avant de mettre en veille', () => {
    expect(DisponibilitesService.JOURS_AVANT_RELANCE).toBeLessThan(
      DisponibilitesService.JOURS_AVANT_VEILLE,
    );
  });

  it('laisse le temps de répondre entre la relance et la veille', () => {
    const marge =
      DisponibilitesService.JOURS_AVANT_VEILLE - DisponibilitesService.JOURS_AVANT_RELANCE;
    expect(marge).toBeGreaterThanOrEqual(5);
  });
});
