import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { EmargementSlot, InscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ContexteGestion } from './contexte.service';
import { OuvrirSeanceDto, PresenceDto, SignatureFormateurDto, SignatureStagiaireDto } from './dto/gestion.dto';
import { codeSixChiffres, dateDeSlot, demiJournee, empreinte, traceValide } from './outils';

/** Une séance ouverte reste signable douze heures, pas davantage. */
export const DUREE_SEANCE_HEURES = 12;

/**
 * L'ÉMARGEMENT SIGNÉ, DEMI-JOURNÉE PAR DEMI-JOURNÉE.
 *
 * C'est la preuve de réalisation la plus regardée en contrôle (OPCO, Caisse
 * des dépôts pour le CPF, DREETS). Trois gestes :
 *
 *  1. le formateur OUVRE la séance : un code à six chiffres s'affiche ;
 *  2. chaque stagiaire présent ouvre son lien personnel, recopie le code et
 *     signe du doigt ou à la souris ;
 *  3. le formateur signe la séance, qu'il ferme ensuite.
 *
 * Chaque signature garde l'heure, l'adresse IP, le navigateur et l'empreinte
 * SHA-256 de ce qui a été signé. ⚠ Aucun texte officiel ne fixe le format d'un
 * émargement électronique : on applique les usages que les financeurs
 * regardent (identification individuelle, horodatage, journal, document non
 * modifiable) sans prétendre à une norme qui n'existe pas.
 *
 * La présence DÉCLARÉE par l'organisme (case cochée) reste possible pour une
 * personne qui n'a pas pu signer : la feuille la distingue d'une signature.
 */
@Injectable()
export class EmargementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: ContexteGestion,
  ) {}

  /** Ouvre (ou rouvre) la séance de cette demi-journée et rend son code. */
  async ouvrir(accountId: string, sessionId: string, dto: OuvrirSeanceDto) {
    await this.ctx.session(accountId, sessionId);
    const maintenant = new Date();
    const slotDate = dto.slotDate ? dateDeSlot(new Date(`${dto.slotDate.slice(0, 10)}T12:00:00Z`)) : dateDeSlot(maintenant);
    const slot = (dto.slot ?? demiJournee(maintenant)) as EmargementSlot;
    const existante = await this.prisma.seanceEmargement.findUnique({
      where: { sessionId_slotDate_slot: { sessionId, slotDate, slot } },
    });
    if (existante && !existante.fermeeLe) return existante;
    if (existante) {
      return this.prisma.seanceEmargement.update({
        where: { id: existante.id },
        data: { fermeeLe: null, ouverteLe: maintenant, code: codeSixChiffres() },
      });
    }
    return this.prisma.seanceEmargement.create({
      data: { sessionId, slotDate, slot, code: codeSixChiffres(), ouverteLe: maintenant },
    });
  }

  async fermer(accountId: string, sessionId: string, seanceId: string) {
    await this.ctx.session(accountId, sessionId);
    const seance = await this.prisma.seanceEmargement.findFirst({ where: { id: seanceId, sessionId } });
    if (!seance) throw new NotFoundException('Séance introuvable.');
    return this.prisma.seanceEmargement.update({ where: { id: seanceId }, data: { fermeeLe: new Date() } });
  }

  /** Nouveau code (si l'ancien a circulé hors de la salle). */
  async nouveauCode(accountId: string, sessionId: string, seanceId: string) {
    await this.ctx.session(accountId, sessionId);
    const seance = await this.prisma.seanceEmargement.findFirst({ where: { id: seanceId, sessionId } });
    if (!seance) throw new NotFoundException('Séance introuvable.');
    return this.prisma.seanceEmargement.update({ where: { id: seanceId }, data: { code: codeSixChiffres() } });
  }

  /** Le formateur signe la séance. */
  async signerFormateur(accountId: string, sessionId: string, seanceId: string, dto: SignatureFormateurDto, ip: string | null) {
    await this.ctx.session(accountId, sessionId);
    const seance = await this.prisma.seanceEmargement.findFirst({ where: { id: seanceId, sessionId } });
    if (!seance) throw new NotFoundException('Séance introuvable.');
    const trace = traceValide(dto.trace);
    if (!trace) throw new BadRequestException('La signature est vide ou illisible : signe dans le cadre, du doigt ou à la souris.');
    return this.prisma.seanceEmargement.update({
      where: { id: seanceId },
      data: { formateurNom: dto.nom.trim(), formateurTrace: trace, formateurSigneLe: new Date(), formateurIp: ip },
    });
  }

  /** Présence déclarée par l'organisme (ou retirée). */
  async declarerPresence(accountId: string, inscriptionId: string, dto: PresenceDto) {
    const inscription = await this.ctx.inscription(accountId, inscriptionId);
    const slotDate = dateDeSlot(new Date(`${dto.slotDate.slice(0, 10)}T12:00:00Z`));
    const slot = dto.slot as EmargementSlot;
    return this.prisma.emargement.upsert({
      where: { inscriptionId_slotDate_slot: { inscriptionId, slotDate, slot } },
      create: { inscriptionId, sessionId: inscription.sessionId, slotDate, slot, present: dto.present, signedAt: dto.present ? new Date() : null },
      update: { present: dto.present, signedAt: dto.present ? new Date() : null },
    });
  }

  /* ------------------------------------------------------ côté stagiaire */

  /** La séance ouverte en ce moment pour la session de ce stagiaire, s'il y en a une. */
  async seanceOuverte(sessionId: string) {
    const limite = new Date(Date.now() - DUREE_SEANCE_HEURES * 3_600_000);
    return this.prisma.seanceEmargement.findFirst({
      where: { sessionId, fermeeLe: null, ouverteLe: { gte: limite } },
      orderBy: { ouverteLe: 'desc' },
    });
  }

  /**
   * LE STAGIAIRE SIGNE. Le code de la séance est exigé : c'est lui qui prouve
   * la présence en salle. Trois conditions : la séance est ouverte, le code
   * est le bon, l'inscription n'est pas annulée. Une signature déjà posée ne
   * se remplace pas (on ne réécrit pas une preuve).
   */
  async signerStagiaire(jeton: string, dto: SignatureStagiaireDto, ip: string | null, ua: string | null) {
    const inscription = await this.prisma.inscription.findUnique({ where: { jetonStagiaire: jeton } });
    if (!inscription) throw new NotFoundException("Ce lien n'est plus valable. Demandez-en un nouveau à votre organisme.");
    if (inscription.status === InscriptionStatus.CANCELLED) throw new ForbiddenException('Cette inscription est annulée.');
    const seance = await this.seanceOuverte(inscription.sessionId);
    if (!seance) throw new BadRequestException("Aucune séance n'est ouverte à l'émargement en ce moment. Le formateur l'ouvre en début de demi-journée.");
    if (seance.code !== dto.code.trim()) throw new BadRequestException("Ce n'est pas le code affiché en salle.");
    const trace = traceValide(dto.trace);
    if (!trace) throw new BadRequestException('La signature est vide ou illisible : signez dans le cadre.');
    const existante = await this.prisma.emargement.findUnique({
      where: { inscriptionId_slotDate_slot: { inscriptionId: inscription.id, slotDate: seance.slotDate, slot: seance.slot } },
    });
    if (existante?.signatureTrace) return { dejaSigne: true, signeLe: existante.signeParStagiaireLe };
    const maintenant = new Date();
    const preuve = empreinte(inscription.id, seance.slotDate.toISOString(), seance.slot, trace, maintenant.toISOString(), ip, ua);
    const donnees = {
      present: true,
      signedAt: maintenant,
      signatureTrace: trace,
      signeParStagiaireLe: maintenant,
      signatureIp: ip?.slice(0, 64) ?? null,
      signatureUa: ua?.slice(0, 300) ?? null,
      signatureEmpreinte: preuve,
    };
    await this.prisma.emargement.upsert({
      where: { inscriptionId_slotDate_slot: { inscriptionId: inscription.id, slotDate: seance.slotDate, slot: seance.slot } },
      create: { inscriptionId: inscription.id, sessionId: inscription.sessionId, slotDate: seance.slotDate, slot: seance.slot, ...donnees },
      update: donnees,
    });
    return { dejaSigne: false, signeLe: maintenant };
  }

  /** L'état de l'émargement d'une session : qui a signé quoi, séance par séance. */
  async etat(accountId: string, sessionId: string) {
    await this.ctx.session(accountId, sessionId);
    const [seances, emargements, inscriptions] = await Promise.all([
      this.prisma.seanceEmargement.findMany({ where: { sessionId }, orderBy: [{ slotDate: 'asc' }, { slot: 'asc' }] }),
      this.prisma.emargement.findMany({ where: { sessionId } }),
      this.prisma.inscription.findMany({
        where: { sessionId, status: { not: InscriptionStatus.CANCELLED } },
        select: { id: true, learnerName: true, learnerEmail: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    return {
      seances: seances.map((s) => ({ ...s, signatures: emargements.filter((e) => e.slotDate.getTime() === s.slotDate.getTime() && e.slot === s.slot && e.signatureTrace).length })),
      emargements: emargements.map((e) => ({ ...e, signatureTrace: e.signatureTrace ? true : false })),
      inscriptions,
    };
  }
}
