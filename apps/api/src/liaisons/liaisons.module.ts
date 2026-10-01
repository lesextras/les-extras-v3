import { Module } from '@nestjs/common';
import { AssociationModule } from '../association/association.module';
import { LiaisonsService } from './liaisons.service';
import { ProjetsReliesService } from './projets.service';
import { AcademieProjetsController, AssociationFormationsController, LiaisonsController } from './liaisons.controller';

/**
 * ESPACES INTERCONNECTÉS (Pilote, 01/10/2026).
 *
 * Une association et une académie se relient dans leurs Réglages. Reliées,
 * elles travaillent sur les MÊMES lignes : l'académie ouvre « Mes projets » de
 * l'association (projets et tâches), chaque projet se relie à des formations,
 * et l'académie lit les agréments de l'association. Une seule source de
 * vérité, jamais de copie.
 */
@Module({
  imports: [AssociationModule],
  controllers: [LiaisonsController, AcademieProjetsController, AssociationFormationsController],
  providers: [LiaisonsService, ProjetsReliesService],
  exports: [LiaisonsService],
})
export class LiaisonsModule {}
