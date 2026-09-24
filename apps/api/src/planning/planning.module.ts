import { Module } from '@nestjs/common';
import { PlanningService } from './planning.service';
import { PlanningController } from './planning.controller';
import { ParametresTempsService } from './parametres-temps.service';

/**
 * Planning des créneaux.
 *
 * Le module GTA (congés, compteurs d'équipe, export des éléments de paie) et
 * l'écran des paramètres de temps de travail sont retirés depuis le
 * 24/09/2026 (« 1 compte = 1 personne », plus de gestion d'équipe). La
 * répétition d'une semaine vit désormais dans `PlanningService`.
 * `ParametresTempsService` reste : le contrat CDD lit les majorations
 * conventionnelles de l'établissement.
 */
@Module({
  controllers: [PlanningController],
  providers: [PlanningService, ParametresTempsService],
  exports: [PlanningService, ParametresTempsService],
})
export class PlanningModule {}
