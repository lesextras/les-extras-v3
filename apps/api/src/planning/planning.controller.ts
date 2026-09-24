import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { PlanningService } from './planning.service';
import { AvailabilityDto, CreateShiftDto, SetStatusDto, UpdateShiftDto } from './dto/shift.dto';
import { AnalyserPlanningDto, ImporterPlanningDto } from './dto/import.dto';

@Controller()
@UseGuards(JwtAuthGuard, AccountGuard)
export class PlanningController {
  constructor(private readonly planning: PlanningService) {}

  @Get('planning')
  planningRange(@CurrentAccount() a: RequestAccount, @CurrentUser() u: RequestUser,
    @Query('from') from?: string, @Query('to') to?: string,
    @Query('orgUnitId') orgUnitId?: string) {
    return this.planning.getPlanning(a.id, a.type, u.id, from, to, orgUnitId);
  }

  /**
   * Étape 1 : on lit le fichier et on renvoie ce qu'on a compris.
   * Rien n'est écrit. Ouvert à tous les membres du compte : chacun apporte
   * son propre planning, y compris un salarié qui déclare ses heures.
   */
  @Post('planning/import/analyse')
  analyserImport(@Body() dto: AnalyserPlanningDto) {
    return this.planning.analyserImport(dto.contenu);
  }

  /** Étape 2 : les créneaux relus entrent au planning. */
  @Post('planning/import')
  importerPlanning(
    @CurrentAccount() a: RequestAccount,
    @CurrentUser() u: RequestUser,
    @Body() dto: ImporterPlanningDto,
  ) {
    return this.planning.importerCreneaux(a.id, u.id, dto.creneaux);
  }

  @Post('shifts')
  create(@CurrentAccount() a: RequestAccount, @Body() dto: CreateShiftDto) {
    return this.planning.createShift(a.id, dto);
  }

  @Patch('shifts/:id')
  update(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: UpdateShiftDto) {
    return this.planning.updateShift(a.id, id, dto);
  }

  /**
   * Le statut d'un créneau (planifié / confirmé / annulé) est un acte
   * d'encadrement : il vaut validation d'heures travaillées. Créer, modifier
   * et supprimer un créneau étaient réservés à OWNER/ADMIN/MANAGER ; changer
   * son statut ne l'était pas, alors que c'est l'opération qui compte pour la
   * paie. N'importe quel membre du compte pouvait confirmer ou annuler le
   * créneau d'un collègue.
   */
  @Patch('shifts/:id/status')
  status(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: SetStatusDto) {
    return this.planning.setStatus(a.id, id, dto.status);
  }

  @Delete('shifts/:id')
  remove(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.planning.deleteShift(a.id, id);
  }

  @Post('shifts/from-booking/:bookingId')
  fromBooking(@CurrentAccount() a: RequestAccount, @Param('bookingId') bookingId: string) {
    return this.planning.shiftFromBooking(a.id, bookingId);
  }

  @Get('availability')
  listAvail(@CurrentUser() u: RequestUser) {
    return this.planning.listAvailability(u.id);
  }

  @Post('availability')
  addAvail(@CurrentUser() u: RequestUser, @Body() dto: AvailabilityDto) {
    return this.planning.addAvailability(u.id, dto);
  }

  @Delete('availability/:id')
  removeAvail(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.planning.removeAvailability(u.id, id);
  }
}
