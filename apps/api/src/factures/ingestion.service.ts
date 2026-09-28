import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { randomBytes } from 'node:crypto';
import { ImapFlow } from 'imapflow';
import { simpleParser, type ParsedMail } from 'mailparser';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { TAILLE_MAX_GLOBALE } from '../storage/file-rules';
import { FacturesService } from './factures.service';
import { FraisService } from './frais.service';

/**
 * LE DÉPÔT PAR E-MAIL : une boîte, lue toutes les cinq minutes.
 *
 * Chaque espace a son adresse : `factures+<jeton>@<domaine>`. On la donne à
 * ses fournisseurs, ou on y transfère les factures reçues ; toute pièce jointe
 * (PDF, photo) devient une facture « à vérifier », lue comme si elle avait été
 * déposée à l'écran. L'expéditeur reçoit un accusé qui dit ce qui a été lu.
 *
 * Comment on retrouve l'espace, dans l'ordre :
 *   1. le `+jeton` dans une adresse destinataire (To, Cc, Delivered-To) ;
 *   2. sinon l'adresse de l'expéditeur, si elle est membre d'UN SEUL espace
 *      qui a activé le dépôt (un membre de deux espaces doit utiliser l'adresse
 *      complète, et l'accusé le lui dit).
 * Un message qui ne se rattache à rien est laissé dans la boîte, non lu, avec
 * l'étiquette « Inconnu » : un humain tranche.
 *
 * ⚠ LA BOÎTE EST LUE, JAMAIS ÉCRITE PAR CE CODE au-delà des drapeaux et du
 * déplacement vers « Traites ». Les identifiants viennent de l'environnement
 * (`FACTURES_IMAP_HOST`, `FACTURES_IMAP_USER`, `FACTURES_IMAP_PASSWORD`,
 * `FACTURES_DEPOT_DOMAINE`) ; sans eux, rien ne tourne et l'écran dit que
 * l'adresse n'est pas en service.
 *
 * ⚠ Une facture arrivée d'une adresse qui n'est PAS membre de l'espace est
 * acceptée (c'est le cas normal d'un fournisseur) mais son alerte le dit :
 * « reçue de <adresse> ». C'est la relecture qui décide.
 */

const TYPES_ACCEPTES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
const PIECES_MAX = 10;

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);
  private enCours = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly factures: FacturesService,
    private readonly frais: FraisService,
  ) {}

  // ─── Ce que l'écran affiche ───────────────────────────────────────────────

  private domaine(): string | null {
    const d = this.config.get<string>('FACTURES_DEPOT_DOMAINE') || (this.config.get<string>('FACTURES_IMAP_USER') ?? '').split('@')[1] || null;
    return d || null;
  }

  private boiteConfiguree() {
    return !!(this.config.get<string>('FACTURES_IMAP_HOST') && this.config.get<string>('FACTURES_IMAP_USER') && this.config.get<string>('FACTURES_IMAP_PASSWORD'));
  }

  private adresse(jeton: string | null) {
    const d = this.domaine();
    const boite = (this.config.get<string>('FACTURES_IMAP_USER') ?? 'factures').split('@')[0] || 'factures';
    return jeton && d ? `${boite}+${jeton}@${d}` : null;
  }

  async depot(accountId: string) {
    const r = await this.frais.reglages(accountId);
    return { enService: this.boiteConfiguree(), adresse: this.adresse(r.jetonDepot), jeton: r.jetonDepot };
  }

  /** Crée (ou renouvelle) le jeton de l'espace : l'ancienne adresse cesse de fonctionner. */
  async activer(accountId: string, userId: string, renouveler = false) {
    const r = await this.prisma.reglagesFactures.findUnique({ where: { accountId } });
    let jeton = r?.jetonDepot ?? null;
    if (!jeton || renouveler) {
      jeton = randomBytes(6).toString('base64url').replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 8) || randomBytes(4).toString('hex');
      await this.prisma.reglagesFactures.upsert({ where: { accountId }, create: { accountId, jetonDepot: jeton }, update: { jetonDepot: jeton } });
      await this.frais.journaliser(accountId, userId, renouveler ? 'depot-email.renouvele' : 'depot-email.active');
    }
    return this.depot(accountId);
  }

  async desactiver(accountId: string, userId: string) {
    await this.prisma.reglagesFactures.updateMany({ where: { accountId }, data: { jetonDepot: null } });
    await this.frais.journaliser(accountId, userId, 'depot-email.desactive');
    return this.depot(accountId);
  }

  // ─── La relève ────────────────────────────────────────────────────────────

  @Cron(process.env.FACTURES_IMAP_CRON ?? '*/5 * * * *', { name: 'factures-ingestion' })
  async relever() {
    if (!this.boiteConfiguree() || this.enCours) return;
    this.enCours = true;
    try {
      await this.releverUneFois();
    } catch (e) {
      this.logger.warn(`Relève IMAP impossible : ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      this.enCours = false;
    }
  }

  async releverUneFois(): Promise<{ traites: number; inconnus: number }> {
    const client = new ImapFlow({
      host: this.config.get<string>('FACTURES_IMAP_HOST')!,
      port: Number(this.config.get<string>('FACTURES_IMAP_PORT') ?? 993),
      secure: (this.config.get<string>('FACTURES_IMAP_SECURE') ?? 'true') !== 'false',
      auth: { user: this.config.get<string>('FACTURES_IMAP_USER')!, pass: this.config.get<string>('FACTURES_IMAP_PASSWORD')! },
      logger: false,
      connectionTimeout: 20_000,
    });
    let traites = 0;
    let inconnus = 0;
    await client.connect();
    try {
      await client.mailboxCreate('Traites').catch(() => undefined);
      await client.mailboxCreate('Inconnus').catch(() => undefined);
      const lock = await client.getMailboxLock('INBOX');
      const messages: { uid: number; source: Buffer }[] = [];
      try {
        // On collecte d'abord : écrire des drapeaux pendant l'itération bloquerait la connexion.
        for await (const m of client.fetch({ seen: false }, { uid: true, source: true })) {
          if (m.source) messages.push({ uid: m.uid, source: m.source });
          if (messages.length >= 25) break;
        }
      } finally {
        lock.release();
      }
      for (const m of messages) {
        const resultat = await this.traiter(m.source).catch((e) => {
          this.logger.warn(`Message ${m.uid} : ${e instanceof Error ? e.message : String(e)}`);
          return 'erreur' as const;
        });
        if (resultat === 'inconnu') {
          inconnus++;
          await client.messageMove(String(m.uid), 'Inconnus', { uid: true }).catch(() => undefined);
        } else if (resultat === 'traite') {
          traites++;
          await client.messageMove(String(m.uid), 'Traites', { uid: true }).catch(() => undefined);
        } else {
          // Erreur passagère : on laisse le message non lu, il sera repris au prochain passage.
        }
      }
    } finally {
      await client.logout().catch(() => undefined);
    }
    if (traites || inconnus) this.logger.log(`Relève : ${traites} message(s) traité(s), ${inconnus} inconnu(s).`);
    return { traites, inconnus };
  }

  /** Un message → des factures. Rend 'traite', 'inconnu' (aucun espace) ou lève sur erreur passagère. */
  async traiter(source: Buffer): Promise<'traite' | 'inconnu'> {
    const mail = await simpleParser(source);
    const expediteur = (mail.from?.value?.[0]?.address ?? '').toLowerCase();
    const cible = await this.identifier(mail, expediteur);
    if (!cible) {
      this.logger.warn(`Message sans espace identifiable (de ${expediteur || 'inconnu'}) : laissé dans « Inconnus ».`);
      return 'inconnu';
    }
    const pieces = (mail.attachments ?? []).filter((a) => TYPES_ACCEPTES.has((a.contentType ?? '').toLowerCase()) && a.content && a.content.length > 0).slice(0, PIECES_MAX);
    const lignes: { nom: string; ok: boolean; detail: string }[] = [];
    if (!pieces.length) lignes.push({ nom: 'Aucune pièce jointe lisible', ok: false, detail: 'Joignez la facture en PDF, JPEG, PNG ou WebP.' });
    for (const a of pieces) {
      const nom = a.filename || `piece-${lignes.length + 1}`;
      if (a.content.length > TAILLE_MAX_GLOBALE) {
        lignes.push({ nom, ok: false, detail: 'Fichier trop lourd.' });
        continue;
      }
      try {
        const f = await this.factures.deposer(cible.accountId, cible.userId, { originalname: nom, mimetype: a.contentType.toLowerCase(), size: a.content.length, buffer: a.content }, undefined, null, 'email');
        if (!cible.membre) {
          await this.prisma.factureFournisseur.update({ where: { id: f.id }, data: { alerte: [f.alerte, `Reçue par e-mail de ${expediteur || 'une adresse inconnue'}.`].filter(Boolean).join(' ') } });
        }
        lignes.push({ nom, ok: true, detail: `${f.fournisseur}, ${f.montantTTC.toFixed(2)} € TTC${f.numero ? `, n° ${f.numero}` : ''}. À vérifier.` });
      } catch (e) {
        lignes.push({ nom, ok: false, detail: e instanceof Error ? e.message : 'Lecture impossible.' });
      }
    }
    await this.frais.journaliser(cible.accountId, cible.userId, 'depot-email.message', undefined, { de: expediteur, pieces: pieces.length, lues: lignes.filter((l) => l.ok).length });
    if (expediteur && !/no-?reply|ne-?pas-?repondre|mailer-daemon/i.test(expediteur)) {
      await this.mail.sendAccuseDepotFacture(expediteur, { espace: cible.nom, chemin: cible.chemin, lignes }).catch(() => undefined);
    }
    return 'traite';
  }

  /** L'espace visé : par le jeton de l'adresse, sinon par l'expéditeur. */
  private async identifier(mail: ParsedMail, expediteur: string): Promise<{ accountId: string; userId: string; nom: string; chemin: string; membre: boolean } | null> {
    const adresses: string[] = [];
    const pousser = (v: unknown) => {
      const liste = Array.isArray(v) ? v : v ? [v] : [];
      for (const x of liste) {
        const vals = (x as { value?: { address?: string }[] })?.value ?? [];
        for (const a of vals) if (a.address) adresses.push(a.address.toLowerCase());
      }
    };
    pousser(mail.to);
    pousser(mail.cc);
    for (const h of ['delivered-to', 'x-original-to', 'envelope-to']) {
      const v = mail.headers.get(h);
      const t = typeof v === 'string' ? v : Array.isArray(v) ? v.join(' ') : v && typeof v === 'object' && 'text' in v ? String((v as { text: string }).text) : '';
      for (const m of t.matchAll(/[\w.+-]+@[\w.-]+/g)) adresses.push(m[0].toLowerCase());
    }
    let jeton: string | null = null;
    for (const a of adresses) {
      const m = /\+([a-z0-9]{6,16})@/.exec(a);
      if (m) {
        jeton = m[1];
        break;
      }
    }
    if (jeton) {
      const r = await this.prisma.reglagesFactures.findUnique({ where: { jetonDepot: jeton }, include: { account: { select: { id: true, name: true, type: true } } } });
      if (r) {
        const titulaire = await this.titulaire(r.accountId, expediteur);
        return { accountId: r.accountId, userId: titulaire.userId, nom: r.account.name, chemin: this.chemin(r.account.type), membre: titulaire.membre };
      }
    }
    if (!expediteur) return null;
    const user = await this.prisma.user.findUnique({ where: { email: expediteur }, select: { id: true, memberships: { where: { status: 'ACTIVE' }, select: { accountId: true, account: { select: { id: true, name: true, type: true, reglagesFactures: { select: { jetonDepot: true } } } } } } } });
    if (!user) return null;
    const espaces = user.memberships.filter((m) => (m.account.type === 'ASSOCIATION' || m.account.type === 'ACADEMIE') && m.account.reglagesFactures?.jetonDepot);
    if (espaces.length !== 1) return null;
    const a = espaces[0].account;
    return { accountId: a.id, userId: user.id, nom: a.name, chemin: this.chemin(a.type), membre: true };
  }

  /** Au nom de qui la facture est déposée : l'expéditeur s'il est membre, sinon le titulaire de l'espace. */
  private async titulaire(accountId: string, expediteur: string) {
    if (expediteur) {
      const m = await this.prisma.membership.findFirst({ where: { accountId, status: 'ACTIVE', user: { email: expediteur } }, select: { userId: true } });
      if (m) return { userId: m.userId, membre: true };
    }
    const owner = await this.prisma.membership.findFirst({ where: { accountId, status: 'ACTIVE' }, orderBy: [{ role: 'asc' }, { id: 'asc' }], select: { userId: true } });
    return { userId: owner?.userId ?? '', membre: false };
  }

  private chemin(type: string) {
    return type === 'ACADEMIE' ? '/academie/factures' : '/espace/factures';
  }
}
