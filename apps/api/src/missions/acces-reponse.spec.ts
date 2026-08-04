import { BadRequestException } from '@nestjs/common';
import { CibleDiffusion, MissionVisibility } from '@prisma/client';
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
      findUnique: jest.fn().mockResolvedValue({ ownerId: options.ownerId ?? null }),
    },
    membership: {
      findFirst: jest.fn().mockResolvedValue(options.estSalarie ? { id: 'mb1' } : null),
    },
  };
}

describe('Accès aux réponses — cascade de diffusion', () => {
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

describe('Accès aux réponses — garde-fou travail dissimulé', () => {
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
