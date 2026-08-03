import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeaveType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { GtaService } from './gta.service';

/** GTA : conges, compteurs, cycles de planning, export paie. */
@Controller('gta')
@UseGuards(JwtAuthGuard, AccountGuard)
export class GtaController {
  constructor(private readonly gta: GtaService) {}

  @Post('conges')
  creerConge(
    @CurrentAccount() a: RequestAccount,
    @CurrentUser() u: RequestUser,
    @Body() dto: { type?: LeaveType; debut: string; fin: string; motif?: string },
  ) {
    return this.gta.creerConge(a.id, u.id, dto);
  }

  @Get('conges')
  listerConges(@CurrentAccount() a: RequestAccount, @CurrentUser() u: RequestUser) {
    return this.gta.listerConges(a.id, u.id, a.role);
  }

  @Patch('conges/:id')
  deciderConge(
    @CurrentAccount() a: RequestAccount,
    @CurrentUser() u: RequestUser,
    @Param('id') id: string,
    @Body() dto: { statut: 'APPROUVE' | 'REFUSE' },
  ) {
    return this.gta.deciderConge(a.id, id, u.id, a.role, dto.statut);
  }

  /**
   * Les compteurs portent les heures et les soldes de TOUTE l'equipe : ce
   * n'est pas une information d'equipe. Sans cette garde, n'importe quel
   * membre les recuperait par appel direct.
   */
  @Get('compteurs')
  @UseGuards(AccountRolesGuard)
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER')
  compteurs(
    @CurrentAccount() a: RequestAccount,
    @Query('mois') mois?: string,
    @Query('orgUnitId') orgUnitId?: string,
  ) {
    return this.gta.compteurs(a.id, mois, orgUnitId);
  }

  @Post('cycles')
  cycles(
    @CurrentAccount() a: RequestAccount,
    @Body() dto: { lundi: string; semaines: number },
  ) {
    return this.gta.deroulerCycle(a.id, a.role, dto);
  }

  @UseGuards(AccountRolesGuard)
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER')
  @Get('export/evp.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="les-extras_elements-de-paie.csv"')
  exportEvp(@CurrentAccount() a: RequestAccount, @Query('mois') mois?: string) {
    return this.gta.exportEvp(a.id, mois);
  }
}
