import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InscriptionStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ContexteGestion } from './contexte.service';
import { DocumentsSessionService, cleEntreprise } from './documents-session.service';
import { EmargementService } from './emargement.service';
import { EvaluationCommanditaireDto, EvaluationStagiaireDto, PositionnementDto } from './dto/gestion.dto';
import { arrondi2, csv, moyennePositionnement, objectifsEnListe } from './outils';

const jour = 86_400_000;
const moyenne = (xs: number[]) => (xs.length ? arrondi2(xs.reduce((a, b) => a + b, 0) / xs.length) : null);
const part = (a: number, b: number) => (b ? Math.round((a / b) * 100) : null);

/** Les documents qu'un stagiaire peut ouvrir lui-même depuis son lien. */
export const DOCUMENTS_STAGIAIRE = ['CONVOCATION', 'PROGRAMME', 'ATTESTATION', 'CERTIFICAT_REALISATION'] as const;
export type DocumentStagiaire = (typeof DOCUMENTS_STAGIAIRE)[number];

/** La date à partir de laquelle l'enquête à froid s'ouvre. */
export function ouvertureFroid(fin: Date, delaiJours: number): Date {
  return new Date(fin.getTime() + delaiJours * jour);
}

/**
 * LA QUALITÉ D'UNE SESSION, VUE DES DEUX CÔTÉS.
 *
 * Côté stagiaire (par son lien personnel, sans compte) : son espace, ses
 * pièces, ses deux enquêtes et son positionnement d'entrée et de sortie.
 * Côté commanditaire (par le sien) : une enquête courte sur les effets.
 * Côté académie : le rapport de la session et les indicateurs de l'année,
 * ceux que l'indicateur 2 de Qualiopi demande de publier.
 *
 * ⚠ UNE RÉPONSE NE SE RÉÉCRIT PAS. Une enquête déjà remplie reste celle qui a
 * été donnée : un indicateur qu'on peut corriger après coup n'indique plus rien.
 */
@Injectable()
export class QualiteSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: ContexteGestion,
    private readonly documents: DocumentsSessionService,
    private readonly emargement: EmargementService,
  ) {}

  /* ============================================================ espace stagiaire */

  private async parJeton(jeton: string) {
    const i = await this.prisma.inscription.findUnique({
      where: { jetonStagiaire: jeton },
      include: { session: { include: { formation: true } }, emargements: true },
    });
    if (!i) throw new NotFoundException("Ce lien n'est plus valable. Demandez-en un nouveau à votre organisme de formation.");
    return i;
  }

  private fin(s: { startDate: Date; endDate: Date | null }) {
    return s.endDate ?? s.startDate;
  }

  async espace(jeton: string) {
    const i = await this.parJeton(jeton);
    const s = i.session;
    const accountId = s.formation.ownerAccountId;
    const [academie, marque, complete, seance] = await Promise.all([
      this.prisma.academie.findUnique({
        where: { accountId },
        select: { nom: true, courriel: true, telephone: true, referentHandicap: true, referentPedagogique: true, reglementInterieurUrl: true },
      }),
      this.ctx.marque(accountId),
      this.documents.charger(s.id),
      this.emargement.seanceOuverte(s.id),
    ]);
    const sessionPdf = this.documents.sessionPdf(complete);
    const heures = this.documents.heures(complete).get(i.id) ?? { heures: 0, estime: false };
    const maintenant = new Date();
    const fin = this.fin(s);
    const terminee = fin.getTime() < maintenant.getTime() - 12 * 3_600_000 || s.status === 'DONE';
    const debutJour = new Date(s.startDate);
    debutJour.setHours(0, 0, 0, 0);
    const annulee = i.status === InscriptionStatus.CANCELLED;
    const froidDes = ouvertureFroid(fin, s.delaiFroidJours);
    const signeeMaintenant = seance
      ? i.emargements.some((e) => e.slotDate.getTime() === seance.slotDate.getTime() && e.slot === seance.slot && e.signatureTrace)
      : false;
    const objectifs = objectifsEnListe(s.formation.objectives);
    return {
      stagiaire: { nom: i.learnerName, email: i.learnerEmail, annulee },
      organisme: { ...academie, nom: marque.nom, couleur: marque.couleur },
      session: {
        intitule: sessionPdf.intitule,
        debut: s.startDate,
        fin: s.endDate,
        lieu: sessionPdf.lieu,
        modalite: sessionPdf.modalite,
        dureeHeures: sessionPdf.dureeHeures,
        infosPratiques: s.infosPratiques,
        formateurs: sessionPdf.formateurs.map((f) => f.nom),
        creneaux: sessionPdf.creneaux,
        objectifs,
        prerequis: s.formation.prerequisites,
        terminee,
      },
      emargement: {
        seanceOuverte: !annulee && !!seance,
        slot: seance ? { date: seance.slotDate, moment: seance.slot } : null,
        dejaSigne: signeeMaintenant,
        signatures: i.emargements.filter((e) => e.present).map((e) => ({ date: e.slotDate, moment: e.slot, signe: !!e.signatureTrace })),
        heuresRealisees: heures.heures,
      },
      documents: {
        convocation: true,
        programme: true,
        attestation: terminee && heures.heures > 0,
        certificatRealisation: terminee && heures.heures > 0,
      },
      evaluations: {
        chaud: { ouverte: !annulee && maintenant >= debutJour, faite: !!i.satisfactionAt },
        froid: { ouverte: !annulee && terminee && maintenant >= froidDes, ouvreLe: froidDes, faite: !!i.coldAt },
      },
      positionnement: {
        objectifs,
        entree: { ouvert: !annulee && !terminee, fait: !!i.positionnementEntree },
        sortie: { ouvert: !annulee && maintenant >= debutJour, fait: !!i.positionnementSortie },
      },
    };
  }

  async document(jeton: string, type: string) {
    if (!(DOCUMENTS_STAGIAIRE as readonly string[]).includes(type)) throw new BadRequestException('Document inconnu.');
    const i = await this.parJeton(jeton);
    if (i.status === InscriptionStatus.CANCELLED) throw new ForbiddenException('Cette inscription est annulée.');
    const accountId = i.session.formation.ownerAccountId;
    const academie = await this.ctx.academie(accountId);
    const s = await this.documents.charger(i.sessionId);
    if (type === 'ATTESTATION' || type === 'CERTIFICAT_REALISATION') {
      const fin = this.fin(i.session);
      if (fin.getTime() > Date.now()) throw new BadRequestException("Ce document se délivre à la fin de la formation.");
    }
    return this.documents.fabriquerPour(academie, s, type as DocumentStagiaire, { inscriptionId: type === 'PROGRAMME' ? undefined : i.id });
  }

  async evaluer(jeton: string, dto: EvaluationStagiaireDto) {
    const e = await this.espace(jeton);
    const i = await this.parJeton(jeton);
    const detail = {
      note: dto.note,
      objectifs: dto.objectifs ?? null,
      pedagogie: dto.pedagogie ?? null,
      organisation: dto.organisation ?? null,
      recommande: dto.recommande ?? null,
      miseEnOeuvre: dto.miseEnOeuvre ?? null,
      commentaire: dto.commentaire?.trim() || null,
      le: new Date().toISOString(),
    };
    if (dto.type === 'chaud') {
      if (!e.evaluations.chaud.ouverte) throw new BadRequestException("L'enquête de fin de formation s'ouvre le premier jour de la session.");
      if (e.evaluations.chaud.faite) throw new BadRequestException('Vous avez déjà répondu à cette enquête. Merci !');
      await this.prisma.inscription.update({
        where: { id: i.id },
        data: {
          satisfaction: dto.note,
          satisfactionComment: detail.commentaire,
          satisfactionAt: new Date(),
          evaluationChaudDetail: detail as unknown as Prisma.InputJsonValue,
        },
      });
    } else {
      if (!e.evaluations.froid.ouverte) {
        throw new BadRequestException(`L'enquête à froid s'ouvre le ${e.evaluations.froid.ouvreLe.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })} : c'est avec du recul qu'elle a du sens.`);
      }
      if (e.evaluations.froid.faite) throw new BadRequestException('Vous avez déjà répondu à cette enquête. Merci !');
      await this.prisma.inscription.update({
        where: { id: i.id },
        data: {
          coldRating: dto.note,
          coldTransfer: dto.miseEnOeuvre ?? null,
          coldComment: detail.commentaire,
          coldAt: new Date(),
          evaluationFroidDetail: detail as unknown as Prisma.InputJsonValue,
        },
      });
    }
    return { enregistre: true };
  }

  async positionner(jeton: string, dto: PositionnementDto) {
    const e = await this.espace(jeton);
    const i = await this.parJeton(jeton);
    const etat = dto.moment === 'entree' ? e.positionnement.entree : e.positionnement.sortie;
    if (!etat.ouvert) {
      throw new BadRequestException(dto.moment === 'entree' ? "Le positionnement d'entrée se fait avant la fin de la formation." : 'Le positionnement de sortie se fait à partir du premier jour.');
    }
    if (etat.fait) throw new BadRequestException('Ce positionnement est déjà enregistré.');
    const objectifs = e.positionnement.objectifs;
    const notes: Record<string, number> = {};
    for (const [objectif, note] of Object.entries(dto.notes)) {
      if (objectifs.length && !objectifs.includes(objectif)) continue;
      if (!Number.isInteger(note) || note < 0 || note > 4) throw new BadRequestException('Chaque note va de 0 à 4.');
      notes[objectif] = note;
    }
    if (!Object.keys(notes).length) throw new BadRequestException('Notez au moins un objectif.');
    await this.prisma.inscription.update({
      where: { id: i.id },
      data: dto.moment === 'entree' ? { positionnementEntree: notes } : { positionnementSortie: notes },
    });
    return { enregistre: true };
  }

  /* ============================================================ commanditaire */

  private async parJetonCommanditaire(jeton: string) {
    const i = await this.prisma.inscription.findUnique({
      where: { jetonCommanditaire: jeton },
      include: { session: { include: { formation: true } } },
    });
    if (!i) throw new NotFoundException("Ce lien n'est plus valable.");
    return i;
  }

  async commanditaire(jeton: string) {
    const i = await this.parJetonCommanditaire(jeton);
    const marque = await this.ctx.marque(i.session.formation.ownerAccountId);
    const stagiaires = await this.prisma.inscription.findMany({
      where: { sessionId: i.sessionId, status: { not: InscriptionStatus.CANCELLED } },
      select: { learnerName: true, entrepriseNom: true },
    });
    const cle = cleEntreprise(i.entrepriseNom);
    return {
      organisme: marque.nom,
      couleur: marque.couleur,
      formation: i.session.title || i.session.formation.title,
      debut: i.session.startDate,
      fin: i.session.endDate,
      entreprise: i.entrepriseNom,
      stagiaires: stagiaires.filter((x) => cleEntreprise(x.entrepriseNom) === cle).map((x) => x.learnerName),
      dejaRepondu: !!i.evaluationCommanditaire,
    };
  }

  /** La réponse s'écrit sur toutes les inscriptions de cette entreprise pour la session. */
  async repondreCommanditaire(jeton: string, dto: EvaluationCommanditaireDto) {
    const i = await this.parJetonCommanditaire(jeton);
    if (i.evaluationCommanditaire) throw new BadRequestException('Vous avez déjà répondu. Merci !');
    if (this.fin(i.session).getTime() > Date.now()) throw new BadRequestException("L'enquête s'ouvre à la fin de la formation.");
    const reponse = {
      note: dto.note,
      effets: dto.effets ?? null,
      recommande: dto.recommande ?? null,
      commentaire: dto.commentaire?.trim() || null,
      le: new Date().toISOString(),
    };
    const cle = cleEntreprise(i.entrepriseNom);
    const memes = await this.prisma.inscription.findMany({ where: { sessionId: i.sessionId }, select: { id: true, entrepriseNom: true } });
    const ids = memes.filter((x) => cle && cleEntreprise(x.entrepriseNom) === cle).map((x) => x.id);
    await this.prisma.inscription.updateMany({
      where: { id: { in: ids.length ? ids : [i.id] }, evaluationCommanditaire: { equals: Prisma.AnyNull } },
      data: { evaluationCommanditaire: reponse as unknown as Prisma.InputJsonValue },
    });
    return { enregistre: true };
  }

  /* ============================================================ rapports */

  async rapportSession(accountId: string, sessionId: string) {
    await this.ctx.session(accountId, sessionId);
    const s = await this.documents.charger(sessionId);
    const toutes = s.inscriptions;
    const actives = toutes.filter((i) => i.status !== InscriptionStatus.CANCELLED);
    const heures = this.documents.heures(s);
    const duree = this.documents.sessionPdf(s).dureeHeures ?? 0;
    const chauds = actives.filter((i) => i.satisfaction !== null);
    const froids = actives.filter((i) => i.coldRating !== null);
    const detailChaud = chauds.map((i) => (i.evaluationChaudDetail ?? {}) as Record<string, unknown>);
    const commanditaires = new Map<string, Record<string, unknown>>();
    for (const i of actives) if (i.evaluationCommanditaire) commanditaires.set(cleEntreprise(i.entrepriseNom) || i.id, i.evaluationCommanditaire as Record<string, unknown>);
    const progressions = actives
      .map((i) => {
        const a = moyennePositionnement(i.positionnementEntree);
        const b = moyennePositionnement(i.positionnementSortie);
        return a !== null && b !== null ? b - a : null;
      })
      .filter((x): x is number => x !== null);
    const assiduites = actives.map((i) => (duree ? Math.min(1, (heures.get(i.id)?.heures ?? 0) / duree) : 0));
    const recommandes = detailChaud.filter((d) => d.recommande === true).length;
    const repondantsReco = detailChaud.filter((d) => typeof d.recommande === 'boolean').length;
    return {
      session: { id: s.id, intitule: s.title || s.formation.title, debut: s.startDate, fin: s.endDate },
      effectifs: { inscrits: toutes.length, actifs: actives.length, abandons: toutes.filter((i) => i.status === InscriptionStatus.CANCELLED || i.abandonLe).length },
      assiduite: { moyenne: assiduites.length ? Math.round((assiduites.reduce((a, b) => a + b, 0) / assiduites.length) * 100) : null },
      chaud: {
        reponses: chauds.length,
        taux: part(chauds.length, actives.length),
        note: moyenne(chauds.map((i) => i.satisfaction!)),
        objectifs: moyenne(detailChaud.map((d) => d.objectifs).filter((x): x is number => typeof x === 'number')),
        pedagogie: moyenne(detailChaud.map((d) => d.pedagogie).filter((x): x is number => typeof x === 'number')),
        organisation: moyenne(detailChaud.map((d) => d.organisation).filter((x): x is number => typeof x === 'number')),
        recommandation: part(recommandes, repondantsReco),
      },
      froid: {
        reponses: froids.length,
        taux: part(froids.length, actives.length),
        note: moyenne(froids.map((i) => i.coldRating!)),
        miseEnOeuvre: {
          oui: froids.filter((i) => i.coldTransfer === 'OUI').length,
          partiellement: froids.filter((i) => i.coldTransfer === 'PARTIELLEMENT').length,
          non: froids.filter((i) => i.coldTransfer === 'NON').length,
        },
      },
      commanditaires: {
        reponses: commanditaires.size,
        note: moyenne([...commanditaires.values()].map((c) => c.note).filter((x): x is number => typeof x === 'number')),
      },
      positionnement: { mesures: progressions.length, progression: moyenne(progressions) },
      commentaires: [
        ...chauds.filter((i) => i.satisfactionComment).map((i) => ({ type: 'chaud', nom: i.learnerName, texte: i.satisfactionComment! })),
        ...froids.filter((i) => i.coldComment).map((i) => ({ type: 'froid', nom: i.learnerName, texte: i.coldComment! })),
        ...[...commanditaires.values()].filter((c) => c.commentaire).map((c) => ({ type: 'commanditaire', nom: null, texte: String(c.commentaire) })),
      ],
    };
  }

  /**
   * LES INDICATEURS DE RÉSULTATS DE L'ANNÉE (indicateur 2 de Qualiopi) :
   * calculés sur les sessions TERMINÉES dans l'année, et accompagnés du
   * nombre de réponses. Un taux sans son effectif ne se publie pas.
   */
  async indicateurs(accountId: string, annee: number) {
    await this.ctx.academie(accountId);
    const debut = new Date(annee, 0, 1);
    const finAnnee = new Date(annee + 1, 0, 1);
    const sessions = await this.prisma.formationSession.findMany({
      where: {
        formation: { ownerAccountId: accountId },
        OR: [{ endDate: { gte: debut, lt: finAnnee } }, { endDate: null, startDate: { gte: debut, lt: finAnnee } }],
      },
      select: { id: true, startDate: true, endDate: true },
    });
    const terminees = sessions.filter((s) => (s.endDate ?? s.startDate).getTime() < Date.now());
    const rapports: Awaited<ReturnType<QualiteSessionService['rapportSession']>>[] = [];
    for (const s of terminees) rapports.push(await this.rapportSession(accountId, s.id));
    const stagiaires = rapports.reduce((t, r) => t + r.effectifs.actifs, 0);
    const inscrits = rapports.reduce((t, r) => t + r.effectifs.inscrits, 0);
    const abandons = rapports.reduce((t, r) => t + r.effectifs.abandons, 0);
    const ponderee = (f: (r: (typeof rapports)[number]) => { n: number; v: number | null }) => {
      let somme = 0;
      let poids = 0;
      for (const r of rapports) {
        const { n, v } = f(r);
        if (v !== null && n) {
          somme += v * n;
          poids += n;
        }
      }
      return { valeur: poids ? arrondi2(somme / poids) : null, reponses: poids };
    };
    const satisfaction = ponderee((r) => ({ n: r.chaud.reponses, v: r.chaud.note }));
    const froid = ponderee((r) => ({ n: r.froid.reponses, v: r.froid.note }));
    const reco = ponderee((r) => ({ n: r.chaud.reponses, v: r.chaud.recommandation }));
    const commanditaire = ponderee((r) => ({ n: r.commanditaires.reponses, v: r.commanditaires.note }));
    const progression = ponderee((r) => ({ n: r.positionnement.mesures, v: r.positionnement.progression }));
    const miseEnOeuvre = rapports.reduce((t, r) => t + r.froid.miseEnOeuvre.oui + r.froid.miseEnOeuvre.partiellement, 0);
    const froidReponses = rapports.reduce((t, r) => t + r.froid.reponses, 0);
    const texte = [
      `En ${annee}, ${stagiaires} stagiaire${stagiaires > 1 ? 's' : ''} sur ${terminees.length} session${terminees.length > 1 ? 's' : ''} terminée${terminees.length > 1 ? 's' : ''}.`,
      satisfaction.valeur !== null ? `Satisfaction en fin de formation : ${String(satisfaction.valeur).replace('.', ',')} / 5 (${satisfaction.reponses} réponses).` : null,
      reco.valeur !== null ? `${Math.round(reco.valeur)} % recommanderaient la formation.` : null,
      froidReponses ? `Quelques semaines après : ${part(miseEnOeuvre, froidReponses)} % mettent en œuvre les acquis, en tout ou partie (${froidReponses} réponses).` : null,
      inscrits ? `Taux d'abandon : ${part(abandons, inscrits)} %.` : null,
    ].filter(Boolean);
    return {
      annee,
      sessions: terminees.length,
      stagiaires,
      tauxAbandon: part(abandons, inscrits),
      satisfaction,
      satisfactionFroid: froid,
      recommandation: reco,
      commanditaire,
      progression,
      miseEnOeuvre: { taux: part(miseEnOeuvre, froidReponses), reponses: froidReponses },
      aPublier: texte.join(' '),
      parSession: rapports.map((r) => ({ id: r.session.id, intitule: r.session.intitule, debut: r.session.debut, actifs: r.effectifs.actifs, satisfaction: r.chaud.note, reponses: r.chaud.reponses, assiduite: r.assiduite.moyenne })),
    };
  }

  async indicateursCsv(accountId: string, annee: number): Promise<string> {
    const r = await this.indicateurs(accountId, annee);
    const lignes = [
      ['Session', 'Début', 'Stagiaires', 'Satisfaction /5', 'Réponses', 'Assiduité %'].join(';'),
      ...r.parSession.map((s) => [s.intitule, s.debut.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }), s.actifs, s.satisfaction, s.reponses, s.assiduite].map(csv).join(';')),
    ];
    return '﻿' + lignes.join('\r\n');
  }
}
