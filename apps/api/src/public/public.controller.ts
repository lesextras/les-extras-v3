import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicService } from './public.service';
import { QueryPublicCatalogDto } from './dto/query-public-catalog.dto';
import { QueryPublicFormationsDto } from './dto/query-public-formations.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { QueryVendorsDto } from './dto/query-vendors.dto';

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

  /** GET /public/highlights — les 10 ateliers et 10 formations mis en avant. */
  @Get('highlights')
  highlights() {
    return this.publicService.highlights();
  }

  /**
   * POST /public/quote-request — demande de devis sans compte.
   * Formulaire ouvert : plafonné à 8 dépôts par heure et par IP, champ-piège
   * en complément. Une adresse en NAT (établissement) reste largement servie.
   */
  @Throttle({ default: { limit: 8, ttl: 3_600_000 } })
  @Post('quote-request')
  quoteRequest(@Body() dto: CreateQuoteRequestDto) {
    return this.publicService.createQuoteRequest(dto);
  }

  /** GET /public/formations?search=&category=&take=&skip= — catalogue public. */
  @Get('formations')
  formations(@Query() query: QueryPublicFormationsDto) {
    return this.publicService.formations(query);
  }

  /** GET /public/formations/:slug — fiche publique d'une formation publiée. */
  @Get('formations/:slug')
  formationDetail(@Param('slug') slug: string) {
    return this.publicService.formationDetail(slug);
  }

  /** GET /public/missions — missions de renfort ouvertes (sitemap, maillage). */
  @Get('missions')
  missions(@Query('take') take?: string, @Query('skip') skip?: string) {
    return this.publicService.missions({
      take: take ? Number(take) : undefined,
      skip: skip ? Number(skip) : undefined,
    });
  }

  /** GET /public/missions/:id — détail public d'une mission publiée (404 sinon). */
  @Get('missions/:id')
  missionDetail(@Param('id') id: string) {
    return this.publicService.missionDetail(id);
  }

  /** GET /public/vendors — annuaire des intervenants qui publient. */
  @Get('vendors')
  vendors(@Query() query: QueryVendorsDto) {
    return this.publicService.vendors(query);
  }

  /** GET /public/vendors/:id — fiche publique d'un intervenant. */
  @Get('vendors/:id')
  vendorDetail(@Param('id') id: string) {
    return this.publicService.vendorDetail(id);
  }

  /** POST /public/contact — dépôt d'une demande de contact depuis le site public. */
  @Throttle({ default: { limit: 8, ttl: 3_600_000 } })
  @Post('contact')
  contact(@Body() dto: CreateContactDto) {
    return this.publicService.createContact(dto);
  }
}
