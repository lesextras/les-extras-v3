import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-context';
import { AcademieService } from './academie.service';
import { OuvrirAcademieDto } from './dto/academie.dto';

/**
 * OUVRIR L'ESPACE D'UNE ACADÉMIE POUR UN COMPTE EXISTANT.
 *
 * Comme pour l'association : à ce stade il n'y a pas de compte actif — c'est
 * justement ce qu'on crée — d'où un contrôleur à part, sans AccountGuard.
 */
@Controller('academie')
@UseGuards(JwtAuthGuard)
export class AcademieOuvertureController {
  constructor(private readonly academie: AcademieService) {}

  @Post('ouvrir')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  ouvrir(@CurrentUser() user: RequestUser, @Body() dto: OuvrirAcademieDto) {
    return this.academie.ouvrir(user.id, dto);
  }
}
