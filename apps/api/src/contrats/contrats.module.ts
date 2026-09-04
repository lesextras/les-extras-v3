import { Module } from '@nestjs/common';
import { MailModule } from '../common/mail/mail.module';
import { ContratsService } from './contrats.service';
import { ContratsController } from './contrats.controller';
import { PlanningModule } from '../planning/planning.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  // Le chiffrage d'une proposition a besoin des regles de temps de travail
  // de l'etablissement pour decouper les heures de nuit et de dimanche.
  imports: [MailModule, PlanningModule, NotificationsModule],
  controllers: [ContratsController],
  providers: [ContratsService],
  exports: [ContratsService],
})
export class ContratsModule {}
