import { Module } from '@nestjs/common';
import { ClaudeService } from '../assistant/claude.service';
import { MoteurService } from '../assistant/moteur.service';
import { MistralService } from '../assistant/mistral.service';
import { EcoleService } from './ecole.service';
import { EcoleController } from './ecole.controller';
import { EcolePublicController } from './ecole-public.controller';
import { ApprenantService } from './suite/apprenant.service';
import { ClassesVisioService } from './suite/classes-visio.service';
import { CleApiGuard } from './suite/cle-api.guard';
import { CommunauteService } from './suite/communaute.service';
import { DevoirsService } from './suite/devoirs.service';
import { EmailsEcoleService } from './suite/emails-ecole.service';
import { OutilsEcoleService } from './suite/outils-ecole.service';
import { EcoleSuiteController } from './suite/suite.controller';
import { EcoleApiController, EcoleSuitePublicController } from './suite/suite-public.controller';

/**
 * L'ÉCOLE EN LIGNE D'UNE ACADÉMIE.
 *
 * Vendre et animer des cours : le catalogue, les chapitres et les leçons, les
 * quiz, les apprenants et leur progression, les ventes, les codes promo, les
 * packs, les classes virtuelles, la vitrine publique et l'affiliation.
 *
 * Le contrôleur public est déclaré en premier : ses routes sont fixes, elles ne
 * doivent jamais être interceptées par un paramètre du contrôleur privé.
 */
@Module({
  controllers: [EcolePublicController, EcoleSuitePublicController, EcoleApiController, EcoleController, EcoleSuiteController],
  // MoteurService sert l'aide à l'écriture : Gemini, puis Mistral, puis Claude.
  // Les trois se facturent séparément ; les deux premiers ont une offre gratuite.
  providers: [
    EcoleService,
    MoteurService,
    ClaudeService,
    MistralService,
    // La parité avec Teachizy (24/09/2026) : espace apprenant, devoirs,
    // courriels automatiques, communauté, salle de visio, réglages, clés d'API.
    EmailsEcoleService,
    ApprenantService,
    DevoirsService,
    CommunauteService,
    ClassesVisioService,
    OutilsEcoleService,
    CleApiGuard,
  ],
  exports: [EcoleService],
})
export class EcoleModule {}
