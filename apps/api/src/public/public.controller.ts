import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { PublicService } from './public.service';
import { QueryPublicCatalogDto } from './dto/query-public-catalog.dto';
import { QueryPublicFormationsDto } from './dto/query-public-formations.dto';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { CreateCaptureDto, DesabonnementCaptureDto } from './dto/create-capture.dto';
import { CreateVueDto } from './dto/create-vue.dto';
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

  /**
   * GET /public/structures?q= — LES STRUCTURES, POUR L'INSCRIPTION.
   *
   * Réunit deux sources : les structures DÉJÀ déclarées sur la plateforme
   * (pour que le onzième établissement d'un groupe tombe sur la même ligne que
   * les dix premiers) et l'annuaire public des entreprises.
   *
   * ⚠ ROUTE PUBLIQUE, PARCE QUE L'INSCRIPTION L'EST. La structure se choisit
   * au même écran que l'établissement, donc avant que le compte n'existe :
   * exiger une authentification rendrait l'écran impossible.
   *
   * Ce qu'elle expose ne va pas plus loin qu'un annuaire d'organisations —
   * raison sociale, forme juridique, ville, SIREN, tous publics par
   * construction. Aucune personne, aucun effectif, aucune adresse de contact.
   * Ne pas y ajouter de champ sans se reposer cette question.
   */
  @Get('structures')
  structures(@Query('q') q?: string) {
    return this.publicService.rechercherStructures(q ?? '');
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

  /**
   * POST /public/captures — « Recevoir la fiche récap par e-mail » depuis la
   * fiche d'un parcours gratuit. Même plafond que les autres formulaires
   * ouverts, même champ-piège.
   */
  @Throttle({ default: { limit: 8, ttl: 3_600_000 } })
  @Post('captures')
  capture(@Body() dto: CreateCaptureDto) {
    return this.publicService.createCapture(dto);
  }

  /**
   * POST /public/captures/desabonnement — retrait de la séquence d'accueil par
   * jeton. Un POST et non un GET : un lien ouvert par un antivirus ou un
   * aperçu de messagerie ne doit pas désabonner quelqu'un à son insu.
   */
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @Post('captures/desabonnement')
  desabonnement(@Body() dto: DesabonnementCaptureDto) {
    return this.publicService.desabonnerCapture(dto.jeton);
  }

  /**
   * POST /public/trafic — une page vue, agrégée par jour, chemin et origine.
   * Aucun identifiant de personne n'entre ici (voir CreateVueDto). Plafond
   * large : une visite normale enchaîne dix pages en quelques minutes.
   */
  @Throttle({ default: { limit: 120, ttl: 600_000 } })
  @Post('trafic')
  vue(@Body() dto: CreateVueDto) {
    return this.publicService.compterVue(dto);
  }
}
