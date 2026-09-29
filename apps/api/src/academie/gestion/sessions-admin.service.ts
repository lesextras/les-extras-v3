import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { FinancingType, InscriptionStatus, Prisma, SessionStatus, TypeStagiaire } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ContexteGestion } from './contexte.service';
import {
  CreneauDto,
  FormateurDto,
  ModifierFormateurDto,
  ModifierSalleDto,
  ReglagesAdministrationDto,
  ModifierSessionAdminDto,
  ModifierStagiaireDto,
  ProgrammeBpfDto,
  SalleDto,
  SerieCreneauxDto,
  StagiaireDto,
} from './dto/gestion.dto';
import {
  arrondi2,
  chevauche,
  demiJourneesDuPlanning,
  heuresEntre,
  heuresRealisees,
  nouveauJeton,
  objectifsEnListe,
} from './outils';

/**
 * LES SESSIONS, VUES DE L'ADMINISTRATION.
 *
 * Le programme (Formation) et ses sessions existaient : le catalogue de
 * l'académie les crée depuis « Mes formations ». Ce service ajoute ce qu'un
 * organisme fait autour : l'annuaire des formateurs et des salles, le
 * planning créneau par créneau (et ses conflits), les stagiaires avec leur
 * employeur et leur financement, et l'état de chaque session.
 */
@Injectable()
export class SessionsAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: ContexteGestion,
  ) {}

  /* ============================================================ annuaire */

  async formateurs(accountId: string) {
    await this.ctx.academie(accountId);
    const liste = await this.prisma.formateurOrganisme.findMany({
      where: { accountId },
      orderBy: [{ actif: 'desc' }, { nom: 'asc' }],
      include: { _count: { select: { sessions: true, creneaux: true } } },
    });
    return liste;
  }

  async creerFormateur(accountId: string, dto: FormateurDto) {
    await this.ctx.academie(accountId);
    return this.prisma.formateurOrganisme.create({
      data: {
        accountId,
        prenom: dto.prenom.trim(),
        nom: dto.nom.trim(),
        email: dto.email?.trim().toLowerCase() || null,
        telephone: dto.telephone?.trim() || null,
        statut: dto.statut ?? 'INTERNE',
        structure: dto.structure?.trim() || null,
        siret: dto.siret || null,
        metier: dto.metier?.trim() || null,
        competences: (dto.competences ?? []).map((c) => c.trim()).filter(Boolean),
        diplomes: dto.diplomes?.trim() || null,
        actif: dto.actif ?? true,
      },
    });
  }

  async modifierFormateur(accountId: string, id: string, dto: ModifierFormateurDto) {
    const f = await this.prisma.formateurOrganisme.findFirst({ where: { id, accountId } });
    if (!f) throw new NotFoundException('Formateur introuvable.');
    const data: Prisma.FormateurOrganismeUpdateInput = {};
    for (const cle of ['prenom', 'nom', 'telephone', 'structure', 'metier', 'diplomes'] as const) {
      if (dto[cle] !== undefined) (data as Record<string, unknown>)[cle] = dto[cle]?.trim() || (cle === 'prenom' || cle === 'nom' ? f[cle] : null);
    }
    if (dto.email !== undefined) data.email = dto.email?.trim().toLowerCase() || null;
    if (dto.siret !== undefined) {
      if (dto.siret && !/^\d{14}$/.test(dto.siret)) throw new BadRequestException('Le SIRET compte quatorze chiffres.');
      data.siret = dto.siret || null;
    }
    if (dto.statut) data.statut = dto.statut;
    if (dto.competences) data.competences = dto.competences.map((c) => c.trim()).filter(Boolean);
    if (dto.actif !== undefined) data.actif = dto.actif;
    return this.prisma.formateurOrganisme.update({ where: { id }, data });
  }

  /**
   * On ne supprime pas un formateur qui a animé : il figure sur des feuilles
   * d'émargement et dans le BPF. On le rend inactif (il sort des listes de
   * choix, il reste dans l'historique).
   */
  async supprimerFormateur(accountId: string, id: string) {
    const f = await this.prisma.formateurOrganisme.findFirst({
      where: { id, accountId },
      include: { _count: { select: { sessions: true, creneaux: true } } },
    });
    if (!f) throw new NotFoundException('Formateur introuvable.');
    if (f._count.sessions || f._count.creneaux) {
      await this.prisma.formateurOrganisme.update({ where: { id }, data: { actif: false } });
      return { supprime: false, inactif: true };
    }
    await this.prisma.formateurOrganisme.delete({ where: { id } });
    return { supprime: true };
  }

  async salles(accountId: string) {
    await this.ctx.academie(accountId);
    return this.prisma.salleOrganisme.findMany({
      where: { accountId },
      orderBy: [{ actif: 'desc' }, { nom: 'asc' }],
      include: { _count: { select: { sessions: true, creneaux: true } } },
    });
  }

  async creerSalle(accountId: string, dto: SalleDto) {
    await this.ctx.academie(accountId);
    return this.prisma.salleOrganisme.create({
      data: {
        accountId,
        nom: dto.nom.trim(),
        adresse: dto.adresse?.trim() || null,
        capacite: dto.capacite ?? null,
        accessiblePmr: dto.accessiblePmr ?? false,
        equipements: dto.equipements?.trim() || null,
        actif: dto.actif ?? true,
      },
    });
  }

  async modifierSalle(accountId: string, id: string, dto: ModifierSalleDto) {
    const salle = await this.prisma.salleOrganisme.findFirst({ where: { id, accountId } });
    if (!salle) throw new NotFoundException('Salle introuvable.');
    return this.prisma.salleOrganisme.update({
      where: { id },
      data: {
        ...(dto.nom !== undefined ? { nom: dto.nom.trim() || salle.nom } : {}),
        ...(dto.adresse !== undefined ? { adresse: dto.adresse?.trim() || null } : {}),
        ...(dto.capacite !== undefined ? { capacite: dto.capacite ?? null } : {}),
        ...(dto.accessiblePmr !== undefined ? { accessiblePmr: dto.accessiblePmr } : {}),
        ...(dto.equipements !== undefined ? { equipements: dto.equipements?.trim() || null } : {}),
        ...(dto.actif !== undefined ? { actif: dto.actif } : {}),
      },
    });
  }

  async supprimerSalle(accountId: string, id: string) {
    const salle = await this.prisma.salleOrganisme.findFirst({
      where: { id, accountId },
      include: { _count: { select: { sessions: true, creneaux: true } } },
    });
    if (!salle) throw new NotFoundException('Salle introuvable.');
    if (salle._count.sessions || salle._count.creneaux) {
      await this.prisma.salleOrganisme.update({ where: { id }, data: { actif: false } });
      return { supprime: false, inactif: true };
    }
    await this.prisma.salleOrganisme.delete({ where: { id } });
    return { supprime: true };
  }

  /* ============================================================ sessions */

  /** Toutes les sessions de l'académie, avec ce qui leur manque. */
  async liste(accountId: string, filtre: { de?: string; a?: string } = {}) {
    await this.ctx.academie(accountId);
    const where: Prisma.FormationSessionWhereInput = { formation: { ownerAccountId: accountId } };
    if (filtre.de || filtre.a) {
      where.startDate = {
        ...(filtre.de ? { gte: new Date(filtre.de) } : {}),
        ...(filtre.a ? { lte: new Date(filtre.a) } : {}),
      };
    }
    const sessions = await this.prisma.formationSession.findMany({
      where,
      orderBy: { startDate: 'desc' },
      take: 300,
      include: {
        formation: { select: { id: true, title: true, durationHours: true } },
        formateurOrganisme: { select: { id: true, prenom: true, nom: true } },
        salle: { select: { id: true, nom: true } },
        _count: { select: { creneaux: true } },
        inscriptions: {
          select: { id: true, status: true, convocationEnvoyeeLe: true, satisfactionAt: true, coldAt: true },
        },
        documents: { select: { type: true, statut: true, inscriptionId: true } },
        factures: { select: { type: true, statut: true } },
      },
    });
    return sessions.map((s) => {
      const actifs = s.inscriptions.filter((i) => i.status !== InscriptionStatus.CANCELLED);
      return {
        id: s.id,
        titre: s.title || s.formation.title,
        formation: s.formation,
        startDate: s.startDate,
        endDate: s.endDate,
        status: s.status,
        location: s.location,
        modalite: s.modalite,
        maxSeats: s.maxSeats,
        formateur: s.formateurOrganisme,
        salle: s.salle,
        creneaux: s._count.creneaux,
        stagiaires: actifs.length,
        convoques: actifs.filter((i) => i.convocationEnvoyeeLe).length,
        evaluesChaud: actifs.filter((i) => i.satisfactionAt).length,
        evaluesFroid: actifs.filter((i) => i.coldAt).length,
        conventionsSignees: s.documents.filter((d) => (d.type === 'CONVENTION' || d.type === 'CONTRAT') && d.statut === 'SIGNE').length,
        conventions: s.documents.filter((d) => d.type === 'CONVENTION' || d.type === 'CONTRAT').length,
        facturee: s.factures.some((f) => f.type === 'FACTURE' && f.statut !== 'BROUILLON' && f.statut !== 'ANNULEE'),
      };
    });
  }

  /** La fiche complète d'une session, pour son écran d'administration. */
  async detail(accountId: string, sessionId: string) {
    await this.ctx.session(accountId, sessionId);
    const s = await this.prisma.formationSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        formation: true,
        formateurOrganisme: true,
        salle: true,
        creneaux: {
          orderBy: { debut: 'asc' },
          include: { formateur: { select: { id: true, prenom: true, nom: true } }, salle: { select: { id: true, nom: true } } },
        },
        inscriptions: { orderBy: { createdAt: 'asc' }, include: { emargements: true } },
        seances: { orderBy: [{ slotDate: 'asc' }, { slot: 'asc' }] },
        documents: { orderBy: { createdAt: 'desc' } },
        factures: { orderBy: { createdAt: 'desc' } },
      },
    });
    const planning = demiJourneesDuPlanning(s.creneaux);
    const duree = this.dureePrevue(s);
    const demiJourneesSession = new Set(s.inscriptions.flatMap((i) => i.emargements.map((e) => `${e.slotDate.toISOString()}:${e.slot}`))).size;
    const conflits = await this.conflits(accountId, s.creneaux.map((c) => ({ id: c.id, debut: c.debut, fin: c.fin, formateurId: c.formateurId, salleId: c.salleId })));
    return {
      ...s,
      objectifs: objectifsEnListe(s.formation.objectives),
      dureePrevue: duree,
      planning,
      conflits,
      inscriptions: s.inscriptions.map((i) => {
        const h = heuresRealisees(i.emargements, planning, duree, demiJourneesSession);
        return { ...i, heuresRealisees: h.heures, heuresEstimees: h.estime };
      }),
    };
  }

  /** La durée prévue par stagiaire : saisie, sinon le planning, sinon le programme. */
  dureePrevue(s: {
    dureeHeures: Prisma.Decimal | null;
    creneaux?: { debut: Date; fin: Date }[];
    formation: { durationHours: number | null; durationMinutes?: number | null };
  }): number | null {
    if (s.dureeHeures !== null && s.dureeHeures !== undefined) return Number(s.dureeHeures);
    if (s.creneaux?.length) return arrondi2(s.creneaux.reduce((t, c) => t + heuresEntre(c.debut, c.fin), 0));
    if (s.formation.durationHours) return s.formation.durationHours;
    if (s.formation.durationMinutes) return arrondi2(s.formation.durationMinutes / 60);
    return null;
  }

  async modifierSession(accountId: string, sessionId: string, dto: ModifierSessionAdminDto) {
    await this.ctx.session(accountId, sessionId);
    if (dto.formateurOrganismeId) await this.formateurDuCompte(accountId, dto.formateurOrganismeId);
    if (dto.salleId) await this.salleDuCompte(accountId, dto.salleId);
    const data: Prisma.FormationSessionUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title?.trim() || null;
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (dto.location !== undefined) data.location = dto.location?.trim() || null;
    if (dto.maxSeats !== undefined) data.maxSeats = dto.maxSeats ?? null;
    if (dto.priceHt !== undefined) data.priceHt = dto.priceHt;
    if (dto.status) data.status = dto.status;
    if (dto.formateurOrganismeId !== undefined) {
      data.formateurOrganisme = dto.formateurOrganismeId ? { connect: { id: dto.formateurOrganismeId } } : { disconnect: true };
    }
    if (dto.salleId !== undefined) data.salle = dto.salleId ? { connect: { id: dto.salleId } } : { disconnect: true };
    if (dto.modalite) data.modalite = dto.modalite;
    if (dto.tauxDistanciel !== undefined) data.tauxDistanciel = dto.tauxDistanciel;
    if (dto.intra !== undefined) data.intra = dto.intra;
    if (dto.sousTraitance) data.sousTraitance = dto.sousTraitance;
    if (dto.organismePartenaire !== undefined) data.organismePartenaire = dto.organismePartenaire?.trim() || null;
    if (dto.dureeHeures !== undefined) data.dureeHeures = dto.dureeHeures;
    if (dto.infosPratiques !== undefined) data.infosPratiques = dto.infosPratiques?.trim() || null;
    if (dto.enquetesAuto !== undefined) data.enquetesAuto = dto.enquetesAuto;
    if (dto.convocationsAuto !== undefined) data.convocationsAuto = dto.convocationsAuto;
    if (dto.delaiFroidJours !== undefined) data.delaiFroidJours = dto.delaiFroidJours;
    await this.prisma.formationSession.update({ where: { id: sessionId }, data });
    return this.detail(accountId, sessionId);
  }

  /** Les champs BPF du PROGRAMME (nature, objectif, NSF, code de certification). */
  async modifierProgrammeBpf(accountId: string, formationId: string, dto: ProgrammeBpfDto) {
    await this.ctx.academie(accountId);
    const f = await this.prisma.formation.findFirst({ where: { id: formationId, ownerAccountId: accountId } });
    if (!f) throw new NotFoundException('Programme introuvable.');
    if (dto.codeNsf && !/^\d{3}[a-zA-Z]?$/.test(dto.codeNsf.trim())) {
      throw new BadRequestException('Un code NSF s’écrit avec trois chiffres, suivis ou non d’une lettre (ex. 330 ou 332t).');
    }
    return this.prisma.formation.update({
      where: { id: formationId },
      data: {
        ...(dto.natureAction ? { natureAction: dto.natureAction } : {}),
        ...(dto.objectifBpf ? { objectifBpf: dto.objectifBpf } : {}),
        ...(dto.codeNsf !== undefined ? { codeNsf: dto.codeNsf?.trim().toLowerCase() || null } : {}),
        ...(dto.codeCertification !== undefined ? { codeCertification: dto.codeCertification?.trim().toUpperCase() || null } : {}),
      },
      select: { id: true, natureAction: true, objectifBpf: true, codeNsf: true, codeCertification: true },
    });
  }

  private async formateurDuCompte(accountId: string, id: string) {
    const f = await this.prisma.formateurOrganisme.findFirst({ where: { id, accountId } });
    if (!f) throw new BadRequestException("Ce formateur n'est pas dans ton annuaire.");
    return f;
  }

  private async salleDuCompte(accountId: string, id: string) {
    const s = await this.prisma.salleOrganisme.findFirst({ where: { id, accountId } });
    if (!s) throw new BadRequestException("Cette salle n'est pas dans ton annuaire.");
    return s;
  }

  /* ============================================================ planning */

  /**
   * LES CONFLITS : un formateur ou une salle pris deux fois au même moment,
   * sur TOUTES les sessions de l'académie. On prévient, on n'interdit pas :
   * une salle peut accueillir deux petits groupes, un formateur peut animer
   * deux classes virtuelles enchaînées. Mais on ne laisse pas le découvrir le
   * matin même.
   */
  async conflits(accountId: string, creneaux: { id?: string; debut: Date; fin: Date; formateurId?: string | null; salleId?: string | null }[]) {
    if (!creneaux.length) return [];
    const min = new Date(Math.min(...creneaux.map((c) => c.debut.getTime())));
    const max = new Date(Math.max(...creneaux.map((c) => c.fin.getTime())));
    const autres = await this.prisma.creneauSession.findMany({
      where: {
        session: { formation: { ownerAccountId: accountId } },
        debut: { lt: max },
        fin: { gt: min },
      },
      include: {
        session: { select: { id: true, title: true, formation: { select: { title: true } } } },
        formateur: { select: { prenom: true, nom: true } },
        salle: { select: { nom: true } },
      },
    });
    const resultat: { creneauId?: string; avec: string; sessionId: string; quoi: 'formateur' | 'salle'; nom: string; debut: Date; fin: Date }[] = [];
    for (const c of creneaux) {
      for (const o of autres) {
        if (c.id && o.id === c.id) continue;
        if (!chevauche(c, o)) continue;
        const titre = o.session.title || o.session.formation.title;
        if (c.formateurId && o.formateurId === c.formateurId) {
          resultat.push({ creneauId: c.id, avec: titre, sessionId: o.sessionId, quoi: 'formateur', nom: `${o.formateur?.prenom ?? ''} ${o.formateur?.nom ?? ''}`.trim(), debut: o.debut, fin: o.fin });
        }
        if (c.salleId && o.salleId === c.salleId) {
          resultat.push({ creneauId: c.id, avec: titre, sessionId: o.sessionId, quoi: 'salle', nom: o.salle?.nom ?? '', debut: o.debut, fin: o.fin });
        }
      }
    }
    return resultat;
  }

  async ajouterCreneau(accountId: string, sessionId: string, dto: CreneauDto) {
    await this.ctx.session(accountId, sessionId);
    const debut = new Date(dto.debut);
    const fin = new Date(dto.fin);
    if (!(fin > debut)) throw new BadRequestException('La fin du créneau doit suivre son début.');
    if (heuresEntre(debut, fin) > 12) throw new BadRequestException('Un créneau ne dépasse pas douze heures : découpe-le en demi-journées.');
    if (dto.formateurId) await this.formateurDuCompte(accountId, dto.formateurId);
    if (dto.salleId) await this.salleDuCompte(accountId, dto.salleId);
    const creneau = await this.prisma.creneauSession.create({
      data: {
        sessionId,
        debut,
        fin,
        intitule: dto.intitule?.trim() || null,
        formateurId: dto.formateurId || null,
        salleId: dto.salleId || null,
        distanciel: dto.distanciel ?? false,
      },
    });
    await this.recalerDates(sessionId);
    const conflits = await this.conflits(accountId, [creneau]);
    return { creneau, conflits };
  }

  /** Une série : chaque jour, un créneau le matin et/ou l'après-midi (heures de Paris). */
  async ajouterSerie(accountId: string, sessionId: string, dto: SerieCreneauxDto) {
    const session = await this.ctx.session(accountId, sessionId);
    if (!dto.jours.length) throw new BadRequestException('Choisis au moins un jour.');
    const demi: { debut: string; fin: string }[] = [];
    if (dto.matinDebut && dto.matinFin) demi.push({ debut: dto.matinDebut, fin: dto.matinFin });
    if (dto.apresMidiDebut && dto.apresMidiFin) demi.push({ debut: dto.apresMidiDebut, fin: dto.apresMidiFin });
    if (!demi.length) throw new BadRequestException('Donne les heures du matin, de l’après-midi, ou des deux.');
    if (dto.formateurId) await this.formateurDuCompte(accountId, dto.formateurId);
    if (dto.salleId) await this.salleDuCompte(accountId, dto.salleId);
    const data: Prisma.CreneauSessionCreateManyInput[] = [];
    for (const jour of dto.jours) {
      const j = jour.slice(0, 10);
      for (const d of demi) {
        const debut = instantParis(j, d.debut);
        const fin = instantParis(j, d.fin);
        if (!(fin > debut)) throw new BadRequestException(`Sur ${j}, la fin d'une demi-journée doit suivre son début.`);
        data.push({ sessionId: session.id, debut, fin, formateurId: dto.formateurId || null, salleId: dto.salleId || null, distanciel: dto.distanciel ?? false });
      }
    }
    await this.prisma.creneauSession.createMany({ data });
    await this.recalerDates(sessionId);
    return this.detail(accountId, sessionId);
  }

  async modifierCreneau(accountId: string, sessionId: string, creneauId: string, dto: Partial<CreneauDto>) {
    await this.ctx.session(accountId, sessionId);
    const c = await this.prisma.creneauSession.findFirst({ where: { id: creneauId, sessionId } });
    if (!c) throw new NotFoundException('Créneau introuvable.');
    if (dto.formateurId) await this.formateurDuCompte(accountId, dto.formateurId);
    if (dto.salleId) await this.salleDuCompte(accountId, dto.salleId);
    const debut = dto.debut ? new Date(dto.debut) : c.debut;
    const fin = dto.fin ? new Date(dto.fin) : c.fin;
    if (!(fin > debut)) throw new BadRequestException('La fin du créneau doit suivre son début.');
    const maj = await this.prisma.creneauSession.update({
      where: { id: creneauId },
      data: {
        debut,
        fin,
        ...(dto.intitule !== undefined ? { intitule: dto.intitule?.trim() || null } : {}),
        ...(dto.formateurId !== undefined ? { formateurId: dto.formateurId || null } : {}),
        ...(dto.salleId !== undefined ? { salleId: dto.salleId || null } : {}),
        ...(dto.distanciel !== undefined ? { distanciel: dto.distanciel } : {}),
      },
    });
    await this.recalerDates(sessionId);
    return { creneau: maj, conflits: await this.conflits(accountId, [maj]) };
  }

  async supprimerCreneau(accountId: string, sessionId: string, creneauId: string) {
    await this.ctx.session(accountId, sessionId);
    const c = await this.prisma.creneauSession.findFirst({ where: { id: creneauId, sessionId } });
    if (!c) throw new NotFoundException('Créneau introuvable.');
    await this.prisma.creneauSession.delete({ where: { id: creneauId } });
    await this.recalerDates(sessionId);
    return { ok: true };
  }

  /** Les dates de la session suivent son planning (premier et dernier créneau). */
  private async recalerDates(sessionId: string) {
    const bornes = await this.prisma.creneauSession.aggregate({
      where: { sessionId },
      _min: { debut: true },
      _max: { fin: true },
    });
    if (bornes._min.debut && bornes._max.fin) {
      await this.prisma.formationSession.update({
        where: { id: sessionId },
        data: { startDate: bornes._min.debut, endDate: bornes._max.fin },
      });
    }
  }

  /** Le planning de toute l'académie sur une période (vue calendrier). */
  async planning(accountId: string, de: string, a: string) {
    await this.ctx.academie(accountId);
    const debut = new Date(de);
    const fin = new Date(a);
    if (Number.isNaN(debut.getTime()) || Number.isNaN(fin.getTime())) throw new BadRequestException('Période invalide.');
    const creneaux = await this.prisma.creneauSession.findMany({
      where: { session: { formation: { ownerAccountId: accountId } }, debut: { lt: fin }, fin: { gt: debut } },
      orderBy: { debut: 'asc' },
      include: {
        session: { select: { id: true, title: true, status: true, formation: { select: { title: true } } } },
        formateur: { select: { id: true, prenom: true, nom: true } },
        salle: { select: { id: true, nom: true } },
      },
    });
    const conflits = await this.conflits(accountId, creneaux);
    const enConflit = new Set(conflits.map((c) => c.creneauId));
    return creneaux.map((c) => ({ ...c, conflit: enConflit.has(c.id) }));
  }

  /* ============================================================ stagiaires */

  async ajouterStagiaire(accountId: string, sessionId: string, dto: StagiaireDto) {
    const session = await this.ctx.session(accountId, sessionId);
    if (session.status === SessionStatus.CANCELLED) throw new BadRequestException('Cette session est annulée.');
    const email = dto.email?.trim().toLowerCase() || null;
    if (email) {
      const doublon = await this.prisma.inscription.findFirst({
        where: { sessionId, learnerEmail: email, status: { not: InscriptionStatus.CANCELLED } },
        select: { id: true },
      });
      if (doublon) throw new ConflictException('Cette personne est déjà inscrite à la session.');
    }
    const financing = dto.financing ?? financementParDefaut(dto.typeStagiaire);
    return this.prisma.$transaction(async (tx) => {
      if (session.maxSeats !== null) {
        const occupees = await tx.inscription.count({ where: { sessionId, status: { not: InscriptionStatus.CANCELLED } } });
        if (occupees >= session.maxSeats) {
          throw new BadRequestException(`Session complète : les ${session.maxSeats} places sont prises. Augmente le nombre de places pour inscrire quelqu'un de plus.`);
        }
      }
      return tx.inscription.create({
        data: {
          sessionId,
          learnerName: dto.nom.trim(),
          learnerEmail: email,
          telephone: dto.telephone?.trim() || null,
          payerAccountId: accountId,
          financing,
          status: InscriptionStatus.CONFIRMED,
          typeStagiaire: dto.typeStagiaire ?? TypeStagiaire.SALARIE_PRIVE,
          origineFinancement: dto.origineFinancement ?? null,
          entrepriseNom: dto.entrepriseNom?.trim() || null,
          entrepriseSiret: dto.entrepriseSiret?.replace(/\s/g, '') || null,
          entrepriseAdresse: dto.entrepriseAdresse?.trim() || null,
          entrepriseContact: dto.entrepriseContact?.trim() || null,
          entrepriseEmail: dto.entrepriseEmail?.trim().toLowerCase() || null,
          financeurNom: dto.financeurNom?.trim() || null,
          numeroDossier: dto.numeroDossier?.trim() || null,
          prixHt: dto.prixHt ?? null,
          jetonStagiaire: nouveauJeton(),
          jetonCommanditaire: nouveauJeton(),
        },
      });
    });
  }

  async modifierStagiaire(accountId: string, inscriptionId: string, dto: ModifierStagiaireDto) {
    const inscription = await this.ctx.inscription(accountId, inscriptionId);
    const data: Prisma.InscriptionUpdateInput = {};
    if (dto.nom !== undefined) data.learnerName = dto.nom.trim();
    if (dto.email !== undefined) data.learnerEmail = dto.email?.trim().toLowerCase() || null;
    if (dto.telephone !== undefined) data.telephone = dto.telephone?.trim() || null;
    if (dto.typeStagiaire) data.typeStagiaire = dto.typeStagiaire;
    if (dto.financing) data.financing = dto.financing;
    if (dto.origineFinancement !== undefined) data.origineFinancement = dto.origineFinancement;
    for (const cle of ['entrepriseNom', 'entrepriseAdresse', 'entrepriseContact', 'financeurNom', 'numeroDossier', 'evalResult', 'motifAbandon'] as const) {
      if (dto[cle] !== undefined) (data as Record<string, unknown>)[cle] = dto[cle]?.trim() || null;
    }
    if (dto.entrepriseSiret !== undefined) {
      const siret = dto.entrepriseSiret?.replace(/\s/g, '') || null;
      if (siret && !/^\d{14}$/.test(siret)) throw new BadRequestException('Le SIRET compte quatorze chiffres.');
      data.entrepriseSiret = siret;
    }
    if (dto.entrepriseEmail !== undefined) data.entrepriseEmail = dto.entrepriseEmail?.trim().toLowerCase() || null;
    if (dto.prixHt !== undefined) data.prixHt = dto.prixHt;
    if (dto.status) {
      data.status = dto.status;
      if (dto.status === InscriptionStatus.CANCELLED && !inscription.abandonLe) data.abandonLe = new Date();
      if (dto.status !== InscriptionStatus.CANCELLED) data.abandonLe = null;
    }
    // Un stagiaire inscrit avant ce module n'a pas encore ses liens : on les pose.
    if (!inscription.jetonStagiaire) data.jetonStagiaire = nouveauJeton();
    if (!inscription.jetonCommanditaire) data.jetonCommanditaire = nouveauJeton();
    return this.prisma.inscription.update({ where: { id: inscriptionId }, data });
  }

  /** Nouveau lien personnel (l'ancien cesse de fonctionner). */
  async renouvelerLien(accountId: string, inscriptionId: string) {
    await this.ctx.inscription(accountId, inscriptionId);
    return this.prisma.inscription.update({
      where: { id: inscriptionId },
      data: { jetonStagiaire: nouveauJeton() },
      select: { id: true, jetonStagiaire: true },
    });
  }

  /**
   * Retirer un stagiaire : seulement s'il n'a laissé aucune trace (émargement,
   * facture, évaluation). Sinon on l'annule — une inscription qui a existé
   * reste dans l'historique et dans le BPF (taux d'abandon).
   */
  async retirerStagiaire(accountId: string, inscriptionId: string) {
    const inscription = await this.ctx.inscription(accountId, inscriptionId);
    const traces = await this.prisma.emargement.count({ where: { inscriptionId } });
    const facturee = await this.prisma.factureOrganisme.count({ where: { accountId, inscriptionIds: { has: inscriptionId }, statut: { not: 'BROUILLON' } } });
    if (traces || facturee || inscription.satisfactionAt || inscription.invoiceId) {
      await this.prisma.inscription.update({
        where: { id: inscriptionId },
        data: { status: InscriptionStatus.CANCELLED, abandonLe: inscription.abandonLe ?? new Date() },
      });
      return { supprime: false, annule: true };
    }
    await this.prisma.documentSession.deleteMany({ where: { accountId, inscriptionId } });
    await this.prisma.inscription.delete({ where: { id: inscriptionId } });
    return { supprime: true };
  }

  /** Les réglages que les documents et les factures impriment. */
  async reglages(accountId: string, dto: ReglagesAdministrationDto) {
    const a = await this.ctx.academie(accountId);
    const data: Prisma.AcademieUpdateInput = {};
    for (const [k, v] of Object.entries(dto)) {
      if (v === undefined) continue;
      (data as Record<string, unknown>)[k] = typeof v === 'string' ? v.trim() || null : v;
    }
    return this.prisma.academie.update({ where: { id: a.id }, data });
  }

  /** Assure que chaque inscription de la session a ses liens (anciennes inscriptions). */
  async assurerLiens(sessionId: string) {
    const sans = await this.prisma.inscription.findMany({
      where: { sessionId, OR: [{ jetonStagiaire: null }, { jetonCommanditaire: null }] },
      select: { id: true, jetonStagiaire: true, jetonCommanditaire: true },
    });
    for (const i of sans) {
      await this.prisma.inscription.update({
        where: { id: i.id },
        data: {
          ...(i.jetonStagiaire ? {} : { jetonStagiaire: nouveauJeton() }),
          ...(i.jetonCommanditaire ? {} : { jetonCommanditaire: nouveauJeton() }),
        },
      });
    }
  }
}

/** Le financement par défaut selon le type de stagiaire. */
export function financementParDefaut(type?: TypeStagiaire | null): FinancingType {
  if (type === TypeStagiaire.PARTICULIER) return FinancingType.PERSONAL;
  if (type === TypeStagiaire.DEMANDEUR_EMPLOI) return FinancingType.POLE_EMPLOI;
  return FinancingType.ESTABLISHMENT;
}

/**
 * Un instant à Paris (« 2026-10-12 » et « 09:00 ») converti en UTC.
 *
 * On essaie le décalage d'hiver puis celui d'été, et on garde celui qui,
 * relu à Paris, donne bien l'heure demandée : pas de bibliothèque de fuseaux
 * pour deux décalages possibles.
 */
export function instantParis(jour: string, heure: string): Date {
  for (const decalage of ['+01:00', '+02:00']) {
    const d = new Date(`${jour}T${heure}:00${decalage}`);
    const relu = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);
    if (relu === heure) return d;
  }
  return new Date(`${jour}T${heure}:00+01:00`);
}
