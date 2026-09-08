import { Module } from '@nestjs/common';
import { FormulairesService } from './formulaires.service';
import { FormulairesController, FormulairesPublicController } from './formulaires.controller';

/**
 * LES FORMULAIRES LIBRES, DANS LES DEUX ESPACES.
 *
 * Un compte compose le formulaire qu'il veut — adhésion, inscription à une
 * sortie, positionnement avant formation, enquête de satisfaction — le publie,
 * et partage une adresse courte. Les réponses reviennent dans son espace.
 */
@Module({
  controllers: [FormulairesPublicController, FormulairesController],
  providers: [FormulairesService],
  exports: [FormulairesService],
})
export class FormulairesModule {}
