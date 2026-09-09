import { Body, Controller, Get, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-context';
import { SupportService } from './support.service';
import { OuvrirTicketDto, RepondreTicketDto } from './dto/support.dto';

/**
 * LA MESSAGERIE INTERNE, CÔTÉ PERSONNE INSCRITE.
 *
 * Volontairement sans `AccountGuard` : quelqu'un qui n'arrive pas à créer son
 * compte d'établissement, ou dont le compte pose justement problème, doit
 * pouvoir écrire. Le fil appartient à la PERSONNE, pas au compte — le compte
 * n'est enregistré que pour donner du contexte à l'équipe.
 */
@Controller('assistance')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Get()
  mesTickets(@CurrentUser() u: RequestUser) {
    return this.support.mesTickets(u.id);
  }

  /**
   * Le compte actif est lu dans l'en-tête, pas dans un garde : il sert
   * seulement de contexte pour l'équipe, et le service vérifie l'appartenance
   * avant de l'enregistrer. Un en-tête absent ou étranger donne un fil sans
   * compte, jamais une erreur — écrire à l'assistance ne doit rien exiger.
   */
  @Post()
  ouvrir(
    @CurrentUser() u: RequestUser,
    @Headers('x-account-id') accountId: string | undefined,
    @Body() dto: OuvrirTicketDto,
  ) {
    return this.support.ouvrir(u.id, accountId ?? null, dto);
  }

  @Get(':id')
  monTicket(@CurrentUser() u: RequestUser, @Param('id') id: string) {
    return this.support.monTicket(u.id, id);
  }

  @Post(':id/messages')
  repondre(
    @CurrentUser() u: RequestUser,
    @Param('id') id: string,
    @Body() dto: RepondreTicketDto,
  ) {
    return this.support.repondre(u.id, id, dto);
  }
}
