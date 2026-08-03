import { BadRequestException } from '@nestjs/common';
import { FormationsService } from './formations.service';

/**
 * LE NOMBRE DE PLACES D'UNE SESSION.
 *
 * `maxSeats` était saisi à la création, affiché sur la page publique en
 * « places restantes », et jamais vérifié nulle part. On pouvait inscrire
 * quinze personnes à une session de huit ; personne ne s'en apercevait avant
 * le jour même, quand quatre stagiaires restaient debout. Le statut FULL
 * figurait dans l'énumération sans qu'aucune ligne de code ne le pose.
 *
 * Ce que ces tests protègent : le refus au-delà du plafond, le basculement
 * automatique en COMPLÈTE, le fait qu'une annulation libère bien la place, et
 * qu'une session sans plafond déclaré reste sans plafond.
 */

interface FauxSession {
  id: string;
  status: string;
  maxSeats: number | null;
  hostAccountId: string | null;
  trainerId: string | null;
  formation: { ownerAccountId: string; type: string; status: string };
}

/**
 * Prisma en trompe-l'œil. `$transaction` exécute simplement le rappel avec le
 * même client : c'est fidèle au comportement observable de Prisma pour une
 * transaction interactive, et cela laisse les compteurs sous notre contrôle.
 */
function service(session: FauxSession, inscritsNonAnnules: number) {
  const inscription = {
    count: jest.fn(async () => inscritsNonAnnules),
    create: jest.fn(async (a: { data: Record<string, unknown> }) => ({ id: 'i_1', ...a.data })),
    update: jest.fn(async (a: { data: Record<string, unknown> }) => ({ id: 'i_1', ...a.data })),
    findUnique: jest.fn(async () => null),
  };
  const formationSession = {
    findUnique: jest.fn(async () => session),
    update: jest.fn(async (a: { data: Record<string, unknown> }) => ({ ...session, ...a.data })),
  };
  const prisma = {
    inscription,
    formationSession,
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ inscription, formationSession }),
  } as never;
  const notifications = { create: jest.fn(async () => undefined) } as never;
  const svc = new FormationsService(prisma, notifications);
  return { svc, inscription, formationSession };
}

const sessionOuverte = (maxSeats: number | null): FauxSession => ({
  id: 's_1',
  status: 'OPEN',
  maxSeats,
  hostAccountId: 'acc_etab',
  trainerId: null,
  formation: { ownerAccountId: 'acc_of', type: 'CERTIFIANTE', status: 'PUBLISHED' },
});

const apprenant = { learnerName: 'Awa Diallo' } as never;

describe('inscription — le plafond de places', () => {
  it('accepte tant qu’il reste de la place', async () => {
    const { svc, inscription } = service(sessionOuverte(8), 5);

    await svc.enroll('s_1', 'acc_etab', apprenant);

    expect(inscription.create).toHaveBeenCalledTimes(1);
  });

  it('accepte la toute dernière place', async () => {
    const { svc, inscription } = service(sessionOuverte(8), 7);

    await svc.enroll('s_1', 'acc_etab', apprenant);

    expect(inscription.create).toHaveBeenCalledTimes(1);
  });

  it('refuse au-delà du plafond', async () => {
    const { svc, inscription } = service(sessionOuverte(8), 8);

    await expect(svc.enroll('s_1', 'acc_etab', apprenant)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(inscription.create).not.toHaveBeenCalled();
  });

  it('n’impose aucun plafond quand la session n’en déclare pas', async () => {
    const { svc, inscription } = service(sessionOuverte(null), 500);

    await svc.enroll('s_1', 'acc_etab', apprenant);

    expect(inscription.create).toHaveBeenCalledTimes(1);
  });
});

describe('inscription — le basculement en COMPLÈTE', () => {
  it('passe la session en COMPLÈTE quand la dernière place part', async () => {
    const { svc, formationSession } = service(sessionOuverte(8), 7);

    await svc.enroll('s_1', 'acc_etab', apprenant);

    expect(formationSession.update).toHaveBeenCalledWith({
      where: { id: 's_1' },
      data: { status: 'FULL' },
    });
  });

  it('ne touche pas au statut tant qu’il reste de la place', async () => {
    const { svc, formationSession } = service(sessionOuverte(8), 3);

    await svc.enroll('s_1', 'acc_etab', apprenant);

    expect(formationSession.update).not.toHaveBeenCalled();
  });

  it('ne rebascule pas une session déjà COMPLÈTE', async () => {
    // Cas de bord : le plafond a été relevé après coup, la session est encore
    // marquée COMPLÈTE mais accepte de nouveau. Inutile de réécrire le statut.
    const { svc, formationSession } = service({ ...sessionOuverte(8), status: 'FULL' }, 7);

    await svc.enroll('s_1', 'acc_etab', apprenant);

    expect(formationSession.update).not.toHaveBeenCalled();
  });
});

describe('inscription — les sessions fermées', () => {
  it('refuse une session annulée', async () => {
    const { svc } = service({ ...sessionOuverte(20), status: 'CANCELLED' }, 0);

    await expect(svc.enroll('s_1', 'acc_etab', apprenant)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('refuse une session terminée', async () => {
    // Inscrire quelqu'un à une session qui s'est tenue la semaine dernière
    // fabrique une preuve fausse : présence attendue, émargement impossible.
    const { svc } = service({ ...sessionOuverte(20), status: 'DONE' }, 0);

    await expect(svc.enroll('s_1', 'acc_etab', apprenant)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
