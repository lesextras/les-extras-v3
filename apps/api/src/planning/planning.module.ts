import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { PlanningService } from './planning.service';
import { PlanningController } from './planning.controller';
import { GtaService } from './gta.service';
import { GtaController } from './gta.controller';

@Module({
  imports: [NotificationsModule],
  controllers: [PlanningController, GtaController],
  providers: [PlanningService, GtaService],
  exports: [PlanningService],
})
export class PlanningModule {}
