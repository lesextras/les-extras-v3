import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { BoutiqueService } from './boutique.service';
import { CommanderDto } from './dto/boutique.dto';

/**
 * LA BOUTIQUE, CÔTÉ VISITEUR.
 *
 * Aucune authentification : on achète avec une adresse e-mail, comme on
 * s'inscrit à une formation. Le débit est plafonné — une commande est un
 * appel au prestataire de paiement, pas une lecture.
 */
@Controller('public/boutique')
export class BoutiquePublicController {
  constructor(
    private readonly boutique: BoutiqueService,
    private readonly config: ConfigService,
  ) {}

  @Get(':slug')
  vitrine(@Param('slug') slug: string) {
    return this.boutique.vitrinePublique(slug);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':slug/commander')
  commander(
    @Param('slug') slug: string,
    @Body() dto: CommanderDto,
    @Headers('origin') origine?: string,
  ) {
    // L'origine dit sur quelle boutique la personne se trouve : c'est là
    // qu'elle doit revenir après le paiement. On ne la déduit jamais d'une
    // valeur écrite dans le corps de la requête.
    const racine =
      origine && /^https?:\/\//.test(origine)
        ? origine
        : this.config.get<string>('APP_WEB_URL') ?? 'https://les-extras.fr';
    return this.boutique.commander(slug, dto, racine);
  }
}
