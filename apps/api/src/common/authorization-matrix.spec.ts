import 'reflect-metadata';
import { ACCOUNT_ROLES_KEY } from './decorators/account-roles.decorator';
import { MissionsController } from '../missions/missions.controller';
import { ServicesController } from '../services/services.controller';
import { MembershipsController } from '../memberships/memberships.controller';
import { InvitationsController } from '../invitations/invitations.controller';
import { InvoicesController } from '../invoices/invoices.controller';
import { ContratsController } from '../contrats/contrats.controller';
import { ConformiteController } from '../conformite/conformite.controller';

/**
 * Matrice d'autorisation « par profil » — vérifie que chaque endpoint sensible
 * porte bien les rôles de compte (AccountRole) attendus via @AccountRoles.
 * C'est le contrat RBAC entre Direction (OWNER), Administrateur (ADMIN),
 * Responsable (MANAGER) et Salarié (MEMBER).
 */
function rolesOf(ctrl: any, method: string): string[] | undefined {
  return Reflect.getMetadata(ACCOUNT_ROLES_KEY, ctrl.prototype[method]);
}

const MANAGER = ['OWNER', 'ADMIN', 'MANAGER'];
const ADMINS = ['OWNER', 'ADMIN'];

describe('Matrice d\'autorisation par profil (RBAC compte)', () => {
  describe('Missions (RenforTeam)', () => {
    it('créer / éditer / publier / élargir : Direction, Administrateur, Responsable', () => {
      for (const m of ['create', 'update', 'publish', 'broaden']) {
        expect(rolesOf(MissionsController, m)).toEqual(MANAGER);
      }
    });
    it('supprimer : Direction + Administrateur uniquement', () => {
      expect(rolesOf(MissionsController, 'remove')).toEqual(ADMINS);
    });
    it('candidater / consulter : aucun rôle requis (tout membre actif)', () => {
      expect(rolesOf(MissionsController, 'candidate')).toBeUndefined();
      expect(rolesOf(MissionsController, 'findOne')).toBeUndefined();
    });
  });

  describe('Ateliers / services', () => {
    it('créer / éditer : Direction, Administrateur, Responsable', () => {
      expect(rolesOf(ServicesController, 'create')).toEqual(MANAGER);
      expect(rolesOf(ServicesController, 'update')).toEqual(MANAGER);
    });
    it('supprimer : Direction + Administrateur', () => {
      expect(rolesOf(ServicesController, 'remove')).toEqual(ADMINS);
    });
    it('réserver : aucun rôle requis (tout membre actif)', () => {
      expect(rolesOf(ServicesController, 'book')).toBeUndefined();
    });
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
    it('inviter / renvoyer / révoquer : Direction + Administrateur', () => {
      for (const m of ['create', 'resend', 'revoke', 'list']) {
        expect(rolesOf(InvitationsController, m)).toEqual(ADMINS);
      }
    });
    it('accepter une invitation : tout utilisateur connecté', () => {
      expect(rolesOf(InvitationsController, 'accept')).toBeUndefined();
    });
  });

  describe('Facturation', () => {
    it('créer / émettre / marquer payée : Direction, Administrateur, Responsable', () => {
      for (const m of ['create', 'issue', 'pay']) {
        expect(rolesOf(InvoicesController, m)).toEqual(MANAGER);
      }
    });
    it('annuler : Direction + Administrateur', () => {
      expect(rolesOf(InvoicesController, 'cancel')).toEqual(ADMINS);
    });
    /**
     * La LECTURE était ouverte à tout membre actif, et ce test l'entérinait.
     * Un éducateur rattaché à la MECS pouvait donc lister l'intégralité de la
     * facturation de sa structure — alors même que le menu lui cachait déjà
     * l'entrée « Devis & factures » (voir nav.ts). L'interface promettait une
     * restriction que le serveur n'appliquait pas ; on aligne le serveur.
     */
    it('consulter : Direction, Administrateur, Responsable — jamais un simple membre', () => {
      for (const m of ['findAll', 'summary', 'findOne']) {
        expect(rolesOf(InvoicesController, m)).toEqual(MANAGER);
      }
    });
  });

  describe('Conformité', () => {
    it('éditer une pièce : Direction, Administration, Chef de service', () => {
      expect(rolesOf(ConformiteController, 'upsertDocument')).toEqual(MANAGER);
    });

    /**
     * La lecture était ouverte à tout membre actif, et ce test le vérifiait.
     * C'était l'erreur : ces pièces comprennent le casier judiciaire et les
     * diplômes de chacun. Un moniteur-éducateur n'a pas à consulter le dossier
     * de ses collègues. La restriction porte désormais sur le contrôleur
     * entier, ce qui la rend visible ici au niveau de la classe.
     */
    it('consulter : réservé aux responsables, comme l’écriture', () => {
      expect(Reflect.getMetadata(ACCOUNT_ROLES_KEY, ConformiteController)).toEqual(MANAGER);
      expect(Reflect.getMetadata(ACCOUNT_ROLES_KEY, ContratsController)).toEqual(MANAGER);
    });
  });
});
