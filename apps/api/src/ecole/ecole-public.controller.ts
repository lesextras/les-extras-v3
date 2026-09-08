import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EcoleService } from './ecole.service';
import {
  AcheterCoursDto,
  AvancerDto,
  CocherTachesDto,
  EcrireCommentaireDto,
  RejoindreDto,
} from './dto/ecole.dto';

/**
 * LA FACE PUBLIQUE DE L'ÉCOLE.
 *
 * Aucune session : ni pour voir la vitrine, ni pour suivre un cours. Ce qui
 * ouvre un cours, c'est le jeton personnel envoyé à l'inscription — long,
 * aléatoire, et propre à une personne. On limite les envois : une page ouverte
 * au monde entier attire les robots.
 */
@Controller('public/ecole')
export class EcolePublicController {
  constructor(private readonly ecole: EcoleService) {}

  /** La vitrine d'une école : /ecole/<slug>. */
  @Get('vitrine/:slug')
  vitrine(@Param('slug') slug: string) {
    return this.ecole.vitrine(slug);
  }

  /** La page publique d'un cours : /cours/<slug>. */
  @Get('cours/:slug')
  cours(@Param('slug') slug: string) {
    return this.ecole.pageCours(slug);
  }

  /** S'inscrire à un cours gratuit. */
  @Post('cours/:slug/rejoindre')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  rejoindre(@Param('slug') slug: string, @Body() dto: RejoindreDto) {
    return this.ecole.rejoindre(slug, dto);
  }

  /** Le cours tel qu'on le suit : /apprendre/<jeton>. */
  @Get('apprendre/:jeton')
  suivre(@Param('jeton') jeton: string) {
    return this.ecole.suivre(jeton);
  }

  /** Cocher une leçon, ou rendre un quiz. */
  @Post('apprendre/:jeton/lecons/:leconId')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  avancer(@Param('jeton') jeton: string, @Param('leconId') leconId: string, @Body() dto: AvancerDto) {
    return this.ecole.avancer(jeton, leconId, dto);
  }

  /** Écrire une question sous une leçon. */
  @Post('apprendre/:jeton/commentaires')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  commenter(@Param('jeton') jeton: string, @Body() dto: EcrireCommentaireDto) {
    return this.ecole.commenter(jeton, dto);
  }

  /* ------------------------------------------------- la durée et les tâches */

  /** L'apprenant ouvre une leçon : c'est de là que court la durée minimum. */
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Post('apprendre/:jeton/lecons/:leconId/ouvrir')
  ouvrirLecon(@Param('jeton') jeton: string, @Param('leconId') leconId: string) {
    return this.ecole.ouvrirLecon(jeton, leconId);
  }

  /** Les cases cochées d'une leçon « Tâches & missions ». */
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Post('apprendre/:jeton/lecons/:leconId/taches')
  cocherTaches(
    @Param('jeton') jeton: string,
    @Param('leconId') leconId: string,
    @Body() dto: CocherTachesDto,
  ) {
    return this.ecole.cocherTaches(jeton, leconId, dto);
  }

  /* ------------------------------------------------------ le paiement */

  /**
   * Acheter une formation. L'adresse de retour est déduite de l'origine de la
   * requête : la boutique d'une académie n'est pas toujours sur le même
   * domaine que le site principal.
   */
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('cours/:slug/acheter')
  acheter(
    @Param('slug') slug: string,
    @Body() dto: AcheterCoursDto,
    @Headers('origin') origin?: string,
    @Headers('referer') referer?: string,
  ) {
    const origine = origin || (referer ? new URL(referer).origin : '') || 'https://pilote.toulali.fr';
    return this.ecole.acheterCours(slug, dto, origine);
  }

  /** Après le paiement : le lien d'accès, dès que Stripe a confirmé. */
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @Get('achat/:sessionId')
  achat(@Param('sessionId') sessionId: string) {
    return this.ecole.achatConfirme(sessionId);
  }
}
