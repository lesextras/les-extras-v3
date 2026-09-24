import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { CreerRendezVousDto, ModifierRendezVousDto } from '../agenda/dto/agenda.dto';
import { PartagesService } from './partages.service';
import {
  AccepterPartageDto,
  AffichagePartageDto,
  DemanderPartageDto,
  InviterPartageDto,
  ModifierPartageDto,
} from './dto/partages.dto';

/**
 * Partages d'agenda entre comptes, comme dans Outlook. Les routes sans `:id`
 * sont déclarées AVANT celles qui en portent un.
 */
@Controller('partages')
@UseGuards(JwtAuthGuard, AccountGuard)
export class PartagesController {
  constructor(private readonly partages: PartagesService) {}

  @Get()
  lister(@CurrentUser() u: RequestUser, @CurrentAccount() a: RequestAccount) {
    return this.partages.lister(u, a);
  }

  @Get('calendrier')
  calendrier(@CurrentUser() u: RequestUser, @Query('du') du?: string, @Query('au') au?: string) {
    return this.partages.calendrier(u, du, au);
  }

  @Post('inviter')
  inviter(@CurrentUser() u: RequestUser, @CurrentAccount() a: RequestAccount, @Body() dto: InviterPartageDto) {
    return this.partages.inviter(u, a, dto);
  }

  @Post('demander')
  demander(@CurrentUser() u: RequestUser, @Body() dto: DemanderPartageDto) {
    return this.partages.demander(u, dto);
  }

  @Get(':id/offres')
  offres(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.partages.offres(u, id);
  }

  @Post(':id/accepter')
  accepter(
    @CurrentUser() u: RequestUser,
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Body() dto: AccepterPartageDto,
  ) {
    return this.partages.accepter(u, a, id, dto);
  }

  @Post(':id/refuser')
  refuser(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.partages.refuser(u, id);
  }

  @Patch(':id')
  modifier(@CurrentUser() u: RequestUser, @Param('id') id: string, @Body() dto: ModifierPartageDto) {
    return this.partages.modifier(u, id, dto);
  }

  @Patch(':id/affichage')
  affichage(@CurrentUser() u: RequestUser, @Param('id') id: string, @Body() dto: AffichagePartageDto) {
    return this.partages.affichage(u, id, dto);
  }

  @Delete(':id')
  retirer(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.partages.retirer(u, id);
  }

  @Post(':id/rendez-vous')
  creerRdv(@CurrentUser() u: RequestUser, @Param('id') id: string, @Body() dto: CreerRendezVousDto) {
    return this.partages.creerRendezVous(u, id, dto);
  }

  @Patch(':id/rendez-vous/:rdvId')
  modifierRdv(
    @CurrentUser() u: RequestUser,
    @Param('id') id: string,
    @Param('rdvId') rdvId: string,
    @Body() dto: ModifierRendezVousDto,
  ) {
    return this.partages.modifierRendezVous(u, id, rdvId, dto);
  }

  @Delete(':id/rendez-vous/:rdvId')
  supprimerRdv(@CurrentUser() u: RequestUser, @Param('id') id: string, @Param('rdvId') rdvId: string) {
    return this.partages.supprimerRendezVous(u, id, rdvId);
  }
}
