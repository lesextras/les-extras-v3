import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccountRole, AccountType, MembershipStatus, StatutLiaison } from '@prisma/client';
import {
  filtreProprietaire,
  lireProprietaire,
  sensDuLien,
  statutALaDemande,
  typeOppose,
  verifierReponse,
  verifierRetrait,
  type Perimetre,
} from './liaisons';
import { LiaisonsService } from './liaisons.service';
import { ProjetsReliesService } from './projets.service';
import type { RequestAccount } from '../common/types/request-context';
import { TachesService } from '../association/taches.service';

/* ----------------------------------------------------------------- les règles */

describe('Espaces reliés : les règles', () => {
  it("relie une association à une académie, et rien d'autre", () => {
    expect(typeOppose(AccountType.ASSOCIATION)).toBe(AccountType.ACADEMIE);
    expect(typeOppose(AccountType.ACADEMIE)).toBe(AccountType.ASSOCIATION);
    expect(() => typeOppose(AccountType.ESTABLISHMENT)).toThrow(BadRequestException);
  });

  it("actif d'emblée quand on administre les deux espaces, en attente sinon", () => {
    expect(statutALaDemande('ici', true, true, null)).toBe(StatutLiaison.ACTIVE);
    expect(statutALaDemande('ici', true, false, null)).toBe(StatutLiaison.EN_ATTENTE);
  });

  it("refuse la demande d'une personne qui n'administre pas l'espace d'où elle demande", () => {
    expect(() => statutALaDemande('ici', false, true, null)).toThrow(ForbiddenException);
  });

  it("demander un lien que l'autre espace a demandé vaut acceptation ; redemander ne change rien", () => {
    expect(statutALaDemande('ici', true, false, { statut: StatutLiaison.EN_ATTENTE, demandeDepuisAccountId: 'labas' })).toBe(StatutLiaison.ACTIVE);
    expect(statutALaDemande('ici', true, false, { statut: StatutLiaison.EN_ATTENTE, demandeDepuisAccountId: 'ici' })).toBeNull();
    expect(statutALaDemande('ici', true, false, { statut: StatutLiaison.ACTIVE, demandeDepuisAccountId: 'labas' })).toBeNull();
    expect(statutALaDemande('ici', true, false, { statut: StatutLiaison.REFUSEE, demandeDepuisAccountId: 'ici' })).toBe(StatutLiaison.EN_ATTENTE);
  });

  it("seul un administrateur de l'espace qui a reçu la demande y répond", () => {
    const enAttente = { statut: StatutLiaison.EN_ATTENTE, demandeDepuisAccountId: 'labas' };
    expect(() => verifierReponse(enAttente, 'ici', AccountRole.ADMIN)).not.toThrow();
    expect(() => verifierReponse(enAttente, 'ici', AccountRole.MEMBER)).toThrow(ForbiddenException);
    expect(() => verifierReponse(enAttente, 'labas', AccountRole.OWNER)).toThrow(ForbiddenException);
    expect(() => verifierReponse({ ...enAttente, statut: StatutLiaison.ACTIVE }, 'ici', AccountRole.OWNER)).toThrow(BadRequestException);
    expect(() => verifierRetrait(AccountRole.MANAGER)).toThrow(ForbiddenException);
    expect(() => verifierRetrait(AccountRole.OWNER)).not.toThrow();
  });

  it("dit à chaque côté ce qu'il a à faire", () => {
    expect(sensDuLien({ statut: StatutLiaison.EN_ATTENTE, demandeDepuisAccountId: 'ici' }, 'ici')).toBe('ENVOYEE');
    expect(sensDuLien({ statut: StatutLiaison.EN_ATTENTE, demandeDepuisAccountId: 'labas' }, 'ici')).toBe('A_REPONDRE');
    expect(sensDuLien({ statut: StatutLiaison.ACTIVE, demandeDepuisAccountId: 'labas' }, 'ici')).toBe('ACTIF');
  });

  it("borne les projets au périmètre : l'association seule, ou l'académie et ses associations", () => {
    const asso: Perimetre = { accountId: 'a', organisationIds: ['org1'], academieIds: [], comptes: ['a'] };
    expect(filtreProprietaire(asso)).toEqual({ organisationId: 'org1' });
    const seule: Perimetre = { accountId: 'b', organisationIds: [], academieIds: ['aca1'], comptes: ['b'] };
    expect(filtreProprietaire(seule)).toEqual({ academieId: 'aca1' });
    const reliee: Perimetre = { accountId: 'b', organisationIds: ['org1'], academieIds: ['aca1'], comptes: ['b', 'a'] };
    expect(filtreProprietaire(reliee)).toEqual({ OR: [{ organisationId: { in: ['org1'] } }, { academieId: { in: ['aca1'] } }] });
  });

  it("un nouveau projet d'académie va à l'association reliée, sinon à l'académie ; jamais à un espace hors périmètre", () => {
    const reliee: Perimetre = { accountId: 'b', organisationIds: ['org1'], academieIds: ['aca1'], comptes: ['b', 'a'] };
    expect(lireProprietaire(undefined, reliee)).toEqual({ organisationId: 'org1', academieId: null });
    expect(lireProprietaire('academie', reliee)).toEqual({ organisationId: null, academieId: 'aca1' });
    expect(() => lireProprietaire('association:org9', reliee)).toThrow(BadRequestException);
    const seule: Perimetre = { accountId: 'b', organisationIds: [], academieIds: ['aca1'], comptes: ['b'] };
    expect(lireProprietaire(null, seule)).toEqual({ organisationId: null, academieId: 'aca1' });
  });
});

/* ------------------------------------------------------------- le service */

function prismaFactice() {
  return {
    account: { findUnique: jest.fn() },
    organisation: { create: jest.fn(), findMany: jest.fn() },
    academie: { create: jest.fn() },
    membership: { findUnique: jest.fn(), findMany: jest.fn() },
    liaisonEspace: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn((a: { data: object }) => Promise.resolve({ id: 'l1', ...a.data })),
      update: jest.fn((a: { where: { id: string }; data: object }) => Promise.resolve({ id: a.where.id, ...a.data })),
      delete: jest.fn(),
    },
    projetFormation: { upsert: jest.fn(), deleteMany: jest.fn() },
    actionAssociation: { findFirst: jest.fn() },
    cours: { findFirst: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
  };
}

const COMPTES: Record<string, object> = {
  asso: { id: 'asso', type: AccountType.ASSOCIATION, name: 'ADéPA', organisation: { id: 'org1', nom: 'ADéPA' }, academie: null },
  aca: { id: 'aca', type: AccountType.ACADEMIE, name: 'Académie ADéPA', organisation: null, academie: { id: 'aca1', nom: 'Académie ADéPA' } },
};

const compte = (id: string, role: AccountRole): RequestAccount => ({
  id,
  role,
  type: id === 'asso' ? AccountType.ASSOCIATION : AccountType.ACADEMIE,
  membershipId: `m-${id}`,
});

describe('Espaces reliés : le service', () => {
  let prisma: ReturnType<typeof prismaFactice>;
  let service: LiaisonsService;

  beforeEach(() => {
    prisma = prismaFactice();
    prisma.account.findUnique.mockImplementation((a: { where: { id: string } }) => Promise.resolve(COMPTES[a.where.id] ?? null));
    service = new LiaisonsService(prisma as never);
  });

  it("la fondatrice, propriétaire des deux espaces, les relie d'un geste : le lien est actif", async () => {
    prisma.membership.findUnique.mockResolvedValue({ role: AccountRole.OWNER, status: MembershipStatus.ACTIVE, account: { type: AccountType.ACADEMIE } });
    prisma.liaisonEspace.findUnique.mockResolvedValue(null);
    const r = await service.demander(compte('asso', AccountRole.OWNER), 'u1', 'aca');
    expect(r.statut).toBe(StatutLiaison.ACTIVE);
    expect(prisma.liaisonEspace.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organisationId: 'org1', academieId: 'aca1', demandeDepuisAccountId: 'asso', demandeParUserId: 'u1', statut: StatutLiaison.ACTIVE }),
    });
  });

  it("simple membre de l'autre espace : la demande attend un administrateur de l'autre côté", async () => {
    prisma.membership.findUnique.mockResolvedValue({ role: AccountRole.MEMBER, status: MembershipStatus.ACTIVE, account: { type: AccountType.ACADEMIE } });
    prisma.liaisonEspace.findUnique.mockResolvedValue(null);
    const r = await service.demander(compte('asso', AccountRole.ADMIN), 'u1', 'aca');
    expect(r.statut).toBe(StatutLiaison.EN_ATTENTE);
  });

  it("on ne relie pas un espace dont on n'est pas membre, ni un espace du même type", async () => {
    prisma.membership.findUnique.mockResolvedValue(null);
    await expect(service.demander(compte('asso', AccountRole.OWNER), 'u1', 'aca')).rejects.toBeInstanceOf(NotFoundException);
    prisma.membership.findUnique.mockResolvedValue({ role: AccountRole.OWNER, status: MembershipStatus.ACTIVE, account: { type: AccountType.ASSOCIATION } });
    await expect(service.demander(compte('asso', AccountRole.OWNER), 'u1', 'autre-asso')).rejects.toBeInstanceOf(NotFoundException);
    prisma.membership.findUnique.mockResolvedValue({ role: AccountRole.OWNER, status: MembershipStatus.SUSPENDED, account: { type: AccountType.ACADEMIE } });
    await expect(service.demander(compte('asso', AccountRole.OWNER), 'u1', 'aca')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.liaisonEspace.create).not.toHaveBeenCalled();
  });

  it("accepter : réservé à l'administrateur de l'espace qui a reçu la demande", async () => {
    prisma.liaisonEspace.findFirst.mockResolvedValue({ id: 'l1', organisationId: 'org1', academieId: 'aca1', statut: StatutLiaison.EN_ATTENTE, demandeDepuisAccountId: 'asso' });
    await expect(service.repondre(compte('asso', AccountRole.OWNER), 'l1', true)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.repondre(compte('aca', AccountRole.MEMBER), 'l1', true)).rejects.toBeInstanceOf(ForbiddenException);
    const r = await service.repondre(compte('aca', AccountRole.ADMIN), 'l1', true);
    expect(r.statut).toBe(StatutLiaison.ACTIVE);
    expect(prisma.liaisonEspace.findFirst).toHaveBeenCalledWith({ where: { id: 'l1', academieId: 'aca1' } });
  });

  it("un lien qui ne concerne pas l'espace courant est introuvable", async () => {
    prisma.liaisonEspace.findFirst.mockResolvedValue(null);
    await expect(service.retirer(compte('aca', AccountRole.OWNER), 'l-autre')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('retirer un lien emporte les liens projets ↔ formations entre les deux espaces', async () => {
    prisma.liaisonEspace.findFirst.mockResolvedValue({ id: 'l1', organisationId: 'org1', academieId: 'aca1', statut: StatutLiaison.ACTIVE, demandeDepuisAccountId: 'asso' });
    await service.retirer(compte('aca', AccountRole.OWNER), 'l1');
    expect(prisma.projetFormation.deleteMany).toHaveBeenCalledWith({ where: { academieId: 'aca1', action: { organisationId: 'org1' } } });
    expect(prisma.liaisonEspace.delete).toHaveBeenCalledWith({ where: { id: 'l1' } });
  });

  it("le périmètre d'une académie ne lit que les liens ACTIVE", async () => {
    prisma.liaisonEspace.findMany.mockResolvedValue([{ organisation: { id: 'org1', nom: 'ADéPA', accountId: 'asso' } }]);
    const { perimetre } = await service.perimetreAcademie('aca');
    expect(prisma.liaisonEspace.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { academieId: 'aca1', statut: StatutLiaison.ACTIVE } }));
    expect(perimetre).toEqual({ accountId: 'aca', organisationIds: ['org1'], academieIds: ['aca1'], comptes: ['aca', 'asso'] });
    await expect(service.perimetreAcademie('asso')).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('Espaces reliés : projets et formations', () => {
  let prisma: ReturnType<typeof prismaFactice>;
  let liaisons: LiaisonsService;
  let projets: ProjetsReliesService;

  beforeEach(() => {
    prisma = prismaFactice();
    prisma.account.findUnique.mockImplementation((a: { where: { id: string } }) => Promise.resolve(COMPTES[a.where.id] ?? null));
    liaisons = new LiaisonsService(prisma as never);
    projets = new ProjetsReliesService(prisma as never, liaisons, {} as never);
  });

  it("sans lien actif, l'académie ne touche pas aux projets de l'association", async () => {
    prisma.liaisonEspace.findMany.mockResolvedValue([]);
    prisma.actionAssociation.findFirst.mockResolvedValue(null);
    await expect(projets.lierFormation('academie', 'aca', 'projet-asso', 'c1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.actionAssociation.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'projet-asso', academieId: 'aca1' } }));
  });

  it("relie une formation de l'académie à un projet de l'association reliée", async () => {
    prisma.liaisonEspace.findMany.mockResolvedValue([{ organisation: { id: 'org1', nom: 'ADéPA', accountId: 'asso' } }]);
    prisma.actionAssociation.findFirst.mockResolvedValue({ id: 'a2pa' });
    prisma.cours.findFirst.mockResolvedValue({ id: 'c1', accountId: 'aca' });
    await projets.lierFormation('academie', 'aca', 'a2pa', 'c1');
    expect(prisma.cours.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'c1', accountId: { in: ['aca'] } } }));
    expect(prisma.projetFormation.upsert).toHaveBeenCalledWith({
      where: { actionId_coursId: { actionId: 'a2pa', coursId: 'c1' } },
      create: { actionId: 'a2pa', coursId: 'c1', academieId: 'aca1' },
      update: {},
    });
  });

  it("l'association ne relie que des formations d'académies reliées", async () => {
    prisma.liaisonEspace.findMany.mockResolvedValue([]);
    prisma.actionAssociation.findFirst.mockResolvedValue({ id: 'a2pa' });
    await expect(projets.lierFormation('association', 'asso', 'a2pa', 'c-ailleurs')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.cours.findFirst).not.toHaveBeenCalled();
    expect(prisma.projetFormation.upsert).not.toHaveBeenCalled();
  });

  it("l'académie lit l'identité et les agréments des seules associations reliées", async () => {
    prisma.liaisonEspace.findMany.mockResolvedValue([{ organisation: { id: 'org1', nom: 'ADéPA', accountId: 'asso' } }]);
    prisma.organisation.findMany.mockResolvedValue([
      { id: 'org1', nom: 'ADéPA', sigle: null, siren: '1', siret: '2', rna: 'W77', commune: 'Melun', codePostal: '77000', pieces: [{ etat: 'PRESENTE', preuve: null, dateEmission: null, dateExpiration: null, note: 'JEP', fileId: 'f1', updatedAt: new Date() }] },
    ]);
    const r = await projets.associationsDeLAcademie('aca');
    expect(prisma.organisation.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: { in: ['org1'] } } }));
    expect(r.associations[0]).toMatchObject({ nom: 'ADéPA', rna: 'W77', agrement: { note: 'JEP', aUnFichier: true } });
    expect(r.associations[0].agrement).not.toHaveProperty('fileId');

    prisma.liaisonEspace.findMany.mockResolvedValue([]);
    prisma.organisation.findMany.mockClear();
    expect(await projets.associationsDeLAcademie('aca')).toEqual({ associations: [] });
    expect(prisma.organisation.findMany).not.toHaveBeenCalled();
  });
});

describe('Espaces reliés : les tâches vues de l\'académie', () => {
  const reliee: Perimetre = { accountId: 'aca', organisationIds: ['org1'], academieIds: ['aca1'], comptes: ['aca', 'asso'] };

  function prismaTaches() {
    return {
      actionAssociation: { findFirst: jest.fn() },
      contactAssociation: { findFirst: jest.fn(), findMany: jest.fn() },
      membership: { findFirst: jest.fn(), findMany: jest.fn() },
      tacheProjet: { findFirst: jest.fn(), create: jest.fn((a: { data: object }) => Promise.resolve(a.data)) },
    };
  }

  it("une tâche d'un projet de l'association reste à l'association ; un membre de l'un ou l'autre espace peut la porter", async () => {
    const prisma = prismaTaches();
    const taches = new TachesService(prisma as never, {} as never);
    prisma.actionAssociation.findFirst.mockResolvedValue({ id: 'a2pa', organisationId: 'org1', academieId: null });
    prisma.membership.findFirst.mockResolvedValue({ user: { id: 'u2', email: 'x@y.fr', firstName: 'Sam', lastName: null } });
    prisma.tacheProjet.findFirst.mockResolvedValue(null);
    const t = await taches.creerTache(reliee, { actionId: 'a2pa', titre: 'Programme', responsable: 'user:u2' });
    expect(prisma.actionAssociation.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'a2pa', OR: [{ organisationId: { in: ['org1'] } }, { academieId: { in: ['aca1'] } }] } }),
    );
    expect(prisma.membership.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { accountId: { in: ['aca', 'asso'] }, userId: 'u2', status: MembershipStatus.ACTIVE } }));
    expect(t).toMatchObject({ organisationId: 'org1', academieId: null, responsableUserId: 'u2', responsableNom: 'Sam' });
  });

  it("un projet propre à l'académie n'a pas d'équipe d'association : une fiche du répertoire est refusée", async () => {
    const prisma = prismaTaches();
    const taches = new TachesService(prisma as never, {} as never);
    prisma.actionAssociation.findFirst.mockResolvedValue({ id: 'p-aca', organisationId: null, academieId: 'aca1' });
    await expect(taches.creerTache(reliee, { actionId: 'p-aca', titre: 'x', responsable: 'contact:c1' })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.contactAssociation.findFirst).not.toHaveBeenCalled();
  });
});
