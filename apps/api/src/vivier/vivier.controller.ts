import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { VivierService } from './vivier.service';
import { RappelerDto, RetenirDto } from './dto/vivier.dto';

/**
 * LE VIVIER.
 *
 * Réservé à la direction, à l'administration et aux chefs de service, pour la
 * même raison que l'écran Équipe : la liste porte des taux horaires, des notes
 * de service et des coordonnées. Un membre de l'équipe n'a pas à y accéder.
 */
@Controller('vivier')
@UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
@AccountRoles('OWNER', 'ADMIN', 'MANAGER')
export class VivierController {
  constructor(private readonly vivier: VivierService) {}

  /** Le vivier : intervenants retenus, puis habitués détectés. */
  @Get()
  liste(@CurrentAccount() account: RequestAccount) {
    this.vivier.assertEtablissement(account.type);
    return this.vivier.liste(account.id);
  }

  /** Retenir un intervenant, ou mettre à jour la note de service. */
  @Post(':intervenantAccountId')
  retenir(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('intervenantAccountId') intervenantAccountId: string,
    @Body() dto: RetenirDto,
  ) {
    this.vivier.assertEtablissement(account.type);
    return this.vivier.retenir(account.id, intervenantAccountId, user.id, dto.note);
  }

  @Delete(':intervenantAccountId')
  retirer(
    @CurrentAccount() account: RequestAccount,
    @Param('intervenantAccountId') intervenantAccountId: string,
  ) {
    this.vivier.assertEtablissement(account.type);
    return this.vivier.retirer(account.id, intervenantAccountId);
  }

  /**
   * Rappeler des intervenants du vivier sur une mission précise.
   * Déclaré avec un préfixe statique, donc avant les routes paramétrées ne
   * poserait aucun problème ici : « rappel » ne peut pas être confondu avec un
   * identifiant de compte puisque la méthode HTTP et le chemin diffèrent.
   */
  @Post('rappel/:missionId')
  rappeler(
    @CurrentAccount() account: RequestAccount,
    @Param('missionId') missionId: string,
    @Body() dto: RappelerDto,
  ) {
    this.vivier.assertEtablissement(account.type);
    return this.vivier.rappeler(account.id, missionId, dto.intervenantAccountIds);
  }
}
