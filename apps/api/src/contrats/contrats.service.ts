import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { bornes, page } from '../common/pagination';
import { chiffrer } from './proposition';
import { chiffrerVacation } from '../planning/majorations';
import { ParametresTempsService } from '../planning/parametres-temps.service';
import { CreateContratDto, DpaeDto, TerminerDto, UpdateContratDto } from './dto/contrat.dto';
import {
  CauseFinContrat,
  MOTIFS_RECOURS,
  MotifRecours,
  ProjetContrat,
  dureeEnJours,
  indemniteFinDeContrat,
  mentionsManquantes,
  periodeEssaiMaxJours,
  synthese,
} from './contrat-cdd';

/**
 * CONTRATS À DURÉE DÉTERMINÉE.
 *
 * L'établissement est l'employeur : il crée, signe et assume le contrat. La
 * plateforme n'intervient ni dans la rémunération ni dans une commission —
 * c'est ce qui la tient hors du prêt de main-d'œuvre (art. L. 8241-1).
 *
 * Deux garde-fous structurent le service :
 *
 *  - un contrat ne quitte l'état BROUILLON que si toutes les mentions de
 *    l'art. L. 1242-12 sont présentes. Un CDD auquel il manque la définition
 *    précise de son motif est réputé conclu pour une durée indéterminée : le
 *    laisser partir serait rendre un mauvais service, pas gagner du temps ;
 *  - un contrat transmis ne se modifie plus. On en crée un avenant ou un
 *    nouveau contrat. Réécrire un document déjà remis au salarié serait
 *    effacer la trace de ce qu'il a signé.
 */
@Injectable()
export class ContratsService {
  constructor(
    private readonly prisma: PrismaService,
    // Les taux de nuit, de dimanche et de jour ferie viennent de la
    // convention de l'etablissement, jamais du code : hors 1er mai, aucune
    // majoration n'est legale dans le medico-social.
    private readonly parametres: ParametresTempsService,
  ) {}

  /** Le contrat vu comme un projet, pour passer au moteur de règles. */
  private projet(c: {
    motif: string;
    salarieRemplaceNom: string | null;
    salarieRemplaceQualification: string | null;
    dateDebut: Date;
    dateFin: Date | null;
    dureeMinimaleJours: number | null;
    poste: string | null;
    qualification: string | null;
    posteARisques: boolean | null;
    conventionCollective: string | null;
    remunerationBrute: unknown;
    remunerationDetail: string | null;
    caisseRetraiteComplementaire: string | null;
    organismePrevoyance: string | null;
  }): ProjetContrat {
    return {
      motif: c.motif as MotifRecours,
      salarieRemplaceNom: c.salarieRemplaceNom,
      salarieRemplaceQualification: c.salarieRemplaceQualification,
      dateDebut: c.dateDebut,
      dateFin: c.dateFin,
      dureeMinimaleJours: c.dureeMinimaleJours,
      poste: c.poste,
      qualification: c.qualification,
      posteARisques: c.posteARisques,
      conventionCollective: c.conventionCollective,
      remunerationBrute: c.remunerationBrute == null ? null : Number(c.remunerationBrute),
      remunerationDetail: c.remunerationDetail,
      caisseRetraiteComplementaire: c.caisseRetraiteComplementaire,
      organismePrevoyance: c.organismePrevoyance,
    };
  }

  private async chargerPourCompte(id: string, accountId: string) {
    const c = await this.prisma.contratCDD.findFirst({
      where: { id, accountId },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        mission: { select: { id: true, title: true } },
      },
    });
    if (!c) throw new NotFoundException('Contrat introuvable.');
    return c;
  }

  private champsDepuisDto(dto: CreateContratDto | UpdateContratDto) {
    const dateDebut = dto.dateDebut ? new Date(dto.dateDebut) : undefined;
    const dateFin = dto.dateFin ? new Date(dto.dateFin) : undefined;
    if (dateDebut && dateFin && dateFin < dateDebut) {
      throw new BadRequestException('La date de fin doit être postérieure à la date de début.');
    }
    return {
      motif: dto.motif as MotifRecours | undefined,
      salarieRemplaceNom: dto.salarieRemplaceNom ?? undefined,
      salarieRemplaceQualification: dto.salarieRemplaceQualification ?? undefined,
      dateDebut,
      dateFin: dto.dateFin === undefined ? undefined : (dateFin ?? null),
      dureeMinimaleJours: dto.dureeMinimaleJours ?? undefined,
      poste: dto.poste ?? undefined,
      qualification: dto.qualification ?? undefined,
      posteARisques: dto.posteARisques ?? undefined,
      conventionCollective: dto.conventionCollective ?? undefined,
      remunerationBrute: dto.remunerationBrute ?? undefined,
      remunerationDetail: dto.remunerationDetail ?? undefined,
      caisseRetraiteComplementaire: dto.caisseRetraiteComplementaire ?? undefined,
      organismePrevoyance: dto.organismePrevoyance ?? undefined,
      missionId: dto.missionId ?? undefined,
    };
  }

  /** Les motifs légaux exposables, pour alimenter le formulaire côté front. */
  motifs() {
    return Object.entries(MOTIFS_RECOURS).map(([code, d]) => ({ code, ...d }));
  }

  /**
   * Les personnes que l'établissement peut embaucher, sans qu'il ait à les
   * retrouver à la main. Trois provenances, fusionnées et dédoublonnées :
   * son propre pool (membres du compte), les intervenants déjà positionnés
   * sur un de ses créneaux, et ceux dont une candidature a été retenue sur
   * une de ses missions. C'est exactement le geste qu'on lui vend : la
   * personne a été trouvée par la plateforme, le contrat part d'elle.
   */
  async salariesPossibles(accountId: string) {
    const champs = { id: true, firstName: true, lastName: true, email: true } as const;
    const [membres, surLePlanning, retenus] = await Promise.all([
      this.prisma.membership.findMany({
        where: { accountId, status: 'ACTIVE' },
        select: { user: { select: champs } },
      }),
      this.prisma.shift.findMany({
        where: { accountId, freelanceId: { not: null } },
        distinct: ['freelanceId'],
        select: { freelance: { select: champs } },
      }),
      this.prisma.booking.findMany({
        where: {
          mission: { accountId },
          status: { in: ['ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] },
        },
        select: { account: { select: { owner: { select: champs } } } },
      }),
    ]);

    const parId = new Map<string, { id: string; firstName: string | null; lastName: string | null; email: string; origine: string }>();
    const ajouter = (u: { id: string; firstName: string | null; lastName: string | null; email: string } | null, origine: string) => {
      if (u && !parId.has(u.id)) parId.set(u.id, { ...u, origine });
    };
    membres.forEach((m) => ajouter(m.user, 'Pool interne'));
    surLePlanning.forEach((s) => ajouter(s.freelance, 'Déjà sur votre planning'));
    retenus.forEach((b) => ajouter(b.account?.owner ?? null, 'Candidature retenue'));

    return [...parId.values()].sort((a, b) =>
      `${a.lastName ?? ''}${a.firstName ?? ''}`.localeCompare(`${b.lastName ?? ''}${b.firstName ?? ''}`, 'fr'),
    );
  }

  /**
   * LA PROPOSITION D'ENGAGEMENT liée à un renfort pourvu.
   *
   * Ce que la plateforme produit après avoir trouvé quelqu'un n'est pas un
   * contrat : c'est un chiffrage. L'établissement s'en sert pour établir SON
   * contrat de travail. Cette méthode assemble tout ce que le document doit
   * dire — qui, quoi, quand, combien — sans rien inventer sur les charges.
   */
  async proposition(accountId: string, bookingId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        OR: [{ accountId }, { mission: { accountId } }, { service: { accountId } }],
      },
      include: {
        mission: {
          include: {
            account: {
              select: {
                id: true,
                name: true,
                legalName: true,
                siret: true,
                address: true,
                postalCode: true,
                city: true,
              },
            },
          },
        },
        account: {
          select: {
            id: true,
            name: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                profile: { select: { job: true, city: true } },
              },
            },
          },
        },
      },
    });
    if (!booking?.mission) {
      throw new NotFoundException('Proposition introuvable pour ce renfort.');
    }

    const m = booking.mission;
    return {
      booking: { id: booking.id, status: booking.status, createdAt: booking.createdAt },
      etablissement: m.account,
      candidat: booking.account?.owner ?? null,
      mission: {
        id: m.id,
        title: m.title,
        description: m.description,
        job: m.job,
        startDate: m.startDate,
        endDate: m.endDate,
        startTime: m.startTime,
        endTime: m.endTime,
        city: m.city,
        postalCode: m.postalCode,
        headcount: m.headcount,
      },
      chiffrage: chiffrer({
        startDate: m.startDate,
        endDate: m.endDate,
        startTime: m.startTime,
        endTime: m.endTime,
        hourlyRate: m.hourlyRate == null ? null : Number(m.hourlyRate),
        headcount: m.headcount,
      }),
      /**
       * Le détail des sujétions : combien d'heures tombent la nuit, le
       * dimanche, un jour férié. C'est ce qui manquait au chiffrage — un
       * internat qui remplace une nuit du samedi au dimanche de Pentecôte ne
       * paie pas le même prix qu'une journée de semaine, et personne ne fait
       * ce découpage juste à la main.
       *
       * Les taux viennent des paramètres de l'établissement, jamais du code :
       * hors 1er mai, aucune majoration n'est légale dans le médico-social.
       */
      sujetions: await this.sujetions(m.accountId, m),
    };
  }

  /**
   * Découpe la période de la mission en heures de nuit, de dimanche et de
   * férié, et applique les taux de l'établissement.
   *
   * On raisonne jour par jour sur la vacation type, car une mission de
   * remplacement se décrit par un horaire répété — pas par une liste de
   * créneaux. C'est une estimation, et elle est annoncée comme telle.
   */
  private async sujetions(
    accountId: string,
    m: {
      startDate: Date;
      endDate: Date | null;
      startTime: string | null;
      endTime: string | null;
      hourlyRate: unknown;
      headcount: number;
    },
  ) {
    if (!m.startTime || !m.endTime) return null;

    const p = await this.parametres.lire(accountId);
    const majorations = {
      nuitDebutHeure: p.nuitDebutHeure,
      nuitFinHeure: p.nuitFinHeure,
      nuitPct: p.nuitPct,
      dimanchePct: p.dimanchePct,
      feriePct: p.feriePct,
      cumulDimancheEtFerie: p.cumulDimancheEtFerie,
      droitLocal: p.droitLocal,
      vendrediSaint: p.vendrediSaint,
    };

    const enMinutes = (h: string): number | null => {
      const x = h.trim().match(/^(\d{1,2})\s*[h:]\s*(\d{0,2})$/i);
      if (!x) return null;
      const heures = Number(x[1]);
      const min = x[2] ? Number(x[2]) : 0;
      if (heures > 23 || min > 59) return null;
      return heures * 60 + min;
    };
    const d1 = enMinutes(m.startTime);
    const d2 = enMinutes(m.endTime);
    if (d1 === null || d2 === null) return null;

    const taux = m.hourlyRate == null ? null : Number(m.hourlyRate);
    const jourMs = 86_400_000;
    const debutJour = new Date(
      Date.UTC(
        m.startDate.getUTCFullYear(),
        m.startDate.getUTCMonth(),
        m.startDate.getUTCDate(),
      ),
    );
    const finJour = m.endDate
      ? new Date(
          Date.UTC(m.endDate.getUTCFullYear(), m.endDate.getUTCMonth(), m.endDate.getUTCDate()),
        )
      : debutJour;

    // Une mission longue se chiffre par échantillon : au-delà de quatre-vingt-
    // douze jours, la boucle coûterait plus qu'elle n'apporte de précision.
    const jours = Math.min(
      92,
      Math.max(1, Math.round((finJour.getTime() - debutJour.getTime()) / jourMs) + 1),
    );

    const cumul = { total: 0, nuit: 0, dimanche: 0, ferie: 0, premierMai: 0 };
    let surcout = 0;
    const feries = new Map<string, { nom: string; libelle: string; date: string }>();

    for (let i = 0; i < jours; i++) {
      const jour = new Date(debutJour.getTime() + i * jourMs);
      const debut = new Date(jour.getTime() + d1 * 60_000);
      // Une fin antérieure au début désigne un service qui passe minuit.
      const fin = new Date(jour.getTime() + (d2 > d1 ? d2 : d2 + 24 * 60) * 60_000);
      const c = chiffrerVacation({ debut, fin }, majorations, taux);
      cumul.total += c.heures.total;
      cumul.nuit += c.heures.nuit;
      cumul.dimanche += c.heures.dimanche;
      cumul.ferie += c.heures.ferie;
      cumul.premierMai += c.heures.premierMai;
      surcout += c.totalMajorations ?? 0;
      c.heures.feriesRencontres.forEach((f) =>
        feries.set(f.date, { nom: f.nom, libelle: f.libelle, date: f.date }),
      );
    }

    const postes = Math.max(1, m.headcount ?? 1);
    const arrondi = (v: number) => Math.round(v * postes * 100) / 100;

    return {
      joursCouverts: jours,
      postes,
      heures: {
        total: arrondi(cumul.total),
        nuit: arrondi(cumul.nuit),
        dimanche: arrondi(cumul.dimanche),
        ferie: arrondi(cumul.ferie),
        premierMai: arrondi(cumul.premierMai),
      },
      feriesRencontres: [...feries.values()].sort((a, b) => a.date.localeCompare(b.date)),
      surcoutEstime: taux === null ? null : arrondi(surcout),
      tauxAppliques: {
        nuitPct: p.nuitPct,
        dimanchePct: p.dimanchePct,
        feriePct: p.feriePct,
        source: p.renseigne
          ? 'Taux renseignés par votre établissement d’après sa convention.'
          : "Aucun taux n'est renseigné. Ce n'est pas un oubli du logiciel : hors 1er mai, la loi n'impose aucune majoration de nuit, de dimanche ni de jour férié dans le médico-social. Renseignez ceux de votre convention dans les réglages du temps de travail.",
      },
    };
  }

  /**
   * Le pont : une proposition acceptée devient un brouillon de CDD.
   *
   * On reprend ce que l'on sait déjà — la personne, le poste, les dates, le
   * taux — et on laisse vides les mentions que seul l'employeur connaît :
   * convention collective, caisse de retraite, prévoyance. C'est là que la
   * plateforme s'arrête et que l'établissement prend la main.
   *
   * Idempotent : rappeler la méthode sur le même renfort renvoie le brouillon
   * déjà créé plutôt qu'un doublon — un directeur qui clique deux fois ne doit
   * pas se retrouver avec deux contrats pour la même personne.
   */
  async depuisRenfort(accountId: string, accountType: string, bookingId: string) {
    if (accountType !== 'ESTABLISHMENT') {
      throw new ForbiddenException(
        "Seul un établissement peut embaucher : c'est lui l'employeur du contrat.",
      );
    }
    const p = await this.proposition(accountId, bookingId);
    if (!p.candidat) {
      throw new BadRequestException(
        "Ce renfort n'identifie aucune personne : impossible d'en tirer un contrat.",
      );
    }

    const existant = await this.prisma.contratCDD.findFirst({
      where: { accountId, missionId: p.mission.id, userId: p.candidat.id },
      orderBy: { createdAt: 'desc' },
    });
    if (existant) return this.get(accountId, existant.id);

    const brut = p.chiffrage.brutEstime;
    const cree = await this.prisma.contratCDD.create({
      data: {
        accountId,
        userId: p.candidat.id,
        missionId: p.mission.id,
        // Un renfort couvre presque toujours une absence. Le motif reste
        // modifiable : c'est une proposition de départ, pas une décision.
        motif: 'REMPLACEMENT_SALARIE_ABSENT',
        dateDebut: p.mission.startDate,
        dateFin: p.mission.endDate,
        poste: p.mission.job ?? p.mission.title,
        qualification: p.candidat.profile?.job ?? null,
        remunerationBrute: brut,
        remunerationDetail: p.chiffrage.tauxHoraire
          ? `Sur la base de ${p.chiffrage.tauxHoraire} € brut de l'heure, ${p.chiffrage.heuresTotales ?? '?'} heures estimées.`
          : null,
      } as never,
    });
    return this.get(accountId, cree.id);
  }

  async create(accountId: string, accountType: string, dto: CreateContratDto) {
    if (accountType !== 'ESTABLISHMENT') {
      throw new ForbiddenException(
        "Seul un établissement peut embaucher : c'est lui l'employeur du contrat.",
      );
    }
    const champs = this.champsDepuisDto(dto);
    const contrat = await this.prisma.contratCDD.create({
      data: {
        accountId,
        userId: dto.userId,
        ...champs,
        motif: dto.motif,
        dateDebut: new Date(dto.dateDebut),
      } as never,
    });
    return this.get(accountId, contrat.id);
  }

  /**
   * Les contrats du compte, page par page. Un établissement qui embauche
   * régulièrement en accumule des centaines par an : la liste entière n'a
   * jamais été une réponse, et `userId` permet d'ouvrir directement ceux
   * d'une personne depuis sa fiche, sans tout charger pour en filtrer trois.
   */
  async list(accountId: string, filtres: { page?: number; perPage?: number; userId?: string } = {}) {
    const { page: p, perPage, skip, take } = bornes(filtres);
    const where = { accountId, ...(filtres.userId ? { userId: filtres.userId } : {}) };

    const [contrats, total] = await Promise.all([
      this.prisma.contratCDD.findMany({
        where,
        orderBy: { dateDebut: 'desc' },
        skip,
        take,
        include: {
          user: { select: { id: true, firstName: true, lastName: true } },
          mission: { select: { id: true, title: true } },
        },
      }),
      this.prisma.contratCDD.count({ where }),
    ]);

    return page(
      contrats.map((c) => ({
        ...c,
        emissible: mentionsManquantes(this.projet(c)).length === 0,
      })),
      total,
      p,
      perPage,
    );
  }

  /**
   * Un contrat n'est jamais rendu seul : il vient avec sa synthèse — durée,
   * période d'essai, indemnité de précarité, délai de carence à respecter
   * ensuite, échéances de DPAE et de transmission. C'est ce calcul que
   * l'établissement ne fait pas, et c'est ce pour quoi il paie l'outil.
   */
  async get(accountId: string, id: string) {
    const c = await this.chargerPourCompte(id, accountId);
    return { contrat: c, synthese: synthese(this.projet(c)) };
  }

  async update(accountId: string, id: string, dto: UpdateContratDto) {
    const existant = await this.chargerPourCompte(id, accountId);
    if (existant.statut !== 'BROUILLON') {
      throw new BadRequestException(
        "Ce contrat a déjà été transmis : il ne se modifie plus. Créez un avenant ou un nouveau contrat.",
      );
    }
    const champs = this.champsDepuisDto(dto);
    await this.prisma.contratCDD.update({
      where: { id },
      data: { ...champs, userId: dto.userId ?? undefined } as never,
    });
    return this.get(accountId, id);
  }

  /**
   * Transmission au salarié. C'est le point de non-retour : on refuse de
   * transmettre un contrat auquel il manque une mention obligatoire, avec la
   * liste exacte de ce qui manque et l'article correspondant.
   */
  async transmettre(accountId: string, id: string) {
    const c = await this.chargerPourCompte(id, accountId);
    if (c.statut !== 'BROUILLON') {
      throw new BadRequestException('Ce contrat a déjà été transmis.');
    }
    const p = this.projet(c);
    const manquantes = mentionsManquantes(p);
    if (manquantes.length) {
      throw new BadRequestException({
        code: 'MENTIONS_OBLIGATOIRES',
        message:
          manquantes.length === 1
            ? manquantes[0].message
            : `${manquantes.length} mentions obligatoires manquent au contrat.`,
        aide:
          "Un CDD auquel il manque la définition précise de son motif est réputé conclu pour une durée indéterminée (art. L. 1242-12). Complétez avant de transmettre.",
        manquantes,
      });
    }
    const duree = c.dateFin ? dureeEnJours(c.dateDebut, c.dateFin) : (c.dureeMinimaleJours ?? 0);
    await this.prisma.contratCDD.update({
      where: { id },
      data: {
        statut: 'TRANSMIS',
        transmisLe: new Date(),
        periodeEssaiJours: periodeEssaiMaxJours(duree),
      },
    });
    return this.get(accountId, id);
  }

  /** Enregistre la déclaration préalable à l'embauche. */
  async declarerDpae(accountId: string, id: string, dto: DpaeDto) {
    const c = await this.chargerPourCompte(id, accountId);
    const effectuee = new Date(dto.effectueeLe);
    if (effectuee > c.dateDebut) {
      throw new BadRequestException(
        "La déclaration préalable à l'embauche doit précéder le début du contrat.",
      );
    }
    await this.prisma.contratCDD.update({
      where: { id },
      data: { dpaeEffectueeLe: effectuee, dpaeReference: dto.reference ?? null },
    });
    return this.get(accountId, id);
  }

  /**
   * Fin du contrat. La cause décide de l'indemnité de précarité : elle n'est
   * pas due en cas de refus d'un CDI, de rupture par le salarié, de faute
   * grave ou de force majeure (art. L. 1243-10).
   */
  async terminer(accountId: string, id: string, dto: TerminerDto) {
    const c = await this.chargerPourCompte(id, accountId);
    if (c.statut === 'TERMINE' || c.statut === 'ROMPU') {
      throw new BadRequestException('Ce contrat est déjà clos.');
    }
    const brut = dto.remunerationBruteTotale ?? Number(c.remunerationBrute ?? 0);
    const indemnite = indemniteFinDeContrat(brut, dto.cause as CauseFinContrat);
    await this.prisma.contratCDD.update({
      where: { id },
      data: {
        statut: dto.cause === 'TERME_NORMAL' ? 'TERMINE' : 'ROMPU',
        causeFin: dto.cause,
        termineLe: new Date(),
      },
    });
    const apres = await this.get(accountId, id);
    return { ...apres, indemnite };
  }
}
