import { BadRequestException } from '@nestjs/common';
import { ComplianceDocType, CibleDiffusion, Interet, MissionVisibility } from '@prisma/client';
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
  /**
   * Les pièces déposées. Non fourni = dossier complet, pour que les tests des
   * quatre autres règles portent bien sur ce qu'ils annoncent.
   */
  pieces?: { type: ComplianceDocType; issuedAt?: Date | null }[];
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
        // ⚠ `Account.ownerId` n'est jamais nul en base : le défaut du mock doit
        // le refléter, sinon les règles qui remontent au propriétaire du compte
        // ne s'exécutent jamais et les tests passent pour la mauvaise raison.
        ownerId: options.ownerId ?? 'u-proprietaire',
        interets: options.interets ?? [],
      }),
    },
    membership: {
      findFirst: jest.fn().mockResolvedValue(options.estSalarie ? { id: 'mb1' } : null),
    },
    complianceDocument: {
      findMany: jest.fn().mockResolvedValue(
        (
          options.pieces ?? [
            { type: ComplianceDocType.IDENTITY },
            { type: ComplianceDocType.CRIMINAL_RECORD, issuedAt: new Date() },
          ]
        ).map((p) => ({
          type: p.type,
          fileId: 'f1',
          fileUrl: null,
          issuedAt: p.issuedAt ?? null,
        })),
      ),
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

/**
 * LE DOSSIER — la cinquieme regle.
 *
 * ⚠ ON NE CANDIDATE PAS SANS AVOIR DEPOSE SES PIECES. Une candidature sans
 * dossier fait perdre plusieurs jours a l'etablissement, qui reclame les
 * papiers apres coup, pendant que le poste reste decouvert.
 *
 * ⚠ ET LE SALARIE DE LA MAISON EN EST EXEMPTE : il est deja employe la, son
 * employeur detient ses pieces depuis son embauche, et ce qu'il fait ici sont
 * des heures supplementaires. Lui redemander son casier pour prendre un
 * creneau chez lui serait absurde — et c'est le genre de refus qui fait
 * abandonner l'outil.
 */
describe('Accès aux réponses : le dossier déposé', () => {
  it('refuse une candidature sans pièce d’identité ni casier', async () => {
    const ciblage = new CiblageService(prismaMock({ pieces: [] }) as never);

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'sans-dossier'),
    ).rejects.toThrow(/Mon dossier/);
  });

  it('nomme les pièces qui manquent, pas seulement le fait qu’il en manque', async () => {
    const ciblage = new CiblageService(
      prismaMock({ pieces: [{ type: ComplianceDocType.IDENTITY }] }) as never,
    );

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'sans-casier'),
    ).rejects.toThrow(/bulletin n° 3/);
  });

  /** Un bulletin n° 3 atteste au jour de son édition, et de rien après. */
  it('refuse un casier de plus d’un an', async () => {
    const vieux = new Date(Date.now() - 400 * 24 * 3600 * 1000);
    const ciblage = new CiblageService(
      prismaMock({
        pieces: [
          { type: ComplianceDocType.IDENTITY },
          { type: ComplianceDocType.CRIMINAL_RECORD, issuedAt: vieux },
        ],
      }) as never,
    );

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'casier-perime'),
    ).rejects.toThrow(/bulletin n° 3/);
  });

  it('laisse passer un dossier complet', async () => {
    const ciblage = new CiblageService(prismaMock({}) as never);

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'avec-dossier'),
    ).resolves.toBeUndefined();
  });

  /**
   * ⚠ NE PAS « RÉPARER » CE TEST en étendant la règle au salarié maison : ce
   * sont des heures supplémentaires chez son propre employeur, qui détient
   * déjà son dossier.
   */
  it('n’exige rien du salarié qui répond à sa propre maison', async () => {
    const ciblage = new CiblageService(
      prismaMock({ ownerId: 'u-salarie', estSalarie: true, pieces: [] }) as never,
    );

    // Le refus attendu est celui du travail dissimulé, pas celui du dossier.
    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'son-compte-perso'),
    ).rejects.toThrow(/rattaché à cet établissement/i);
  });
});

/**
 * PRÉVENIR AVANT LE CLIC.
 *
 * ⚠⚠ CES TESTS VÉRIFIENT QUE L'AVERTISSEMENT ET LE REFUS DISENT LA MÊME CHOSE.
 * Un écran qui annonce « vous pouvez candidater » suivi d'un refus au clic est
 * pire que pas d'écran du tout — et c'est exactement ce qui arrive si
 * quelqu'un réécrit une des deux règles d'un seul côté.
 *
 * ⚠ LES REFUS NON RÉPARABLES N'Y FIGURENT PAS (ciblage, paliers de cascade,
 * salarié de la maison) : ils ne dépendent pas de la personne, tombent d'eux-
 * mêmes avec le temps, et n'ont aucune réparation à proposer.
 */
describe('Blocages annoncés avant la candidature', () => {
  it('n’annonce RIEN à un compte en règle', async () => {
    const ciblage = new CiblageService(prismaMock({}) as never);

    await expect(
      ciblage.blocagesReponse(missionReseau(MissionVisibility.PUBLIC), 'moi'),
    ).resolves.toEqual([]);
  });

  /**
   * ⚠ NE PAS « RÉPARER » CE TEST en avertissant les comptes sans déclaration.
   * Tous les comptes créés avant le 16/09/2026 ont une liste vide : les
   * avertir reviendrait à afficher un reproche à tout le monde, sur une
   * question qu'on ne leur a jamais posée.
   */
  it('n’annonce rien à un compte qui n’a rien déclaré', async () => {
    const ciblage = new CiblageService(prismaMock({ interets: [] }) as never);

    await expect(
      ciblage.blocagesReponse(missionReseau(MissionVisibility.PUBLIC), 'moi'),
    ).resolves.toEqual([]);
  });

  it('annonce le montage à qui n’a pas coché le CDD, avec où le corriger', async () => {
    const ciblage = new CiblageService(
      prismaMock({ interets: [Interet.RENFORT_PERSONNALISE] }) as never,
    );

    const blocages = await ciblage.blocagesReponse(
      missionReseau(MissionVisibility.PUBLIC),
      'moi',
    );
    expect(blocages).toHaveLength(1);
    expect(blocages[0].code).toBe('MONTAGE');
    expect(blocages[0].message).toMatch(/CDD/);
    expect(blocages[0].href).toBe('/dashboard/disponibilite');
  });

  it('annonce les pièces manquantes, et l’écran où les déposer', async () => {
    const ciblage = new CiblageService(
      prismaMock({ pieces: [{ type: ComplianceDocType.IDENTITY }] }) as never,
    );

    const blocages = await ciblage.blocagesReponse(
      missionReseau(MissionVisibility.PUBLIC),
      'moi',
    );
    expect(blocages).toHaveLength(1);
    expect(blocages[0].code).toBe('DOSSIER');
    expect(blocages[0].message).toMatch(/bulletin n° 3/);
    expect(blocages[0].href).toBe('/dashboard/mon-dossier');
  });

  /** Le salarié de la maison est exempté du dossier — ici comme au refus. */
  it('n’annonce pas le dossier au salarié de la maison', async () => {
    const ciblage = new CiblageService(
      prismaMock({ estSalarie: true, pieces: [] }) as never,
    );

    await expect(
      ciblage.blocagesReponse(missionReseau(MissionVisibility.PUBLIC), 'moi'),
    ).resolves.toEqual([]);
  });

  it('annonce les deux quand les deux manquent', async () => {
    const ciblage = new CiblageService(
      prismaMock({ interets: [Interet.ATELIERS], pieces: [] }) as never,
    );

    const codes = (
      await ciblage.blocagesReponse(missionReseau(MissionVisibility.PUBLIC), 'moi')
    ).map((b) => b.code);
    expect(codes).toEqual(['MONTAGE', 'DOSSIER']);
  });

  /**
   * LE MESSAGE ANNONCÉ EST CELUI QUI SERA OPPOSÉ. S'ils divergent, la personne
   * répare ce qu'on lui a montré et se fait refuser pour autre chose.
   */
  it('dit exactement ce que le refus dira', async () => {
    const ciblage = new CiblageService(
      prismaMock({ interets: [Interet.RENFORT_PERSONNALISE] }) as never,
    );
    const [blocage] = await ciblage.blocagesReponse(
      missionReseau(MissionVisibility.PUBLIC),
      'moi',
    );

    await expect(
      ciblage.assertReponseAutorisee(missionReseau(MissionVisibility.PUBLIC), 'moi'),
    ).rejects.toThrow(blocage.message);
  });
});
