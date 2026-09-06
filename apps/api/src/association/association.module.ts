import { Module } from '@nestjs/common';
import { AssociationService } from './association.service';
import { AssociationPublicController } from './association-public.controller';

/**
 * PILOTER MON ASSOCIATION (association.toulali.fr).
 *
 * Premier lot : tout est public et sans base de données. Le référentiel des
 * pièces, le chemin et la carte des outils sont des fichiers versionnés ; les
 * données d'identité viennent de l'API publique « Recherche d'entreprises ».
 * Les objets persistants (organisation, classeur, dossiers) arrivent au lot
 * suivant, avec le type de compte ASSOCIATION.
 */
@Module({
  controllers: [AssociationPublicController],
  providers: [AssociationService],
  exports: [AssociationService],
})
export class AssociationModule {}
