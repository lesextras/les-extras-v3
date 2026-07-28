import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AssistantService } from './assistant.service';
import { ChatDto } from './dto/assistant.dto';

/**
 * Bot du site public — SANS authentification.
 * Garde-fous : plafond horaire par IP + champ-piège + réponses courtes,
 * cadrées sur la plateforme uniquement (aucun conseil individualisé).
 */
@Controller('public/chatbot')
export class PublicChatController {
  constructor(private readonly assistant: AssistantService) {}

  @Throttle({ default: { limit: 15, ttl: 3_600_000 } })
  @Post()
  async chat(@Body() dto: ChatDto) {
    if (dto.website) return { reponse: 'Merci !' }; // robot : réponse neutre
    return this.assistant.chat('public', dto.message, dto.historique);
  }
}
