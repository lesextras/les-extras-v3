import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { AgendaService } from './agenda.service';
import { CreerRendezVousDto, ModifierRendezVousDto } from './dto/agenda.dto';

/**
 * L'agenda est celui du COMPTE, pas d'une personne : tout membre de l'équipe
 * le lit et l'alimente. C'est la demande, et c'est ce qui distingue un agenda
 * d'association ou d'organisme d'un agenda personnel.
 */
@Controller('agenda')
@UseGuards(JwtAuthGuard, AccountGuard)
export class AgendaController {
  constructor(private readonly agenda: AgendaService) {}

  @Get()
  liste(
    @CurrentAccount() a: RequestAccount,
    @Query('du') du?: string,
    @Query('au') au?: string,
  ) {
    return this.agenda.evenements(a.id, du, au);
  }

  @Post()
  creer(
    @CurrentAccount() a: RequestAccount,
    @CurrentUser() u: RequestUser,
    @Body() dto: CreerRendezVousDto,
  ) {
    return this.agenda.creer(a.id, u.id, dto);
  }

  @Patch(':id')
  modifier(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Body() dto: ModifierRendezVousDto,
  ) {
    return this.agenda.modifier(a.id, id, dto);
  }

  @Delete(':id')
  supprimer(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.agenda.supprimer(a.id, id);
  }
}
