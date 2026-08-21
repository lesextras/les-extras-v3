import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingStatus, PointReason } from '@prisma/client';
import { BookingsService } from './bookings.service';
import { CommunityService } from '../community/community.service';
import { empreinte, genererCode, hacherCode, codeCorrect, verifier } from '../signature/signature';

/**
 * LE PARCOURS QUI FAIT VIVRE LA PLATEFORME, DE BOUT EN BOUT :
 *
 *   candidature → retenue → confirmée → contrat scellé → signé → mission
 *   démarrée → terminée.
 *
 * Chaque écran de l'application ne montre qu'un morceau de cette chaîne ;
 * ce test la déroule ENTIÈRE, dans l'ordre, sur les mêmes services que la
 * production (BookingsService + les primitives de signature), avec une base
 * en mémoire. Si un maillon casse — une transition qui saute un état, une
 * signature qui accepte un document modifié — c'est ici que ça se voit,
 * avant qu'un établissement ne le découvre un vendredi soir.
 */

const ETABLISSEMENT = 'acc-etab';
const INTERVENANT = 'acc-freelance';

/**
 * Deux flux, deux orientations — c'est la source du piège corrigé plus bas.
 *
 *   renfort : la mission est à l'ÉTABLISSEMENT, l'intervenant candidate ;
 *   atelier : la fiche est à l'INTERVENANT, l'établissement réserve.
 *
 * Dans les deux cas `booking.accountId` est le DEMANDEUR, et c'est le SOLLICITÉ
 * — le propriétaire de la mission ou de la fiche — qui fait avancer le dossier.
 */
function fabrique(flux: 'renfort' | 'atelier' = 'renfort') {
  const renfort = flux === 'renfort';
  const etat = {
    booking: {
      id: 'bk1',
      // Renfort : le candidat crée la réservation.
      // Atelier : c'est l'établissement qui réserve.
      accountId: renfort ? INTERVENANT : ETABLISSEMENT,
      status: BookingStatus.REQUESTED as BookingStatus,
      scheduledAt: null as Date | null,
      mission: renfort
        ? {
            id: 'm1',
            title: 'Renfort éducateur — internat',
            accountId: ETABLISSEMENT,
            account: { ownerId: 'user-etab' },
          }
        : null,
      service: renfort
        ? null
        : {
            id: 's1',
            title: 'Atelier socio-esthétique',
            accountId: INTERVENANT,
            account: { ownerId: 'user-lea' },
          },
      account: renfort
        ? { id: INTERVENANT, name: 'Léa Martin', ownerId: 'user-lea' }
        : { id: ETABLISSEMENT, name: 'MECS Les Tilleuls', ownerId: 'user-etab' },
    },
    notifications: [] as { userId: string; type: string }[],
    mails: [] as string[],
  };

  const prisma = {
    booking: {
      findUnique: jest.fn(async () => ({ ...etat.booking })),
      update: jest.fn(async ({ data }: { data: { status: BookingStatus } }) => {
        etat.booking.status = data.status;
        return { ...etat.booking };
      }),
    },
    user: {
      findUnique: jest.fn(async () => ({ email: 'direction@mecs.fr' })),
    },
  };
  const notifications = {
    create: jest.fn(async (userId: string, n: { type: string }) => {
      etat.notifications.push({ userId, type: n.type });
    }),
  };
  const mail = {
    sendBookingConfirmation: jest.fn(async (to: string) => {
      etat.mails.push(to);
    }),
  };
  const service = new BookingsService(
    prisma as never,
    notifications as never,
    mail as never,
    { log: jest.fn() } as never,
    {} as never,
  );
  return { service, etat };
}

describe('Parcours réservation → contrat → signature', () => {
  it('déroule la chaîne complète sans sauter un seul état', async () => {
    const { service, etat } = fabrique();

    // 1. L'établissement RETIENT la candidature.
    await service.accept('bk1', ETABLISSEMENT);
    expect(etat.booking.status).toBe(BookingStatus.ACCEPTED);

    // 2. Il CONFIRME : le courriel de confirmation part vers la direction.
    await service.confirm('bk1', ETABLISSEMENT);
    expect(etat.booking.status).toBe(BookingStatus.CONFIRMED);
    expect(etat.mails).toContain('direction@mecs.fr');

    // 3. Le CONTRAT est établi et SCELLÉ : l'empreinte fige le texte.
    const contrat = [
      'CONTRAT_CDD', 'bk1', 'user-lea', 'REMPLACEMENT',
      '2026-09-01', '2026-09-15', 'Éducatrice spécialisée', '2 450,00 €',
    ].join('\n');
    const sceau = empreinte(contrat);

    // 4. La salariée SIGNE : code à 6 chiffres, haché salé, jamais en clair.
    const code = genererCode();
    expect(code).toMatch(/^\d{6}$/);
    const sel = 'sel-de-test';
    const hache = hacherCode(code, sel);
    expect(hache).not.toContain(code);
    expect(codeCorrect(code, hache, sel)).toBe(true);

    const demande = {
      statut: 'EN_ATTENTE' as const,
      codeHache: hache,
      codeExpireLe: new Date(Date.now() + 10 * 60_000),
      tentatives: 0,
      empreinte: sceau,
    };

    // 5. Le document N'A PAS BOUGÉ entre l'envoi du code et la signature :
    //    l'empreinte recalculée au moment de signer est la même → signature OK.
    expect(verifier(demande, code, sel, empreinte(contrat)).ok).toBe(true);

    // 6. Un contrat MODIFIÉ après coup est refusé : le sceau ne ment pas.
    const falsifie = contrat.replace('2 450,00 €', '1 450,00 €');
    const refus = verifier(demande, code, sel, empreinte(falsifie));
    expect(refus.ok).toBe(false);
    expect(refus.echec).toBe('DOCUMENT_MODIFIE');

    // 6bis. Un mauvais code sur le bon document est refusé aussi.
    const mauvaisCode = code === '123456' ? '654321' : '123456';
    expect(verifier(demande, mauvaisCode, sel, empreinte(contrat)).echec).toBe('CODE_ERRONE');

    // 7. La mission DÉMARRE puis se TERMINE.
    await service.start('bk1', ETABLISSEMENT);
    expect(etat.booking.status).toBe(BookingStatus.IN_PROGRESS);
    await service.complete('bk1', ETABLISSEMENT);
    expect(etat.booking.status).toBe(BookingStatus.COMPLETED);

    // 8. Les DEUX parties ont été notifiées à chaque étape (4 transitions).
    const notifies = new Set(etat.notifications.map((n) => n.userId));
    expect(notifies).toEqual(new Set(['user-etab', 'user-lea']));
    expect(etat.notifications.length).toBeGreaterThanOrEqual(8);
  });

  it('refuse de sauter un état : pas de démarrage sans confirmation', async () => {
    const { service, etat } = fabrique();
    await expect(service.start('bk1', ETABLISSEMENT)).rejects.toThrow(BadRequestException);
    expect(etat.booking.status).toBe(BookingStatus.REQUESTED);
  });

  it('refuse de terminer une mission déjà terminée (pas de double clôture)', async () => {
    const { service } = fabrique();
    await service.accept('bk1', ETABLISSEMENT);
    await service.confirm('bk1', ETABLISSEMENT);
    await service.start('bk1', ETABLISSEMENT);
    await service.complete('bk1', ETABLISSEMENT);
    await expect(service.complete('bk1', ETABLISSEMENT)).rejects.toThrow(BadRequestException);
  });

  it("interdit la chaîne à un compte qui n'est pas partie au contrat", async () => {
    const { service, etat } = fabrique();
    await expect(service.accept('bk1', 'acc-intrus')).rejects.toThrow(ForbiddenException);
    expect(etat.booking.status).toBe(BookingStatus.REQUESTED);
  });
});

/**
 * ON NE VALIDE PAS SA PROPRE DEMANDE.
 *
 * Être partie au contrat ne suffit pas : encore faut-il être du bon côté.
 * Le contrôle d'accès historique ne vérifiait que l'appartenance, si bien que
 * le demandeur pouvait mener seul son dossier jusqu'à « terminée » — et, sur
 * un atelier, déclencher un brouillon de facture au nom d'un intervenant qui
 * n'avait jamais dit oui. Les écrans ne l'ont jamais proposé ; l'API le
 * permettait, et c'est là que se juge un garde-fou.
 */
describe('Seul le sollicité fait avancer la réservation', () => {
  it("renfort : l'intervenant qui a candidaté ne peut pas se retenir lui-même", async () => {
    const { service, etat } = fabrique('renfort');
    await expect(service.accept('bk1', INTERVENANT)).rejects.toThrow(ForbiddenException);
    expect(etat.booking.status).toBe(BookingStatus.REQUESTED);
  });

  it("atelier : l'établissement qui a réservé ne peut pas accepter à la place de l'intervenant", async () => {
    const { service, etat } = fabrique('atelier');
    await expect(service.accept('bk1', ETABLISSEMENT)).rejects.toThrow(ForbiddenException);
    expect(etat.booking.status).toBe(BookingStatus.REQUESTED);
  });

  it("atelier : l'intervenant propriétaire de la fiche déroule bien la chaîne", async () => {
    const { service, etat } = fabrique('atelier');
    await service.accept('bk1', INTERVENANT);
    await service.confirm('bk1', INTERVENANT);
    await service.start('bk1', INTERVENANT);
    await service.complete('bk1', INTERVENANT);
    expect(etat.booking.status).toBe(BookingStatus.COMPLETED);
  });

  it('aucune étape n’échappe au contrôle, pas même la dernière', async () => {
    const { service } = fabrique('renfort');
    await service.accept('bk1', ETABLISSEMENT);
    await expect(service.confirm('bk1', INTERVENANT)).rejects.toThrow(ForbiddenException);
    await service.confirm('bk1', ETABLISSEMENT);
    await expect(service.start('bk1', INTERVENANT)).rejects.toThrow(ForbiddenException);
    await service.start('bk1', ETABLISSEMENT);
    await expect(service.complete('bk1', INTERVENANT)).rejects.toThrow(ForbiddenException);
  });

  it('mais le demandeur garde le droit de renoncer, des deux côtés', async () => {
    const renfort = fabrique('renfort');
    await renfort.service.cancel('bk1', INTERVENANT, { reason: 'Plus disponible.' } as never);
    expect(renfort.etat.booking.status).toBe(BookingStatus.CANCELLED);

    const atelier = fabrique('atelier');
    await atelier.service.cancel('bk1', ETABLISSEMENT, { reason: 'Séjour annulé.' } as never);
    expect(atelier.etat.booking.status).toBe(BookingStatus.CANCELLED);
  });
});

/**
 * PARRAINAGE : LES DEUX PARTIES, ET UN COMPTEUR QUI DIT LA MÊME CHOSE.
 *
 * Décision produit : tous les comptes peuvent être récompensés dès lors qu'ils
 * ont été parrainés. Jusqu'ici seul `booking.accountId` l'était — c'est-à-dire
 * l'intervenant sur un renfort, mais l'ÉTABLISSEMENT sur un atelier : celui qui
 * animait l'atelier ne touchait jamais rien.
 *
 * Le second enjeu n'est pas le versement mais la COHÉRENCE : l'écran de
 * parrainage annonce « N filleuls avec une première mission terminée » et
 * « vous gagnez tous les deux 40 points ». Si le compteur et la récompense ne
 * comptent pas la même chose, l'écran promet des points qui ne tombent pas.
 * Les deux tests ci-dessous font donc tourner le VRAI `CommunityService.parrainage`
 * sur les mêmes données que `complete`, et vérifient qu'ils s'accordent.
 */
const PARRAIN = 'acc-parrain';

type FauxBooking = {
  id: string;
  accountId: string;
  status: BookingStatus;
  totalAmount: null;
  mission: { accountId: string } | null;
  service: { accountId: string } | null;
};

/**
 * Base en mémoire minimale. Le filtre lit le `where` RÉEL produit par le code
 * (`prestationsTermineesDe`) : si quelqu'un revient un jour à un critère fondé
 * sur `accountId` seul, d'un côté ou de l'autre, ces tests le disent.
 */
function baseAvec(bookings: FauxBooking[], parrains: Record<string, string | null>) {
  type Cond = { accountId?: string; mission?: { accountId: string }; service?: { accountId: string } };
  const correspond = (b: FauxBooking, where: { status?: BookingStatus; OR?: Cond[] }) => {
    if (where.status && b.status !== where.status) return false;
    if (!where.OR) return true;
    return where.OR.some((c) =>
      c.accountId
        ? b.accountId === c.accountId
        : c.mission
          ? b.mission?.accountId === c.mission.accountId
          : c.service
            ? b.service?.accountId === c.service.accountId
            : false,
    );
  };
  return {
    booking: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => {
        const b = bookings.find((x) => x.id === where.id);
        return b ? { ...b } : null;
      }),
      update: jest.fn(async ({ where, data }: { where: { id: string }; data: { status: BookingStatus } }) => {
        const b = bookings.find((x) => x.id === where.id)!;
        b.status = data.status;
        return { ...b };
      }),
      count: jest.fn(async ({ where }: { where: never }) => bookings.filter((b) => correspond(b, where)).length),
      findMany: jest.fn(async ({ where }: { where: never }) =>
        bookings.filter((b) => correspond(b, where)).map((b) => ({
          accountId: b.accountId,
          mission: b.mission,
          service: b.service,
        })),
      ),
    },
    account: {
      findUnique: jest.fn(async ({ where }: { where: { id: string } }) => ({
        name: where.id,
        parrainAccountId: parrains[where.id] ?? null,
      })),
      findMany: jest.fn(async ({ where }: { where: { parrainAccountId: string } }) =>
        Object.entries(parrains)
          .filter(([, p]) => p === where.parrainAccountId)
          .map(([id]) => ({ id, name: id, createdAt: new Date() })),
      ),
    },
    user: { findUnique: jest.fn(async () => null) },
  };
}

/** Une prestation terminée de bout en bout, avec le vrai service. */
async function terminer(
  booking: FauxBooking,
  parrains: Record<string, string | null>,
  sollicite: string,
) {
  const prisma = baseAvec([booking], parrains);
  const community = new CommunityService(prisma as never);
  const credits = jest.spyOn(community, 'crediter').mockResolvedValue(null);
  const svc = new BookingsService(
    prisma as never,
    { create: jest.fn(async () => undefined) } as never,
    { sendBookingConfirmation: jest.fn(async () => undefined) } as never,
    { log: jest.fn() } as never,
    community,
  );
  await svc.accept(booking.id, sollicite);
  await svc.confirm(booking.id, sollicite);
  await svc.start(booking.id, sollicite);
  await svc.complete(booking.id, sollicite);
  // La récompense est volontairement détachée de la requête (jamais bloquante) :
  // on laisse la boucle d'événements la dérouler avant de conclure.
  await new Promise((r) => setTimeout(r, 0));
  return { credits, community };
}

/** Les comptes crédités d'un bonus de parrainage, sans doublon. */
const beneficiaires = (credits: { mock: { calls: unknown[][] } }) =>
  new Set(credits.mock.calls.filter((c) => c[1] === PointReason.PARRAINAGE).map((c) => c[0] as string));

describe('Parrainage : les deux parties d’une prestation terminée', () => {
  it("atelier : l'INTERVENANT qui a animé est récompensé, pas seulement l'établissement qui a réservé", async () => {
    // Atelier : la fiche est à l'intervenant, la réservation à l'établissement.
    // Avant correction, seul `booking.accountId` — l'établissement — comptait.
    const { credits, community } = await terminer(
      {
        id: 'bk1',
        accountId: ETABLISSEMENT,
        status: BookingStatus.REQUESTED,
        totalAmount: null,
        mission: null,
        service: { accountId: INTERVENANT },
      },
      { [INTERVENANT]: PARRAIN, [ETABLISSEMENT]: PARRAIN, [PARRAIN]: null },
      INTERVENANT, // le sollicité, ici le propriétaire de la fiche
    );

    expect(beneficiaires(credits)).toEqual(new Set([PARRAIN, INTERVENANT, ETABLISSEMENT]));
    // Le parrain est crédité une fois PAR FILLEUL actif, pas une fois par prestation.
    expect(credits.mock.calls.filter((c) => c[0] === PARRAIN)).toHaveLength(2);

    // Et le compteur affiché au parrain dit exactement la même chose.
    const vue = await community.parrainage(PARRAIN);
    expect(vue.actifs).toBe(2);
  });

  it("renfort : l'ÉTABLISSEMENT porteur de la mission est récompensé lui aussi", async () => {
    const { credits, community } = await terminer(
      {
        id: 'bk1',
        accountId: INTERVENANT,
        status: BookingStatus.REQUESTED,
        totalAmount: null,
        mission: { accountId: ETABLISSEMENT },
        service: null,
      },
      { [INTERVENANT]: PARRAIN, [ETABLISSEMENT]: PARRAIN, [PARRAIN]: null },
      ETABLISSEMENT, // le sollicité, ici l'établissement qui a publié la mission
    );

    expect(beneficiaires(credits)).toEqual(new Set([PARRAIN, INTERVENANT, ETABLISSEMENT]));
    const vue = await community.parrainage(PARRAIN);
    expect(vue.actifs).toBe(2);
  });

  it('une structure qui réserve sa propre fiche n’est créditée qu’une fois', async () => {
    const { credits, community } = await terminer(
      {
        id: 'bk1',
        accountId: INTERVENANT,
        status: BookingStatus.REQUESTED,
        totalAmount: null,
        mission: null,
        service: { accountId: INTERVENANT },
      },
      { [INTERVENANT]: PARRAIN, [PARRAIN]: null },
      INTERVENANT,
    );

    expect(credits.mock.calls.filter((c) => c[0] === INTERVENANT)).toHaveLength(1);
    expect(credits.mock.calls.filter((c) => c[0] === PARRAIN)).toHaveLength(1);
    expect((await community.parrainage(PARRAIN)).actifs).toBe(1);
  });

  /**
   * LE TEST DE COHÉRENCE PROPREMENT DIT : le filleul n'est PAS celui qui a
   * réservé. C'est le cas qui sépare les deux critères possibles — compter sur
   * `booking.accountId` seul ne voit ni l'intervenant d'un atelier ni
   * l'établissement d'un renfort. Le parrain lirait alors « 0 filleul avec une
   * première mission terminée » alors que 40 points viennent de lui être
   * versés pour ce filleul-là.
   */
  it('le compteur annonce exactement les comptes crédités, des deux côtés', async () => {
    // Atelier : le filleul est l'INTERVENANT ; l'établissement qui a réservé
    // n'est parrainé par personne.
    const atelier = await terminer(
      {
        id: 'bk1',
        accountId: ETABLISSEMENT,
        status: BookingStatus.REQUESTED,
        totalAmount: null,
        mission: null,
        service: { accountId: INTERVENANT },
      },
      { [INTERVENANT]: PARRAIN, [ETABLISSEMENT]: null, [PARRAIN]: null },
      INTERVENANT,
    );
    expect(beneficiaires(atelier.credits)).toEqual(new Set([PARRAIN, INTERVENANT]));
    expect((await atelier.community.parrainage(PARRAIN)).actifs).toBe(1);

    // Renfort : le filleul est l'ÉTABLISSEMENT porteur de la mission ;
    // l'intervenant qui a candidaté n'est parrainé par personne.
    const renfort = await terminer(
      {
        id: 'bk1',
        accountId: INTERVENANT,
        status: BookingStatus.REQUESTED,
        totalAmount: null,
        mission: { accountId: ETABLISSEMENT },
        service: null,
      },
      { [ETABLISSEMENT]: PARRAIN, [INTERVENANT]: null, [PARRAIN]: null },
      ETABLISSEMENT,
    );
    expect(beneficiaires(renfort.credits)).toEqual(new Set([PARRAIN, ETABLISSEMENT]));
    expect((await renfort.community.parrainage(PARRAIN)).actifs).toBe(1);
  });

  // Réservation ORPHELINE (mission ou atelier supprimé) : pas de test de bout
  // en bout possible, et c'est rassurant — sans offre, `assertOffreur` refuse
  // déjà toute transition, donc aucune réservation orpheline ne peut être
  // terminée. Le repli sur le demandeur dans `recompenserParties` ne couvre
  // que la course : une suppression qui tombe entre la clôture et le calcul
  // des points, différé parce qu'il n'est jamais bloquant.
});
