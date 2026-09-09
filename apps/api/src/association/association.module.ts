import { Module } from '@nestjs/common';
import { AssociationService } from './association.service';
import { ClaudeService } from '../assistant/claude.service';
import { MoteurService } from '../assistant/moteur.service';
import { MistralService } from '../assistant/mistral.service';
import { EspaceService } from './espace.service';
import { AssociationPublicController } from './association-public.controller';
import { AssociationEspaceController } from './association-espace.controller';
import { AssociationOuvertureController } from './association-ouverture.controller';

/**
 * PILOTER MON ASSOCIATION (pilote.toulali.fr).
 *
 * Deux faces : la face publique (référentiel des pièces, chemin, carte des
 * outils, vérification d'une association, inscription) et l'espace connecté
 * d'un compte ASSOCIATION (organisation, classeur à péremption, dossiers de
 * financement, écran du lundi).
 */
@Module({
  controllers: [AssociationPublicController, AssociationEspaceController, AssociationOuvertureController],
  providers: [AssociationService, EspaceService, ClaudeService, MoteurService, MistralService],
  exports: [AssociationService, EspaceService],
})
export class AssociationModule {}
