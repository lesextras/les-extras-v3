import { Module } from '@nestjs/common';
import { ClaudeService } from '../assistant/claude.service';
import { MoteurService } from '../assistant/moteur.service';
import { MistralService } from '../assistant/mistral.service';
import { EcoleService } from './ecole.service';
import { EcoleController } from './ecole.controller';
import { EcolePublicController } from './ecole-public.controller';

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
  controllers: [EcolePublicController, EcoleController],
  // MoteurService sert l'aide à l'écriture : Gemini, puis Mistral, puis Claude.
  // Les trois se facturent séparément ; les deux premiers ont une offre gratuite.
  providers: [EcoleService, MoteurService, ClaudeService, MistralService],
  exports: [EcoleService],
})
export class EcoleModule {}
