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

  @Get('compteurs')
  compteurs(@CurrentAccount() a: RequestAccount, @Query('mois') mois?: string) {
    return this.gta.compteurs(a.id, mois);
  }

  @Post('cycles')
  cycles(
    @CurrentAccount() a: RequestAccount,
    @Body() dto: { lundi: string; semaines: number },
  ) {
    return this.gta.deroulerCycle(a.id, a.role, dto);
  }

  @Get('export/evp.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="les-extras_elements-de-paie.csv"')
  exportEvp(@CurrentAccount() a: RequestAccount, @Query('mois') mois?: string) {
    return this.gta.exportEvp(a.id, mois);
  }
}
