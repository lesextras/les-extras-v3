import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { BillingService } from './billing.service';
import { CreditsService } from './credits.service';
import { CreateCheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { RequestAccount, RequestUser } from '../common/types/request-context';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { AccountRole } from '@prisma/client';

/**
 * Le compte payeur vient du garde, plus du corps de la requête.
 *
 * Ici l'enjeu est plus net qu'ailleurs : c'est de l'argent. Le compte à
 * débiter, ou celui dont on active l'adhésion, arrivait dans le corps de la
 * requête et n'était revérifié qu'au fond du service. Le webhook, lui, reste
 * volontairement sans garde : il n'est pas appelé par un utilisateur mais par
 * Stripe, et son authentification est la signature HMAC de son corps brut.
 */
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly credits: CreditsService,
  ) {}

  /** Vue d'ensemble facturation : adhésion en cours et formules disponibles. */
  @Get('overview')
  @UseGuards(JwtAuthGuard, AccountGuard)
  overview(@CurrentUser() user: RequestUser, @CurrentAccount() account: RequestAccount) {
    return this.billing.overview(user.id, account.id);
  }

  /** Crée une session Stripe Checkout et renvoie son URL. */
  @Post('checkout')
  @UseGuards(JwtAuthGuard, AccountGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  checkout(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: CreateCheckoutDto,
  ) {
    if (dto.kind === 'subscription') {
      if (!dto.planId) throw new BadRequestException('planId requis.');
      return this.billing.createSubscriptionCheckout(user.id, account.id, dto.planId);
    }
    if (dto.kind === 'credits') {
      if (!dto.packId) throw new BadRequestException('packId requis.');
      return this.billing.createCreditsCheckout(user.id, account.id, dto.packId);
    }
    if (dto.kind === 'invoice') {
      if (!dto.invoiceId) throw new BadRequestException('invoiceId requis.');
      return this.billing.createInvoiceCheckout(user.id, account.id, dto.invoiceId);
    }
    throw new BadRequestException(
      'Type de paiement inconnu : subscription, credits ou invoice.',
    );
  }

  /**
   * Écran « Utilisation » : solde de crédits LEX, consommation sur 30 jours
   * et derniers mouvements du grand livre. Lisible par tout membre actif du
   * compte — voir sa consommation n'exige pas le droit de payer.
   */
  @Get('utilisation')
  @UseGuards(JwtAuthGuard, AccountGuard)
  utilisation(@CurrentAccount() account: RequestAccount) {
    return this.credits.utilisation(account.id);
  }

  /**
   * Essai Découverte : gratuit, une fois par compte, 7 jours de recharge
   * quotidienne. Pas de paiement, donc pas de tunnel Stripe — juste un clic.
   */
  @Post('essai')
  @UseGuards(JwtAuthGuard, AccountGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  essai(@CurrentAccount() account: RequestAccount) {
    return this.credits.reclamerEssai(account.id);
  }

  /**
   * JOURNAL DES GÉNÉRATIONS — réservé à la direction du compte.
   *
   * /confiance-lex le promet à une direction, pas à chaque membre : voir qui,
   * dans l'équipe, a produit quel écrit relève du pilotage. Un membre garde
   * l'accès à sa propre consommation via /billing/utilisation.
   */
  @Get('journal')
  @UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  journal(@CurrentAccount() account: RequestAccount, @Query('depuis') depuis?: string) {
    return this.credits.journal(account.id, { depuis: this.dateOuRien(depuis) });
  }

  /**
   * Le même journal en CSV, pour une évaluation HAS ou un protocole d'équipe.
   *
   * Séparateur point-virgule et BOM UTF-8 : sans eux, Excel en configuration
   * française ouvre tout dans une seule colonne et casse les accents. Le
   * fichier finit sur le bureau d'une direction, pas dans un script.
   */
  @Get('journal.csv')
  @UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  async journalCsv(
    @CurrentAccount() account: RequestAccount,
    @Res() res: Response,
    @Query('depuis') depuis?: string,
  ) {
    const lignes = await this.credits.journal(account.id, {
      depuis: this.dateOuRien(depuis),
      limite: 5000,
    });
    const cellule = (v: unknown) => {
      const t = v === null || v === undefined ? '' : String(v);
      return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const entete = ['Date', 'Auteur', 'E-mail', 'Outil', 'Intitulé', 'Crédits'];
    const corps = lignes.map((l) =>
      [
        l.date.toISOString(),
        l.auteur?.nom ?? 'Auteur non enregistré',
        l.auteur?.email ?? '',
        l.outil,
        l.intitule ?? '',
        l.credits,
      ]
        .map(cellule)
        .join(';'),
    );
    const csv = '\uFEFF' + [entete.join(';'), ...corps].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="journal-generations-lex.csv"',
    );
    res.send(csv);
  }

  /** Une date de filtre invalide est ignorée, elle ne fait pas échouer l'export. */
  private dateOuRien(valeur?: string): Date | undefined {
    if (!valeur) return undefined;
    const d = new Date(valeur);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }

  /** Webhook Stripe — public, authentifié par signature HMAC sur le corps brut. */
  @Post('webhook')
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
  ) {
    return this.billing.handleWebhook(
      req.rawBody ?? Buffer.from(''),
      signature,
    );
  }
}
