import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { DeplacerTacheDto, FiltresTachesDto, ModifierActionDto, ModifierTacheDto, TacheDto } from '../association/dto/espace.dto';
import { LiaisonsService } from './liaisons.service';
import { ProjetsReliesService } from './projets.service';
import { DemandeLiaisonDto, LienFormationDto, ProjetAcademieDto } from './dto';

/**
 * LES ESPACES RELIÉS (Réglages des deux espaces) : une association et une
 * académie. Le compte courant est toujours l'un des deux côtés du lien.
 */
@Controller('liaisons')
@UseGuards(JwtAuthGuard, AccountGuard)
export class LiaisonsController {
  constructor(private readonly liaisons: LiaisonsService) {}

  @Get()
  liste(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    return this.liaisons.liste(account, user.id);
  }

  @Post()
  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
  demander(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Body() dto: DemandeLiaisonDto) {
    return this.liaisons.demander(account, user.id, dto.accountId);
  }

  @Post(':id/accepter')
  accepter(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.liaisons.repondre(account, id, true);
  }

  @Post(':id/refuser')
  refuser(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.liaisons.repondre(account, id, false);
  }

  @Delete(':id')
  retirer(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.liaisons.retirer(account, id);
  }
}

/**
 * « MES PROJETS » D'UNE ACADÉMIE : les projets des associations reliées (les
 * mêmes lignes) et les siens propres, leurs tâches, leurs formations. Et, en
 * lecture seule, l'identité et les agréments des associations reliées.
 */
@Controller('academie')
@UseGuards(JwtAuthGuard, AccountGuard)
export class AcademieProjetsController {
  constructor(private readonly projets: ProjetsReliesService) {}

  @Get('projets')
  liste(@CurrentAccount() account: RequestAccount) {
    return this.projets.projetsAcademie(account.id);
  }

  @Post('projets')
  creer(@CurrentAccount() account: RequestAccount, @Body() dto: ProjetAcademieDto) {
    return this.projets.creerProjetAcademie(account.id, dto);
  }

  @Patch('projets/:id')
  modifier(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: ModifierActionDto) {
    return this.projets.modifierProjetAcademie(account.id, id, dto);
  }

  @Delete('projets/:id')
  supprimer(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.projets.supprimerProjetAcademie(account.id, id);
  }

  @Post('projets/:id/formations')
  lierFormation(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: LienFormationDto) {
    return this.projets.lierFormation('academie', account.id, id, dto.coursId);
  }

  @Delete('projets/:id/formations/:coursId')
  delierFormation(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Param('coursId') coursId: string) {
    return this.projets.delierFormation('academie', account.id, id, coursId);
  }

  @Get('taches')
  taches(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Query() filtres: FiltresTachesDto) {
    return this.projets.tachesAcademie(account.id, { id: user.id, email: user.email }, filtres);
  }

  @Post('taches')
  creerTache(@CurrentAccount() account: RequestAccount, @Body() dto: TacheDto) {
    return this.projets.creerTacheAcademie(account.id, dto);
  }

  @Patch('taches/:id')
  modifierTache(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: ModifierTacheDto) {
    return this.projets.modifierTacheAcademie(account.id, id, dto);
  }

  @Post('taches/:id/deplacer')
  deplacerTache(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: DeplacerTacheDto) {
    return this.projets.deplacerTacheAcademie(account.id, id, dto);
  }

  @Delete('taches/:id')
  supprimerTache(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.projets.supprimerTacheAcademie(account.id, id);
  }

  /** Les associations reliées : identité et agréments, en lecture seule. */
  @Get('association')
  association(@CurrentAccount() account: RequestAccount) {
    return this.projets.associationsDeLAcademie(account.id);
  }
}

/** Côté association : les formations des académies reliées, et leur lien aux projets. */
@Controller('association')
@UseGuards(JwtAuthGuard, AccountGuard)
export class AssociationFormationsController {
  constructor(private readonly projets: ProjetsReliesService) {}

  @Get('formations-liees')
  catalogue(@CurrentAccount() account: RequestAccount) {
    return this.projets.formationsDeLAssociation(account.id);
  }

  @Post('actions/:id/formations')
  lier(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: LienFormationDto) {
    return this.projets.lierFormation('association', account.id, id, dto.coursId);
  }

  @Delete('actions/:id/formations/:coursId')
  delier(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Param('coursId') coursId: string) {
    return this.projets.delierFormation('association', account.id, id, coursId);
  }
}
