import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PublicService } from './public.service';
import { QueryPublicCatalogDto } from './dto/query-public-catalog.dto';
import { CreateContactDto } from './dto/create-contact.dto';

/**
 * Vitrine PUBLIQUE, sans authentification (aucun JwtAuthGuard).
 * Expose le catalogue des ateliers & formations publiés pour le site marketing.
 */
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  /** GET /public/catalog?type=all|atelier|formation&category=&search=&take=&skip= */
  @Get('catalog')
  catalog(@Query() query: QueryPublicCatalogDto) {
    return this.publicService.catalog(query);
  }

  /** GET /public/catalog/:id — détail d'un service publié (404 sinon). */
  @Get('catalog/:id')
  detail(@Param('id') id: string) {
    return this.publicService.detail(id);
  }

  /** GET /public/missions/:id — détail public d'une mission publiée (404 sinon). */
  @Get('missions/:id')
  missionDetail(@Param('id') id: string) {
    return this.publicService.missionDetail(id);
  }

  /** POST /public/contact — dépôt d'une demande de contact depuis le site public. */
  @Post('contact')
  contact(@Body() dto: CreateContactDto) {
    return this.publicService.createContact(dto);
  }
}
