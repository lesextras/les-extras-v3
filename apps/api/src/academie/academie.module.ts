import { Module } from '@nestjs/common';
import { AcademieService } from './academie.service';
import { RepertoiresFormationService } from './repertoires';
import { CertificationService } from './certification';
import { AcademieEspaceController } from './academie-espace.controller';
import { AcademieOuvertureController } from './academie-ouverture.controller';
import { AcademiePublicController } from './academie-public.controller';
import { ContexteGestion } from './gestion/contexte.service';
import { SessionsAdminService } from './gestion/sessions-admin.service';
import { EmargementService } from './gestion/emargement.service';
import { DocumentsSessionService } from './gestion/documents-session.service';
import { FacturationOrganismeService } from './gestion/facturation-organisme.service';
import { QualiteSessionService } from './gestion/qualite-session.service';
import { BpfService } from './gestion/bpf.service';
import { EdofService } from './gestion/edof';
import { GestionScheduler } from './gestion/gestion.scheduler';
import { GestionController } from './gestion/gestion.controller';
import { GestionPublicController } from './gestion/gestion-public.controller';

/**
 * PILOTER MON ACADÉMIE (pilote.toulali.fr/academie).
 *
 * Le poste de pilotage d'un organisme de formation : la fiche de l'organisme,
 * le chemin en douze étapes, le journal de veille et le registre des
 * réclamations. Le catalogue, les sessions, les inscriptions et les preuves
 * Qualiopi vivent dans leurs modules d'origine — ce module les compose.
 *
 * `gestion/` porte l'ADMINISTRATION des sessions (29/09/2026) : formateurs et
 * salles, planning, émargement signé, documents et signatures, facturation
 * des clients, enquêtes, BPF et préparation EDOF.
 */
@Module({
  controllers: [AcademiePublicController, AcademieOuvertureController, AcademieEspaceController, GestionController, GestionPublicController],
  providers: [
    AcademieService,
    RepertoiresFormationService,
    CertificationService,
    ContexteGestion,
    SessionsAdminService,
    EmargementService,
    DocumentsSessionService,
    FacturationOrganismeService,
    QualiteSessionService,
    BpfService,
    EdofService,
    GestionScheduler,
  ],
  exports: [AcademieService, RepertoiresFormationService, CertificationService],
})
export class AcademieModule {}
