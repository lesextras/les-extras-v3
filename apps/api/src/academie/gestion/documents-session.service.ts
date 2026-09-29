import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  FinancingType,
  InscriptionStatus,
  StatutDocumentSession,
  TypeDocumentSession,
  TypeStagiaire,
  type Academie,
  type Inscription,
  type Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../../common/mail/mail.service';
import { zip } from '../../factures/xlsx';
import { genererCode, hacherCode, verifier, VALIDITE_CODE_MINUTES } from '../../signature/signature';
import { ContexteGestion } from './contexte.service';
import { SessionsAdminService } from './sessions-admin.service';
import {
  attestationFinPdf,
  certificatRealisationPdf,
  contratPdf,
  conventionPdf,
  convocationPdf,
  feuilleEmargementPdf,
  programmePdf,
  type DemiJourneePdf,
  type OrganismePdf,
  type SessionPdf,
} from './documents-session.pdf';
import {
  MENTION_EXONERATION,
  arrondi2,
  cleSlot,
  demiJourneesDuPlanning,
  empreinte,
  heuresRealisees,
  nouveauJeton,
  objectifsEnListe,
} from './outils';

type SessionComplete = Prisma.FormationSessionGetPayload<{
  include: {
    formation: true;
    formateurOrganisme: true;
    salle: true;
    creneaux: { include: { formateur: true; salle: true } };
    inscriptions: { include: { emargements: true } };
    seances: true;
  };
}>;

export const LIBELLE_DOCUMENT: Record<TypeDocumentSession, string> = {
  CONVENTION: 'Convention de formation',
  CONTRAT: 'Contrat de formation professionnelle',
  CONVOCATION: 'Convocation',
  PROGRAMME: 'Programme',
  ATTESTATION: 'Attestation de fin de formation',
  CERTIFICAT_REALISATION: 'Certificat de réalisation',
  EMARGEMENT: "Feuille d'émargement",
};

/** Qui paie lui-même signe un CONTRAT ; les autres relèvent d'une CONVENTION avec leur employeur ou client. */
export function estParticulier(i: Pick<Inscription, 'typeStagiaire' | 'financing'>): boolean {
  return i.typeStagiaire === TypeStagiaire.PARTICULIER || i.financing === FinancingType.PERSONAL;
}

export function cleEntreprise(nom: string | null | undefined): string {
  return (nom ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const nomFichier = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'document';

/**
 * LES DOCUMENTS D'UNE SESSION : fabriqués, envoyés, signés.
 *
 * Tout part des mêmes données (`donnees()`), une seule fois : deux chemins qui
 * assembleraient chacun leur session finiraient par imprimer deux dates
 * différentes sur la convocation et sur l'attestation.
 */
@Injectable()
export class DocumentsSessionService {
  private readonly logger = new Logger(DocumentsSessionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ctx: ContexteGestion,
    private readonly sessions: SessionsAdminService,
    private readonly mail: MailService,
  ) {}

  /* ============================================================ données */

  organisme(a: Academie): OrganismePdf {
    return {
      nom: a.nom,
      nda: a.nda,
      siret: a.siret,
      adresse: a.adresse,
      codePostal: a.codePostal,
      commune: a.commune,
      telephone: a.telephone,
      courriel: a.courriel,
      representantNom: a.representantNom,
      representantQualite: a.representantQualite,
      referentHandicap: a.referentHandicap,
      referentPedagogique: a.referentPedagogique,
      reglementInterieurUrl: a.reglementInterieurUrl,
    };
  }

  async charger(sessionId: string): Promise<SessionComplete> {
    return this.prisma.formationSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: {
        formation: true,
        formateurOrganisme: true,
        salle: true,
        creneaux: { orderBy: { debut: 'asc' }, include: { formateur: true, salle: true } },
        inscriptions: { orderBy: { createdAt: 'asc' }, include: { emargements: true } },
        seances: true,
      },
    });
  }

  sessionPdf(s: SessionComplete, lienEspace?: string | null): SessionPdf {
    const formateurs = new Map<string, { nom: string; diplomes?: string | null }>();
    if (s.formateurOrganisme) formateurs.set(s.formateurOrganisme.id, { nom: `${s.formateurOrganisme.prenom} ${s.formateurOrganisme.nom}`, diplomes: s.formateurOrganisme.diplomes });
    for (const c of s.creneaux) if (c.formateur) formateurs.set(c.formateur.id, { nom: `${c.formateur.prenom} ${c.formateur.nom}`, diplomes: c.formateur.diplomes });
    return {
      intitule: s.title || s.formation.title,
      natureAction: s.formation.natureAction,
      objectifs: objectifsEnListe(s.formation.objectives),
      objectifsTexte: s.formation.objectives,
      prerequis: s.formation.prerequisites,
      publicVise: s.formation.targetAudience,
      programme: s.formation.program,
      methodes: s.formation.methodology,
      evaluation: s.formation.evaluation,
      debut: s.startDate,
      fin: s.endDate,
      dureeHeures: this.sessions.dureePrevue(s),
      lieu: s.salle ? [s.salle.nom, s.salle.adresse].filter(Boolean).join(', ') : s.location,
      modalite: s.modalite,
      tauxDistanciel: s.tauxDistanciel,
      creneaux: s.creneaux.map((c) => ({
        debut: c.debut,
        fin: c.fin,
        distanciel: c.distanciel,
        salle: c.salle ? [c.salle.nom, c.salle.adresse].filter(Boolean).join(', ') : null,
        formateur: c.formateur ? `${c.formateur.prenom} ${c.formateur.nom}` : null,
      })),
      formateurs: [...formateurs.values()],
      infosPratiques: s.infosPratiques,
      certification: s.formation.codeCertification,
      lienEspace: lienEspace ?? null,
    };
  }

  /** Les heures réalisées par inscription, avec le planning de la session. */
  heures(s: SessionComplete) {
    const planning = demiJourneesDuPlanning(s.creneaux);
    const duree = this.sessions.dureePrevue(s);
    const nbSlots = new Set(s.inscriptions.flatMap((i) => i.emargements.map((e) => cleSlot(e.slotDate, e.slot)))).size;
    const table = new Map<string, { heures: number; estime: boolean }>();
    for (const i of s.inscriptions) table.set(i.id, heuresRealisees(i.emargements, planning, duree, nbSlots));
    return table;
  }

  prixInscription(s: SessionComplete, i: Inscription): number {
    if (i.prixHt !== null && i.prixHt !== undefined) return Number(i.prixHt);
    if (s.priceHt !== null && s.priceHt !== undefined) return Number(s.priceHt);
    return 0;
  }

  prix(a: Academie, totalHt: number) {
    const taux = a.exonereTva ? 0 : a.tauxTva;
    const tva = arrondi2((totalHt * taux) / 100);
    return {
      totalHt: arrondi2(totalHt),
      tva,
      totalTtc: arrondi2(totalHt + tva),
      mentionTva: a.exonereTva ? MENTION_EXONERATION : null,
      modalites: `Paiement à ${a.delaiPaiementJours} jours à réception de la facture${a.coordonneesBancaires ? `, par virement : ${a.coordonneesBancaires}` : ''}.`,
    };
  }

  actives(s: SessionComplete) {
    return s.inscriptions.filter((i) => i.status !== InscriptionStatus.CANCELLED);
  }

  /** Les clients d'une session : un par entreprise, hors particuliers. */
  clients(s: SessionComplete) {
    const groupes = new Map<string, { cle: string; nom: string; siret: string | null; adresse: string | null; contact: string | null; email: string | null; inscriptions: Inscription[] }>();
    for (const i of this.actives(s)) {
      if (estParticulier(i)) continue;
      const nom = i.entrepriseNom?.trim() || (s.intra ? 'Client de la session' : 'Entreprise non renseignée');
      const cle = cleEntreprise(nom);
      const g = groupes.get(cle) ?? { cle, nom, siret: null, adresse: null, contact: null, email: null, inscriptions: [] };
      g.siret ??= i.entrepriseSiret;
      g.adresse ??= i.entrepriseAdresse;
      g.contact ??= i.entrepriseContact;
      g.email ??= i.entrepriseEmail;
      g.inscriptions.push(i);
      groupes.set(cle, g);
    }
    return [...groupes.values()];
  }

  /**
   * Le texte canonique d'une convention ou d'un contrat : ce qui est signé.
   * Toute modification d'une de ces données après la demande de signature
   * rend la signature impossible (l'empreinte ne correspond plus).
   */
  canonique(s: SessionComplete, type: 'CONVENTION' | 'CONTRAT', cible: { entreprise?: string; inscriptionId?: string }): string {
    const sp = this.sessionPdf(s);
    const stagiaires =
      type === 'CONTRAT'
        ? this.actives(s).filter((i) => i.id === cible.inscriptionId)
        : (this.clients(s).find((c) => c.cle === cleEntreprise(cible.entreprise))?.inscriptions ?? []);
    return JSON.stringify({
      type,
      intitule: sp.intitule,
      nature: sp.natureAction,
      debut: sp.debut.toISOString(),
      fin: sp.fin?.toISOString() ?? null,
      duree: sp.dureeHeures,
      lieu: sp.lieu,
      creneaux: sp.creneaux.map((c) => [c.debut.toISOString(), c.fin.toISOString()]),
      stagiaires: stagiaires.map((i) => [i.id, i.learnerName, this.prixInscription(s, i)]),
      objectifs: sp.objectifsTexte,
      programme: sp.programme,
    });
  }

  /* ============================================================ fabriquer */

  async fabriquer(
    accountId: string,
    sessionId: string,
    type: TypeDocumentSession,
    cible: { inscriptionId?: string; entreprise?: string } = {},
  ): Promise<{ contenu: Buffer; nom: string }> {
    await this.ctx.session(accountId, sessionId);
    const academie = await this.ctx.academie(accountId);
    const s = await this.charger(sessionId);
    return this.fabriquerPour(academie, s, type, cible);
  }

  async fabriquerPour(
    academie: Academie,
    s: SessionComplete,
    type: TypeDocumentSession,
    cible: { inscriptionId?: string; entreprise?: string } = {},
  ): Promise<{ contenu: Buffer; nom: string }> {
    const organisme = this.organisme(academie);
    const intitule = s.title || s.formation.title;
    const inscription = cible.inscriptionId ? s.inscriptions.find((i) => i.id === cible.inscriptionId) : undefined;
    if (cible.inscriptionId && !inscription) throw new NotFoundException('Stagiaire introuvable dans cette session.');
    const lien = inscription?.jetonStagiaire ? `${this.ctx.urlPilote}/stagiaire/${inscription.jetonStagiaire}` : null;
    const sessionPdf = this.sessionPdf(s, lien);
    const reference = `${s.id.slice(-8).toUpperCase()}`;

    switch (type) {
      case 'PROGRAMME':
        return { contenu: await programmePdf({ organisme, session: sessionPdf, prixHt: s.priceHt !== null ? Number(s.priceHt) : null }), nom: `programme-${nomFichier(intitule)}.pdf` };

      case 'EMARGEMENT':
        return { contenu: await feuilleEmargementPdf({ organisme, session: sessionPdf, demiJournees: this.demiJourneesPdf(s) }), nom: `emargement-${nomFichier(intitule)}.pdf` };

      case 'CONVENTION': {
        const client = this.clients(s).find((c) => c.cle === cleEntreprise(cible.entreprise));
        if (!client) throw new BadRequestException("Aucun stagiaire de cette entreprise dans la session : renseigne l'entreprise sur la fiche des stagiaires.");
        const doc = await this.dernierDocument(s.id, 'CONVENTION', { entreprise: client.nom });
        const totalHt = client.inscriptions.reduce((t, i) => t + this.prixInscription(s, i), 0);
        return {
          contenu: await conventionPdf({
            organisme,
            session: sessionPdf,
            client: { nom: client.nom, siret: client.siret, adresse: client.adresse, contact: client.contact, email: client.email },
            stagiaires: client.inscriptions.map((i) => ({ nom: i.learnerName ?? 'Stagiaire' })),
            prix: this.prix(academie, totalHt),
            signature: doc?.statut === 'SIGNE' && doc.signeLe ? { nom: doc.signataireNom ?? client.nom, le: doc.signeLe, empreinte: doc.empreinte ?? '' } : null,
            reference: `${reference}-${nomFichier(client.nom).slice(0, 10).toUpperCase()}`,
          }),
          nom: `convention-${nomFichier(client.nom)}-${nomFichier(intitule)}.pdf`,
        };
      }

      case 'CONTRAT': {
        if (!inscription) throw new BadRequestException('Choisis le stagiaire concerné.');
        const doc = await this.dernierDocument(s.id, 'CONTRAT', { inscriptionId: inscription.id });
        return {
          contenu: await contratPdf({
            organisme,
            session: sessionPdf,
            stagiaire: { nom: inscription.learnerName ?? 'Stagiaire', email: inscription.learnerEmail },
            prix: this.prix(academie, this.prixInscription(s, inscription)),
            signature: doc?.statut === 'SIGNE' && doc.signeLe ? { nom: doc.signataireNom ?? inscription.learnerName ?? '', le: doc.signeLe, empreinte: doc.empreinte ?? '' } : null,
            reference: `${reference}-${inscription.id.slice(-4).toUpperCase()}`,
          }),
          nom: `contrat-${nomFichier(inscription.learnerName ?? 'stagiaire')}.pdf`,
        };
      }

      case 'CONVOCATION': {
        if (!inscription) throw new BadRequestException('Choisis le stagiaire concerné.');
        return {
          contenu: await convocationPdf({ organisme, session: sessionPdf, stagiaire: { nom: inscription.learnerName ?? 'Stagiaire' } }),
          nom: `convocation-${nomFichier(inscription.learnerName ?? 'stagiaire')}.pdf`,
        };
      }

      case 'ATTESTATION':
      case 'CERTIFICAT_REALISATION': {
        if (!inscription) throw new BadRequestException('Choisis le stagiaire concerné.');
        const h = this.heures(s).get(inscription.id) ?? { heures: 0, estime: false };
        if (h.heures <= 0) {
          throw new BadRequestException("Aucune présence n'est enregistrée pour ce stagiaire : l'émargement fonde la durée réalisée. Fais-le signer, ou déclare sa présence.");
        }
        const stagiaire = { nom: inscription.learnerName ?? 'Stagiaire', entreprise: inscription.entrepriseNom };
        const faitLe = s.endDate && s.endDate < new Date() ? s.endDate : new Date();
        if (type === 'CERTIFICAT_REALISATION') {
          return {
            contenu: await certificatRealisationPdf({ organisme, session: sessionPdf, stagiaire, heuresRealisees: h.heures, faitLe }),
            nom: `certificat-realisation-${nomFichier(stagiaire.nom)}.pdf`,
          };
        }
        const entree = (inscription.positionnementEntree ?? {}) as Record<string, number>;
        const sortie = (inscription.positionnementSortie ?? {}) as Record<string, number>;
        const resultats = sessionPdf.objectifs.map((o) => ({
          objectif: o,
          entree: typeof entree[o] === 'number' ? entree[o] : null,
          sortie: typeof sortie[o] === 'number' ? sortie[o] : null,
        }));
        return {
          contenu: await attestationFinPdf({ organisme, session: sessionPdf, stagiaire, heuresRealisees: h.heures, resultats, appreciation: inscription.evalResult, faitLe }),
          nom: `attestation-${nomFichier(stagiaire.nom)}.pdf`,
        };
      }
    }
  }

  demiJourneesPdf(s: SessionComplete): DemiJourneePdf[] {
    const planning = new Map(demiJourneesDuPlanning(s.creneaux).map((p) => [p.cle, p]));
    const horaires = new Map<string, string>();
    for (const c of s.creneaux) {
      const p = demiJourneesDuPlanning([c])[0];
      const h = `${c.debut.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' })} à ${c.fin.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit' })}`;
      horaires.set(p.cle, horaires.has(p.cle) ? `${horaires.get(p.cle)}, ${h}` : h);
    }
    const cles = new Set<string>([...planning.keys()]);
    for (const i of s.inscriptions) for (const e of i.emargements) cles.add(cleSlot(e.slotDate, e.slot));
    for (const se of s.seances) cles.add(cleSlot(se.slotDate, se.slot));
    const actives = this.actives(s);
    return [...cles]
      .sort()
      .filter((cle) => new Date(`${cle.slice(0, 10)}T23:59:59Z`) <= new Date(Date.now() + 86_400_000))
      .map((cle) => {
        const [jour, slot] = cle.split(':') as [string, 'MORNING' | 'AFTERNOON'];
        const seance = s.seances.find((se) => cleSlot(se.slotDate, se.slot) === cle);
        return {
          date: new Date(`${jour}T12:00:00Z`),
          slot,
          horaires: horaires.get(cle) ?? null,
          heures: planning.get(cle)?.heures ?? null,
          lignes: actives.map((i) => {
            const e = i.emargements.find((x) => cleSlot(x.slotDate, x.slot) === cle);
            return {
              stagiaire: i.learnerName ?? 'Stagiaire',
              etat: e?.present ? (e.signatureTrace ? 'SIGNE' : 'DECLARE') : 'ABSENT',
              trace: e?.signatureTrace ?? null,
              le: e?.signeParStagiaireLe ?? e?.signedAt ?? null,
            };
          }),
          formateur: seance?.formateurNom ? { nom: seance.formateurNom, trace: seance.formateurTrace, le: seance.formateurSigneLe } : null,
        };
      });
  }

  private async dernierDocument(sessionId: string, type: TypeDocumentSession, cible: { inscriptionId?: string; entreprise?: string }) {
    return this.prisma.documentSession.findFirst({
      where: {
        sessionId,
        type,
        ...(cible.inscriptionId ? { inscriptionId: cible.inscriptionId } : {}),
        ...(cible.entreprise ? { titre: { contains: cible.entreprise } } : {}),
        statut: { not: StatutDocumentSession.REFUSE },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ============================================================ registre */

  async registre(accountId: string, sessionId: string) {
    await this.ctx.session(accountId, sessionId);
    const s = await this.charger(sessionId);
    const documents = await this.prisma.documentSession.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, type: true, titre: true, inscriptionId: true, envoyeLe: true, envoyeA: true, statut: true, signeLe: true,
        signataireNom: true, signataireEmail: true, createdAt: true,
      },
    });
    const actives = this.actives(s);
    const heures = this.heures(s);
    return {
      documents,
      clients: this.clients(s).map((c) => ({ nom: c.nom, email: c.email, stagiaires: c.inscriptions.length })),
      stagiaires: actives.map((i) => ({
        id: i.id,
        nom: i.learnerName,
        email: i.learnerEmail,
        particulier: estParticulier(i),
        convocationEnvoyeeLe: i.convocationEnvoyeeLe,
        heuresRealisees: heures.get(i.id)?.heures ?? 0,
      })),
    };
  }

  /* ============================================================ envoyer */

  /**
   * ENVOYER : convocations, programme, attestations, certificats, ou une
   * demande de signature pour une convention ou un contrat.
   *
   * ⚠ Rien ne part à une adresse absente : la personne est comptée dans
   * `sansAdresse`, et l'écran le dit. Un envoi raté ne bloque pas les autres.
   */
  async envoyer(accountId: string, sessionId: string, type: TypeDocumentSession, cible: { inscriptionId?: string; entreprise?: string; aSigner?: boolean }) {
    await this.ctx.session(accountId, sessionId);
    await this.sessions.assurerLiens(sessionId);
    const academie = await this.ctx.academie(accountId);
    const marque = await this.ctx.marque(accountId);
    const s = await this.charger(sessionId);
    const intitule = s.title || s.formation.title;
    const resultat = { envoyes: 0, sansAdresse: [] as string[], echecs: [] as string[] };

    if (type === 'CONVENTION') {
      const clients = this.clients(s).filter((c) => !cible.entreprise || c.cle === cleEntreprise(cible.entreprise));
      if (!clients.length) throw new BadRequestException("Aucune entreprise à conventionner : les stagiaires qui paient eux-mêmes signent un contrat, pas une convention.");
      for (const c of clients) {
        if (!c.email) {
          resultat.sansAdresse.push(c.nom);
          continue;
        }
        try {
          await this.envoyerPourSignature(accountId, academie, marque, s, 'CONVENTION', { entreprise: c.nom }, c.contact || c.nom, c.email, cible.aSigner !== false);
          resultat.envoyes++;
        } catch (e) {
          resultat.echecs.push(`${c.nom} : ${(e as Error).message}`);
        }
      }
      return resultat;
    }

    const cibles = this.actives(s).filter((i) => !cible.inscriptionId || i.id === cible.inscriptionId);
    if (type === 'CONTRAT') {
      const particuliers = cibles.filter(estParticulier);
      if (!particuliers.length) throw new BadRequestException("Aucun stagiaire ne paie lui-même : le contrat de formation professionnelle ne concerne que les personnes qui financent seules leur formation.");
      for (const i of particuliers) {
        if (!i.learnerEmail) {
          resultat.sansAdresse.push(i.learnerName ?? 'Stagiaire');
          continue;
        }
        try {
          await this.envoyerPourSignature(accountId, academie, marque, s, 'CONTRAT', { inscriptionId: i.id }, i.learnerName ?? 'Stagiaire', i.learnerEmail, cible.aSigner !== false);
          resultat.envoyes++;
        } catch (e) {
          resultat.echecs.push(`${i.learnerName} : ${(e as Error).message}`);
        }
      }
      return resultat;
    }

    if (type === 'EMARGEMENT') throw new BadRequestException("La feuille d'émargement se télécharge : elle ne s'envoie pas aux stagiaires.");

    for (const i of cibles) {
      if (!i.learnerEmail) {
        resultat.sansAdresse.push(i.learnerName ?? 'Stagiaire');
        continue;
      }
      try {
        const pieces = [await this.fabriquerPour(academie, s, type, { inscriptionId: i.id })];
        if (type === 'CONVOCATION') pieces.push(await this.fabriquerPour(academie, s, 'PROGRAMME'));
        const lien = `${this.ctx.urlPilote}/stagiaire/${(await this.prisma.inscription.findUnique({ where: { id: i.id }, select: { jetonStagiaire: true } }))?.jetonStagiaire}`;
        const texte = this.texteEnvoi(type, intitule, i.learnerName ?? '', marque.nom);
        await this.mail.sendEcoleLibre({
          to: i.learnerEmail,
          ecole: marque,
          sujet: `${LIBELLE_DOCUMENT[type]} : ${intitule}`,
          titre: LIBELLE_DOCUMENT[type],
          texte,
          bouton: { label: 'Ouvrir mon espace stagiaire', url: lien },
          pieces: pieces.map((p) => ({ nom: p.nom, contenu: p.contenu, type: 'application/pdf' })),
        });
        await this.prisma.documentSession.create({
          data: {
            accountId,
            sessionId,
            inscriptionId: i.id,
            type,
            titre: `${LIBELLE_DOCUMENT[type]}, ${i.learnerName ?? ''}`.trim(),
            empreinte: empreinte(pieces[0].contenu.toString('base64')),
            envoyeLe: new Date(),
            envoyeA: i.learnerEmail,
            statut: StatutDocumentSession.ENVOYE,
          },
        });
        if (type === 'CONVOCATION') {
          await this.prisma.inscription.update({ where: { id: i.id }, data: { convocationEnvoyeeLe: new Date() } });
        }
        resultat.envoyes++;
      } catch (e) {
        this.logger.warn(`[documents] ${type} non envoyé à ${i.id} : ${(e as Error).message}`);
        resultat.echecs.push(`${i.learnerName} : ${(e as Error).message}`);
      }
    }
    return resultat;
  }

  private texteEnvoi(type: TypeDocumentSession, intitule: string, nom: string, organisme: string): string {
    const bonjour = nom ? `Bonjour ${nom.split(' ')[0]},` : 'Bonjour,';
    switch (type) {
      case 'CONVOCATION':
        return `${bonjour}\n\nVous trouverez ci-joint votre convocation à la formation « ${intitule} », avec son programme.\n\nChaque demi-journée, vous signerez l'émargement depuis votre espace stagiaire : le formateur affiche un code en salle, vous le recopiez et vous signez. Gardez ce message, le bouton ci-dessous ouvre votre espace.\n\nÀ bientôt,\n${organisme}`;
      case 'PROGRAMME':
        return `${bonjour}\n\nVoici le programme de la formation « ${intitule} ».\n\n${organisme}`;
      case 'ATTESTATION':
        return `${bonjour}\n\nVous avez suivi la formation « ${intitule} ». Votre attestation de fin de formation est jointe à ce message ; elle reste aussi disponible dans votre espace stagiaire.\n\n${organisme}`;
      case 'CERTIFICAT_REALISATION':
        return `${bonjour}\n\nVoici le certificat de réalisation de la formation « ${intitule} ». Il est destiné à votre employeur ou à votre financeur.\n\n${organisme}`;
      default:
        return `${bonjour}\n\nVous trouverez ci-joint le document « ${LIBELLE_DOCUMENT[type]} » de la formation « ${intitule} ».\n\n${organisme}`;
    }
  }

  private async envoyerPourSignature(
    accountId: string,
    academie: Academie,
    marque: { nom: string; couleur: string | null; contactEmail: string | null },
    s: SessionComplete,
    type: 'CONVENTION' | 'CONTRAT',
    cible: { entreprise?: string; inscriptionId?: string },
    signataireNom: string,
    signataireEmail: string,
    aSigner: boolean,
  ) {
    const intitule = s.title || s.formation.title;
    const pdf = await this.fabriquerPour(academie, s, type, cible);
    const jeton = aSigner ? nouveauJeton() : null;
    const titre = type === 'CONVENTION' ? `Convention, ${cible.entreprise}` : `Contrat, ${signataireNom}`;
    // Une nouvelle demande remplace la précédente, restée sans signature.
    await this.prisma.documentSession.updateMany({
      where: { sessionId: s.id, type, statut: StatutDocumentSession.A_SIGNER, ...(cible.inscriptionId ? { inscriptionId: cible.inscriptionId } : { titre }) },
      data: { statut: StatutDocumentSession.REFUSE, jetonSignature: null, codeHache: null },
    });
    await this.prisma.documentSession.create({
      data: {
        accountId,
        sessionId: s.id,
        inscriptionId: cible.inscriptionId ?? null,
        type,
        titre,
        empreinte: empreinte(this.canonique(s, type, cible)),
        envoyeLe: new Date(),
        envoyeA: signataireEmail,
        jetonSignature: jeton,
        signataireNom,
        signataireEmail,
        statut: aSigner ? StatutDocumentSession.A_SIGNER : StatutDocumentSession.ENVOYE,
      },
    });
    const bouton = jeton ? { label: 'Lire et signer', url: `${this.ctx.urlPilote}/signer-document/${jeton}` } : null;
    await this.mail.sendEcoleLibre({
      to: signataireEmail,
      ecole: marque,
      sujet: `${type === 'CONVENTION' ? 'Convention de formation' : 'Contrat de formation'} : ${intitule}`,
      titre: type === 'CONVENTION' ? 'Convention de formation' : 'Contrat de formation',
      texte: `Bonjour,\n\nVous trouverez ci-joint ${type === 'CONVENTION' ? 'la convention' : 'le contrat'} de la formation « ${intitule} ».${
        jeton
          ? '\n\nVous pouvez le signer en ligne : le bouton ci-dessous ouvre le document, puis un code à usage unique vous est envoyé par e-mail pour confirmer votre signature. Vous pouvez aussi nous le retourner signé.'
          : '\n\nMerci de nous le retourner signé.'
      }${type === 'CONTRAT' ? "\n\nVous disposez d'un délai de dix jours à compter de la signature pour vous rétracter, par lettre recommandée avec avis de réception." : ''}\n\n${marque.nom}`,
      bouton,
      pieces: [{ nom: pdf.nom, contenu: pdf.contenu, type: 'application/pdf' }],
    });
  }

  /* ============================================================ zip */

  /** Tous les documents d'un type pour la session, dans un seul fichier ZIP. */
  async archive(accountId: string, sessionId: string, type: TypeDocumentSession): Promise<{ contenu: Buffer; nom: string }> {
    await this.ctx.session(accountId, sessionId);
    const academie = await this.ctx.academie(accountId);
    const s = await this.charger(sessionId);
    const entrees: { nom: string; contenu: Buffer }[] = [];
    const heures = this.heures(s);
    if (type === 'CONVENTION') {
      for (const c of this.clients(s)) entrees.push(await this.fabriquerPour(academie, s, type, { entreprise: c.nom }));
    } else {
      for (const i of this.actives(s)) {
        if (type === 'CONTRAT' && !estParticulier(i)) continue;
        if ((type === 'ATTESTATION' || type === 'CERTIFICAT_REALISATION') && !(heures.get(i.id)?.heures ?? 0)) continue;
        entrees.push(await this.fabriquerPour(academie, s, type, { inscriptionId: i.id }));
      }
    }
    if (!entrees.length) throw new BadRequestException('Aucun document de ce type à produire pour cette session.');
    const vus = new Map<string, number>();
    for (const e of entrees) {
      const n = (vus.get(e.nom) ?? 0) + 1;
      vus.set(e.nom, n);
      if (n > 1) e.nom = e.nom.replace(/\.pdf$/, `-${n}.pdf`);
    }
    return { contenu: zip(entrees), nom: `${LIBELLE_DOCUMENT[type].toLowerCase().replace(/[^a-z]+/g, '-')}-${nomFichier(s.title || s.formation.title)}.zip` };
  }

  /* ============================================================ signature publique */

  private async parJeton(jeton: string) {
    const doc = await this.prisma.documentSession.findUnique({ where: { jetonSignature: jeton } });
    if (!doc) throw new NotFoundException("Ce lien de signature n'est plus valable. Demandez-en un nouveau à l'organisme.");
    return doc;
  }

  private etatSignature(doc: { statut: StatutDocumentSession; codeHache: string | null; codeExpireLe: Date | null; tentatives: number; empreinte: string | null }) {
    const statut =
      doc.statut === StatutDocumentSession.SIGNE ? 'SIGNEE' : doc.statut === StatutDocumentSession.REFUSE ? 'REFUSEE' : 'EN_ATTENTE';
    return { statut, codeHache: doc.codeHache, codeExpireLe: doc.codeExpireLe, tentatives: doc.tentatives, empreinte: doc.empreinte ?? '' } as const;
  }

  async signatureInfos(jeton: string) {
    const doc = await this.parJeton(jeton);
    const s = await this.prisma.formationSession.findUnique({
      where: { id: doc.sessionId },
      select: { title: true, startDate: true, endDate: true, formation: { select: { title: true } } },
    });
    const academie = await this.prisma.academie.findUnique({ where: { accountId: doc.accountId }, select: { nom: true } });
    return {
      type: doc.type,
      titre: doc.titre,
      organisme: academie?.nom ?? '',
      formation: s?.title || s?.formation.title || '',
      debut: s?.startDate ?? null,
      fin: s?.endDate ?? null,
      signataireNom: doc.signataireNom,
      emailMasque: masquer(doc.signataireEmail),
      statut: doc.statut,
      signeLe: doc.signeLe,
    };
  }

  async pdfPourSignataire(jeton: string) {
    const doc = await this.parJeton(jeton);
    const academie = await this.ctx.academie(doc.accountId);
    const s = await this.charger(doc.sessionId);
    const cible = doc.type === 'CONVENTION' ? { entreprise: doc.titre.replace(/^Convention, /, '') } : { inscriptionId: doc.inscriptionId ?? undefined };
    return this.fabriquerPour(academie, s, doc.type, cible);
  }

  async envoyerCode(jeton: string) {
    const doc = await this.parJeton(jeton);
    if (doc.statut === StatutDocumentSession.SIGNE) throw new BadRequestException('Ce document est déjà signé.');
    if (doc.statut === StatutDocumentSession.REFUSE) throw new BadRequestException('Cette demande de signature a été retirée ou refusée.');
    if (!doc.signataireEmail) throw new BadRequestException('Aucune adresse de signataire.');
    const code = genererCode();
    await this.prisma.documentSession.update({
      where: { id: doc.id },
      data: { codeHache: hacherCode(code, doc.id), codeExpireLe: new Date(Date.now() + VALIDITE_CODE_MINUTES * 60_000), tentatives: 0 },
    });
    const marque = await this.ctx.marque(doc.accountId);
    await this.mail.sendEcoleLibre({
      to: doc.signataireEmail,
      ecole: marque,
      sujet: `Votre code de signature : ${code}`,
      titre: 'Votre code de signature',
      texte: `Voici votre code pour signer « ${doc.titre} » : ${code}\n\nIl est valable ${VALIDITE_CODE_MINUTES} minutes. Si vous n'avez rien demandé, ignorez ce message.`,
    });
    return { envoye: true, emailMasque: masquer(doc.signataireEmail), validiteMinutes: VALIDITE_CODE_MINUTES };
  }

  async signer(jeton: string, code: string, ip: string | null, ua: string | null) {
    const doc = await this.parJeton(jeton);
    const s = await this.charger(doc.sessionId);
    const cible = doc.type === 'CONVENTION' ? { entreprise: doc.titre.replace(/^Convention, /, '') } : { inscriptionId: doc.inscriptionId ?? undefined };
    if (doc.type !== 'CONVENTION' && doc.type !== 'CONTRAT') throw new ForbiddenException('Ce document ne se signe pas.');
    const actuelle = empreinte(this.canonique(s, doc.type, cible));
    const r = verifier(this.etatSignature(doc), code, doc.id, actuelle);
    if (!r.ok) {
      if (r.echec === 'CODE_ERRONE') await this.prisma.documentSession.update({ where: { id: doc.id }, data: { tentatives: { increment: 1 } } });
      throw new BadRequestException(r.message);
    }
    await this.prisma.documentSession.update({
      where: { id: doc.id },
      data: { statut: StatutDocumentSession.SIGNE, signeLe: new Date(), signeIp: ip?.slice(0, 64) ?? null, signeUa: ua?.slice(0, 300) ?? null, codeHache: null },
    });
    return { signe: true };
  }

  async refuser(jeton: string, motif?: string) {
    const doc = await this.parJeton(jeton);
    if (doc.statut === StatutDocumentSession.SIGNE) throw new BadRequestException('Ce document est déjà signé.');
    await this.prisma.documentSession.update({
      where: { id: doc.id },
      data: { statut: StatutDocumentSession.REFUSE, codeHache: null },
    });
    this.logger.log(`[documents] signature refusée ${doc.id}${motif ? ` : ${motif.slice(0, 200)}` : ''}`);
    return { refuse: true };
  }
}

export function masquer(email: string | null | undefined): string {
  if (!email) return '';
  const [local, domaine] = email.split('@');
  if (!domaine) return '***';
  return `${local.slice(0, 2)}${'•'.repeat(Math.max(1, local.length - 2))}@${domaine}`;
}
