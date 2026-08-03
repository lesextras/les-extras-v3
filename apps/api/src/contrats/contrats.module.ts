import { Module } from '@nestjs/common';
import { ContratsService } from './contrats.service';
import { ContratsController } from './contrats.controller';
import { PlanningModule } from '../planning/planning.module';

@Module({
  // Le chiffrage d'une proposition a besoin des regles de temps de travail
  // de l'etablissement pour decouper les heures de nuit et de dimanche.
  imports: [PlanningModule],
  controllers: [ContratsController],
  providers: [ContratsService],
  exports: [ContratsService],
})
export class ContratsModule {}
