import { Module } from '@nestjs/common';
import { AdministrationService } from './administration.service';
import { AdministrationController } from './administration.controller';

/**
 * L'ADMINISTRATION DE PILOTER.
 *
 * Voir tous les espaces, toutes les personnes, tout ce qui a été créé —
 * et corriger ce qui doit l'être. Le rôle ADMIN, en base, ouvre la porte.
 */
@Module({
  controllers: [AdministrationController],
  providers: [AdministrationService],
  exports: [AdministrationService],
})
export class AdministrationModule {}
