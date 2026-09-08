import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/request-context';
import { AdministrationGuard } from './administration.guard';
import { AdministrationService } from './administration.service';
import { ChercherDto, ModifierCompteDto, ModifierPersonneDto } from './dto/administration.dto';

/**
 * L'ADMINISTRATION DE PILOTER.
 *
 * Une session valide, et le rôle ADMIN. Aucune route de suppression : on
 * corrige, on suspend, on rend l'accès — on n'efface pas.
 */
@Controller('administration')
@UseGuards(JwtAuthGuard, AdministrationGuard)
export class AdministrationController {
  constructor(private readonly administration: AdministrationService) {}

  @Get('tableau')
  tableau() {
    return this.administration.tableau();
  }

  @Get('comptes')
  comptes(@Query() dto: ChercherDto) {
    return this.administration.comptes(dto);
  }

  @Get('comptes/:id')
  compte(@Param('id') id: string) {
    return this.administration.compte(id);
  }

  @Patch('comptes/:id')
  modifierCompte(@Param('id') id: string, @Body() dto: ModifierCompteDto) {
    return this.administration.modifierCompte(id, dto);
  }

  @Get('personnes')
  personnes(@Query() dto: ChercherDto) {
    return this.administration.personnes(dto);
  }

  @Patch('personnes/:id')
  modifierPersonne(@CurrentUser() moi: RequestUser, @Param('id') id: string, @Body() dto: ModifierPersonneDto) {
    return this.administration.modifierPersonne(id, dto, moi.id);
  }

  @Get('formulaires')
  formulaires() {
    return this.administration.formulaires();
  }

  @Get('cours')
  cours() {
    return this.administration.cours();
  }
}
