import { AdminService } from './admin.service';

/**
 * ARCHIVER PLUTÔT QUE DÉTRUIRE.
 *
 * ⚠⚠ CE QUI A RENDU CETTE COLONNE NÉCESSAIRE. Vingt et un comptes de test
 * créés pendant les audits — « MECS Audit Test 2 », « [VERIF] MECS Finale », et
 * trois portant le mot « démo » — s'affichaient dans la recherche
 * d'établissement de l'inscription, c'est-à-dire sur l'écran même qui sert à
 * éviter les doublons. La seule sortie était `DELETE /admin/accounts/:id`, qui
 * supprime en cascade jusqu'aux FACTURES — or une facture émise ne se supprime
 * pas (art. 242 nonies A, ann. II du CGI).
 *
 * ⚠ ARCHIVER N'EST PAS SUSPENDRE : la colonne retire de la VUE, elle ne ferme
 * aucun accès. Quelqu'un qui a le mot de passe d'un compte archivé se connecte
 * normalement. Les deux ne doivent pas être confondus — on sortirait une équipe
 * entière d'un établissement qu'on voulait seulement retirer d'un annuaire.
 */
function harnais(compte: { id: string; name: string } | null = { id: 'a1', name: 'MECS Audit Test 2' }) {
  const prisma = {
    account: {
      findUnique: jest.fn().mockResolvedValue(compte),
      update: jest.fn(async ({ data }: { data: { archivedAt: Date | null } }) => ({
        id: 'a1',
        name: 'MECS Audit Test 2',
        archivedAt: data.archivedAt,
      })),
    },
  };
  const service = new AdminService(
    prisma as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { service, prisma };
}

describe('Archiver un compte', () => {
  it('pose une DATE, pas un booléen', async () => {
    const { service, prisma } = harnais();

    const maj = await service.archiverCompte('a1', true);

    expect(prisma.account.update).toHaveBeenCalledTimes(1);
    // ⚠ La date répond à la première question qu'on se pose quand quelqu'un
    // signale qu'un compte ne se trouve plus : depuis quand.
    expect(maj.archivedAt).toBeInstanceOf(Date);
  });

  it('se défait : rétablir remet la colonne à null', async () => {
    const { service } = harnais();

    const maj = await service.archiverCompte('a1', false);

    expect(maj.archivedAt).toBeNull();
  });

  /**
   * ⚠ NE PAS « RÉPARER » CE TEST en supprimant le compte au passage. Archiver
   * ne touche à AUCUNE autre donnée : c'est toute la différence avec le bouton
   * rouge voisin, et c'est ce qui rend l'opération réversible.
   */
  it('ne touche à rien d’autre que la colonne', async () => {
    const { service, prisma } = harnais();

    await service.archiverCompte('a1', true);

    const champs = Object.keys(prisma.account.update.mock.calls[0][0].data);
    expect(champs).toEqual(['archivedAt']);
  });

  it('refuse un compte introuvable plutôt que d’archiver dans le vide', async () => {
    const { service } = harnais(null);

    await expect(service.archiverCompte('inexistant', true)).rejects.toThrow();
  });
});
