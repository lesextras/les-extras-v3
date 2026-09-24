import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { CreditsService } from './credits.service';
import { EnveloppesController } from './enveloppes.controller';
import { EnveloppesService } from './enveloppes.service';
import { MailModule } from '../common/mail/mail.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { EcoleModule } from '../ecole/ecole.module';
import { BoutiqueModule } from '../boutique/boutique.module';
import { AttestationsModule } from '../attestations/attestations.module';

@Module({
  // Deux modules importés pour une seule raison : quand le webhook confirme
  // un paiement, c'est l'école qui sait ouvrir l'accès à une formation, et la
  // boutique qui sait écrire une commande. Aucune dépendance en sens inverse.
  // (et les attestations, qui savent ce qu'un paiement d'attestation change).
  // Aucune dépendance en sens inverse : ces trois modules ignorent billing.
  imports: [EcoleModule, BoutiqueModule, AttestationsModule, MailModule, NotificationsModule],
  controllers: [BillingController, EnveloppesController],
  providers: [BillingService, CreditsService, EnveloppesService],
  // Exporté pour l'assistant : chaque génération LEX consomme un crédit.
  exports: [CreditsService],
})
export class BillingModule {}
