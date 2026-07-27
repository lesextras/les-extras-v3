import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/**
 * Module du journal d'audit, global : `AuditService` est injectable partout
 * (services métier, guards, intercepteurs) sans avoir à réimporter le module.
 *
 * À enregistrer une seule fois dans `AppModule` (aux côtés de PrismaModule
 * et MailModule) pour être disponible dans toute l'application.
 */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
