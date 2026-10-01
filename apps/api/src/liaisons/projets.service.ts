import { Injectable, NotFoundException } from '@nestjs/common';
import { EtatAction, type ActionAssociation, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TachesService, type Moi } from '../association/taches.service';
import { progressionParProjet } from '../association/taches';
import type { DeplacerTacheDto, FiltresTachesDto, ModifierActionDto, ModifierTacheDto, TacheDto } from '../association/dto/espace.dto';
import { LiaisonsService, type EspaceResume } from './liaisons.service';
import { filtreProprietaire, lireProprietaire, type Perimetre } from './liaisons';
import type { ProjetAcademieDto } from './dto';

/** Ce qu'on joint à un projet pour afficher ses formations. */
export const AVEC_FORMATIONS = {
  formations: {
    select: { academieId: true, cours: { select: { id: true, titre: true } }, academie: { select: { nom: true } } },
    orderBy: { createdAt: 'asc' },
  },
} satisfies Prisma.ActionAssociationInclude;

type ProjetAvecFormations = Prisma.ActionAssociationGetPayload<{ include: typeof AVEC_FORMATIONS }>;

/** Les formations d'un projet, réduites aux académies que le lecteur a le droit de voir. */
export function formationsVisibles(p: ProjetAvecFormations, academiesVisibles: ReadonlySet<string>) {
  return p.formations
    .filter((f) => academiesVisibles.has(f.academieId))
    .map((f) => ({ id: f.cours.id, titre: f.cours.titre, academieId: f.academieId, academieNom: f.academie.nom }));
}

/**
 * « MES PROJETS » D'UNE ACADÉMIE, ET LES FORMATIONS DES PROJETS.
 *
 * Une académie reliée à une association travaille sur les projets DE
 * l'association : mêmes lignes, mêmes tâches, aucune copie. Une académie sans
 * association a ses propres projets (`academieId`). Chaque projet peut être
 * relié à une ou plusieurs formations (Cours) de l'académie.
 */
@Injectable()
export class ProjetsReliesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly liaisons: LiaisonsService,
    private readonly taches: TachesService,
  ) {}

  /* ------------------------------------------------- côté académie */

  async projetsAcademie(accountId: string) {
    const { perimetre: p, academie, associations } = await this.liaisons.perimetreAcademie(accountId);
    const [actions, groupes, catalogue] = await Promise.all([
      this.prisma.actionAssociation.findMany({
        where: filtreProprietaire(p),
        include: AVEC_FORMATIONS,
        orderBy: [{ dateDebut: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.tacheProjet.groupBy({ by: ['actionId', 'statut'], where: filtreProprietaire(p), _count: { _all: true } }),
      this.catalogue([academie]),
    ]);
    const progression = progressionParProjet(groupes);
    const visibles = new Set([academie.id]);
    const nomAssociation = new Map(associations.map((a) => [a.id, a.nom]));
    return {
      actions: actions.map(({ formations: _f, ...a }) => ({
        ...a,
        ...(progression.get(a.id) ?? { tachesTotal: 0, tachesFaites: 0 }),
        formations: formationsVisibles({ ...a, formations: _f }, visibles),
        proprietaire: a.organisationId
          ? { type: 'ASSOCIATION' as const, nom: nomAssociation.get(a.organisationId) ?? 'Association' }
          : { type: 'ACADEMIE' as const, nom: academie.nom },
      })),
      resume: resumerProjets(actions),
      proprietaires: [
        ...associations.map((a) => ({ cle: `association:${a.id}`, nom: a.nom, type: 'ASSOCIATION' as const })),
        { cle: 'academie', nom: academie.nom, type: 'ACADEMIE' as const },
      ],
      catalogue,
    };
  }

  async creerProjetAcademie(accountId: string, dto: ProjetAcademieDto) {
    const { perimetre } = await this.liaisons.perimetreAcademie(accountId);
    const proprietaire = lireProprietaire(dto.proprietaire, perimetre);
    return this.prisma.actionAssociation.create({ data: { ...proprietaire, ...donneesProjet(dto) } });
  }

  async modifierProjetAcademie(accountId: string, id: string, dto: ModifierActionDto) {
    const { perimetre } = await this.liaisons.perimetreAcademie(accountId);
    await this.projetDans(perimetre, id);
    return this.prisma.actionAssociation.update({ where: { id }, data: modificationsProjet(dto) });
  }

  async supprimerProjetAcademie(accountId: string, id: string) {
    const { perimetre } = await this.liaisons.perimetreAcademie(accountId);
    await this.projetDans(perimetre, id);
    await this.prisma.actionAssociation.delete({ where: { id } });
    return { ok: true };
  }

  async tachesAcademie(accountId: string, moi: Moi, filtres: FiltresTachesDto) {
    return this.taches.taches((await this.liaisons.perimetreAcademie(accountId)).perimetre, moi, filtres);
  }

  async creerTacheAcademie(accountId: string, dto: TacheDto) {
    return this.taches.creerTache((await this.liaisons.perimetreAcademie(accountId)).perimetre, dto);
  }

  async modifierTacheAcademie(accountId: string, id: string, dto: ModifierTacheDto) {
    return this.taches.modifierTache((await this.liaisons.perimetreAcademie(accountId)).perimetre, id, dto);
  }

  async deplacerTacheAcademie(accountId: string, id: string, dto: DeplacerTacheDto) {
    return this.taches.deplacerTache((await this.liaisons.perimetreAcademie(accountId)).perimetre, id, dto);
  }

  async supprimerTacheAcademie(accountId: string, id: string) {
    return this.taches.supprimerTache((await this.liaisons.perimetreAcademie(accountId)).perimetre, id);
  }

  /**
   * Les associations reliées, vues de l'académie : identité et agréments
   * (la pièce « Agréments et habilitations » du classeur), en lecture seule.
   */
  async associationsDeLAcademie(accountId: string) {
    const { associations } = await this.liaisons.perimetreAcademie(accountId);
    if (!associations.length) return { associations: [] };
    const fiches = await this.prisma.organisation.findMany({
      where: { id: { in: associations.map((a) => a.id) } },
      select: {
        id: true,
        nom: true,
        sigle: true,
        siren: true,
        siret: true,
        rna: true,
        commune: true,
        codePostal: true,
        pieces: {
          where: { typeCode: 'AGREMENT' },
          select: { etat: true, preuve: true, dateEmission: true, dateExpiration: true, note: true, fileId: true, updatedAt: true },
        },
      },
    });
    return {
      associations: fiches.map(({ pieces, ...o }) => {
        const piece = pieces[0];
        return {
          ...o,
          agrement: piece
            ? {
                etat: piece.etat,
                preuve: piece.preuve,
                dateEmission: piece.dateEmission,
                dateExpiration: piece.dateExpiration,
                note: piece.note,
                aUnFichier: Boolean(piece.fileId),
                updatedAt: piece.updatedAt,
              }
            : null,
        };
      }),
    };
  }

  /* ------------------------------------------------- côté association */

  /** Le catalogue des académies reliées à l'association. */
  async formationsDeLAssociation(accountId: string) {
    const { academies } = await this.liaisons.perimetreAssociation(accountId);
    return { academies: academies.map((a) => ({ id: a.id, nom: a.nom })), catalogue: await this.catalogue(academies) };
  }

  /* ------------------------------------------- relier une formation */

  async lierFormation(espace: 'academie' | 'association', accountId: string, actionId: string, coursId: string) {
    const { perimetre, academies } = await this.portee(espace, accountId);
    await this.projetDans(perimetre, actionId);
    const cours = academies.length
      ? await this.prisma.cours.findFirst({ where: { id: coursId, accountId: { in: academies.map((a) => a.accountId) } }, select: { id: true, accountId: true } })
      : null;
    if (!cours) throw new NotFoundException('Cette formation est introuvable.');
    const academie = academies.find((a) => a.accountId === cours.accountId) as EspaceResume;
    await this.prisma.projetFormation.upsert({
      where: { actionId_coursId: { actionId, coursId } },
      create: { actionId, coursId, academieId: academie.id },
      update: {},
    });
    return { ok: true };
  }

  async delierFormation(espace: 'academie' | 'association', accountId: string, actionId: string, coursId: string) {
    const { perimetre, academies } = await this.portee(espace, accountId);
    await this.projetDans(perimetre, actionId);
    await this.prisma.projetFormation.deleteMany({ where: { actionId, coursId, academieId: { in: academies.map((a) => a.id) } } });
    return { ok: true };
  }

  /* ------------------------------------------------------------ outils */

  /** Le périmètre des projets, et les académies dont on peut lier les formations. */
  private async portee(espace: 'academie' | 'association', accountId: string): Promise<{ perimetre: Perimetre; academies: EspaceResume[] }> {
    if (espace === 'academie') {
      const { perimetre, academie } = await this.liaisons.perimetreAcademie(accountId);
      return { perimetre, academies: [academie] };
    }
    const { perimetre, academies } = await this.liaisons.perimetreAssociation(accountId);
    return { perimetre, academies };
  }

  private async projetDans(p: Perimetre, id: string) {
    const projet = await this.prisma.actionAssociation.findFirst({ where: { id, ...filtreProprietaire(p) }, select: { id: true } });
    if (!projet) throw new NotFoundException('Ce projet est introuvable.');
    return projet;
  }

  private async catalogue(academies: EspaceResume[]) {
    if (!academies.length) return [];
    const nom = new Map(academies.map((a) => [a.accountId, a]));
    const cours = await this.prisma.cours.findMany({
      where: { accountId: { in: academies.map((a) => a.accountId) } },
      select: { id: true, titre: true, statut: true, accountId: true },
      orderBy: [{ ordre: 'asc' }, { createdAt: 'desc' }],
    });
    return cours.map((c) => ({ id: c.id, titre: c.titre, statut: c.statut, academieId: nom.get(c.accountId)!.id, academieNom: nom.get(c.accountId)!.nom }));
  }
}

/* ------------------------------------------------------------------ pur */

const texte = (v: string | null | undefined) => (v === undefined ? undefined : v?.trim() || null);
const date = (v: string | null | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);

/** Les champs d'un nouveau projet (mêmes règles que « Mes projets » de l'association). */
export function donneesProjet(dto: ProjetAcademieDto) {
  return {
    intitule: dto.intitule.trim(),
    resume: dto.resume?.trim() || null,
    lieu: dto.lieu?.trim() || null,
    dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : null,
    dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
    etat: dto.etat ?? EtatAction.PREVUE,
    beneficiaires: dto.beneficiaires ?? null,
    benevoles: dto.benevoles ?? null,
    heuresBenevoles: dto.heuresBenevoles ?? null,
    cout: dto.cout ?? null,
    partenaires: dto.partenaires?.trim() || null,
    bilan: dto.bilan?.trim() || null,
  };
}

export function modificationsProjet(dto: ModifierActionDto) {
  return {
    intitule: dto.intitule?.trim(),
    resume: texte(dto.resume),
    lieu: texte(dto.lieu),
    dateDebut: date(dto.dateDebut),
    dateFin: date(dto.dateFin),
    etat: dto.etat,
    beneficiaires: dto.beneficiaires,
    benevoles: dto.benevoles,
    heuresBenevoles: dto.heuresBenevoles,
    cout: dto.cout,
    partenaires: texte(dto.partenaires),
    bilan: texte(dto.bilan),
  };
}

/** Les mêmes chiffres que l'écran de l'association. */
export function resumerProjets(actions: Pick<ActionAssociation, 'etat' | 'beneficiaires' | 'benevoles' | 'heuresBenevoles' | 'cout' | 'bilan'>[]) {
  const somme = (f: (a: (typeof actions)[number]) => number | null) => actions.reduce((t, a) => t + (f(a) ?? 0), 0);
  const terminees = actions.filter((a) => a.etat === EtatAction.TERMINEE);
  return {
    total: actions.length,
    prevues: actions.filter((a) => a.etat === EtatAction.PREVUE).length,
    enCours: actions.filter((a) => a.etat === EtatAction.EN_COURS).length,
    terminees: terminees.length,
    beneficiaires: somme((a) => a.beneficiaires),
    benevoles: somme((a) => a.benevoles),
    heuresBenevoles: somme((a) => a.heuresBenevoles),
    cout: somme((a) => a.cout),
    sansBilan: terminees.filter((a) => !a.bilan).length,
  };
}
