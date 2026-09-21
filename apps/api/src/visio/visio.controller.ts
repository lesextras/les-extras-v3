import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { VisioService } from './visio.service';
import { AnnulerVisioDto, PlanifierVisioDto, RejoindreVisioDto } from './dto/visio.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { RequestAccount } from '../common/types/request-context';

/**
 * LES RENDEZ-VOUS À DISTANCE, CÔTÉ INTERVENANT.
 *
 * Tout ce qui crée, annule ou ferme un rendez-vous passe par une session : ce
 * sont des gestes d'agenda, et l'agenda a un titulaire.
 */
@Controller('visio')
@UseGuards(JwtAuthGuard, AccountGuard)
export class VisioController {
  constructor(private readonly visio: VisioService) {}

  @Get('mes-rendez-vous')
  mesRendezVous(@CurrentAccount() account: RequestAccount) {
    return this.visio.mesVisios(account.id);
  }

  @Post()
  planifier(@CurrentAccount() account: RequestAccount, @Body() dto: PlanifierVisioDto) {
    return this.visio.planifier(account.id, dto);
  }

  @Post(':id/terminer')
  terminer(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.visio.terminer(account.id, id);
  }

  @Post(':id/annuler')
  annuler(
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Body() dto: AnnulerVisioDto,
  ) {
    return this.visio.annuler(account.id, id, dto);
  }
}

/**
 * LE LIEN REÇU — SANS COMPTE.
 *
 * ⚠⚠ CES DEUX ROUTES SONT PUBLIQUES, ET ELLES DOIVENT L'ÊTRE. Une famille qui
 * reçoit un lien de rendez-vous n'a pas de compte sur Les Extras et n'a aucune
 * raison d'en créer un pour parler vingt minutes à une psychomotricienne.
 * C'est le même choix que pour l'attestation : la clé est le lien, pas le
 * compte.
 *
 * Ce qui tient la porte, ce n'est donc pas une session, ce sont trois choses
 * cumulées : un jeton de 32 caractères tirés au hasard cryptographique, une
 * FENÊTRE d'ouverture bornée autour du rendez-vous (`fenetre.ts`), et un
 * plafond de débit.
 *
 * ⚠ LE PLAFOND N'EST PAS DÉCORATIF : sans lui, un jeton de 32 caractères
 * hexadécimaux reste théoriquement énumérable. Avec lui, il ne l'est plus en
 * pratique. Toutes les autres routes publiques d'écriture du dépôt en portent
 * un ; celle-ci ouvre une salle où se trouvent des familles, elle n'allait pas
 * faire exception.
 */
@Controller('public/visio')
export class VisioPubliqueController {
  constructor(private readonly visio: VisioService) {}

  /**
   * L'état du rendez-vous. Aucun secret n'en sort : c'est ce qui permet à la
   * salle d'attente d'appeler cette route toutes les dix secondes pour savoir
   * si l'intervenant a ouvert.
   */
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get(':jeton')
  etat(@Param('jeton') jeton: string) {
    return this.visio.etatParJeton(jeton);
  }

  /** Entrer. C'est ici que le jeton du serveur média est signé. */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':jeton/rejoindre')
  rejoindre(@Param('jeton') jeton: string, @Body() dto: RejoindreVisioDto) {
    return this.visio.rejoindre(jeton, dto.prenom);
  }
}
