import { Body, Controller, Post } from '@nestjs/common';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { AssistantService } from './assistant.service';
import { ChatDto } from './dto/assistant.dto';

/** Essai public de LEX : notes courtes + champ-piège anti-robot. */
class DemoLexDto {
  @IsString()
  @MinLength(20, { message: 'Décrivez la situation en quelques lignes.' })
  @MaxLength(400)
  notes!: string;

  @IsOptional()
  @IsString()
  website?: string;
}

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

/**
 * Démonstration publique de LEX — SANS authentification.
 *
 * Plafond volontairement bas (3 essais par heure et par IP) : la démo sert à
 * faire comprendre le geste, pas à remplacer l'outil. La chaîne de protection
 * est identique à celle de l'espace connecté : les noms sont masqués avant
 * l'appel au modèle et restaurés localement, et rien n'est enregistré.
 */
@Controller('public/lex-demo')
export class PublicLexDemoController {
  constructor(private readonly assistant: AssistantService) {}

  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @Post()
  async demo(@Body() dto: DemoLexDto) {
    if (dto.website) return { brouillon: 'Merci !', tronque: false, protection: [] };
    return this.assistant.demoPublique(dto.notes);
  }
}
