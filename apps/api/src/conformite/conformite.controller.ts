import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestAccount, RequestUser } from '../common/types/request-context';
import { ConformiteService } from './conformite.service';
import { UpsertComplianceDto } from './dto/upsert-compliance.dto';

/**
 * Coffre-fort de conformité — pièces obligatoires des intervenants.
 * Isolé au compte actif (header x-account-id) via AccountGuard.
 */
// Les pièces suivies ici comprennent le casier judiciaire et les diplômes de
// chacun. La lecture était ouverte à tout membre actif du compte : elle est
// désormais réservée aux responsables, comme l'écriture l'était déjà.
//
// Depuis le 22/09/2026, le droit déclaré « Consulter le coffre-fort de
// conformité » ouvre lui aussi la lecture, en OU avec le rôle : la personne
// dont c'est le métier — une assistante administrative, par exemple — n'a
// plus besoin qu'on la nomme chef de service pour tenir les dossiers.
@Controller('conformite')
@UseGuards(JwtAuthGuard, AccountGuard)
export class ConformiteController {
  constructor(private readonly conformite: ConformiteService) {}

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

  /**
   * MON PROPRE DOSSIER.
   *
   * Le coffre-fort était unilatéral : l'établissement documentait l'intervenant,
   * et l'intervenant n'avait aucun accès à son propre dossier — ni pour voir ce
   * qui manquait, ni pour déposer sa carte d'identité. Concrètement, un
   * éducateur devait envoyer son casier judiciaire par courriel et attendre que
   * quelqu'un le saisisse.
   *
   * Ces deux routes échappent à `@AccountRoles` au niveau de la classe, et
   * c'est délibéré : consulter et alimenter SON dossier n'est pas un acte de
   * responsable. La règle qui compte est ailleurs — le dépôt ne vaut jamais
   * validation (voir `deposerMonDocument`).
   *
   * Déclarées AVANT `:userId`, sinon Nest lirait « mes-documents » comme un
   * identifiant d'utilisateur.
   */
  @Get('mes-documents')
  mesDocuments(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    return this.conformite.listForUser(account.id, user.id);
  }

  @Patch('mes-documents')
  deposerMonDocument(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: UpsertComplianceDto,
  ) {
    return this.conformite.deposerSonDocument(account.id, user.id, dto);
  }

  @Get(':userId')
  listForUser(@CurrentAccount() account: RequestAccount, @Param('userId') userId: string) {
    return this.conformite.listForUser(account.id, userId);
  }

  /** Dépose / met à jour une pièce (réservé aux responsables du compte). */
  @Patch(':userId/documents')
  upsertDocument(
    @CurrentAccount() account: RequestAccount,
    @Param('userId') userId: string,
    @Body() dto: UpsertComplianceDto,
  ) {
    return this.conformite.upsertDocument(account.id, userId, dto);
  }
}
