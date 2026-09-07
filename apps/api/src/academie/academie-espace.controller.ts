import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import type { RequestAccount } from '../common/types/request-context';
import { AcademieService } from './academie.service';
import {
  EtapeAcademieFaiteDto,
  ModifierAcademieDto,
  ModifierReclamationDto,
  ModifierVeilleDto,
  ReclamationDto,
  VeilleDto,
} from './dto/academie.dto';

/**
 * L'ESPACE CONNECTÉ D'UNE ACADÉMIE.
 *
 * Réservé aux comptes de type ACADEMIE : le service refuse les autres. Le
 * catalogue, les sessions et les inscriptions restent servis par leurs propres
 * modules — on ne redéclare pas ici ce qui existe déjà.
 */
@Controller('academie')
@UseGuards(JwtAuthGuard, AccountGuard)
export class AcademieEspaceController {
  constructor(private readonly academie: AcademieService) {}

  @Get('espace')
  espace(@CurrentAccount() account: RequestAccount) {
    return this.academie.espace(account.id);
  }

  @Get('fiche')
  fiche(@CurrentAccount() account: RequestAccount) {
    return this.academie.monAcademie(account.id);
  }

  @Patch('fiche')
  modifier(@CurrentAccount() account: RequestAccount, @Body() dto: ModifierAcademieDto) {
    return this.academie.modifier(account.id, dto);
  }

  @Post('chemin/:slug')
  marquerEtape(
    @CurrentAccount() account: RequestAccount,
    @Param('slug') slug: string,
    @Body() dto: EtapeAcademieFaiteDto,
  ) {
    return this.academie.marquerEtape(account.id, slug, dto.faite);
  }

  // ----------------------------------------------------------------- veille

  @Get('veille')
  veilles(@CurrentAccount() account: RequestAccount) {
    return this.academie.veilles(account.id);
  }

  @Post('veille')
  creerVeille(@CurrentAccount() account: RequestAccount, @Body() dto: VeilleDto) {
    return this.academie.creerVeille(account.id, dto);
  }

  @Patch('veille/:id')
  modifierVeille(
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Body() dto: ModifierVeilleDto,
  ) {
    return this.academie.modifierVeille(account.id, id, dto);
  }

  @Delete('veille/:id')
  supprimerVeille(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.academie.supprimerVeille(account.id, id);
  }

  // ------------------------------------------------------------ réclamations

  @Get('reclamations')
  reclamations(@CurrentAccount() account: RequestAccount) {
    return this.academie.reclamations(account.id);
  }

  @Post('reclamations')
  creerReclamation(@CurrentAccount() account: RequestAccount, @Body() dto: ReclamationDto) {
    return this.academie.creerReclamation(account.id, dto);
  }

  @Patch('reclamations/:id')
  modifierReclamation(
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Body() dto: ModifierReclamationDto,
  ) {
    return this.academie.modifierReclamation(account.id, id, dto);
  }

  @Delete('reclamations/:id')
  supprimerReclamation(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.academie.supprimerReclamation(account.id, id);
  }
}
