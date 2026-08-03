import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlanningService } from './planning.service';
import { PlanningController } from './planning.controller';
import { GtaService } from './gta.service';
import { GtaController } from './gta.controller';
import { ParametresTempsService } from './parametres-temps.service';
import { ParametresTempsController } from './parametres-temps.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [PlanningController, GtaController, ParametresTempsController],
  providers: [PlanningService, GtaService, ParametresTempsService],
  exports: [PlanningService, ParametresTempsService],
})
export class PlanningModule {}
