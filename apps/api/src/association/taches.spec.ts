import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MembershipStatus, PrioriteTache, RoleContact, StatutTache } from '@prisma/client';
import {
  clesDeMoi,
  construireEquipe,
  estEnRetard,
  faiteLeSelon,
  initiales,
  lireResponsable,
  progressionParProjet,
  reordonner,
  trierAFaire,
  verifierDates,
} from './taches';
import { TachesService } from './taches.service';

const J = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('Tâches des projets : les règles', () => {
  it('lit une clé de responsable, et refuse le reste', () => {
    expect(lireResponsable('contact:abc123')).toEqual({ type: 'contact', id: 'abc123' });
    expect(lireResponsable('user:u_1')).toEqual({ type: 'user', id: 'u_1' });
    expect(lireResponsable(null)).toBeNull();
    expect(lireResponsable('')).toBeNull();
    expect(() => lireResponsable('admin:1')).toThrow(BadRequestException);
    expect(() => lireResponsable('contact:')).toThrow(BadRequestException);
  });

  it('fait des initiales lisibles', () => {
    expect(initiales('Awa Diallo')).toBe('AD');
    expect(initiales('Jean Pierre Martin')).toBe('JM');
    expect(initiales('sihame')).toBe('SI');
    expect(initiales('  ')).toBe('?');
  });

  it("construit l'équipe : le répertoire d'abord, les accès sans fiche ensuite, moi en tête, sans doublon", () => {
    const equipe = construireEquipe(
      [
        { id: 'c1', prenom: 'Zoé', nom: 'Blanc', email: 'zoe@asso.fr', roles: [RoleContact.BENEVOLE] },
        { id: 'c2', prenom: 'Paul', nom: 'Noir', email: 'PRESIDENT@asso.fr', roles: [RoleContact.PRESIDENT] },
        { id: 'c3', prenom: 'Léa', nom: 'Simple', email: null, roles: [RoleContact.MEMBRE] },
        { id: 'c4', prenom: 'Max', nom: 'Mairie', email: null, roles: [RoleContact.PARTENAIRE] },
      ],
      [
        { userId: 'u1', email: 'president@asso.fr', firstName: 'Paul', lastName: 'Noir' },
        { userId: 'u2', email: 'tresor@asso.fr', firstName: null, lastName: null },
      ],
      { id: 'u1', email: 'president@asso.fr' },
    );
    expect(equipe.map((m) => m.cle)).toEqual(['contact:c2', 'user:u2', 'contact:c1']);
    expect(equipe[0]).toMatchObject({ nom: 'Paul Noir', moi: true, source: 'EQUIPE', initiales: 'PN' });
    expect(equipe[1]).toMatchObject({ nom: 'tresor@asso.fr', source: 'ACCES', moi: false });
  });

  it('reconnaît mes tâches par mon compte et par ma fiche du répertoire', () => {
    const cles = clesDeMoi(
      [
        { id: 'c1', email: 'Moi@Asso.fr' },
        { id: 'c2', email: 'autre@asso.fr' },
      ],
      { id: 'u9', email: 'moi@asso.fr' },
    );
    expect([...cles].sort()).toEqual(['contact:c1', 'user:u9']);
  });

  it("trie le « À faire » : échéance la plus proche d'abord, sans date à la fin, faites retirées", () => {
    const base = { priorite: PrioriteTache.NORMALE, ordre: 0, createdAt: J('2026-09-01') };
    const liste = trierAFaire([
      { ...base, id: 'sans-date', statut: StatutTache.A_FAIRE, echeance: null },
      { ...base, id: 'loin', statut: StatutTache.EN_COURS, echeance: J('2026-12-01') },
      { ...base, id: 'faite', statut: StatutTache.FAITE, echeance: J('2026-09-01') },
      { ...base, id: 'retard', statut: StatutTache.BLOQUEE, echeance: J('2026-09-20') },
      { ...base, id: 'proche-basse', statut: StatutTache.A_FAIRE, echeance: J('2026-10-05'), priorite: PrioriteTache.BASSE },
      { ...base, id: 'proche-haute', statut: StatutTache.A_FAIRE, echeance: J('2026-10-05'), priorite: PrioriteTache.HAUTE },
    ]);
    expect(liste.map((t) => t.id)).toEqual(['retard', 'proche-haute', 'proche-basse', 'loin', 'sans-date']);
  });

  it("ne met en retard qu'une échéance passée d'au moins un jour, et jamais une tâche faite", () => {
    const maintenant = new Date('2026-10-01T18:00:00.000Z');
    expect(estEnRetard({ statut: StatutTache.A_FAIRE, echeance: J('2026-10-01') }, maintenant)).toBe(false);
    expect(estEnRetard({ statut: StatutTache.A_FAIRE, echeance: J('2026-09-30') }, maintenant)).toBe(true);
    expect(estEnRetard({ statut: StatutTache.FAITE, echeance: J('2026-09-01') }, maintenant)).toBe(false);
    expect(estEnRetard({ statut: StatutTache.A_FAIRE, echeance: null }, maintenant)).toBe(false);
  });

  it('pose et efface la date « faite le » selon le statut', () => {
    const maintenant = J('2026-10-01');
    expect(faiteLeSelon(StatutTache.FAITE, null, maintenant)).toEqual(maintenant);
    expect(faiteLeSelon(StatutTache.FAITE, { statut: StatutTache.FAITE, faiteLe: J('2026-09-01') }, maintenant)).toEqual(J('2026-09-01'));
    expect(faiteLeSelon(StatutTache.EN_COURS, { statut: StatutTache.FAITE, faiteLe: J('2026-09-01') }, maintenant)).toBeNull();
  });

  it('compte les tâches et les faites de chaque projet', () => {
    const p = progressionParProjet([
      { actionId: 'a', statut: StatutTache.A_FAIRE, _count: { _all: 2 } },
      { actionId: 'a', statut: StatutTache.FAITE, _count: { _all: 3 } },
      { actionId: 'b', statut: StatutTache.BLOQUEE, _count: { _all: 1 } },
    ]);
    expect(p.get('a')).toEqual({ tachesTotal: 5, tachesFaites: 3 });
    expect(p.get('b')).toEqual({ tachesTotal: 1, tachesFaites: 0 });
    expect(p.get('c')).toBeUndefined();
  });

  it('replace une tâche dans sa colonne, ou la pose au bout', () => {
    expect(reordonner(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b']);
    expect(reordonner(['a', 'b', 'c'], 'a', 1)).toEqual(['b', 'a', 'c']);
    expect(reordonner(['a', 'b'], 'x', 1)).toEqual(['a', 'x', 'b']);
    expect(reordonner(['a', 'b'], 'x', Number.POSITIVE_INFINITY)).toEqual(['a', 'b', 'x']);
    expect(reordonner(['a', 'b'], 'x', 99)).toEqual(['a', 'b', 'x']);
  });

  it('refuse une échéance avant le début', () => {
    expect(() => verifierDates(J('2026-10-10'), J('2026-10-01'))).toThrow(BadRequestException);
    expect(() => verifierDates(J('2026-10-01'), J('2026-10-01'))).not.toThrow();
    expect(() => verifierDates(null, J('2026-10-01'))).not.toThrow();
  });
});

/* --------------------------------------------------------------- le service */

function prismaFactice() {
  return {
    actionAssociation: { findFirst: jest.fn() },
    contactAssociation: { findFirst: jest.fn(), findMany: jest.fn() },
    membership: { findFirst: jest.fn(), findMany: jest.fn() },
    tacheProjet: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn((a: { data: unknown }) => Promise.resolve(a.data)),
      update: jest.fn((a: { where: { id: string }; data: unknown }) => Promise.resolve({ id: a.where.id, ...(a.data as object) })),
      delete: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

describe('Tâches des projets : le service', () => {
  const espace = { organisationDuCompte: jest.fn().mockResolvedValue({ id: 'org1' }) };
  let prisma: ReturnType<typeof prismaFactice>;
  let service: TachesService;

  beforeEach(() => {
    prisma = prismaFactice();
    service = new TachesService(prisma as never, espace as never);
  });

  it("crée une tâche au bout de sa colonne, avec le nom du responsable recopié", async () => {
    prisma.actionAssociation.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.contactAssociation.findFirst.mockResolvedValue({ id: 'c1', prenom: 'Awa', nom: 'Diallo', roles: [RoleContact.BENEVOLE] });
    prisma.tacheProjet.findFirst.mockResolvedValue({ ordre: 4 });
    const t = await service.creerTache('acc1', {
      actionId: 'p1',
      titre: '  Réserver la salle ',
      responsable: 'contact:c1',
      echeance: '2026-10-10',
    });
    expect(prisma.contactAssociation.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'c1', organisationId: 'org1' } }));
    expect(t).toMatchObject({
      organisationId: 'org1',
      titre: 'Réserver la salle',
      statut: StatutTache.A_FAIRE,
      priorite: PrioriteTache.NORMALE,
      responsableContactId: 'c1',
      responsableUserId: null,
      responsableNom: 'Awa Diallo',
      ordre: 5,
      faiteLe: null,
    });
  });

  it("refuse un projet d'une autre association, et un responsable hors de l'équipe", async () => {
    prisma.actionAssociation.findFirst.mockResolvedValue(null);
    await expect(service.creerTache('acc1', { actionId: 'autre', titre: 'x' })).rejects.toBeInstanceOf(NotFoundException);

    prisma.actionAssociation.findFirst.mockResolvedValue({ id: 'p1' });
    prisma.contactAssociation.findFirst.mockResolvedValue({ id: 'c9', prenom: 'Max', nom: 'Mairie', roles: [RoleContact.PARTENAIRE] });
    await expect(service.creerTache('acc1', { actionId: 'p1', titre: 'x', responsable: 'contact:c9' })).rejects.toBeInstanceOf(BadRequestException);

    prisma.membership.findFirst.mockResolvedValue(null);
    await expect(service.creerTache('acc1', { actionId: 'p1', titre: 'x', responsable: 'user:u9' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.membership.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { accountId: 'acc1', userId: 'u9', status: MembershipStatus.ACTIVE } }),
    );
  });

  it('cocher une tâche la passe à FAITE, au bout de la colonne, avec la date', async () => {
    prisma.tacheProjet.findFirst
      .mockResolvedValueOnce({ id: 't1', actionId: 'p1', statut: StatutTache.A_FAIRE, faiteLe: null, debut: null, echeance: null })
      .mockResolvedValueOnce({ ordre: 2 });
    const t = await service.modifierTache('acc1', 't1', { statut: StatutTache.FAITE });
    expect(t).toMatchObject({ statut: StatutTache.FAITE, ordre: 3 });
    expect((t as { faiteLe: Date }).faiteLe).toBeInstanceOf(Date);
  });

  it('glisser une tâche dans une autre colonne renumérote cette colonne', async () => {
    prisma.tacheProjet.findFirst.mockResolvedValue({ id: 't1', actionId: 'p1', statut: StatutTache.A_FAIRE, faiteLe: null });
    prisma.tacheProjet.findMany.mockResolvedValue([{ id: 'a' }, { id: 'b' }]);
    const r = await service.deplacerTache('acc1', 't1', { statut: StatutTache.EN_COURS, position: 1 });
    expect(r).toEqual({ ok: true, statut: StatutTache.EN_COURS, ordre: 1 });
    const appels = prisma.tacheProjet.update.mock.calls.map((c) => c[0]);
    expect(appels).toEqual([
      { where: { id: 'a' }, data: { ordre: 0 } },
      { where: { id: 't1' }, data: { statut: StatutTache.EN_COURS, ordre: 1, faiteLe: null } },
      { where: { id: 'b' }, data: { ordre: 2 } },
    ]);
  });

  it('liste : les ouvertes par échéance, puis les faites, avec « à moi » et « en retard »', async () => {
    prisma.contactAssociation.findMany.mockResolvedValue([{ id: 'c1', prenom: 'Awa', nom: 'Diallo', email: 'moi@asso.fr', roles: [RoleContact.BENEVOLE] }]);
    prisma.membership.findMany.mockResolvedValue([{ user: { id: 'u1', email: 'moi@asso.fr', firstName: 'Awa', lastName: 'Diallo' } }]);
    const base = {
      actionId: 'p1',
      action: { id: 'p1', intitule: 'Fête' },
      priorite: PrioriteTache.NORMALE,
      ordre: 0,
      createdAt: J('2026-09-01'),
      faiteLe: null,
      responsableUserId: null,
      responsableContactId: null,
      responsableNom: null,
    };
    prisma.tacheProjet.findMany.mockResolvedValue([
      { ...base, id: 'faite', statut: StatutTache.FAITE, echeance: null, faiteLe: J('2026-09-15') },
      { ...base, id: 'plus-tard', statut: StatutTache.A_FAIRE, echeance: J('2099-01-01') },
      { ...base, id: 'vieille', statut: StatutTache.A_FAIRE, echeance: J('2020-01-01'), responsableContactId: 'c1', responsableNom: 'Awa Diallo' },
    ]);
    const r = await service.taches('acc1', { id: 'u1', email: 'moi@asso.fr' });
    expect(r.taches.map((t) => t.id)).toEqual(['vieille', 'plus-tard', 'faite']);
    expect(r.taches[0]).toMatchObject({ aMoi: true, enRetard: true, responsable: { cle: 'contact:c1', nom: 'Awa Diallo' }, projet: { intitule: 'Fête' } });
    expect(r.equipe).toHaveLength(1);
    expect(r.resume).toEqual({ total: 3, ouvertes: 2, enRetard: 1, miennes: 1 });

    const miennes = await service.taches('acc1', { id: 'u1', email: 'moi@asso.fr' }, { miennes: '1' });
    expect(miennes.taches.map((t) => t.id)).toEqual(['vieille']);
  });
});
