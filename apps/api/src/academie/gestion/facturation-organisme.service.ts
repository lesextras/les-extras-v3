import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  InscriptionStatus,
  OrigineFinancement,
  Prisma,
  StatutFactureOrganisme,
  TypeFactureOrganisme,
  type Academie,
  type FactureOrganisme,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { ContexteGestion } from './contexte.service';
import { AvoirDto, FactureDto, FacturerSessionDto, ModifierFactureOrgDto, PaiementFactureDto } from './dto/gestion.dto';
import { factureOrganismePdf, type ClientFacture, type EmetteurFacture } from './facture-organisme.pdf';
import { MENTION_EXONERATION, arrondi2, csv, numero as numeroFacture, prefixeSerie, totaux, type LigneFacture } from './outils';
import { cleEntreprise, estParticulier } from './documents-session.service';

/** Relances : J+1, J+15 et J+30 après l'échéance, puis plus rien d'automatique. */
export const PALIERS_RELANCE = [1, 15, 30];

export const ORIGINE_PAR_GENRE: Record<ClientFacture['genre'], OrigineFinancement> = {
  ENTREPRISE: OrigineFinancement.ENTREPRISE,
  OPCO: OrigineFinancement.OPCO_PLAN,
  PARTICULIER: OrigineFinancement.PARTICULIER,
  PUBLIC: OrigineFinancement.AUTRES_PUBLICS,
  ORGANISME: OrigineFinancement.AUTRE_ORGANISME,
};

const n = (v: Prisma.Decimal | number | null | undefined) => (v === null || v === undefined ? 0 : Number(v));
const jour = 86_400_000;

/** Le palier de relance dû aujourd'hui, ou null. `faites` = relances déjà parties. */
export function relanceDue(echeance: Date, faites: number, maintenant = new Date()): number | null {
  if (faites >= PALIERS_RELANCE.length) return null;
  const retard = Math.floor((maintenant.getTime() - echeance.getTime()) / jour);
  return retard >= PALIERS_RELANCE[faites] ? faites + 1 : null;
}

/**
 * LA FACTURATION DE L'ORGANISME : devis, factures, avoirs.
 *
 * ⚠⚠ UNE FACTURE ÉMISE NE SE MODIFIE PLUS ET NE SE SUPPRIME JAMAIS (art. 242
 * nonies A ann. II CGI). Elle s'annule par un avoir, qui porte son propre
 * numéro. Seul un brouillon se corrige ou se supprime.
 *
 * ⚠ LE NUMÉRO EST PRIS DANS LA MÊME TRANSACTION QUE L'ÉMISSION, sur un
 * compteur par série (« F2026 ») : deux émissions simultanées ne peuvent pas
 * obtenir le même numéro, et un numéro pris n'est jamais rendu.
 */
@Injectable()
export class FacturationOrganismeService {
  private readonly logger = new Logger(FacturationOrganismeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: ContexteGestion,
    private readonly mail: MailService,
  ) {}

  private tauxDefaut(a: Academie) {
    return a.exonereTva ? 0 : a.tauxTva;
  }

  private emetteur(a: Academie): EmetteurFacture {
    return {
      nom: a.nom,
      adresse: a.adresse,
      codePostal: a.codePostal,
      commune: a.commune,
      siret: a.siret,
      nda: a.nda,
      numeroTva: a.numeroTva,
      courriel: a.courriel,
      telephone: a.telephone,
      coordonneesBancaires: a.coordonneesBancaires,
    };
  }

  private async charger(accountId: string, id: string) {
    await this.ctx.academie(accountId);
    const f = await this.prisma.factureOrganisme.findFirst({ where: { id, accountId } });
    if (!f) throw new NotFoundException('Document introuvable.');
    return f;
  }

  private nettoyerLignes(lignes: LigneFacture[], a: Academie): LigneFacture[] {
    if (!lignes.length) throw new BadRequestException('Ajoute au moins une ligne.');
    return lignes.map((l) => ({
      libelle: l.libelle.trim(),
      quantite: l.quantite,
      prixUnitaireHt: arrondi2(l.prixUnitaireHt),
      // ⚠ Un organisme exonéré ne facture JAMAIS de TVA, quelle que soit la saisie.
      tauxTva: a.exonereTva ? 0 : l.tauxTva,
    }));
  }

  /* ============================================================ lecture */

  async liste(accountId: string, filtres: { type?: string; statut?: string; sessionId?: string; annee?: number } = {}) {
    await this.ctx.academie(accountId);
    const where: Prisma.FactureOrganismeWhereInput = { accountId };
    if (filtres.type && filtres.type in TypeFactureOrganisme) where.type = filtres.type as TypeFactureOrganisme;
    if (filtres.statut && filtres.statut in StatutFactureOrganisme) where.statut = filtres.statut as StatutFactureOrganisme;
    if (filtres.sessionId) where.sessionId = filtres.sessionId;
    const factures = await this.prisma.factureOrganisme.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: 500,
      include: { session: { select: { id: true, title: true, startDate: true, formation: { select: { title: true } } } } },
    });
    const annee = filtres.annee ?? new Date().getFullYear();
    const maintenant = new Date();
    const emisesAnnee = factures.filter((f) => f.dateEmission && f.dateEmission.getFullYear() === annee && f.statut !== 'BROUILLON');
    const ca = emisesAnnee.filter((f) => f.type !== 'DEVIS').reduce((t, f) => t + n(f.totalHt), 0);
    const aEncaisser = factures
      .filter((f) => f.type === 'FACTURE' && f.statut === 'EMISE')
      .reduce((t, f) => t + (n(f.totalTtc) - n(f.montantPaye)), 0);
    const enRetard = factures.filter((f) => f.type === 'FACTURE' && f.statut === 'EMISE' && f.echeance && f.echeance < maintenant);
    const devisOuverts = factures.filter((f) => f.type === 'DEVIS' && f.statut === 'EMISE');
    return {
      factures: factures.map((f) => ({
        ...f,
        totalHt: n(f.totalHt),
        totalTva: n(f.totalTva),
        totalTtc: n(f.totalTtc),
        montantPaye: n(f.montantPaye),
        enRetard: f.type === 'FACTURE' && f.statut === 'EMISE' && !!f.echeance && f.echeance < maintenant,
      })),
      resume: {
        annee,
        chiffreAffairesHt: arrondi2(ca),
        aEncaisser: arrondi2(aEncaisser),
        enRetard: enRetard.length,
        montantEnRetard: arrondi2(enRetard.reduce((t, f) => t + (n(f.totalTtc) - n(f.montantPaye)), 0)),
        devisOuverts: devisOuverts.length,
        montantDevis: arrondi2(devisOuverts.reduce((t, f) => t + n(f.totalHt), 0)),
        brouillons: factures.filter((f) => f.statut === 'BROUILLON').length,
      },
    };
  }

  async detail(accountId: string, id: string) {
    const f = await this.charger(accountId, id);
    const [avoirs, origine] = await Promise.all([
      this.prisma.factureOrganisme.findMany({ where: { accountId, factureOrigineId: id }, orderBy: { createdAt: 'asc' } }),
      f.factureOrigineId ? this.prisma.factureOrganisme.findUnique({ where: { id: f.factureOrigineId }, select: { id: true, numero: true } }) : null,
    ]);
    return { ...f, totalHt: n(f.totalHt), totalTva: n(f.totalTva), totalTtc: n(f.totalTtc), montantPaye: n(f.montantPaye), avoirs, origine };
  }

  /* ============================================================ écriture */

  async creer(accountId: string, dto: FactureDto) {
    const a = await this.ctx.academie(accountId);
    if (dto.sessionId) await this.ctx.session(accountId, dto.sessionId);
    const lignes = this.nettoyerLignes(dto.lignes, a);
    const t = totaux(lignes);
    return this.prisma.factureOrganisme.create({
      data: {
        accountId,
        type: dto.type,
        client: dto.client as unknown as Prisma.InputJsonValue,
        lignes: lignes as unknown as Prisma.InputJsonValue,
        ...t,
        mentionTva: a.exonereTva ? MENTION_EXONERATION : null,
        sessionId: dto.sessionId ?? null,
        inscriptionIds: dto.inscriptionIds ?? [],
        origineBpf: dto.origineBpf ?? (dto.type === 'FACTURE' ? ORIGINE_PAR_GENRE[dto.client.genre] : null),
        numeroDossier: dto.numeroDossier ?? null,
        referenceClient: dto.referenceClient ?? null,
        echeance: dto.echeance ? new Date(dto.echeance) : null,
        conditions: dto.conditions ?? `Paiement à ${a.delaiPaiementJours} jours à réception.`,
        notes: dto.notes ?? null,
      },
    });
  }

  async modifier(accountId: string, id: string, dto: ModifierFactureOrgDto) {
    const f = await this.charger(accountId, id);
    const seulementRelances = Object.keys(dto).every((k) => k === 'relancesActives' || k === 'notes');
    if (f.statut !== 'BROUILLON' && !seulementRelances) {
      throw new BadRequestException(
        f.type === 'FACTURE'
          ? 'Une facture émise ne se modifie plus. Pour la corriger, émets un avoir puis une nouvelle facture.'
          : 'Un document émis ne se modifie plus.',
      );
    }
    const a = await this.ctx.academie(accountId);
    const data: Prisma.FactureOrganismeUpdateInput = {};
    if (dto.client) data.client = dto.client as unknown as Prisma.InputJsonValue;
    if (dto.lignes) {
      const lignes = this.nettoyerLignes(dto.lignes, a);
      data.lignes = lignes as unknown as Prisma.InputJsonValue;
      Object.assign(data, totaux(lignes));
    }
    if (dto.origineBpf !== undefined) data.origineBpf = dto.origineBpf;
    if (dto.numeroDossier !== undefined) data.numeroDossier = dto.numeroDossier;
    if (dto.referenceClient !== undefined) data.referenceClient = dto.referenceClient;
    if (dto.echeance !== undefined) data.echeance = dto.echeance ? new Date(dto.echeance) : null;
    if (dto.conditions !== undefined) data.conditions = dto.conditions;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.relancesActives !== undefined) data.relancesActives = dto.relancesActives;
    return this.prisma.factureOrganisme.update({ where: { id }, data });
  }

  async supprimer(accountId: string, id: string) {
    const f = await this.charger(accountId, id);
    if (f.statut !== 'BROUILLON') {
      throw new BadRequestException('Seul un brouillon se supprime. Une facture émise s’annule par un avoir.');
    }
    await this.prisma.factureOrganisme.delete({ where: { id } });
    return { supprime: true };
  }

  /** Prend le numéro suivant de la série, dans la transaction de l'appelant. */
  private async prendreNumero(tx: Prisma.TransactionClient, accountId: string, type: 'FACTURE' | 'AVOIR' | 'DEVIS', annee: number) {
    const serie = prefixeSerie(type, annee);
    const c = await tx.compteurNumerotation.upsert({
      where: { accountId_serie: { accountId, serie } },
      create: { accountId, serie, dernier: 1 },
      update: { dernier: { increment: 1 } },
    });
    return numeroFacture(type, annee, c.dernier);
  }

  async emettre(accountId: string, id: string) {
    const f = await this.charger(accountId, id);
    if (f.statut !== 'BROUILLON') throw new BadRequestException('Ce document est déjà émis.');
    const lignes = f.lignes as unknown as LigneFacture[];
    if (!lignes?.length || n(f.totalTtc) <= 0) throw new BadRequestException('Le montant doit être positif pour émettre.');
    const client = f.client as unknown as ClientFacture;
    if (!client?.nom) throw new BadRequestException('Renseigne le client.');
    const a = await this.ctx.academie(accountId);
    if (f.type === 'FACTURE' && !a.siret) {
      throw new BadRequestException('Le SIRET de l’organisme est obligatoire sur une facture : renseigne-le dans « Mon académie ».');
    }
    const maintenant = new Date();
    return this.prisma.$transaction(async (tx) => {
      const numero = await this.prendreNumero(tx, accountId, f.type, maintenant.getFullYear());
      const echeance =
        f.echeance ?? new Date(maintenant.getTime() + (f.type === 'DEVIS' ? 30 : a.delaiPaiementJours) * jour);
      return tx.factureOrganisme.update({
        where: { id },
        data: {
          numero,
          statut: StatutFactureOrganisme.EMISE,
          dateEmission: maintenant,
          echeance,
          emetteur: this.emetteur(a) as unknown as Prisma.InputJsonValue,
        },
      });
    });
  }

  async decisionDevis(accountId: string, id: string, accepte: boolean) {
    const f = await this.charger(accountId, id);
    if (f.type !== 'DEVIS' || f.statut !== 'EMISE') throw new BadRequestException('Seul un devis envoyé s’accepte ou se refuse.');
    return this.prisma.factureOrganisme.update({ where: { id }, data: { statut: accepte ? 'ACCEPTE' : 'REFUSE' } });
  }

  /** Un devis accepté devient une facture BROUILLON, reprise à l'identique. */
  async facturerDevis(accountId: string, id: string) {
    const d = await this.charger(accountId, id);
    if (d.type !== 'DEVIS') throw new BadRequestException('Ce document n’est pas un devis.');
    if (d.statut === 'REFUSE') throw new BadRequestException('Ce devis a été refusé.');
    const deja = await this.prisma.factureOrganisme.findFirst({ where: { accountId, devisId: id, type: 'FACTURE' } });
    if (deja) return deja;
    const client = d.client as unknown as ClientFacture;
    const a = await this.ctx.academie(accountId);
    return this.prisma.factureOrganisme.create({
      data: {
        accountId,
        type: 'FACTURE',
        client: d.client as Prisma.InputJsonValue,
        lignes: d.lignes as Prisma.InputJsonValue,
        totalHt: d.totalHt,
        totalTva: d.totalTva,
        totalTtc: d.totalTtc,
        mentionTva: d.mentionTva,
        sessionId: d.sessionId,
        inscriptionIds: d.inscriptionIds,
        origineBpf: d.origineBpf ?? ORIGINE_PAR_GENRE[client.genre],
        numeroDossier: d.numeroDossier,
        referenceClient: d.referenceClient ?? d.numero,
        conditions: `Paiement à ${a.delaiPaiementJours} jours à réception.`,
        devisId: id,
      },
    });
  }

  async paiement(accountId: string, id: string, dto: PaiementFactureDto) {
    const f = await this.charger(accountId, id);
    if (f.type !== 'FACTURE' || (f.statut !== 'EMISE' && f.statut !== 'PAYEE')) {
      throw new BadRequestException('Un règlement s’enregistre sur une facture émise.');
    }
    const paye = arrondi2(n(f.montantPaye) + dto.montant);
    if (paye > n(f.totalTtc) + 0.009) throw new BadRequestException('Ce règlement dépasse le reste à payer.');
    const solde = paye >= n(f.totalTtc) - 0.009;
    return this.prisma.factureOrganisme.update({
      where: { id },
      data: {
        montantPaye: paye,
        statut: solde ? 'PAYEE' : 'EMISE',
        payeeLe: solde ? (dto.date ? new Date(dto.date) : new Date()) : null,
      },
    });
  }

  /**
   * L'AVOIR : total (annule la facture) ou partiel. Il est émis directement,
   * avec son propre numéro, et ses montants sont NÉGATIFS : la somme des
   * factures et des avoirs donne le chiffre d'affaires réel.
   */
  async avoir(accountId: string, id: string, dto: AvoirDto) {
    const f = await this.charger(accountId, id);
    if (f.type !== 'FACTURE' || f.statut === 'BROUILLON') throw new BadRequestException('Un avoir se fait sur une facture émise.');
    if (f.statut === 'ANNULEE') throw new BadRequestException('Cette facture est déjà annulée.');
    const deja = await this.prisma.factureOrganisme.findMany({ where: { accountId, factureOrigineId: id, type: 'AVOIR' } });
    const dejaHt = deja.reduce((t, x) => t - n(x.totalHt), 0);
    const resteHt = arrondi2(n(f.totalHt) - dejaHt);
    const montantHt = dto.montantHt ? arrondi2(dto.montantHt) : resteHt;
    if (montantHt <= 0 || montantHt > resteHt + 0.009) {
      throw new BadRequestException(`L’avoir ne peut pas dépasser ${resteHt.toFixed(2).replace('.', ',')} € HT (le reste non annulé).`);
    }
    const lignesOrigine = f.lignes as unknown as LigneFacture[];
    const taux = lignesOrigine[0]?.tauxTva ?? 0;
    const total = montantHt >= resteHt - 0.009;
    const lignes: LigneFacture[] =
      total && !deja.length
        ? lignesOrigine.map((l) => ({ ...l, prixUnitaireHt: -l.prixUnitaireHt }))
        : [{ libelle: `${dto.motif ?? 'Avoir partiel'} (facture ${f.numero})`, quantite: 1, prixUnitaireHt: -montantHt, tauxTva: taux }];
    const t = totaux(lignes);
    const a = await this.ctx.academie(accountId);
    const maintenant = new Date();
    return this.prisma.$transaction(async (tx) => {
      const numero = await this.prendreNumero(tx, accountId, 'AVOIR', maintenant.getFullYear());
      const av = await tx.factureOrganisme.create({
        data: {
          accountId,
          type: 'AVOIR',
          statut: 'EMISE',
          numero,
          client: f.client as Prisma.InputJsonValue,
          lignes: lignes as unknown as Prisma.InputJsonValue,
          ...t,
          mentionTva: f.mentionTva,
          sessionId: f.sessionId,
          inscriptionIds: f.inscriptionIds,
          origineBpf: f.origineBpf,
          numeroDossier: f.numeroDossier,
          dateEmission: maintenant,
          factureOrigineId: f.id,
          emetteur: this.emetteur(a) as unknown as Prisma.InputJsonValue,
          notes: dto.motif ?? null,
          relancesActives: false,
        },
      });
      if (total) await tx.factureOrganisme.update({ where: { id: f.id }, data: { statut: 'ANNULEE', relancesActives: false } });
      return av;
    });
  }

  /* ============================================================ PDF et envoi */

  async pdf(accountId: string, id: string): Promise<{ contenu: Buffer; nom: string }> {
    const f = await this.charger(accountId, id);
    const a = await this.ctx.academie(accountId);
    return { contenu: await this.pdfDe(f, a), nom: `${(f.numero ?? `brouillon-${f.id.slice(-6)}`).toLowerCase()}.pdf` };
  }

  private async pdfDe(f: FactureOrganisme, a: Academie): Promise<Buffer> {
    const [session, origine] = await Promise.all([
      f.sessionId
        ? this.prisma.formationSession.findUnique({ where: { id: f.sessionId }, select: { title: true, startDate: true, endDate: true, formation: { select: { title: true } } } })
        : null,
      f.factureOrigineId ? this.prisma.factureOrganisme.findUnique({ where: { id: f.factureOrigineId }, select: { numero: true } }) : null,
    ]);
    return factureOrganismePdf({
      type: f.type,
      numero: f.numero,
      emetteur: (f.emetteur as unknown as EmetteurFacture) ?? this.emetteur(a),
      client: f.client as unknown as ClientFacture,
      lignes: f.lignes as unknown as LigneFacture[],
      totalHt: n(f.totalHt),
      totalTva: n(f.totalTva),
      totalTtc: n(f.totalTtc),
      mentionTva: f.mentionTva,
      dateEmission: f.dateEmission,
      echeance: f.echeance,
      conditions: f.conditions,
      numeroDossier: f.numeroDossier,
      referenceClient: f.referenceClient,
      factureOrigine: origine?.numero ?? null,
      montantPaye: n(f.montantPaye),
      session: session ? { intitule: session.title || session.formation.title, debut: session.startDate, fin: session.endDate } : null,
    });
  }

  async envoyer(accountId: string, id: string) {
    const f = await this.charger(accountId, id);
    if (f.statut === 'BROUILLON') throw new BadRequestException('Émets le document avant de l’envoyer : un brouillon n’a pas de numéro.');
    const client = f.client as unknown as ClientFacture;
    if (!client.email) throw new BadRequestException("Le client n'a pas d'adresse e-mail : ajoute-la sur le document.");
    const a = await this.ctx.academie(accountId);
    const marque = await this.ctx.marque(accountId);
    const contenu = await this.pdfDe(f, a);
    const libelle = f.type === 'FACTURE' ? 'la facture' : f.type === 'AVOIR' ? "l'avoir" : 'le devis';
    await this.mail.sendEcoleLibre({
      to: client.email,
      ecole: marque,
      sujet: `${f.type === 'FACTURE' ? 'Facture' : f.type === 'AVOIR' ? 'Avoir' : 'Devis'} ${f.numero} : ${marque.nom}`,
      titre: `${f.type === 'FACTURE' ? 'Facture' : f.type === 'AVOIR' ? 'Avoir' : 'Devis'} ${f.numero}`,
      texte: `Bonjour,\n\nVous trouverez ci-joint ${libelle} ${f.numero}, d'un montant de ${n(f.totalTtc).toFixed(2).replace('.', ',')} € TTC.${
        f.type === 'FACTURE' && f.echeance ? `\n\nÉchéance : ${f.echeance.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}.` : ''
      }${f.numeroDossier ? `\n\nDossier de prise en charge : ${f.numeroDossier}.` : ''}\n\n${marque.nom}`,
      pieces: [{ nom: `${f.numero}.pdf`, contenu, type: 'application/pdf' }],
    });
    return { envoye: true, a: client.email };
  }

  /* ============================================================ facturer une session */

  /**
   * Prépare les factures (ou devis) d'une session, en BROUILLON : une par
   * entreprise, une par financeur (subrogation de paiement), ou une seule. Un
   * particulier reçoit toujours la sienne. Rien n'est émis : on relit d'abord.
   */
  async facturerSession(accountId: string, sessionId: string, dto: FacturerSessionDto) {
    await this.ctx.session(accountId, sessionId);
    const a = await this.ctx.academie(accountId);
    const s = await this.prisma.formationSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { formation: true, inscriptions: { where: { status: { not: InscriptionStatus.CANCELLED } }, orderBy: { createdAt: 'asc' } } },
    });
    const type = dto.type ?? 'FACTURE';
    if (!s.inscriptions.length) throw new BadRequestException('Aucun stagiaire inscrit à facturer.');
    const dejaFacturees = new Set(
      (
        await this.prisma.factureOrganisme.findMany({
          where: { accountId, sessionId, type, statut: { notIn: ['ANNULEE', 'REFUSE'] } },
          select: { inscriptionIds: true },
        })
      ).flatMap((f) => f.inscriptionIds),
    );
    const aFacturer = s.inscriptions.filter((i) => !dejaFacturees.has(i.id));
    if (!aFacturer.length) throw new BadRequestException(`Tous les stagiaires ont déjà ${type === 'DEVIS' ? 'un devis' : 'une facture'}.`);
    const intitule = s.title || s.formation.title;
    const taux = this.tauxDefaut(a);
    const prix = (i: (typeof aFacturer)[number]) => n(i.prixHt ?? s.priceHt);
    const groupes = new Map<string, { client: ClientFacture; inscriptions: typeof aFacturer; dossier: string | null; origine: OrigineFinancement | null }>();
    for (const i of aFacturer) {
      let cle: string;
      let client: ClientFacture;
      if (estParticulier(i)) {
        cle = `p:${i.id}`;
        client = { nom: i.learnerName ?? 'Stagiaire', email: i.learnerEmail, genre: 'PARTICULIER' };
      } else if (dto.regroupement === 'UNIQUE') {
        cle = 'unique';
        client = { nom: i.entrepriseNom ?? 'Client', siret: i.entrepriseSiret, adresse: i.entrepriseAdresse, email: i.entrepriseEmail, contact: i.entrepriseContact, genre: 'ENTREPRISE' };
      } else if (dto.regroupement === 'PAR_FINANCEUR' && i.financeurNom) {
        cle = `f:${cleEntreprise(i.financeurNom)}`;
        client = { nom: i.financeurNom, genre: /opco|akto|atlas|uniformation|afdas|ocapiat|constructys|opco ?ep|sante/i.test(i.financeurNom) ? 'OPCO' : 'PUBLIC' };
      } else {
        cle = `e:${cleEntreprise(i.entrepriseNom) || 'sans-nom'}`;
        client = { nom: i.entrepriseNom ?? 'Entreprise non renseignée', siret: i.entrepriseSiret, adresse: i.entrepriseAdresse, email: i.entrepriseEmail, contact: i.entrepriseContact, genre: 'ENTREPRISE' };
      }
      const g = groupes.get(cle) ?? { client, inscriptions: [], dossier: i.numeroDossier, origine: i.origineFinancement };
      g.inscriptions.push(i);
      groupes.set(cle, g);
    }
    const periode = s.endDate && s.endDate.toDateString() !== s.startDate.toDateString()
      ? `du ${s.startDate.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })} au ${s.endDate.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}`
      : `le ${s.startDate.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}`;
    const crees: FactureOrganisme[] = [];
    for (const g of groupes.values()) {
      const lignes: LigneFacture[] = g.inscriptions.map((i) => ({
        libelle: `Formation « ${intitule} », ${periode}, stagiaire : ${i.learnerName ?? 'à nommer'}`,
        quantite: 1,
        prixUnitaireHt: prix(i),
        tauxTva: taux,
      }));
      const t = totaux(lignes);
      crees.push(
        await this.prisma.factureOrganisme.create({
          data: {
            accountId,
            type,
            client: g.client as unknown as Prisma.InputJsonValue,
            lignes: lignes as unknown as Prisma.InputJsonValue,
            ...t,
            mentionTva: a.exonereTva ? MENTION_EXONERATION : null,
            sessionId,
            inscriptionIds: g.inscriptions.map((i) => i.id),
            origineBpf: type === 'FACTURE' ? g.origine ?? ORIGINE_PAR_GENRE[g.client.genre] : null,
            numeroDossier: g.dossier,
            conditions: type === 'DEVIS' ? 'Devis valable trente jours.' : `Paiement à ${a.delaiPaiementJours} jours à réception.`,
          },
        }),
      );
    }
    const sansPrix = aFacturer.filter((i) => prix(i) <= 0).length;
    return { crees: crees.length, documents: crees.map((f) => f.id), sansPrix };
  }

  /* ============================================================ relances */

  /** Passe quotidienne : relance les factures échues, trois fois au plus. */
  async relancer(maintenant = new Date()) {
    const echues = await this.prisma.factureOrganisme.findMany({
      where: { type: 'FACTURE', statut: 'EMISE', relancesActives: true, echeance: { lt: maintenant }, relances: { lt: PALIERS_RELANCE.length } },
      take: 500,
    });
    let envoyees = 0;
    for (const f of echues) {
      const palier = relanceDue(f.echeance!, f.relances, maintenant);
      if (!palier) continue;
      const client = f.client as unknown as ClientFacture;
      // Le verrou d'abord : un doublon dans la boîte d'un client coûte plus qu'une relance manquée.
      const verrou = await this.prisma.actionAutoSession
        .create({ data: { accountId: f.accountId, cle: `relance:${f.id}:${palier}`, type: 'RELANCE_FACTURE' } })
        .catch(() => null);
      if (!verrou) continue;
      await this.prisma.factureOrganisme.update({ where: { id: f.id }, data: { relances: palier, derniereRelanceLe: maintenant } });
      if (!client?.email) continue;
      try {
        const a = await this.prisma.academie.findUnique({ where: { accountId: f.accountId } });
        if (!a) continue;
        const marque = await this.ctx.marque(f.accountId);
        const reste = arrondi2(n(f.totalTtc) - n(f.montantPaye));
        await this.mail.sendEcoleLibre({
          to: client.email,
          ecole: marque,
          sujet: `${palier === 1 ? 'Rappel' : palier === 2 ? 'Second rappel' : 'Dernier rappel'} : facture ${f.numero}`,
          titre: `Facture ${f.numero}`,
          texte: `Bonjour,\n\nSauf erreur de notre part, la facture ${f.numero} arrivée à échéance le ${f.echeance!.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })} reste à régler : ${reste.toFixed(2).replace('.', ',')} € TTC.${
            f.numeroDossier ? `\n\nDossier de prise en charge : ${f.numeroDossier}.` : ''
          }\n\nSi le règlement est déjà parti, merci de ne pas tenir compte de ce message.\n\n${marque.nom}`,
          pieces: [{ nom: `${f.numero}.pdf`, contenu: await this.pdfDe(f, a), type: 'application/pdf' }],
        });
        envoyees++;
      } catch (e) {
        this.logger.warn(`[factures] relance ${f.id} : ${(e as Error).message}`);
      }
    }
    return { examinees: echues.length, envoyees };
  }

  /* ============================================================ exports */

  /** Le journal des ventes de l'année, en CSV (point-virgule, pour un tableur français). */
  async journalCsv(accountId: string, annee: number): Promise<string> {
    await this.ctx.academie(accountId);
    const docs = await this.prisma.factureOrganisme.findMany({
      where: { accountId, type: { in: ['FACTURE', 'AVOIR'] }, statut: { not: 'BROUILLON' }, dateEmission: { gte: new Date(annee, 0, 1), lt: new Date(annee + 1, 0, 1) } },
      orderBy: { numero: 'asc' },
    });
    const entetes = ['Numéro', 'Type', 'Date', 'Client', 'SIRET client', 'Total HT', 'TVA', 'Total TTC', 'Réglé', 'Statut', 'Origine BPF', 'Dossier'];
    const lignes = docs.map((f) => {
      const c = f.client as unknown as ClientFacture;
      return [
        f.numero,
        f.type === 'AVOIR' ? 'Avoir' : 'Facture',
        f.dateEmission?.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' }),
        c?.nom,
        c?.siret,
        n(f.totalHt).toFixed(2).replace('.', ','),
        n(f.totalTva).toFixed(2).replace('.', ','),
        n(f.totalTtc).toFixed(2).replace('.', ','),
        n(f.montantPaye).toFixed(2).replace('.', ','),
        f.statut,
        f.origineBpf,
        f.numeroDossier,
      ].map(csv).join(';');
    });
    return '﻿' + [entetes.join(';'), ...lignes].join('\r\n');
  }

  /** Produits de l'année par ligne du cadre C du BPF (factures moins avoirs, HT). */
  async produitsParOrigine(accountId: string, annee: number): Promise<Record<string, number>> {
    const docs = await this.prisma.factureOrganisme.findMany({
      where: { accountId, type: { in: ['FACTURE', 'AVOIR'] }, statut: { not: 'BROUILLON' }, dateEmission: { gte: new Date(annee, 0, 1), lt: new Date(annee + 1, 0, 1) } },
      select: { totalHt: true, origineBpf: true, client: true },
    });
    const r: Record<string, number> = {};
    for (const f of docs) {
      const origine = f.origineBpf ?? ORIGINE_PAR_GENRE[(f.client as unknown as ClientFacture)?.genre ?? 'ENTREPRISE'];
      r[origine] = arrondi2((r[origine] ?? 0) + n(f.totalHt));
    }
    return r;
  }
}
