import { AccountType, AccountRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService, decouperNom } from './auth.service';

/**
 * LE FORMULAIRE DE PAIEMENT OUVRE LE COMPTE (28/09/2026). Ce qui ne doit
 * jamais casser :
 *  1. une adresse qui a déjà un compte : on s'y rattache, rien n'est créé,
 *     aucun message ne part ;
 *  2. une adresse nouvelle : compte PARTICULIER (STRUCTURE si une structure a
 *     été saisie), titulaire, dotation d'accueil ;
 *  3. aucun mot de passe n'est choisi pour la personne : le lien reçu est un
 *     lien de réinitialisation, valable sept jours ;
 *  4. jamais d'exception : une ouverture ratée ne fait pas échouer l'achat.
 */
function monter(opts: { existant?: any; echec?: boolean } = {}) {
  const crees: Record<string, any> = {};
  const tx: any = {
    user: { create: jest.fn(({ data }: any) => (crees.user = { id: 'u1', ...data })) },
    account: { create: jest.fn(({ data }: any) => (crees.account = { id: 'a1', ...data })) },
    creditLedger: { create: jest.fn() },
    membership: { create: jest.fn(({ data }: any) => (crees.membership = data)) },
  };
  const prisma: any = {
    user: {
      findUnique: jest.fn(() => {
        if (opts.echec) throw new Error('base indisponible');
        return Promise.resolve(opts.existant ?? null);
      }),
    },
    account: { findUnique: jest.fn().mockResolvedValue(null) },
    $transaction: jest.fn((fn: any) => fn(tx)),
  };
  const jwt: any = { signAsync: jest.fn().mockResolvedValue('jeton-signe') };
  const config: any = { get: jest.fn() };
  const mail: any = {
    sendCompteOuvertParPaiement: jest.fn().mockResolvedValue(undefined),
    sendAlerteInscription: jest.fn().mockResolvedValue(undefined),
  };
  const service = new AuthService(prisma, jwt, config, mail);
  return { service, prisma, jwt, mail, tx, crees };
}

describe('Paiement sans compte : le compte s’ouvre au paiement', () => {
  it("adresse connue : on rattache au compte dont la personne est titulaire, sans rien créer", async () => {
    const { service, tx, mail } = monter({
      existant: { id: 'u9', status: 'VERIFIED', memberships: [{ accountId: 'compte-existant' }] },
    });
    const r = await service.ouvrirCompteAcheteur({ email: 'Nadia@Exemple.fr', atelier: 'Théâtre' });
    expect(r).toEqual({ accountId: 'compte-existant' });
    expect(tx.user.create).not.toHaveBeenCalled();
    expect(mail.sendCompteOuvertParPaiement).not.toHaveBeenCalled();
  });

  it('adresse nouvelle : compte PARTICULIER, titulaire, dotation d’accueil', async () => {
    const { service, crees, tx } = monter();
    const r = await service.ouvrirCompteAcheteur({ email: 'camille@exemple.fr', nom: 'Camille Durand', atelier: 'Théâtre' });
    expect(r).toEqual({ accountId: 'a1' });
    expect(crees.user).toMatchObject({ email: 'camille@exemple.fr', firstName: 'Camille', lastName: 'Durand', emailVerified: false });
    expect(crees.account).toMatchObject({ type: AccountType.PARTICULIER, name: 'Camille Durand', source: 'paiement-atelier' });
    expect(crees.account.credits).toBeGreaterThan(0);
    expect(crees.membership).toMatchObject({ role: AccountRole.OWNER });
    expect(tx.creditLedger.create).toHaveBeenCalled();
  });

  it('une structure saisie ouvre un compte STRUCTURE à son nom', async () => {
    const { service, crees } = monter();
    await service.ouvrirCompteAcheteur({ email: 'direction@mecs.fr', nom: 'Nadia B', organisation: 'MECS Les Tilleuls', atelier: 'Théâtre' });
    expect(crees.account).toMatchObject({ type: AccountType.ESTABLISHMENT, name: 'MECS Les Tilleuls', legalName: 'MECS Les Tilleuls' });
  });

  it("aucun mot de passe choisi pour elle : un secret aléatoire, et un lien de réinitialisation de sept jours", async () => {
    const { service, crees, jwt, mail } = monter();
    await service.ouvrirCompteAcheteur({ email: 'camille@exemple.fr', nom: 'Camille', atelier: 'Théâtre' });
    expect(crees.user.password).toMatch(/^\$2[aby]\$/);
    expect(await bcrypt.compare('', crees.user.password)).toBe(false);
    const [charge, options] = jwt.signAsync.mock.calls[0];
    expect(charge).toMatchObject({ sub: 'u1', purpose: 'password-reset' });
    expect(options).toMatchObject({ expiresIn: '7d' });
    expect(mail.sendCompteOuvertParPaiement).toHaveBeenCalledWith(
      'camille@exemple.fr',
      expect.objectContaining({ token: 'jeton-signe', atelier: 'Théâtre' }),
    );
  });

  it('compte suspendu ou base indisponible : null, jamais une exception', async () => {
    const banni = monter({ existant: { id: 'u9', status: 'BANNED', memberships: [{ accountId: 'x' }] } });
    await expect(banni.service.ouvrirCompteAcheteur({ email: 'a@b.fr', atelier: 'T' })).resolves.toBeNull();
    const panne = monter({ echec: true });
    await expect(panne.service.ouvrirCompteAcheteur({ email: 'a@b.fr', atelier: 'T' })).resolves.toBeNull();
  });

  it('découpe le nom, et prend la partie locale de l’adresse faute de nom', () => {
    expect(decouperNom('  Jean  Léo Martin ', 'x@y.fr')).toEqual({ prenom: 'Jean', nom: 'Léo Martin' });
    expect(decouperNom('', 'marie.dupont@y.fr')).toEqual({ prenom: 'Marie dupont', nom: '' });
  });
});
