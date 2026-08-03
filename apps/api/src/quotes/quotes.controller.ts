import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import {
  CreateQuoteRequestDto,
  RefuseQuoteDto,
  SendQuoteDto,
} from './dto/quote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestUser } from '../common/types/request-context';

@Controller('quotes')
@UseGuards(JwtAuthGuard)
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  /** Devis du compte : reçus (intervenant) et émis (établissement). */
  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('accountId') accountId: string,
    @Query('page') p?: string,
    @Query('perPage') perPage?: string,
  ) {
    return this.quotes.findAllForAccount(user.id, accountId, {
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
    @Query('accountId') accountId: string,
    @Body() dto: CreateQuoteRequestDto,
  ) {
    return this.quotes.request(user.id, accountId, dto);
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
