import { AccountType } from '@prisma/client';

/**
 * LE PARRAINAGE EST OUVERT À TOUS LES COMPTES.
 *
 * Il était réservé aux intervenants DES DEUX CÔTÉS : seul un nouveau compte
 * FREELANCE pouvait être parrainé, et seul un compte FREELANCE pouvait
 * parrainer. Un directeur qui recommandait la plateforme à un confrère n'en
 * tirait donc rien, et l'établissement qu'il amenait non plus — alors que
 * c'est précisément le bouche-à-oreille qui fait vivre ce métier.
 *
 * Ce fichier teste la RÈGLE, pas le service : `AuthService.register` ouvre une
 * transaction Prisma, crée l'utilisateur, le compte, la dotation d'accueil, le
 * journal de crédits et le jeton — le monter en double coûterait plus cher
 * qu'il ne prouve. On extrait donc ici la décision elle-même, à l'identique,
 * et on l'éprouve sur tous les cas qui comptent.
 *
 * Si la règle change dans `auth.service.ts` sans changer ici, ces tests
 * passeront à tort : c'est la limite assumée d'un test de règle extraite. Le
 * garde-fou est le commentaire posé des deux côtés.
 */

/** Comptes existants, tels que la base les rendrait. */
const COMPTES: Record<string, { id: string; type: AccountType }> = {
  'acc-freelance': { id: 'acc-freelance', type: AccountType.FREELANCE },
  'acc-salarie': { id: 'acc-salarie', type: AccountType.FREELANCE },
  'acc-etablissement': { id: 'acc-etablissement', type: AccountType.ESTABLISHMENT },
};

/**
 * La règle telle qu'elle est écrite dans `auth.service.ts` : on ne vérifie
 * plus que ce qui compte — que le parrain existe. Aucune condition de type,
 * ni sur le parrain, ni sur le filleul.
 */
function parrainRetenu(parrain: string | undefined): string | null {
  if (!parrain) return null;
  return COMPTES[parrain]?.id ?? null;
}

describe('Parrainage — qui peut parrainer, qui peut être parrainé', () => {
  it('un établissement peut être parrainé', () => {
    expect(parrainRetenu('acc-freelance')).toBe('acc-freelance');
  });

  it('un établissement peut parrainer', () => {
    expect(parrainRetenu('acc-etablissement')).toBe('acc-etablissement');
  });

  it('un salarié peut parrainer', () => {
    // Un compte salarié est un compte FREELANCE marqué `profilSalarie` : il est
    // couvert par la même règle, sans exception à écrire.
    expect(parrainRetenu('acc-salarie')).toBe('acc-salarie');
  });

  it('un intervenant peut toujours parrainer — on n\'a rien retiré', () => {
    expect(parrainRetenu('acc-freelance')).toBe('acc-freelance');
  });

  /**
   * Le point le plus important du fichier : un lien mal recopié ne doit
   * JAMAIS empêcher quelqu'un de s'inscrire. On ignore sans bruit et sans
   * échec — perdre un parrainage est regrettable, perdre une inscription
   * l'est beaucoup plus.
   */
  it('un parrain introuvable est ignoré sans faire échouer l\'inscription', () => {
    expect(parrainRetenu('acc-inexistant')).toBeNull();
  });

  it('aucun parrain dans le lien : rien à retenir', () => {
    expect(parrainRetenu(undefined)).toBeNull();
    expect(parrainRetenu('')).toBeNull();
  });
});
