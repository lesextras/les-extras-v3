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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/request-context';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  /** Vue d'ensemble facturation : adhésion en cours et formules disponibles. */
  @Get('overview')
  @UseGuards(JwtAuthGuard)
  overview(
    @CurrentUser() user: RequestUser,
    @Query('accountId') accountId: string,
  ) {
    return this.billing.overview(user.id, accountId);
  }

  /** Crée une session Stripe Checkout et renvoie son URL. */
  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  checkout(@CurrentUser() user: RequestUser, @Body() dto: CreateCheckoutDto) {
    if (dto.kind === 'subscription') {
      if (!dto.planId) throw new BadRequestException('planId requis.');
      return this.billing.createSubscriptionCheckout(user.id, dto.accountId, dto.planId);
    }
    if (dto.kind === 'invoice') {
      if (!dto.invoiceId) throw new BadRequestException('invoiceId requis.');
      return this.billing.createInvoiceCheckout(user.id, dto.accountId, dto.invoiceId);
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
