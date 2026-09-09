import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import type { RequestAccount } from '../common/types/request-context';
import { StripeConnectService } from './stripe-connect.service';

export class LierStripeDto {
  /** L'écran d'où part la demande : c'est là que Stripe renverra la personne. */
  @IsOptional() @IsString() retour?: string;
}

export class CommissionDto {
  @IsInt() @Min(0) @Max(50) pourcent!: number;
}

/**
 * LE COMPTE D'ENCAISSEMENT DE L'ORGANISME.
 *
 * Les mêmes routes servent l'académie et la boutique de l'association : c'est
 * le compte qui est relié, pas l'un de ses écrans.
 */
@Controller('paiements/stripe')
@UseGuards(JwtAuthGuard, AccountGuard)
export class StripeConnectController {
  constructor(private readonly connect: StripeConnectService) {}

  @Get('etat')
  etat(@CurrentAccount() a: RequestAccount) {
    return this.connect.etat(a.id);
  }

  @Post('lier')
  lier(@CurrentAccount() a: RequestAccount, @Body() dto: LierStripeDto) {
    return this.connect.lier(a.id, dto.retour?.trim() || 'https://les-extras.fr');
  }

  @Post('tableau-de-bord')
  tableauDeBord(@CurrentAccount() a: RequestAccount) {
    return this.connect.tableauDeBord(a.id);
  }

  @Post('commission')
  commission(@CurrentAccount() a: RequestAccount, @Body() dto: CommissionDto) {
    return this.connect.definirCommission(a.id, dto.pourcent);
  }

  @Delete('lier')
  detacher(@CurrentAccount() a: RequestAccount) {
    return this.connect.detacher(a.id);
  }
}
