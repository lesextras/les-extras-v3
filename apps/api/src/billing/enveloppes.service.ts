import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../common/mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { consommeCeMois } from './enveloppe-disponible';
import type { InviterEnveloppeDto, ModifierEnveloppeDto } from './dto/enveloppes.dto';

/**
 * LES ENVELOPPES LEX (24/09/2026, décision de Siham).
 *
 * Un compte (un établissement, le plus souvent) paie les générations LEX
 * d'autres personnes, chacune avec un plafond mensuel. C'est la forme que
 * prend « LEX pour toute l'équipe » depuis que « 1 compte = 1 personne » :
 *
 *  - ON PARTAGE DES CRÉDITS, JAMAIS UN COMPTE. Chaque bénéficiaire a son
 *    propre compte ; le payeur ne peut ni s'y connecter ni lire ses écrits.
 *  - LE PAYEUR VOIT DES NOMBRES, PAS DES TEXTES : qui, combien ce mois-ci.
 *    Les écrits portent sur des enfants et des familles ; un premier jet doit
 *    pouvoir s'écrire en confiance.
 *  - PAS DE LIEN OUVERT À TOUS. Une invitation = une personne = une adresse,
 *    un jeton valable 7 jours, dont on ne garde que l'empreinte. Un lien qui
 *    circulerait dans un groupe viderait l'enveloppe sans qu'on sache qui.
 *  - L'ENVELOPPE PAIE D'ABORD (voir `CreditsService.avecCredit`) : les quinze
 *    générations gratuites de la personne restent à elle.
 */

const DUREE_JETON_MS = 7 * 86_400_000;
const MAX_ENVELOPPES = 100;

const empreinte = (jeton: string) => createHash('sha256').update(jeton).digest('hex');
const nomDe = (u: { firstName: string | null; lastName: string | null; email: string } | null) =>
  u ? [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.email : null;

@Injectable()
export class EnveloppesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly notifications: NotificationsService,
  ) {}

  /* ------------------------------------------------------ côté payeur */

  async lister(account: RequestAccount) {
    this.assertTitulaire(account);
    const [compte, enveloppes] = await Promise.all([
      this.prisma.account.findUniqueOrThrow({ where: { id: account.id }, select: { credits: true, name: true } }),
      this.prisma.enveloppeLex.findMany({
        where: { payeurAccountId: account.id, statut: { not: 'RETIREE' } },
        orderBy: { createdAt: 'asc' },
        include: { beneficiaire: { select: { firstName: true, lastName: true, email: true } } },
      }),
    ]);
    const vues = await Promise.all(
      enveloppes.map(async (e) => ({
        id: e.id,
        email: e.email,
        nom: nomDe(e.beneficiaire),
        statut: e.statut,
        plafondMensuel: e.plafondMensuel,
        partageTrames: e.partageTrames,
        consommeCeMois: await consommeCeMois(this.prisma, e.id),
        invitationExpireLe: e.statut === 'INVITEE' ? e.jetonExpireLe : null,
        accepteLe: e.accepteLe,
        creeLe: e.createdAt,
      })),
    );
    return {
      solde: compte.credits,
      compte: compte.name,
      plafondsCumules: vues.filter((v) => v.statut === 'ACTIVE').reduce((s, v) => s + v.plafondMensuel, 0),
      consommeCeMois: vues.reduce((s, v) => s + v.consommeCeMois, 0),
      enveloppes: vues,
    };
  }

  async inviter(user: RequestUser, account: RequestAccount, dto: InviterEnveloppeDto) {
    this.assertTitulaire(account);
    const email = dto.email.trim().toLowerCase();
    if (email === user.email.toLowerCase()) {
      throw new BadRequestException('Vos propres générations se paient déjà sur votre solde.');
    }
    const existante = await this.prisma.enveloppeLex.findUnique({
      where: { payeurAccountId_email: { payeurAccountId: account.id, email } },
    });
    if (existante && existante.statut !== 'RETIREE' && existante.statut !== 'INVITEE') {
      throw new ConflictException('Cette personne bénéficie déjà de votre enveloppe : modifiez son plafond.');
    }
    if (!existante) {
      const n = await this.prisma.enveloppeLex.count({ where: { payeurAccountId: account.id, statut: { not: 'RETIREE' } } });
      if (n >= MAX_ENVELOPPES) throw new BadRequestException(`${MAX_ENVELOPPES} personnes au plus par compte.`);
    }

    const jeton = randomBytes(32).toString('base64url');
    const donnees = {
      plafondMensuel: dto.plafondMensuel,
      partageTrames: dto.partageTrames ?? true,
      statut: 'INVITEE' as const,
      beneficiaireId: null,
      accepteLe: null,
      jetonHash: empreinte(jeton),
      jetonExpireLe: new Date(Date.now() + DUREE_JETON_MS),
      creeParId: user.id,
    };
    const e = existante
      ? await this.prisma.enveloppeLex.update({ where: { id: existante.id }, data: donnees })
      : await this.prisma.enveloppeLex.create({ data: { ...donnees, payeurAccountId: account.id, email } });

    const lien = this.lien(jeton);
    const [qui, compte] = await Promise.all([this.nomUtilisateur(user.id), this.nomCompte(account.id)]);
    await this.mail.sendEnveloppeLex(email, { qui, compte, plafond: e.plafondMensuel, lien }).catch(() => undefined);
    // Le lien est rendu une fois, pour que le payeur puisse aussi le transmettre
    // lui-même. Seule son empreinte est gardée : il ne pourra plus être relu.
    return { id: e.id, lien, expireLe: e.jetonExpireLe };
  }

  /** Nouveau lien (l'ancien cesse de fonctionner). */
  async nouveauLien(user: RequestUser, account: RequestAccount, id: string) {
    const e = await this.chargerPourPayeur(account, id);
    if (e.statut !== 'INVITEE') throw new BadRequestException('Cette invitation a déjà été acceptée.');
    return this.inviter(user, account, { email: e.email, plafondMensuel: e.plafondMensuel, partageTrames: e.partageTrames });
  }

  async modifier(account: RequestAccount, id: string, dto: ModifierEnveloppeDto) {
    const e = await this.chargerPourPayeur(account, id);
    if (dto.statut && e.statut === 'INVITEE') {
      throw new BadRequestException('Une invitation en attente ne se suspend pas : retirez-la si besoin.');
    }
    await this.prisma.enveloppeLex.update({
      where: { id },
      data: { plafondMensuel: dto.plafondMensuel, partageTrames: dto.partageTrames, statut: dto.statut },
    });
    return this.lister(account);
  }

  /** Retire l'enveloppe. Le grand livre garde l'historique des générations payées. */
  async retirer(account: RequestAccount, id: string) {
    await this.chargerPourPayeur(account, id);
    await this.prisma.enveloppeLex.update({
      where: { id },
      data: { statut: 'RETIREE', jetonHash: null, jetonExpireLe: null },
    });
    return { retiree: true };
  }

  /* ------------------------------------------------- côté bénéficiaire */

  /** Ce qu'une personne voit avant d'accepter. Public : jamais d'adresse en clair. */
  async apercu(jeton: string) {
    const e = await this.parJeton(jeton);
    const [compte, qui] = await Promise.all([this.nomCompte(e.payeurAccountId), this.nomUtilisateur(e.creeParId)]);
    const [local, domaine] = e.email.split('@');
    return {
      compte,
      qui,
      plafondMensuel: e.plafondMensuel,
      partageTrames: e.partageTrames,
      emailMasque: `${local.slice(0, 2)}…@${domaine}`,
      expireLe: e.jetonExpireLe,
    };
  }

  async accepter(user: RequestUser, jeton: string) {
    const e = await this.parJeton(jeton);
    if (e.email !== user.email.toLowerCase()) {
      throw new ForbiddenException(
        'Cette invitation a été envoyée à une autre adresse. Connectez-vous avec l’adresse qui l’a reçue.',
      );
    }
    const u = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id }, select: { emailVerified: true } });
    if (!u.emailVerified) {
      throw new ForbiddenException('Confirmez d’abord votre adresse e-mail (lien reçu à l’inscription), puis revenez sur ce lien.');
    }
    await this.prisma.enveloppeLex.update({
      where: { id: e.id },
      data: { beneficiaireId: user.id, statut: 'ACTIVE', accepteLe: new Date(), jetonHash: null, jetonExpireLe: null },
    });
    await this.prevenirPayeur(e.creeParId, `${await this.nomUtilisateur(user.id)} a accepté votre enveloppe LEX`).catch(() => undefined);
    return this.miennes(user);
  }

  /** Les enveloppes dont cette personne bénéficie, avec ce qu'il lui reste. */
  async miennes(user: RequestUser) {
    const enveloppes = await this.prisma.enveloppeLex.findMany({
      where: { beneficiaireId: user.id, statut: { in: ['ACTIVE', 'SUSPENDUE'] } },
      orderBy: { accepteLe: 'asc' },
      include: { payeur: { select: { name: true, credits: true } } },
    });
    return Promise.all(
      enveloppes.map(async (e) => {
        const consomme = await consommeCeMois(this.prisma, e.id);
        return {
          id: e.id,
          compte: e.payeur.name,
          statut: e.statut,
          plafondMensuel: e.plafondMensuel,
          consommeCeMois: consomme,
          restantCeMois: Math.max(0, Math.min(e.plafondMensuel - consomme, e.payeur.credits)),
          partageTrames: e.partageTrames,
        };
      }),
    );
  }

  /** La personne peut se retirer elle-même. */
  async quitter(user: RequestUser, id: string) {
    const e = await this.prisma.enveloppeLex.findFirst({ where: { id, beneficiaireId: user.id } });
    if (!e) throw new NotFoundException('Enveloppe introuvable.');
    await this.prisma.enveloppeLex.update({ where: { id }, data: { statut: 'RETIREE' } });
    return { retiree: true };
  }

  /* ------------------------------------------------------------ interne */

  private assertTitulaire(account: RequestAccount) {
    if (account.role !== 'OWNER') {
      throw new ForbiddenException('Seul le titulaire du compte peut partager ses crédits LEX.');
    }
  }

  private async chargerPourPayeur(account: RequestAccount, id: string) {
    this.assertTitulaire(account);
    const e = await this.prisma.enveloppeLex.findFirst({
      where: { id, payeurAccountId: account.id, statut: { not: 'RETIREE' } },
    });
    if (!e) throw new NotFoundException('Enveloppe introuvable.');
    return e;
  }

  private async parJeton(jeton: string) {
    const e = await this.prisma.enveloppeLex.findUnique({ where: { jetonHash: empreinte(jeton) } });
    if (!e || e.statut !== 'INVITEE') throw new NotFoundException('Ce lien d’invitation n’est plus valable.');
    if (!e.jetonExpireLe || e.jetonExpireLe < new Date()) {
      throw new GoneException('Ce lien a expiré. Demandez-en un nouveau à la personne qui vous l’a envoyé.');
    }
    return e;
  }

  private lien(jeton: string) {
    return `${this.mail.webUrl}/lex/rejoindre?jeton=${encodeURIComponent(jeton)}`;
  }

  private async nomUtilisateur(id: string) {
    const u = await this.prisma.user.findUnique({ where: { id }, select: { firstName: true, lastName: true, email: true } });
    return nomDe(u) ?? 'Une personne';
  }

  private async nomCompte(id: string) {
    const a = await this.prisma.account.findUnique({ where: { id }, select: { name: true } });
    return a?.name ?? 'Un compte Les Extras';
  }

  private prevenirPayeur(userId: string, title: string) {
    return this.notifications.create(userId, { type: 'ENVELOPPE_LEX', title, link: '/dashboard/lex-equipe' });
  }
}
