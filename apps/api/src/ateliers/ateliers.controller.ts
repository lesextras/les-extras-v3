import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import type { RequestAccount } from '../common/types/request-context';
import { AteliersService } from './ateliers.service';
import {
  ReglagePaiementDto,
  RemboursementDto,
  SuiviReservationDto,
} from './dto/ateliers.dto';

/**
 * LES ATELIERS PAYÉS EN LIGNE, CÔTÉ INTERVENANT.
 *
 * Le garde de compte fait le tri : on ne voit et on ne rembourse jamais les
 * réservations d'un autre.
 */
@Controller('ateliers')
@UseGuards(JwtAuthGuard, AccountGuard)
export class AteliersController {
  constructor(private readonly ateliers: AteliersService) {}

  @Get('reservations')
  reservations(@CurrentAccount() a: RequestAccount) {
    return this.ateliers.listerReservations(a.id);
  }

  @Patch('reservations/:id')
  suivre(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Body() dto: SuiviReservationDto,
  ) {
    return this.ateliers.suivre(a.id, id, dto);
  }

  @Post('reservations/:id/rembourser')
  rembourser(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Body() dto: RemboursementDto,
  ) {
    return this.ateliers.rembourser(a.id, id, dto);
  }

  @Get(':serviceId/paiement')
  conditions(@CurrentAccount() a: RequestAccount, @Param('serviceId') serviceId: string) {
    return this.ateliers.conditions(a.id, serviceId);
  }

  @Patch(':serviceId/paiement')
  reglerPaiement(
    @CurrentAccount() a: RequestAccount,
    @Param('serviceId') serviceId: string,
    @Body() dto: ReglagePaiementDto,
  ) {
    return this.ateliers.reglerPaiement(a.id, serviceId, dto);
  }
}
