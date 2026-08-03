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
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { RequestAccount, RequestUser } from '../common/types/request-context';

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
  constructor(private readonly billing: BillingService) {}

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
    if (dto.kind === 'invoice') {
      if (!dto.invoiceId) throw new BadRequestException('invoiceId requis.');
      return this.billing.createInvoiceCheckout(user.id, account.id, dto.invoiceId);
    }
    throw new BadRequestException(
      'Type de paiement inconnu. Les prestations se règlent à la facture, il n’y a plus de crédits à recharger.',
    );
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
