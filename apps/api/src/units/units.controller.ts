import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UnitsService } from './units.service';
import {
  CreateUnitDto,
  UpdateUnitDto,
  AssignMemberDto,
  RetirerServiceDto,
  DemandeServiceDto,
  DeciderDemandeServiceDto,
} from './dto/unit.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequestAccount, RequestUser } from '../common/types/request-context';

/**
 * Unités / services d'un établissement. Agit sur le COMPTE ACTIF (x-account-id).
 * Lecture : tout membre actif. Écriture : OWNER / ADMIN / MANAGER.
 *
 * ⚠ `verifier-nom` et `demandes` sont ouverts à TOUT MEMBRE, volontairement.
 * C'est le carrefour du doublon : quelqu'un qui n'a pas le droit de créer un
 * service doit quand même pouvoir apprendre que son nom est pris et demander à
 * rejoindre celui qui existe. Lui renvoyer un 403 le laisserait sans issue.
 */
@Controller('units')
@UseGuards(JwtAuthGuard, AccountGuard)
export class UnitsController {
  constructor(private readonly units: UnitsService) {}

  @Get()
  list(
    @CurrentAccount() account: RequestAccount,
    @Query('archives') archives?: string,
  ) {
    return this.units.list(account, { inclureArchives: archives === '1' });
  }

  /** Le nom est-il libre dans cet établissement ? Ne crée rien. */
  @Get('verifier-nom')
  verifierNom(@CurrentAccount() account: RequestAccount, @Query('nom') nom: string) {
    return this.units.verifierNom(account, nom ?? '');
  }

  /** Les demandes à trancher, filtrées par le périmètre du demandeur. */
  @Get('demandes')
  demandes(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
  ) {
    return this.units.listerDemandes(account, user);
  }

  @Post('demandes')
  demander(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: DemandeServiceDto,
  ) {
    return this.units.demander(account, user, dto);
  }

  @Post('demandes/:id/decider')
  deciderDemande(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('id') id: string,
    @Body() dto: DeciderDemandeServiceDto,
  ) {
    return this.units.deciderDemande(account, user, id, dto);
  }

  @Post()
  create(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateUnitDto,
  ) {
    return this.units.create(account, user, dto);
  }

  @Post('assign')
  assign(@CurrentAccount() account: RequestAccount, @Body() dto: AssignMemberDto) {
    return this.units.assignMember(account, dto);
  }

  @Post('retirer')
  retirer(@CurrentAccount() account: RequestAccount, @Body() dto: RetirerServiceDto) {
    return this.units.retirerService(account, dto.membershipId, dto.orgUnitId, dto.portee);
  }

  @Patch(':id')
  update(
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.units.update(account, id, dto);
  }

  @Post(':id/desarchiver')
  desarchiver(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.units.desarchiver(account, id);
  }

  /**
   * Archive le service (ou le supprime s'il est vide — un service créé par
   * erreur il y a trente secondes n'a pas à devenir une ligne d'archive).
   */
  @Delete(':id')
  remove(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.units.archiver(account, id);
  }
}
