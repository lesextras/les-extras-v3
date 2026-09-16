import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TypeConversation } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalAccountGuard } from '../common/guards/optional-account.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { RequestAccount, RequestUser } from '../common/types/request-context';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  OuvrirFilDto,
  ModifierMessageDto,
  SignalerMessageDto,
  AjouterParticipantsDto,
  FermerFilDto,
  NotificationsFilDto,
} from './dto/fil.dto';

/**
 * ⚠ `OptionalAccountGuard` et non `AccountGuard` : la messagerie traverse les
 * comptes. Une même personne peut être salariée d'un établissement ET
 * intervenante indépendante — sa boîte de réception est la sienne, pas celle
 * d'un compte. Le compte actif ne sert qu'à l'ouverture d'un fil interne, où
 * il dit de quel établissement on parle.
 */
@Controller('conversations')
@UseGuards(JwtAuthGuard, OptionalAccountGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  findAll(
    @CurrentUser() user: RequestUser,
    @Query('type') type?: TypeConversation,
    @Query('archives') archives?: string,
  ) {
    return this.conversations.findAll(user.id, {
      type: type && Object.values(TypeConversation).includes(type) ? type : undefined,
      archives: archives === '1',
    });
  }

  /** La pastille de la barre de navigation. */
  @Get('non-lus')
  nonLus(@CurrentUser() user: RequestUser) {
    return this.conversations.nonLus(user.id);
  }

  /** Ouvre un fil, quel que soit son type (voir les règles dans le service). */
  @Post('ouvrir')
  ouvrir(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount | undefined,
    @Body() dto: OuvrirFilDto,
  ) {
    return this.conversations.ouvrir(user.id, account?.id, dto);
  }

  /** Fil de mission de renfort — chemin historique, conservé. */
  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateConversationDto) {
    return this.conversations.create(user.id, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.conversations.findOne(id, user.id);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.conversations.getMessages(id, user.id);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversations.envoyer(id, user.id, dto);
  }

  @Patch(':id/messages/:messageId')
  modifier(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: ModifierMessageDto,
  ) {
    return this.conversations.modifier(id, messageId, user.id, dto);
  }

  @Delete(':id/messages/:messageId')
  retirer(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.conversations.retirer(id, messageId, user.id);
  }

  @Post(':id/messages/:messageId/signaler')
  signaler(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: SignalerMessageDto,
  ) {
    return this.conversations.signaler(id, messageId, user.id, dto);
  }

  @Post(':id/participants')
  ajouterParticipants(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: AjouterParticipantsDto,
  ) {
    return this.conversations.ajouterParticipants(id, user.id, dto);
  }

  @Delete(':id/participants/moi')
  quitter(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.conversations.quitter(id, user.id);
  }

  @Patch(':id/fermeture')
  fermer(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: FermerFilDto,
  ) {
    return this.conversations.fermer(id, user.id, dto.fermee);
  }

  @Patch(':id/notifications')
  notifications(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Body() dto: NotificationsFilDto,
  ) {
    return this.conversations.notifications(id, user.id, dto.actif);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.conversations.markRead(id, user.id);
  }
}
