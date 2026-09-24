import 'reflect-metadata';
import { ACCOUNT_ROLES_KEY } from './decorators/account-roles.decorator';
import { MissionsController } from '../missions/missions.controller';
import { ServicesController } from '../services/services.controller';
import { MembershipsController } from '../memberships/memberships.controller';
import { InvitationsController } from '../invitations/invitations.controller';
import { InvoicesController } from '../invoices/invoices.controller';
import { ContratsController } from '../contrats/contrats.controller';
import { ConformiteController } from '../conformite/conformite.controller';
import { BookingsController } from '../bookings/bookings.controller';
import { QuotesController } from '../quotes/quotes.controller';
import { rolesActifs } from './roles';

/**
 * MATRICE D'AUTORISATION, APRÈS LA SUPPRESSION DES RÔLES (24/09/2026).
 *
 * Sur Les Extras, le compte, c'est la personne : direction, administration,
 * chef de service, salarié et les droits déclarés (« Réserver directement »,
 * « Utiliser les générations LEX ») n'existent plus. Ce fichier vérifie que
 * AUCUNE route Les Extras ne porte encore de rôle ni de droit : un décorateur
 * oublié refuserait une action à la seule personne du compte.
 *
 * Les routes de membres et d'invitations servent les espaces Piloter, qui
 * gardent leurs droits d'accès : elles gardent leurs rôles, et la garde ne les
 * lit que pour une association ou une académie (`common/roles.ts`).
 */
function rolesOf(ctrl: any, method: string): string[] | undefined {
  return Reflect.getMetadata(ACCOUNT_ROLES_KEY, ctrl.prototype[method]);
}

const ADMINS = ['OWNER', 'ADMIN'];

function metasDe(ctrl: any): { methode: string; roles?: unknown }[] {
  const proto = ctrl.prototype;
  return [
    { methode: '(classe)', roles: Reflect.getMetadata(ACCOUNT_ROLES_KEY, ctrl) },
    ...Object.getOwnPropertyNames(proto)
      .filter((m) => m !== 'constructor' && typeof proto[m] === 'function')
      .map((m) => ({ methode: m, roles: Reflect.getMetadata(ACCOUNT_ROLES_KEY, proto[m]) })),
  ];
}

describe('Matrice d\'autorisation (plus de rôles sur Les Extras)', () => {
  it.each([
    ['Missions', MissionsController],
    ['Ateliers / services', ServicesController],
    ['Réservations', BookingsController],
    ['Devis', QuotesController],
    ['Facturation', InvoicesController],
    ['Contrats', ContratsController],
    ['Conformité', ConformiteController],
  ])('%s : aucune route ne porte de rôle ni de droit déclaré', (_nom, ctrl) => {
    const restants = metasDe(ctrl).filter((m) => m.roles);
    expect(restants).toEqual([]);
  });

  it('la garde ne lit le rôle que pour Piloter', () => {
    for (const t of ['ESTABLISHMENT', 'FREELANCE', 'PARTICULIER']) expect(rolesActifs(t)).toBe(false);
    for (const t of ['ASSOCIATION', 'ACADEMIE']) expect(rolesActifs(t)).toBe(true);
  });

  describe('Membres & invitations (gouvernance du compte)', () => {
    it('changer rôle / suspendre / réactiver / retirer un membre : Direction + Administrateur', () => {
      for (const m of ['changeRole', 'suspend', 'reactivate', 'remove']) {
        expect(rolesOf(MembershipsController, m)).toEqual(ADMINS);
      }
    });
    it('lister les membres : tout membre actif', () => {
      expect(rolesOf(MembershipsController, 'list')).toBeUndefined();
    });
    /**
     * Les invitations n'ont pas de garde de rôle sur le contrôleur : le
     * contrôle (espace Piloter ET rôle OWNER/ADMIN) est fait dans
     * `InvitationsService.assertPeutInviter`, parce que `AccountRolesGuard`
     * laisse tout passer sur un compte Les Extras. Couvert par
     * `invitations/invitations-piloter.spec.ts`.
     */
    it('inviter / renvoyer / révoquer : contrôle dans le service, pas de décorateur', () => {
      for (const m of ['create', 'resend', 'revoke', 'list']) {
        expect(rolesOf(InvitationsController, m)).toBeUndefined();
      }
    });
    it('accepter une invitation : tout utilisateur connecté', () => {
      expect(rolesOf(InvitationsController, 'accept')).toBeUndefined();
    });
  });

});
