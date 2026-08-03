import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

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

  async list(accountId: string) {
    const contrats = await this.prisma.contratCDD.findMany({
      where: { accountId },
      orderBy: { dateDebut: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        mission: { select: { id: true, title: true } },
      },
    });
    return contrats.map((c) => ({
      ...c,
      emissible: mentionsManquantes(this.projet(c)).length === 0,
    }));
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
