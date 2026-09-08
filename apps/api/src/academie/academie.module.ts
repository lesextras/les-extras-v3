import { Module } from '@nestjs/common';
import { AcademieService } from './academie.service';
import { RepertoiresFormationService } from './repertoires';
import { CertificationService } from './certification';
import { AcademieEspaceController } from './academie-espace.controller';
import { AcademieOuvertureController } from './academie-ouverture.controller';
import { AcademiePublicController } from './academie-public.controller';

/**
 * PILOTER MON ACADÉMIE (pilote.toulali.fr/academie).
 *
 * Le poste de pilotage d'un organisme de formation : la fiche de l'organisme,
 * le chemin en douze étapes, le journal de veille et le registre des
 * réclamations. Le catalogue, les sessions, les inscriptions et les preuves
 * Qualiopi vivent dans leurs modules d'origine — ce module les compose.
 */
@Module({
  controllers: [AcademiePublicController, AcademieOuvertureController, AcademieEspaceController],
  providers: [AcademieService, RepertoiresFormationService, CertificationService],
  exports: [AcademieService, RepertoiresFormationService, CertificationService],
})
export class AcademieModule {}
