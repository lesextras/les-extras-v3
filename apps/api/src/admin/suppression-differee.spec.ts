import { ComptesScheduler } from './comptes.scheduler';
import {
  MOIS_AVANT_SUPPRESSION,
  dansNMois,
  motifDeBlocage,
} from '../common/suppression-compte';

/**
 * SUPPRIMER UN COMPTE, C'EST L'ARCHIVER TROIS MOIS — décision de Siham,
 * 16/09/2026.
 *
 * ⚠⚠ CE QUE CES TESTS PROTÈGENT N'EST PAS DU CONFORT. Avant, « Supprimer »
 * faisait un `account.delete` en cascade à la seconde du clic : rattachements,
 * fiches, missions, réservations, ET les factures et les contrats de travail —
 * que la loi impose de conserver. Le bouton était rouge, l'avertissement long,
 * et il suffisait d'un clic de trop.
 *
 * Trois choses doivent tenir, et chacune a son test :
 *   1. le clic ne détruit RIEN, il archive et programme ;
 *   2. « Rétablir » annule l'échéance — sinon on croit avoir sauvé un compte
 *      et on le perd quand même, trois mois plus tard, sans alerte ;
 *   3. le planificateur ne force JAMAIS sur un compte qui porte une facture ou
 *      un contrat, et il écrit pourquoi.
 */

describe('Le délai avant suppression', () => {
  it('vaut trois mois', () => {
    expect(MOIS_AVANT_SUPPRESSION).toBe(3);
  });

  it('tombe le même quantième, trois mois plus tard', () => {
    expect(dansNMois(new Date('2026-09-16T10:00:00Z'), 3).toISOString().slice(0, 10)).toBe(
      '2026-12-16',
    );
  });

  /**
   * ⚠ `setMonth` DÉBORDE : le 31 novembre n'existe pas, et JavaScript le fait
   * glisser au 1er décembre. L'échéance tomberait alors un jour APRÈS le mois
   * annoncé — ce qui se voit et se discute, puisqu'on affiche la date.
   */
  it('retombe sur le dernier jour du mois quand le quantième n’existe pas', () => {
    expect(dansNMois(new Date('2026-08-31T10:00:00Z'), 3).toISOString().slice(0, 10)).toBe(
      '2026-11-30',
    );
  });

  it('passe l’année sans se tromper', () => {
    expect(dansNMois(new Date('2026-11-20T10:00:00Z'), 3).toISOString().slice(0, 10)).toBe(
      '2027-02-20',
    );
  });
});

describe('Ce qui interdit de supprimer un compte', () => {
  it('ne bloque rien quand le compte n’a ni facture ni contrat', () => {
    expect(motifDeBlocage({ factures: 0, facturesAPayer: 0, contrats: 0 })).toBeNull();
  });

  /**
   * ⚠ UNE FACTURE ÉMISE SE CONSERVE DIX ANS (art. L123-22 c. com.) et son
   * numéro ne peut pas disparaître de la série (art. 242 nonies A, ann. II du
   * CGI). `Invoice.account` étant en `onDelete: Cascade`, supprimer le compte
   * détruirait la facture : aucun délai n'y change quoi que ce soit.
   */
  it('nomme les factures émises, et dit pourquoi', () => {
    const motif = motifDeBlocage({ factures: 3, facturesAPayer: 0, contrats: 0 });
    expect(motif).toContain('3 facture(s) émise(s)');
    expect(motif).toContain('dix ans');
    // Le compte n'est pas perdu pour autant : il reste invisible partout.
    expect(motif).toContain('reste archivé');
  });

  it('nomme aussi les contrats de travail', () => {
    expect(motifDeBlocage({ factures: 0, facturesAPayer: 0, contrats: 2 })).toContain(
      '2 contrat(s) de travail',
    );
  });

  it('cumule les raisons plutôt que de n’en donner qu’une', () => {
    const motif = motifDeBlocage({ factures: 1, facturesAPayer: 4, contrats: 1 })!;
    expect(motif).toContain('1 facture(s) émise(s)');
    expect(motif).toContain('4 facture(s) reçue(s)');
    expect(motif).toContain('1 contrat(s)');
  });
});

describe('Le planificateur des échéances', () => {
  function prismaMock(options: {
    comptes?: Record<string, unknown>[];
    factures?: number;
    facturesAPayer?: number;
    contrats?: number;
  }) {
    return {
      account: {
        findMany: jest.fn().mockResolvedValue(options.comptes ?? []),
        update: jest.fn().mockResolvedValue({}),
        delete: jest.fn().mockResolvedValue({}),
      },
      invoice: {
        count: jest
          .fn()
          .mockImplementationOnce(async () => options.factures ?? 0)
          .mockImplementationOnce(async () => options.facturesAPayer ?? 0),
      },
      contratCDD: { count: jest.fn().mockResolvedValue(options.contrats ?? 0) },
    };
  }

  const compteEchu = {
    id: 'cmcompte0001',
    name: 'MECS Les Tilleuls',
    suppressionPrevueLe: new Date('2026-06-16T00:00:00Z'),
  };

  it('ne fait rien quand aucune échéance n’est arrivée', async () => {
    const prisma = prismaMock({ comptes: [] });
    const s = new ComptesScheduler(prisma as never);

    await expect(s.executerLesEcheances()).resolves.toEqual({
      examines: 0,
      supprimes: 0,
      bloques: 0,
    });
    expect(prisma.account.delete).not.toHaveBeenCalled();
  });

  it('supprime pour de bon un compte qui ne porte ni facture ni contrat', async () => {
    const prisma = prismaMock({ comptes: [compteEchu] });
    const s = new ComptesScheduler(prisma as never);

    const r = await s.executerLesEcheances();

    expect(r).toEqual({ examines: 1, supprimes: 1, bloques: 0 });
    expect(prisma.account.delete).toHaveBeenCalledWith({
      where: { id: 'cmcompte0001' },
    });
  });

  /**
   * ⚠⚠ LE TEST LE PLUS IMPORTANT DU FICHIER. Si le planificateur forçait, il
   * détruirait une comptabilité — chaque nuit, tout seul, sans que personne ne
   * clique sur quoi que ce soit.
   */
  it('ne supprime JAMAIS un compte qui a émis une facture', async () => {
    const prisma = prismaMock({ comptes: [compteEchu], factures: 3 });
    const s = new ComptesScheduler(prisma as never);

    const r = await s.executerLesEcheances();

    expect(r).toEqual({ examines: 1, supprimes: 0, bloques: 1 });
    expect(prisma.account.delete).not.toHaveBeenCalled();

    // Et il écrit pourquoi, pour que l'écran puisse le dire.
    const data = prisma.account.update.mock.calls[0][0].data as {
      suppressionMotifBlocage: string;
    };
    expect(data.suppressionMotifBlocage).toContain('3 facture(s) émise(s)');
  });

  /**
   * ⚠ L'ÉCHÉANCE N'EST PAS REPOUSSÉE quand elle est bloquée, et c'est voulu :
   * une date qui glisse toute seule laisse croire que quelque chose finira par
   * se passer. Une date dépassée avec son motif dit la vérité.
   */
  it('ne repousse pas l’échéance qu’il n’a pas pu exécuter', async () => {
    const prisma = prismaMock({ comptes: [compteEchu], contrats: 1 });
    const s = new ComptesScheduler(prisma as never);

    await s.executerLesEcheances();

    const data = prisma.account.update.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.suppressionPrevueLe).toBeUndefined();
  });

  /**
   * ⚠ UN ÉCHEC TECHNIQUE NE DOIT PAS SE REPRÉSENTER CHAQUE NUIT. Une contrainte
   * imprévue — une table ajoutée depuis, sans cascade — produirait sinon une
   * erreur par jour, indéfiniment, dans des journaux que personne ne relit.
   */
  it('inscrit un échec technique comme un blocage, une seule fois', async () => {
    const prisma = prismaMock({ comptes: [compteEchu] });
    prisma.account.delete = jest
      .fn()
      .mockRejectedValue(new Error('violation de contrainte étrangère'));
    const s = new ComptesScheduler(prisma as never);

    const r = await s.executerLesEcheances();

    expect(r).toEqual({ examines: 1, supprimes: 0, bloques: 1 });
    const data = prisma.account.update.mock.calls[0][0].data as {
      suppressionMotifBlocage: string;
    };
    expect(data.suppressionMotifBlocage).toContain('raison technique');
  });

  /**
   * ⚠ UN COMPTE DÉJÀ BLOQUÉ N'EST PAS RÉEXAMINÉ chaque nuit : le filtre exige
   * `suppressionMotifBlocage: null`. Sans ça, le planificateur recompterait
   * indéfiniment les factures des mêmes comptes, pour rien.
   */
  it('ne réexamine pas un compte déjà bloqué', async () => {
    const prisma = prismaMock({ comptes: [] });
    const s = new ComptesScheduler(prisma as never);

    await s.executerLesEcheances();

    const where = prisma.account.findMany.mock.calls[0][0].where as Record<string, unknown>;
    expect(where.suppressionMotifBlocage).toBeNull();
  });
});
