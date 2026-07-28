import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { AssistantService } from './assistant.service';
import { ActiviteDto, ChatDto, EnregistrerDocumentDto, FeedbackDto, FicheDto, GenererDto, ModifierDocumentDto } from './dto/assistant.dto';

/**
 * Assistant d'écriture professionnelle.
 * Toutes les routes exigent une session ET un compte actif : les documents
 * vivent dans le compte, cloisonnés par auteur.
 */
@Controller('assistant')
@UseGuards(JwtAuthGuard, AccountGuard)
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Get('trames')
  trames() {
    return this.assistant.trames();
  }

  /** Génération : plafonnée par utilisateur — le poste de coût est ici. */
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @Post('generer')
  generer(@Body() dto: GenererDto) {
    return this.assistant.generer(dto.trame, dto.notes);
  }

  /** Générateur d'activités éducatives & thérapeutiques. */
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @Post('activite')
  activite(@Body() dto: ActiviteDto) {
    return this.assistant.genererActivite(dto);
  }

  /** Bot d'aide de l'espace connecté. */
  @Throttle({ default: { limit: 60, ttl: 3_600_000 } })
  @Post('chat')
  chat(@Body() dto: ChatDto) {
    return this.assistant.chat('dashboard', dto.message, dto.historique);
  }

  /** Pré-remplissage d'une fiche atelier/formation depuis un brief. */
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @Post('fiche')
  fiche(@Body() dto: FicheDto) {
    return this.assistant.remplirFiche(dto.type, dto.brief);
  }

  @Post('documents')
  enregistrer(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: EnregistrerDocumentDto,
  ) {
    return this.assistant.enregistrer(account.id, user.id, dto);
  }

  @Get('documents')
  lister(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    return this.assistant.lister(account.id, user.id);
  }

  @Get('documents/:id')
  lire(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assistant.lire(id, account.id, user.id);
  }

  @Patch('documents/:id')
  modifier(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: ModifierDocumentDto,
  ) {
    return this.assistant.modifier(id, account.id, user.id, dto);
  }

  @Delete('documents/:id')
  supprimer(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assistant.supprimer(id, account.id, user.id);
  }

  @Post('feedback')
  feedback(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: FeedbackDto,
  ) {
    return this.assistant.feedback(account.id, user.id, dto);
  }
}
