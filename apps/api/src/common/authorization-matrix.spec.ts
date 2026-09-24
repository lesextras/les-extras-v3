import 'reflect-metadata';
import { ACCOUNT_ROLES_KEY } from './decorators/account-roles.decorator';
import { CAPACITE_KEY } from './decorators/capacite.decorator';
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

function metasDe(ctrl: any): { methode: string; roles?: unknown; capacite?: unknown }[] {
  const proto = ctrl.prototype;
  return [
    { methode: '(classe)', roles: Reflect.getMetadata(ACCOUNT_ROLES_KEY, ctrl), capacite: Reflect.getMetadata(CAPACITE_KEY, ctrl) },
    ...Object.getOwnPropertyNames(proto)
      .filter((m) => m !== 'constructor' && typeof proto[m] === 'function')
      .map((m) => ({ methode: m, roles: Reflect.getMetadata(ACCOUNT_ROLES_KEY, proto[m]), capacite: Reflect.getMetadata(CAPACITE_KEY, proto[m]) })),
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
    const restants = metasDe(ctrl).filter((m) => m.roles || m.capacite);
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
     * ⚠ LE GARDE DE RÔLE A ÉTÉ RETIRÉ DES INVITATIONS LE 16/09/2026, ET
     * L'ABSENCE DE MÉTADONNÉE EST ICI LE COMPORTEMENT ATTENDU.
     *
     * Il exigeait OWNER ou ADMIN, c'est-à-dire la direction. Un chef de service
     * arrivé seul — le cas que ce produit doit servir en priorité — ne pouvait
     * donc inviter personne tant que sa direction n'avait pas ouvert de compte.
     * Il n'avait rien à faire sur la plateforme.
     *
     * Le droit d'inviter est devenu une CAPACITÉ (`Capacite.INVITER_MEMBRES`),
     * vérifiée dans `InvitationsService`, où l'on sait aussi rabattre le niveau,
     * les droits et les services à ce que l'invitant détient réellement. Un
     * garde de rôle ne sait rien faire de tout cela : il aurait laissé passer un
     * ADMIN invitant hors de son périmètre, et refusé un responsable invitant
     * dans le sien. Les règles sont couvertes par `common/perimetre.spec.ts`.
     *
     * NE PAS « RÉPARER » CE TEST en remettant @AccountRoles sur le contrôleur :
     * cela refermerait la porte sur les premiers utilisateurs du produit.
     */
    it('inviter / renvoyer / révoquer : plus de garde de rôle — c’est une capacité', () => {
      for (const m of ['create', 'resend', 'revoke', 'list']) {
        expect(rolesOf(InvitationsController, m)).toBeUndefined();
      }
    });
    it('accepter une invitation : tout utilisateur connecté', () => {
      expect(rolesOf(InvitationsController, 'accept')).toBeUndefined();
    });
  });

});
