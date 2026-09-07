import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-context';
import { EspaceService } from './espace.service';
import { OuvrirEspaceDto } from './dto/espace.dto';

/**
 * OUVRIR L'ESPACE D'UNE ASSOCIATION POUR UN COMPTE EXISTANT.
 *
 * Une personne connectée, mais dont aucun compte n'est une association, peut
 * ouvrir le sien ici. Il n'y a pas de compte actif à ce stade (c'est
 * justement ce qu'on crée), d'où un contrôleur à part, sans AccountGuard.
 */
@Controller('association')
@UseGuards(JwtAuthGuard)
export class AssociationOuvertureController {
  constructor(private readonly espace: EspaceService) {}

  @Post('ouvrir')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  ouvrir(@CurrentUser() user: RequestUser, @Body() dto: OuvrirEspaceDto) {
    return this.espace.ouvrir(user.id, dto);
  }
}
