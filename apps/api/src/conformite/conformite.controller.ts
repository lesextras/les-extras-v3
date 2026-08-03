import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { RequestAccount } from '../common/types/request-context';
import { ConformiteService } from './conformite.service';
import { UpsertComplianceDto } from './dto/upsert-compliance.dto';

/**
 * Coffre-fort de conformité — pièces obligatoires des intervenants.
 * Isolé au compte actif (header x-account-id) via AccountGuard.
 */
// Les pièces suivies ici comprennent le casier judiciaire et les diplômes de
// chacun. La lecture était ouverte à tout membre actif du compte : elle est
// désormais réservée aux responsables, comme l'écriture l'était déjà.
@Controller('conformite')
@UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
@AccountRoles('OWNER', 'ADMIN', 'MANAGER')
export class ConformiteController {
  constructor(private readonly conformite: ConformiteService) {}

  /** Synthèse de complétude pour chaque membre du compte actif. */
  @Get()
  summary(@CurrentAccount() account: RequestAccount) {
    return this.conformite.summaryForAccount(account.id);
  }

  /** Détail des pièces d'un intervenant. */
  /**
   * Les dossiers en défaut, du plus urgent au moins urgent.
   * Déclaré AVANT `:userId` : sans cela Nest prendrait « alertes » pour un
   * identifiant d'utilisateur et la route ne serait jamais atteinte.
   */
  @Get('alertes')
  alertes(
    @CurrentAccount() account: RequestAccount,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
    @Query('orgUnitId') orgUnitId?: string,
  ) {
    return this.conformite.alertes(account.id, {
      page: page ? Number(page) : undefined,
      perPage: perPage ? Number(perPage) : undefined,
      orgUnitId,
    });
  }

  @Get(':userId')
  listForUser(@CurrentAccount() account: RequestAccount, @Param('userId') userId: string) {
    return this.conformite.listForUser(account.id, userId);
  }

  /** Dépose / met à jour une pièce (réservé aux responsables du compte). */
  @Patch(':userId/documents')
  @UseGuards(AccountRolesGuard)
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER')
  upsertDocument(
    @CurrentAccount() account: RequestAccount,
    @Param('userId') userId: string,
    @Body() dto: UpsertComplianceDto,
  ) {
    return this.conformite.upsertDocument(account.id, userId, dto);
  }
}
