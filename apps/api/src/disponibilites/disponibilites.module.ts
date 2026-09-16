import { Module } from '@nestjs/common';
import { DisponibilitesController } from './disponibilites.controller';
import { DisponibilitesService } from './disponibilites.service';
import { DisponibilitesScheduler } from './disponibilites.scheduler';

// `MailModule` est @Global : il n'y a rien à importer ici pour l'obtenir.
@Module({
  controllers: [DisponibilitesController],
  providers: [DisponibilitesService, DisponibilitesScheduler],
  exports: [DisponibilitesService],
})
export class DisponibilitesModule {}
