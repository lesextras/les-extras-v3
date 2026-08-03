import { Module } from '@nestjs/common';
import { VivierController } from './vivier.controller';
import { VivierService } from './vivier.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [VivierController],
  providers: [VivierService],
  exports: [VivierService],
})
export class VivierModule {}
