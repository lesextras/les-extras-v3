import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrganisationService } from './organisation.service';
import {
  DeclarerPosteDto,
  ChangerNiveauDto,
  AccorderCapacitesDto,
  DemanderNiveauDto,
  VisibiliteDto,
  DeciderNiveauDto,
  RejoindreEtablissementDto,
} from './dto/organisation.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestAccount, RequestUser } from '../common/types/request-context';

/**
 * Organisation de l'établissement : niveaux, droits délégués, organigramme.
 *
 * ⚠ AUCUN GARDE DE RÔLE SUR CES ROUTES, et c'est le cœur du modèle. Le droit
 * d'agir ne vient pas du rôle applicatif mais du PÉRIMÈTRE, calculé dans le
 * service : un chef de service agit sur son service sans être ADMIN, et un
 * ADMIN n'agit pas hors du sien. Un garde de rôle poserait la mauvaise question.
 */
@Controller('organisation')
@UseGuards(JwtAuthGuard, AccountGuard)
export class OrganisationController {
  constructor(private readonly organisation: OrganisationService) {}

  @Get('moi')
  moi(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    return this.organisation.moi(account, user);
  }

  @Patch('moi')
  declarer(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: DeclarerPosteDto,
  ) {
    return this.organisation.declarer(account, user, dto);
  }

  @Patch('moi/visibilite')
  visibilite(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: VisibiliteDto,
  ) {
    return this.organisation.visibilite(account, user, dto);
  }

  /**
   * SE DÉCLARER D'UN ÉTABLISSEMENT DÉJÀ PRÉSENT — « comme sur LinkedIn ».
   *
   * ⚠ La route agit sur l'UTILISATEUR, pas sur le compte actif : elle crée un
   * rattachement vers un AUTRE compte que celui dont on vient. C'est voulu, et
   * c'est ce qui évite que douze salariés d'une même MECS créent douze
   * établissements homonymes. Le rattachement naît NON VÉRIFIÉ : il ne donne
   * accès à rien tant qu'un responsable ne l'a pas confirmé.
   */
  @Post('rejoindre')
  rejoindre(
    @CurrentUser() user: RequestUser,
    @Body() dto: RejoindreEtablissementDto,
  ) {
    return this.organisation.rejoindreEtablissement(user, dto.etablissementId, dto.message);
  }

  @Get('organigramme')
  organigramme(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    return this.organisation.organigramme(account, user);
  }

  @Get('equipe')
  equipe(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    return this.organisation.equipe(account, user);
  }

  /** Ce que je peux déléguer : sert à n'afficher que les droits que j'ai. */
  @Get('delegation')
  delegation(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    return this.organisation.capacitesDelegablesParMoi(account, user);
  }

  @Post('demandes-niveau')
  demanderNiveau(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: DemanderNiveauDto,
  ) {
    return this.organisation.demanderNiveau(account, user, dto);
  }

  @Patch('membres/:id/niveau')
  changerNiveau(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: ChangerNiveauDto,
  ) {
    return this.organisation.changerNiveau(account, user, id, dto);
  }

  @Patch('membres/:id/capacites')
  accorderCapacites(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: AccorderCapacitesDto,
  ) {
    return this.organisation.accorderCapacites(account, user, id, dto);
  }

  @Post('membres/:id/verifier')
  verifier(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
  ) {
    return this.organisation.verifierRattachement(account, user, id);
  }

  @Delete('membres/:id/services/:orgUnitId')
  retirer(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Param('orgUnitId') orgUnitId: string,
  ) {
    return this.organisation.retirerDuService(account, user, id, orgUnitId);
  }
}

/**
 * LE SEUL ÉCRAN DE VALIDATION MANUELLE DU MODÈLE — côté Les Extras.
 *
 * Une demande par établissement, pas une par salarié : c'est ce qui rend la
 * charge tenable. Tout est pré-rempli pour que la décision tienne en un clic.
 */
@Controller('admin/organisation')
@UseGuards(JwtAuthGuard, AdminGuard)
export class OrganisationAdminController {
  constructor(private readonly organisation: OrganisationService) {}

  @Get('demandes-niveau')
  demandes() {
    return this.organisation.demandesEnAttente();
  }

  @Post('demandes-niveau/:id/decider')
  decider(
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: DeciderNiveauDto,
  ) {
    return this.organisation.deciderDemande(user.id, id, dto.accepter, dto.motifRefus);
  }
}
