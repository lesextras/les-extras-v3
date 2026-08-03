import { Body, Controller, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import type { RequestAccount } from '../common/types/request-context';
import { ParametresTempsService } from './parametres-temps.service';
import { MajorerDto, MajParametresTempsDto, VolumeAnnuelDto } from './dto/parametres-temps.dto';

/**
 * Les règles de temps de travail de l'établissement.
 *
 * La lecture est ouverte à toute l'équipe : savoir à partir de quelle heure
 * commence la nuit dans sa maison n'est pas une information confidentielle,
 * et c'est même ce qu'il faut pour comprendre son planning. L'écriture, elle,
 * engage la paie de tout le monde — elle reste aux responsables.
 */
@Controller('parametres-temps')
@UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
@AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
export class ParametresTempsController {
  constructor(private readonly parametres: ParametresTempsService) {}

  @Get()
  lire(@CurrentAccount() a: RequestAccount) {
    return this.parametres.lire(a.id);
  }

  @Put()
  @AccountRoles('OWNER', 'ADMIN')
  enregistrer(@CurrentAccount() a: RequestAccount, @Body() dto: MajParametresTempsDto) {
    return this.parametres.enregistrer(a.id, dto);
  }

  /** Les jours fériés de l'année, tels que les voit cet établissement. */
  @Get('feries/:annee')
  feries(@CurrentAccount() a: RequestAccount, @Param('annee') annee: string) {
    return this.parametres.feries(a.id, Number(annee));
  }

  /** Chiffrage d'une vacation : découpage nuit / dimanche / férié et surcoûts. */
  @Post('chiffrage')
  chiffrer(@CurrentAccount() a: RequestAccount, @Body() dto: MajorerDto) {
    return this.parametres.chiffrer(a.id, dto);
  }

  /**
   * Volume annuel planifiable d'un salarié, comparé au seuil de déclenchement
   * des heures supplémentaires. Les deux nombres sont renvoyés côte à côte
   * parce que les confondre est l'erreur la plus coûteuse de tout le domaine.
   */
  @Post('volume')
  volume(@CurrentAccount() a: RequestAccount, @Body() dto: VolumeAnnuelDto) {
    return this.parametres.volume(a.id, dto);
  }

  /** Bilan de fin de période à partir des heures hebdomadaires réalisées. */
  @Post('bilan')
  bilan(
    @CurrentAccount() a: RequestAccount,
    @Body() body: { semaines: { lundi: string; heures: number }[]; volumePrevu?: number },
    @Query('partielle') partielle?: string,
  ) {
    return this.parametres.bilan(a.id, body.semaines ?? [], {
      partielle: partielle === 'oui' || partielle === 'true',
      volumePrevu: body.volumePrevu ?? null,
    });
  }
}
