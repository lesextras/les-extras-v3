import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { EcoleService } from './ecole.service';
import { AvancerDto, RejoindreDto } from './dto/ecole.dto';

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
}
