import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import {
  CreateQuoteRequestDto,
  RefuseQuoteDto,
  SendQuoteDto,
} from './dto/quote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { RequestAccount, RequestUser } from '../common/types/request-context';

/**
 * Le compte actif vient du garde, plus de la requête.
 *
 * Ce contrôleur recevait l'identifiant du compte en paramètre d'URL, et le
 * service revérifiait l'appartenance à la main. Cela fonctionnait, mais
 * reposait sur la vigilance : un point d'entrée ajouté plus tard sans reprendre
 * cette vérification aurait laissé n'importe qui lire les devis d'un autre
 * établissement, sans que rien ne le signale. L'isolation appartient au garde,
 * pas à la mémoire du développeur suivant.
 */
@Controller('quotes')
@UseGuards(JwtAuthGuard, AccountGuard)
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  /** Devis du compte : reçus (intervenant) et émis (établissement). */
  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Query('page') p?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.quotes.findAllForAccount(user.id, account.id, {
      page: p ? Number(p) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
    });
  }

  @Get(':id')
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.quotes.findOne(user.id, id);
  }

  /** Établissement : demande de devis (depuis une fiche atelier/formation). */
  @Post()
  request(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: CreateQuoteRequestDto,
  ) {
    return this.quotes.request(user.id, account.id, dto);
  }

  /** Intervenant : chiffrage et envoi. */
  @Post(':id/send')
  send(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: SendQuoteDto,
  ) {
    return this.quotes.send(user.id, id, dto);
  }

  /** Établissement : acceptation → réservation confirmée. */
  @Post(':id/accept')
  accept(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.quotes.accept(user.id, id);
  }

  /** Établissement : refus motivé. */
  @Post(':id/refuse')
  refuse(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: RefuseQuoteDto,
  ) {
    return this.quotes.refuse(user.id, id, dto.reason);
  }
}
