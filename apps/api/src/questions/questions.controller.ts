import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { QuestionsService } from './questions.service';
import {
  CreateAnswerDto,
  CreateQuestionDto,
  METIERS,
  PUBLICS,
  QueryQuestionsDto,
  UpdateAnswerDto,
  UpdateQuestionDto,
} from './dto/question.dto';

/**
 * LE GAP — Groupe d'Analyse de Pratique en ligne.
 *
 * Une table ronde permanente : un professionnel dépose une situation, les
 * autres lui renvoient ce qu'ils ont vécu et tenté. L'accès est réservé aux
 * comptes et les échanges ne sont PAS publics : on parle de situations
 * réelles, et la sécurité du cadre prime sur la visibilité.
 */
@Controller('gap')
@UseGuards(JwtAuthGuard, AccountGuard)
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  /** Listes fermées des filtres — sert aussi à construire le formulaire. */
  @Get('referentiel')
  referentiel() {
    return { metiers: METIERS, publics: PUBLICS };
  }

  /** Le fil, enrichi de « c'est la mienne » et de l'état des votes. */
  @Get()
  lister(@Query() query: QueryQuestionsDto, @CurrentUser() user: RequestUser) {
    return this.questions.lister(query, user.id);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.questions.detail(id, user.id);
  }

  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Post()
  creer(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateQuestionDto,
  ) {
    if (dto.website) return { id: 'ok' }; // robot : réponse neutre
    return this.questions.creer(account.id, user.id, dto);
  }

  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
  @Post(':id/reponses')
  repondre(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateAnswerDto,
  ) {
    if (dto.website) return { id: 'ok' };
    return this.questions.repondre(id, account.id, user.id, dto);
  }

  @Post('reponses/:id/vote')
  voter(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.questions.voter(id, user.id);
  }

  @Post('reponses/:id/retenir')
  retenir(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.questions.retenir(id, user.id);
  }

  @Post(':id/fermer')
  fermer(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.questions.fermer(id, user.id, user.role === 'ADMIN');
  }

  // ── Correction et retrait ────────────────────────────────────────────────
  //
  // L'auteur reste maître de sa parole : il corrige, il retire. L'équipe, elle,
  // ne réécrit rien — elle ne peut que supprimer, et c'est le rôle du modérateur
  // dans un GAP : garantir le cadre, pas mettre des mots dans la bouche des pairs.

  @Patch(':id')
  modifier(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questions.modifier(id, user.id, dto);
  }

  @Delete(':id')
  supprimer(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.questions.supprimer(id, user.id, user.role === 'ADMIN');
  }

  @Patch('reponses/:id')
  modifierReponse(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpdateAnswerDto,
  ) {
    return this.questions.modifierReponse(id, user.id, dto.content);
  }

  @Delete('reponses/:id')
  supprimerReponse(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.questions.supprimerReponse(id, user.id, user.role === 'ADMIN');
  }
}
