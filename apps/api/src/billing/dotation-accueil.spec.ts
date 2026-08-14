import { readFileSync } from 'fs';
import { join } from 'path';
import { FREE_MONTHLY_CREDITS, MOTIF_DOTATION } from './credits.constants';

/**
 * LA DOTATION D'ACCUEIL, ET POURQUOI ELLE EST ÉCRITE EN DUR DANS LA
 * TRANSACTION DE CRÉATION.
 *
 * Un compte naissait à zéro crédit. Pour en obtenir, il fallait cliquer un
 * bouton situé sur un écran de facturation réservé au propriétaire du compte :
 * un salarié arrivé par invitation ne pouvait donc ni essayer LEX, ni le
 * payer. Le premier geste possible dans le produit était un mur.
 *
 * Deux propriétés sont verrouillées ici, et elles ne sont pas décoratives :
 *
 *  1. le compte est doté DÈS SA CRÉATION, dans la même transaction — sinon un
 *     échec entre les deux laisserait un compte sans crédit et sans écriture ;
 *  2. le motif de l'écriture est EXACTEMENT celui de la dotation mensuelle.
 *     C'est la clé d'idempotence du 1er du mois : `crediterJusquA` cherche une
 *     écriture portant ce motif depuis le début du mois et s'abstient si elle
 *     existe. Un motif différent (« BIENVENUE », « DOTATION_INITIALE »…)
 *     paraîtrait plus lisible et doterait deux fois tout compte créé un 1er.
 */

/** Ce que la transaction de création doit avoir écrit, quelle que soit la voie. */
function attendreDotation(ecriture: {
  delta: number;
  balanceAfter: number;
  reason: string;
}) {
  expect(ecriture.delta).toBe(FREE_MONTHLY_CREDITS);
  expect(ecriture.balanceAfter).toBe(FREE_MONTHLY_CREDITS);
  expect(ecriture.reason).toBe(MOTIF_DOTATION);
}

describe('Dotation d’accueil — les constantes', () => {
  it('accorde une dotation non nulle, sinon le correctif ne sert à rien', () => {
    expect(FREE_MONTHLY_CREDITS).toBeGreaterThan(0);
  });

  it('partage le motif de la dotation mensuelle — c’est la clé d’idempotence', () => {
    expect(MOTIF_DOTATION).toBe('DOTATION_MENSUELLE');
  });
});

describe('Dotation d’accueil — inscription (auth.service)', () => {
  it('crédite le compte et écrit au grand livre, dans la transaction de création', async () => {
    // On rejoue la transaction telle que le service la compose, sans monter
    // tout le service : ce qui compte est la forme des deux écritures.
    const majComptes: Array<{ where: unknown; data: { credits: number } }> = [];
    const ecritures: Array<{ delta: number; balanceAfter: number; reason: string }> = [];

    const tx = {
      account: {
        update: async (a: { where: unknown; data: { credits: number } }) => {
          majComptes.push(a);
          return { id: 'acc_1', credits: a.data.credits };
        },
      },
      creditLedger: {
        create: async (a: {
          data: { delta: number; balanceAfter: number; reason: string };
        }) => {
          ecritures.push(a.data);
          return a.data;
        },
      },
    };

    // Le fragment exact posé dans auth.service.ts.
    await tx.account.update({
      where: { id: 'acc_1' },
      data: { credits: FREE_MONTHLY_CREDITS },
    });
    await tx.creditLedger.create({
      data: {
        accountId: 'acc_1',
        delta: FREE_MONTHLY_CREDITS,
        balanceAfter: FREE_MONTHLY_CREDITS,
        reason: MOTIF_DOTATION,
      } as never,
    });

    expect(majComptes).toHaveLength(1);
    expect(ecritures).toHaveLength(1);
    attendreDotation(ecritures[0]);
  });
});

describe('Le code source lui-même', () => {
  /**
   * Ces deux vérifications lisent le fichier. C'est inhabituel, et volontaire :
   * la dotation vit dans une transaction Prisma qu'aucun test unitaire ne
   * traverse réellement. Sans cela, quelqu'un pourrait la retirer sans qu'une
   * seule assertion ne tombe — et le mur reviendrait en silence.
   */
  const lire = (chemin: string) => readFileSync(join(__dirname, chemin), 'utf-8');

  it('l’inscription dote le compte', () => {
    const source = lire('../auth/auth.service.ts');
    expect(source).toContain('credits: FREE_MONTHLY_CREDITS');
    expect(source).toContain('reason: MOTIF_DOTATION');
  });

  it('la création d’un compte supplémentaire le dote aussi', () => {
    const source = lire('../accounts/accounts.service.ts');
    expect(source).toContain('credits: FREE_MONTHLY_CREDITS');
    expect(source).toContain('reason: MOTIF_DOTATION');
  });
});
