import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import {
  CreateQuoteRequestDto,
  RefuseQuoteDto,
  ReviserQuoteDto,
  SendQuoteDto,
  SignerQuoteDto,
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
 *
 * ET LE DEVIS EST UN ENGAGEMENT FINANCIER, PAS UNE INFORMATION D'ÉQUIPE.
 *
 * L'appartenance au compte suffisait ici : un éducateur simple membre de la
 * MECS lisait donc toute la facturation prévisionnelle de sa structure — et,
 * bien pire, pouvait ACCEPTER un devis à 900 €, ce qui crée une réservation
 * confirmée et engage l'établissement. Le menu lui cachait pourtant déjà
 * « Devis & factures » (voir nav.ts) et le contrôleur des factures posait
 * déjà cette limite : les devis avaient simplement été oubliés. On aligne.
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
  findOne(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
  ) {
    return this.quotes.findOne(user.id, id, account.id);
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
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Body() dto: SendQuoteDto,
  ) {
    return this.quotes.send(user.id, id, account.id, dto);
  }

  /** Établissement : acceptation → réservation confirmée. */
  @Post(':id/accept')
  accept(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
  ) {
    return this.quotes.accept(user.id, id, account.id);
  }

  /** Établissement : refus motivé. */
  @Post(':id/refuse')
  refuse(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Body() dto: RefuseQuoteDto,
  ) {
    return this.quotes.refuse(user.id, id, account.id, dto.reason);
  }

  /**
   * Négocier plutôt que refuser : le devis repart en demande, chiffré à
   * nouveau, et la trace de ce qui a été demandé reste lisible.
   */
  /**
   * Le devis signé, déposé : ce dépôt vaut acceptation. Le fichier a été
   * déposé juste avant sur `POST /files/quote`.
   */
  @Post(':id/signe')
  signer(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Body() dto: SignerQuoteDto,
  ) {
    return this.quotes.signer(user.id, id, account.id, dto.fileId);
  }

  @Post(':id/reviser')
  reviser(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Body() dto: ReviserQuoteDto,
  ) {
    return this.quotes.reviser(
      user.id,
      id,
      account.id,
      dto.motif,
      dto.montantSouhaite,
    );
  }
}
