import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import type { RequestAccount } from '../common/types/request-context';
import { ContratsService } from './contrats.service';
import { CreateContratDto, DpaeDto, TerminerDto, UpdateContratDto } from './dto/contrat.dto';

@Controller('contrats')
@UseGuards(JwtAuthGuard, AccountGuard)
export class ContratsController {
  constructor(private readonly contrats: ContratsService) {}

  /** Motifs de recours légaux, pour alimenter le formulaire. */
  @Get('motifs')
  motifs() {
    return this.contrats.motifs();
  }

  @Get()
  list(@CurrentAccount() a: RequestAccount) {
    return this.contrats.list(a.id);
  }

  @Get(':id')
  get(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.contrats.get(a.id, id);
  }

  @Post()
  create(@CurrentAccount() a: RequestAccount, @Body() dto: CreateContratDto) {
    return this.contrats.create(a.id, a.type, dto);
  }

  @Patch(':id')
  update(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: UpdateContratDto) {
    return this.contrats.update(a.id, id, dto);
  }

  @Post(':id/transmettre')
  transmettre(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.contrats.transmettre(a.id, id);
  }

  @Post(':id/dpae')
  dpae(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: DpaeDto) {
    return this.contrats.declarerDpae(a.id, id, dto);
  }

  @Post(':id/terminer')
  terminer(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: TerminerDto) {
    return this.contrats.terminer(a.id, id, dto);
  }
}
