import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InscriptionStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { ContexteGestion } from './contexte.service';
import { DocumentsSessionService, cleEntreprise } from './documents-session.service';
import { FacturationOrganismeService } from './facturation-organisme.service';
import { SessionsAdminService } from './sessions-admin.service';
import { DUREE_SEANCE_HEURES } from './emargement.service';
import { ouvertureFroid } from './qualite-session.service';

const jour = 86_400_000;

/**
 * Rien de ce qui s'est passé avant la mise en service n'est rattrapé : la
 * première nuit enverrait sinon des enquêtes sur des sessions finies depuis
 * des mois, à des gens qui ne s'en souviennent plus.
 */
export const MISE_EN_SERVICE = new Date('2026-09-29T00:00:00Z');

/**
 * LES ENVOIS AUTOMATIQUES DE L'ADMINISTRATION, UNE FOIS PAR JOUR.
 *
 *  - convocations sept jours avant (si la session l'a demandé) ;
 *  - enquête de fin le lendemain de la fin, à froid après le délai choisi,
 *    commanditaire le lendemain de la fin ;
 *  - relances des factures échues ;
 *  - fermeture des séances d'émargement oubliées ouvertes.
 *
 * ⚠ CHAQUE ENVOI POSE SON VERROU AVANT DE PARTIR (`ActionAutoSession.cle`
 * unique) : un doublon est impossible, pas seulement improbable. Un message
 * raté ne se rattrape pas automatiquement, et c'est voulu.
 */
@Injectable()
export class GestionScheduler {
  private readonly logger = new Logger(GestionScheduler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly ctx: ContexteGestion,
    private readonly documents: DocumentsSessionService,
    private readonly facturation: FacturationOrganismeService,
    private readonly sessions: SessionsAdminService,
  ) {}

  private async verrou(accountId: string, cle: string, type: string) {
    return this.prisma.actionAutoSession.create({ data: { accountId, cle, type } }).then(() => true).catch(() => false);
  }

  @Cron(process.env.GESTION_ACADEMIE_CRON ?? '40 7 * * *', { name: 'gestion-academie', timeZone: 'Europe/Paris' })
  async passer(maintenant = new Date()) {
    const r = { convocations: 0, chaud: 0, froid: 0, commanditaires: 0, relances: 0, seances: 0 };
    try {
      r.seances = (
        await this.prisma.seanceEmargement.updateMany({
          where: { fermeeLe: null, ouverteLe: { lt: new Date(maintenant.getTime() - DUREE_SEANCE_HEURES * 3_600_000) } },
          data: { fermeeLe: maintenant },
        })
      ).count;
      r.convocations = await this.convocations(maintenant);
      const e = await this.enquetes(maintenant);
      Object.assign(r, e);
      r.relances = (await this.facturation.relancer(maintenant)).envoyees;
    } catch (e) {
      this.logger.error(`[gestion] passage interrompu : ${(e as Error).message}`);
    }
    this.logger.log(`[gestion] ${JSON.stringify(r)}`);
    return r;
  }

  private async convocations(maintenant: Date) {
    const sessions = await this.prisma.formationSession.findMany({
      where: {
        convocationsAuto: true,
        status: { not: 'CANCELLED' },
        startDate: { gt: maintenant, lte: new Date(maintenant.getTime() + 7 * jour) },
        inscriptions: { some: { convocationEnvoyeeLe: null, status: { not: InscriptionStatus.CANCELLED }, learnerEmail: { not: null } } },
      },
      select: { id: true, formation: { select: { ownerAccountId: true } }, inscriptions: { where: { convocationEnvoyeeLe: null, status: { not: InscriptionStatus.CANCELLED }, learnerEmail: { not: null } }, select: { id: true } } },
      take: 200,
    });
    let n = 0;
    for (const s of sessions) {
      const accountId = s.formation.ownerAccountId;
      for (const i of s.inscriptions) {
        if (!(await this.verrou(accountId, `convocation:${i.id}`, 'CONVOCATION'))) continue;
        try {
          const r = await this.documents.envoyer(accountId, s.id, 'CONVOCATION', { inscriptionId: i.id });
          n += r.envoyes;
        } catch (e) {
          this.logger.warn(`[gestion] convocation ${i.id} : ${(e as Error).message}`);
        }
      }
    }
    return n;
  }

  private async enquetes(maintenant: Date) {
    const r = { chaud: 0, froid: 0, commanditaires: 0 };
    const sessions = await this.prisma.formationSession.findMany({
      where: {
        enquetesAuto: true,
        status: { not: 'CANCELLED' },
        OR: [
          { endDate: { gte: MISE_EN_SERVICE, lt: new Date(maintenant.getTime() - 12 * 3_600_000) } },
          { endDate: null, startDate: { gte: MISE_EN_SERVICE, lt: new Date(maintenant.getTime() - 12 * 3_600_000) } },
        ],
      },
      include: {
        formation: { select: { ownerAccountId: true, title: true } },
        inscriptions: { where: { status: { not: InscriptionStatus.CANCELLED } } },
      },
      take: 300,
    });
    for (const s of sessions) {
      const accountId = s.formation.ownerAccountId;
      const marque = await this.ctx.marque(accountId);
      const intitule = s.title || s.formation.title;
      const fin = s.endDate ?? s.startDate;
      await this.sessions.assurerLiens(s.id).catch(() => undefined);
      const inscriptions = await this.prisma.inscription.findMany({ where: { sessionId: s.id, status: { not: InscriptionStatus.CANCELLED } } });
      const froidDes = ouvertureFroid(fin, s.delaiFroidJours);
      for (const i of inscriptions) {
        if (!i.learnerEmail || !i.jetonStagiaire) continue;
        const lien = `${this.ctx.urlPilote}/stagiaire/${i.jetonStagiaire}`;
        if (!i.satisfactionAt && maintenant.getTime() - fin.getTime() < 30 * jour && (await this.verrou(accountId, `chaud:${i.id}`, 'ENQUETE_CHAUD'))) {
          await this.mail
            .sendEcoleLibre({
              to: i.learnerEmail,
              ecole: marque,
              sujet: `Votre avis sur « ${intitule} »`,
              titre: 'Deux minutes pour votre avis',
              texte: `Bonjour${i.learnerName ? ` ${i.learnerName.split(' ')[0]}` : ''},\n\nVous venez de suivre la formation « ${intitule} ». Votre avis nous aide à l'améliorer : cinq questions, deux minutes.\n\nVotre attestation de fin de formation est aussi disponible dans votre espace.\n\n${marque.nom}`,
              bouton: { label: 'Donner mon avis', url: `${lien}#evaluation` },
            })
            .then(() => r.chaud++);
        }
        if (!i.coldAt && maintenant >= froidDes && maintenant.getTime() - froidDes.getTime() < 45 * jour && (await this.verrou(accountId, `froid:${i.id}`, 'ENQUETE_FROID'))) {
          await this.mail
            .sendEcoleLibre({
              to: i.learnerEmail,
              ecole: marque,
              sujet: `Et maintenant ? Votre formation « ${intitule} »`,
              titre: 'Quelques semaines après',
              texte: `Bonjour,\n\nIl y a quelques semaines, vous avez suivi la formation « ${intitule} ». Qu'en avez-vous fait depuis ? Trois questions pour nous le dire.\n\n${marque.nom}`,
              bouton: { label: 'Répondre', url: `${lien}#evaluation` },
            })
            .then(() => r.froid++);
        }
      }
      // Le commanditaire : une enquête par entreprise, pas par stagiaire.
      const vus = new Set<string>();
      for (const i of inscriptions) {
        const cle = cleEntreprise(i.entrepriseNom);
        if (!cle || !i.entrepriseEmail || !i.jetonCommanditaire || i.evaluationCommanditaire || vus.has(cle)) continue;
        vus.add(cle);
        if (maintenant.getTime() - fin.getTime() > 30 * jour) continue;
        if (!(await this.verrou(accountId, `commanditaire:${s.id}:${cle}`, 'ENQUETE_COMMANDITAIRE'))) continue;
        await this.mail
          .sendEcoleLibre({
            to: i.entrepriseEmail,
            ecole: marque,
            sujet: `Votre avis sur la formation « ${intitule} »`,
            titre: 'Votre avis de commanditaire',
            texte: `Bonjour,\n\nVos collaborateurs ont suivi la formation « ${intitule} ». En tant que commanditaire, votre regard compte : une minute, trois questions.\n\n${marque.nom}`,
            bouton: { label: 'Donner mon avis', url: `${this.ctx.urlPilote}/avis-commanditaire/${i.jetonCommanditaire}` },
          })
          .then(() => r.commanditaires++);
      }
    }
    return r;
  }
}
