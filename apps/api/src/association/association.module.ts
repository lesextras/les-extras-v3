import { Module } from '@nestjs/common';
import { AssociationService } from './association.service';
import { EspaceService } from './espace.service';
import { AssociationPublicController } from './association-public.controller';
import { AssociationEspaceController } from './association-espace.controller';

/**
 * PILOTER MON ASSOCIATION (association.toulali.fr).
 *
 * Deux faces : la face publique (référentiel des pièces, chemin, carte des
 * outils, vérification d'une association, inscription) et l'espace connecté
 * d'un compte ASSOCIATION (organisation, classeur à péremption, dossiers de
 * financement, écran du lundi).
 */
@Module({
  controllers: [AssociationPublicController, AssociationEspaceController],
  providers: [AssociationService, EspaceService],
  exports: [AssociationService, EspaceService],
})
export class AssociationModule {}
