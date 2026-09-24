import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { ContratsService } from './contrats.service';
import { CreateContratDto, DpaeDto, TerminerDto, UpdateContratDto } from './dto/contrat.dto';

/**
 * Un contrat de travail porte une rémunération, une qualification et parfois
 * le nom de la personne remplacée. Toutes les routes sont bornées au compte
 * actif (l'établissement qui l'établit), à une exception en lecture seule :
 * la personne engagée lit SON contrat (`GET /contrats/:id`).
 */
@Controller('contrats')
@UseGuards(JwtAuthGuard, AccountGuard)
export class ContratsController {
  constructor(private readonly contrats: ContratsService) {}

  /** Motifs de recours légaux, pour alimenter le formulaire. */
  @Get('motifs')
  motifs() {
    return this.contrats.motifs();
  }

  /** Personnes embauchables : planning, candidatures retenues. */
  @Get('salaries')
  salaries(@CurrentAccount() a: RequestAccount) {
    return this.contrats.salariesPossibles(a.id);
  }

  @Get()
  list(
    @CurrentAccount() a: RequestAccount,
    @Query('page') p?: string,
    @Query('perPage') perPage?: string,
    @Query('userId') userId?: string,
  ) {
    return this.contrats.list(a.id, {
      page: p ? Number(p) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      userId,
    });
  }

  /** Lecture : l'établissement, ou la personne engagée (lecture seule). */
  @Get(':id')
  get(
    @CurrentAccount() a: RequestAccount,
    @CurrentUser() u: RequestUser,
    @Param('id') id: string,
  ) {
    return this.contrats.get(a.id, id, u.id);
  }

  /** La proposition chiffrée liée à un renfort pourvu. */
  @Get('proposition/:bookingId')
  proposition(@CurrentAccount() a: RequestAccount, @Param('bookingId') bookingId: string) {
    return this.contrats.proposition(a.id, bookingId);
  }

  /** Transforme une proposition acceptée en brouillon de CDD. */
  @Post('depuis-renfort/:bookingId')
  depuisRenfort(@CurrentAccount() a: RequestAccount, @Param('bookingId') bookingId: string) {
    return this.contrats.depuisRenfort(a.id, a.type, bookingId);
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
