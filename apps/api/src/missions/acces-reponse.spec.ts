import { BadRequestException } from '@nestjs/common';
import { CibleDiffusion, Interet, MissionVisibility } from '@prisma/client';
import { CiblageService } from './ciblage.service';

/**
 * LES TROIS VOIES DE RÉPONSE OBÉISSENT À LA MÊME RÈGLE.
 *
 * Constat d'audit, en production : une mission publiée « réservée à mon
 * équipe » était refusée à un inconnu sur /candidate, et acceptée sur
 * /accept comme sur /sengager — contrat émis, établissement notifié
 * « mission pourvue ». Les contrôles n'avaient été écrits que dans la
 * première voie et jamais recopiés dans les deux autres.
 *
 * Ces tests portent sur `assertReponseAutorisee`, le point de passage
 * commun. Ils échouent si quelqu'un ré-écrit les contrôles à la main
 * quelque part au lieu de l'appeler.
 */

function missionReseau(visibility: MissionVisibility) {
  return {
    id: 'm1',
    accountId: 'etab',
    orgUnitId: null,
    visibility,
    cibleDiffusion: CibleDiffusion.RESEAU,
    destinatairesSalaries: [],
    destinatairesIntervenants: [],
  };
}

/** Prisma réduit au strict nécessaire pour ce garde. */
function prismaMock(options: {
  connus?: string[];
  ownerId?: string | null;
  estSalarie?: boolean;
  /** Ce que le compte a déclaré vouloir faire. Non fourni = rien déclaré. */
  interets?: Interet[];
}) {
  return {
    poolMember: {
      findMany: jest
        .fn()
        .mockResolvedValue((options.connus ?? []).map((id) => ({ intervenantAccountId: id }))),
    },
    // `intervenantsConnus` construit deux requêtes puis les passe à
    // $transaction : les deux doivent exister, même si c'est le résultat de
    // la transaction qui compte.
    booking: { findMany: jest.fn() },
    $transaction: jest.fn().mockResolvedValue([[], []]),
    account: {
      findUnique: jest.fn().mockResolvedValue({
        ownerId: options.ownerId ?? null,
        interets: options.interets ?? [],
      }),
    },
    membership: {
      findFirst: jest.fn().mockResolvedValue(options.estSalarie ? { id: 'mb1' } : null),
    },
  };
}

describe('Accès aux réponses : cascade de diffusion', () => {
  it('refuse un inconnu sur une mission réservée aux salariés', async () => {
    const ciblage = new CiblageService(prismaMock({}) as never);

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.SALARIES), 'inconnu'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('refuse un inconnu sur une mission réservée au réseau de l’établissement', async () => {
    const ciblage = new CiblageService(prismaMock({ connus: ['deja-venu'] }) as never);

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.RESERVED), 'inconnu'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('laisse passer un intervenant du réseau sur une mission réservée', async () => {
    const ciblage = new CiblageService(prismaMock({ connus: ['deja-venu'] }) as never);

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.RESERVED), 'deja-venu'),
    ).resolves.toBeUndefined();
  });

  it('laisse passer n’importe qui une fois la mission publique', async () => {
    const ciblage = new CiblageService(prismaMock({}) as never);

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'inconnu'),
    ).resolves.toBeUndefined();
  });
});

describe('Accès aux réponses : garde-fou travail dissimulé', () => {
  it('refuse un salarié qui répondrait en indépendant à son propre employeur', async () => {
    const ciblage = new CiblageService(
      prismaMock({ ownerId: 'u-salarie', estSalarie: true }) as never,
    );

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'son-compte-perso'),
    ).rejects.toThrow(/rattaché à cet établissement/i);
  });

  it('laisse ce même intervenant répondre à un autre établissement', async () => {
    const ciblage = new CiblageService(
      prismaMock({ ownerId: 'u-salarie', estSalarie: false }) as never,
    );

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'son-compte-perso'),
    ).resolves.toBeUndefined();
  });
});

/**
 * LE MONTAGE — la quatrième règle de `assertReponseAutorisee`.
 *
 * ⚠ CE N'EST PAS LA PERSONNE QUI CHOISIT LE MONTAGE, C'EST LE BESOIN.
 *
 * Une `ReliefMission` est un REMPLACEMENT : quelqu'un manque sur un poste, et
 * cela ne se couvre qu'en CDD salarié. Le Conseil d'État l'a tranché le
 * 11/02/2025 (n° 491128, affaire Mediflash) et la LFSS 2025 (art. 70) a
 * resserré l'intérim en ESSMS. Un indépendant qui facturerait un remplacement
 * de poste, c'est une requalification pour lui et un risque de travail
 * dissimulé pour la maison.
 *
 * Intervenir EN PLUS, sur un besoin nommé, est autre chose — le « renfort
 * personnalisé » — et cela passe par une fiche, un devis et un contrat de
 * prestation, jamais par ici.
 *
 * ⚠ CE DÉFAUT NE SE VOIT PAS À L'ÉCRAN. Tout fonctionne : la mission se
 * pourvoit, la proposition d'engagement s'imprime. Il se découvre au contrôle,
 * des mois plus tard, et c'est l'établissement qui paie.
 */
describe('Accès aux réponses : le montage juridique', () => {
  it('refuse quelqu’un qui a déclaré ne vouloir que du renfort personnalisé', async () => {
    const ciblage = new CiblageService(
      prismaMock({ interets: [Interet.RENFORT_PERSONNALISE, Interet.ATELIERS] }) as never,
    );

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'un-independant'),
    ).rejects.toThrow(/CDD/);
  });

  it('laisse passer qui a déclaré vouloir des remplacements en CDD', async () => {
    const ciblage = new CiblageService(
      prismaMock({ interets: [Interet.RENFORT_CDD] }) as never,
    );

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'un-remplacant'),
    ).resolves.toBeUndefined();
  });

  /**
   * ⚠⚠ CE TEST PROTÈGE TOUS LES COMPTES ANTÉRIEURS, ET IL NE FAUT PAS LE
   * « RÉPARER » EN EXIGEANT UNE DÉCLARATION.
   *
   * Les centres d'intérêt sont arrivés le 16/09/2026 : tous les comptes créés
   * avant ce jour ont une liste VIDE. Refuser sur une absence de déclaration
   * fermerait RenforTeam à tout le monde du jour au lendemain, sans qu'aucun
   * test ni aucune alerte ne le signale — on ne restreint que sur un choix
   * explicitement fait.
   */
  it('ne refuse RIEN à un compte qui n’a rien déclaré', async () => {
    const ciblage = new CiblageService(prismaMock({ interets: [] }) as never);

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'compte-ancien'),
    ).resolves.toBeUndefined();
  });

  it('le message dit par où passer, il ne se contente pas de refuser', async () => {
    const ciblage = new CiblageService(
      prismaMock({ interets: [Interet.ATELIERS] }) as never,
    );

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'un-animateur'),
    ).rejects.toThrow(/renfort personnalisé/i);
  });
});
