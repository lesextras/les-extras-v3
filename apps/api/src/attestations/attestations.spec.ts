import { BadRequestException } from '@nestjs/common';
import { StatutAttestation } from '@prisma/client';
import { AttestationsService } from './attestations.service';
import * as pdf from '../documents/attestation-suivi.pdf';

/**
 * L'ATTESTATION DE SUIVI — ce que la loi impose, et que le code doit tenir.
 *
 * ⚠⚠ CES TESTS NE PORTENT PAS SUR DU CONFORT : deux d'entre eux verrouillent
 * des règles du code de la consommation. Une vente à un particulier qui
 * délivrerait avant la fin du délai de rétractation, ou qui s'ouvrirait sans
 * décision, exposerait une association par ailleurs certifiée Qualiopi.
 */

function prismaMock(options: {
  formation?: Record<string, unknown> | null;
  demande?: Record<string, unknown> | null;
  dejaPayee?: Record<string, unknown> | null;
} = {}) {
  const formation =
    options.formation === undefined
      ? {
          id: 'f1',
          title: 'Les premières minutes d’une crise',
          slug: 'crise',
          status: 'PUBLISHED',
          freeOnline: true,
          attestationPrixCents: 2000,
        }
      : options.formation;

  return {
    formation: { findFirst: jest.fn().mockResolvedValue(formation) },
    demandeAttestation: {
      findFirst: jest.fn().mockResolvedValue(options.dejaPayee ?? null),
      findUnique: jest.fn().mockResolvedValue(options.demande ?? null),
      create: jest.fn().mockResolvedValue({ id: 'd1' }),
      update: jest.fn(async ({ data }: { data: Record<string, unknown> }) => ({
        id: 'd1',
        ...data,
      })),
      findMany: jest.fn().mockResolvedValue([]),
    },
  };
}

const mailMock = () => ({
  sendAttestationCommandee: jest.fn().mockResolvedValue(undefined),
  sendAttestationDelivree: jest.fn().mockResolvedValue(undefined),
});

function service(prisma: ReturnType<typeof prismaMock>, mail = mailMock()) {
  const config = { get: jest.fn(() => 'sk_test_x') };
  return {
    svc: new AttestationsService(prisma as never, config as never, mail as never),
    mail,
  };
}

const COMMANDE = {
  formation: 'crise',
  email: 'Camille@Exemple.fr',
  prenom: 'Camille',
  nom: 'Durand',
};

describe('Attestation : l’interrupteur de la vente', () => {
  /**
   * ⚠ NE PAS « RÉPARER » CE TEST en donnant un prix par défaut. Vendre à un
   * particulier oblige à nommer dans les CGV un médiateur de la consommation
   * référencé par la CECMC (art. L612-1 c. conso) ; aucun ne l'est à ce jour.
   * Un prix nul est la porte fermée, et c'est le défaut voulu.
   */
  it('refuse la commande tant qu’aucun prix n’est posé sur la fiche', async () => {
    const prisma = prismaMock({
      formation: {
        id: 'f1',
        title: 'Parcours',
        slug: 'p',
        status: 'PUBLISHED',
        freeOnline: true,
        attestationPrixCents: null,
      },
    });
    const { svc } = service(prisma);

    await expect(svc.commander(COMMANDE as never)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.demandeAttestation.create).not.toHaveBeenCalled();
  });

  it('refuse sur une fiche qui n’est pas publiée', async () => {
    const prisma = prismaMock({ formation: null });
    const { svc } = service(prisma);

    await expect(svc.commander(COMMANDE as never)).rejects.toThrow();
  });

  /** Payer deux fois le même document n'a aucun sens : on rend l'état. */
  it('ne refacture pas une commande déjà payée', async () => {
    const prisma = prismaMock({
      dejaPayee: { id: 'd0', statut: StatutAttestation.PAYEE },
    });
    const { svc } = service(prisma);

    const r = (await svc.commander(COMMANDE as never)) as { deja?: boolean };
    expect(r.deja).toBe(true);
    expect(prisma.demandeAttestation.create).not.toHaveBeenCalled();
  });
});

describe('Attestation : le droit de rétractation', () => {
  function demandePayee(renonciation: boolean) {
    return {
      id: 'd1',
      email: 'camille@exemple.fr',
      prenom: 'Camille',
      nom: 'Durand',
      montantCents: 2000,
      statut: StatutAttestation.EN_ATTENTE_PAIEMENT,
      renonciationRetractation: renonciation,
      formation: { title: 'Crise' },
    };
  }

  /**
   * ⚠⚠ QUATORZE JOURS, ET ILS NE SE NÉGOCIENT PAS. Le droit ne s'éteint que
   * sur demande EXPRESSE d'exécution immédiate (art. L221-25 et L221-28, 1°
   * c. conso). Sans la case, la date de délivrance est repoussée d'autant.
   */
  it('repousse la délivrance de 14 jours sans renonciation', async () => {
    const prisma = prismaMock({ demande: demandePayee(false) });
    const { svc } = service(prisma);

    await svc.confirmerPaiement('cs_1');

    const data = prisma.demandeAttestation.update.mock.calls[0][0].data;
    expect(data.statut).toBe(StatutAttestation.PAYEE);
    const jours = Math.round(
      ((data.livrableLe as Date).getTime() - Date.now()) / 86_400_000,
    );
    expect(jours).toBe(14);
  });

  it('délivre tout de suite quand l’acheteur l’a expressément demandé', async () => {
    const prisma = prismaMock({ demande: demandePayee(true) });
    const { svc } = service(prisma);

    await svc.confirmerPaiement('cs_1');

    const data = prisma.demandeAttestation.update.mock.calls[0][0].data;
    const jours =
      ((data.livrableLe as Date).getTime() - Date.now()) / 86_400_000;
    expect(jours).toBeLessThan(1);
  });

  it('refuse de délivrer tant que le délai court', async () => {
    const dans10jours = new Date(Date.now() + 10 * 86_400_000);
    const prisma = prismaMock({
      demande: {
        id: 'd1',
        statut: StatutAttestation.PAYEE,
        livrableLe: dans10jours,
        email: 'c@e.fr',
        prenom: 'C',
        nom: 'D',
        formation: { title: 'Crise', slug: 'crise' },
      },
    });
    const { svc, mail } = service(prisma);

    await expect(svc.delivrer('d1')).rejects.toBeInstanceOf(BadRequestException);
    expect(mail.sendAttestationDelivree).not.toHaveBeenCalled();
  });

  it('délivre une fois le délai passé', async () => {
    const hier = new Date(Date.now() - 86_400_000);
    const prisma = prismaMock({
      demande: {
        id: 'd1',
        statut: StatutAttestation.PAYEE,
        livrableLe: hier,
        email: 'c@e.fr',
        prenom: 'Camille',
        nom: 'Durand',
        formation: { title: 'Crise', slug: 'crise' },
      },
    });
    const { svc, mail } = service(prisma);

    await expect(svc.delivrer('d1')).resolves.toEqual({
      delivree: true,
      document: true,
    });
    expect(mail.sendAttestationDelivree).toHaveBeenCalled();
  });
});

describe('Attestation : le document remis', () => {
  function demandeADelivrer() {
    return {
      id: 'cmdemande0001abcd',
      statut: StatutAttestation.PAYEE,
      livrableLe: new Date(Date.now() - 86_400_000),
      payeeLe: new Date(Date.now() - 15 * 86_400_000),
      delivreeLe: null,
      email: 'camille@exemple.fr',
      prenom: 'Camille',
      nom: 'Durand',
      formation: {
        id: 'f1',
        title: 'Les premières minutes d’une crise',
        slug: 'crise',
        summary: 'Réduire ce que l’adulte ajoute pendant la crise.',
        objectives: 'Repérer les trois secondes qui précèdent.',
        durationHours: null,
        durationMinutes: 45,
        ownerAccount: { name: 'ADéPA', city: 'Melun' },
      },
    };
  }

  /**
   * ⚠ LE PDF PART EN PIÈCE JOINTE, PAS DERRIÈRE UN LIEN. L'acheteur n'a pas de
   * compte : un lien demanderait un jeton, une validité et une page publique de
   * plus pour un document qu'on peut joindre — et une pièce jointe s'archive
   * dans sa boîte, là où un lien expire.
   */
  it('joint le document au message de délivrance', async () => {
    const prisma = prismaMock({ demande: demandeADelivrer() });
    const { svc, mail } = service(prisma);

    await svc.delivrer('cmdemande0001abcd');

    const piece = mail.sendAttestationDelivree.mock.calls[0][1];
    expect(piece.type).toBe('application/pdf');
    expect(piece.nom).toMatch(/^attestation-de-suivi-.*\.pdf$/);
    expect(piece.contenu.subarray(0, 4).toString()).toBe('%PDF');
    expect(piece.contenu.length).toBeGreaterThan(2000);
  });

  /**
   * ⚠ REGARDER N'EST PAS DÉLIVRER. Sans cette séparation, la seule façon de
   * vérifier l'orthographe d'un nom sur le document serait de l'envoyer à la
   * personne — c'est-à-dire trop tard.
   */
  it('l’aperçu ne change aucun statut et n’envoie rien', async () => {
    const prisma = prismaMock({ demande: demandeADelivrer() });
    const { svc, mail } = service(prisma);

    const piece = await svc.apercu('cmdemande0001abcd');

    expect(piece.contenu.subarray(0, 4).toString()).toBe('%PDF');
    expect(prisma.demandeAttestation.update).not.toHaveBeenCalled();
    expect(mail.sendAttestationDelivree).not.toHaveBeenCalled();
  });

  /**
   * ⚠ UN PDF QUI NE SE FABRIQUE PAS NE DOIT PAS BLOQUER UNE COMMANDE PAYÉE.
   * L'inverse — une commande qui reste indéfiniment « à délivrer » parce qu'une
   * police manque — se découvre par une réclamation, des semaines plus tard.
   */
  it('délivre quand même si le document ne se fabrique pas', async () => {
    const prisma = prismaMock({ demande: demandeADelivrer() });
    const { svc, mail } = service(prisma);
    const panne = jest
      .spyOn(pdf, 'attestationSuiviPdf')
      .mockRejectedValue(new Error('police introuvable'));

    try {
      const r = (await svc.delivrer('cmdemande0001abcd')) as {
        delivree: boolean;
        document: boolean;
      };
      expect(r).toEqual({ delivree: true, document: false });
      // Le message part quand même, sans pièce jointe — et il le dit.
      expect(mail.sendAttestationDelivree).toHaveBeenCalled();
      expect(mail.sendAttestationDelivree.mock.calls[0][1]).toBeUndefined();
    } finally {
      panne.mockRestore();
    }
  });

  /**
   * ⚠ « CERTIFICAT » EST INTERDIT DANS LE DOCUMENT AUSSI. Même règle, même
   * raison que pour le service : un certificat désigne une certification
   * enregistrée au RNCP ou au Répertoire spécifique ; Qualiopi certifie un
   * PROCESSUS. « certification professionnelle » reste autorisé — c'est
   * précisément la mention qui doit figurer sur la pièce.
   */
  it('n’écrit jamais « certificat » sur la pièce', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const source: string = require('node:fs').readFileSync(
      require('node:path').join(__dirname, '..', 'documents', 'attestation-suivi.pdf.ts'),
      'utf8',
    );
    const sansCommentaires = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    expect(sansCommentaires.match(/certificat(?!ion)/gi) ?? []).toEqual([]);
    expect(/attestation de suivi/i.test(sansCommentaires)).toBe(true);
    // Et ce que la pièce n'ouvre pas est écrit dessus, pas seulement dans les CGV.
    expect(/ni un diplôme, ni une certification professionnelle/i.test(source)).toBe(
      true,
    );
  });
});

describe('Attestation : l’idempotence du webhook', () => {
  it('ne traite pas deux fois la même session', async () => {
    const prisma = prismaMock({
      demande: {
        id: 'd1',
        statut: StatutAttestation.PAYEE,
        renonciationRetractation: false,
        email: 'c@e.fr',
        prenom: 'C',
        nom: 'D',
        montantCents: 2000,
        formation: { title: 'Crise' },
      },
    });
    const { svc, mail } = service(prisma);

    await expect(svc.confirmerPaiement('cs_1')).resolves.toEqual({
      ignored: 'deja_traite',
    });
    expect(prisma.demandeAttestation.update).not.toHaveBeenCalled();
    // ⚠ Surtout : l'accusé de réception ne repart pas. Un doublon dans une
    // boîte, sur un message qui annonce un débit, se lit comme un second débit.
    expect(mail.sendAttestationCommandee).not.toHaveBeenCalled();
  });

  it('ignore une session inconnue sans lever', async () => {
    const prisma = prismaMock({ demande: null });
    const { svc } = service(prisma);

    await expect(svc.confirmerPaiement('cs_inconnue')).resolves.toEqual({
      ignored: 'inconnue',
    });
  });
});

describe('Attestation : ce qu’on n’écrit jamais', () => {
  /**
   * ⚠ « CERTIFICAT » EST INTERDIT, ICI COMME PARTOUT. Un certificat désigne
   * une certification enregistrée au RNCP ou au Répertoire spécifique ;
   * Qualiopi certifie un PROCESSUS et n'autorise à délivrer aucun titre.
   * Vendre 20 € un document appelé certificat serait une pratique commerciale
   * trompeuse (art. L121-1 c. conso).
   */
  it('n’appelle jamais « certificat » ce qui est vendu', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const source: string = require('node:fs').readFileSync(
      require('node:path').join(__dirname, 'attestations.service.ts'),
      'utf8',
    );
    /**
     * On retire les commentaires — c'est là qu'on EXPLIQUE l'interdit, et
     * l'explication doit pouvoir nommer ce qu'elle interdit. Reste le code,
     * donc les chaînes que l'acheteur lit.
     *
     * ⚠ `certification` reste autorisé : « ni diplôme, ni certification
     * professionnelle » est précisément la mention qui doit figurer.
     */
    const sansCommentaires = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    const fautifs = sansCommentaires.match(/certificat(?!ion)/gi) ?? [];
    expect(fautifs).toEqual([]);
    // Et ce qui est vendu porte bien son nom.
    expect(/attestation de suivi/i.test(sansCommentaires)).toBe(true);
  });
});
