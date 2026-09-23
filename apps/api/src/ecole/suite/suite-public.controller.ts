import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ApprenantService } from './apprenant.service';
import { ClassesVisioService } from './classes-visio.service';
import { CommunauteService } from './communaute.service';
import { DevoirsService, FICHIERS_MAX, TAILLE_MAX_RENDU, type FichierRecuDevoir } from './devoirs.service';
import { OutilsEcoleService } from './outils-ecole.service';
import { envoyerFichier } from './suite.controller';
import { CleApiGuard, CleApiAcademie } from './cle-api.guard';
import {
  ChangerMotDePasseDto,
  ChoisirMotDePasseDto,
  CommentaireCommunauteDto,
  ConnexionApprenantDto,
  DemanderLienDto,
  InscriptionApiDto,
  ProfilApprenantDto,
  PublicationDto,
  RejoindreClasseDto,
  RenduDto,
} from './suite.dto';

/**
 * LA SUITE DE L'ÉCOLE, CÔTÉ APPRENANT ET CÔTÉ PUBLIC.
 *
 * Aucune session Piloter ici : l'apprenant s'identifie par sa session
 * d'espace apprenant (en-tête `x-apprenant`, posé par le relais du site) ou
 * par le lien personnel de sa formation. Chaque route d'écriture est plafonnée.
 */
@Controller('public/ecole')
export class EcoleSuitePublicController {
  constructor(
    private readonly apprenants: ApprenantService,
    private readonly devoirs: DevoirsService,
    private readonly communaute: CommunauteService,
    private readonly classes: ClassesVisioService,
    private readonly outils: OutilsEcoleService,
  ) {}

  /* ------------------------------------------- l'école : pages publiques */

  @Get('ecoles/:slug/infos')
  infos(@Param('slug') slug: string) {
    return this.outils.publicEcole(slug);
  }

  @Get('ecoles/:slug/espace')
  ecoleEspace(@Param('slug') slug: string) {
    return this.apprenants.ecoleParSlug(slug);
  }

  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Get('domaine/:hote')
  domaine(@Param('hote') hote: string) {
    return this.outils.ecoleDuDomaine(hote);
  }

  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  @Get('integration/cours/:slug')
  carteCours(@Param('slug') slug: string) {
    return this.outils.carteCours(slug);
  }

  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  @Get('integration/pack/:slug')
  cartePack(@Param('slug') slug: string) {
    return this.outils.cartePack(slug);
  }

  /* ------------------------------------------ l'espace : se connecter */

  @Throttle({ default: { limit: 6, ttl: 3_600_000 } })
  @Post('ecoles/:slug/lien')
  demanderLien(@Param('slug') slug: string, @Body() dto: DemanderLienDto) {
    return this.apprenants.demanderLien(slug, dto.email);
  }

  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  @Post('ecoles/:slug/mot-de-passe')
  choisirMotDePasse(@Param('slug') slug: string, @Body() dto: ChoisirMotDePasseDto) {
    return this.apprenants.choisirMotDePasse(slug, dto);
  }

  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  @Post('ecoles/:slug/connexion')
  connexion(@Param('slug') slug: string, @Body() dto: ConnexionApprenantDto) {
    return this.apprenants.connexion(slug, dto);
  }

  /* ----------------------------------------------- l'espace : connecté */

  @Get('apprenant/moi')
  moi(@Headers('x-apprenant') s?: string) {
    return this.apprenants.moi(s);
  }

  @Patch('apprenant/moi')
  profil(@Headers('x-apprenant') s: string | undefined, @Body() dto: ProfilApprenantDto) {
    return this.apprenants.modifierProfil(s, dto);
  }

  @Throttle({ default: { limit: 10, ttl: 600_000 } })
  @Post('apprenant/mot-de-passe')
  changerMotDePasse(@Headers('x-apprenant') s: string | undefined, @Body() dto: ChangerMotDePasseDto) {
    return this.apprenants.changerMotDePasse(s, dto);
  }

  @Get('apprenant/calendrier')
  calendrier(@Headers('x-apprenant') s?: string) {
    return this.apprenants.calendrier(s);
  }

  @Get('apprenant/communaute')
  accueilCommunaute(@Headers('x-apprenant') s?: string) {
    return this.communaute.accueilApprenant(s);
  }

  @Get('apprenant/communaute/espaces/:id')
  filCommunaute(@Headers('x-apprenant') s: string | undefined, @Param('id') id: string) {
    return this.communaute.filApprenant(s, id);
  }

  @Throttle({ default: { limit: 20, ttl: 600_000 } })
  @Post('apprenant/communaute/espaces/:id/publications')
  publierCommunaute(@Headers('x-apprenant') s: string | undefined, @Param('id') id: string, @Body() dto: PublicationDto) {
    return this.communaute.publierApprenant(s, id, dto);
  }

  @Throttle({ default: { limit: 60, ttl: 600_000 } })
  @Post('apprenant/communaute/publications/:id/commentaires')
  commenterCommunaute(@Headers('x-apprenant') s: string | undefined, @Param('id') id: string, @Body() dto: CommentaireCommunauteDto) {
    return this.communaute.commenterApprenant(s, id, dto);
  }

  @Throttle({ default: { limit: 120, ttl: 600_000 } })
  @Post('apprenant/communaute/publications/:id/aimer')
  aimer(@Headers('x-apprenant') s: string | undefined, @Param('id') id: string) {
    return this.communaute.aimer(s, id);
  }

  @Delete('apprenant/communaute/publications/:id')
  retirer(@Headers('x-apprenant') s: string | undefined, @Param('id') id: string) {
    return this.communaute.retirerMaPublication(s, id);
  }

  /* ------------------------------------------------ les devoirs (lien) */

  @Get('apprendre/:jeton/devoirs/:leconId')
  monRendu(@Param('jeton') jeton: string, @Param('leconId') leconId: string) {
    return this.devoirs.monRendu(jeton, leconId);
  }

  @Throttle({ default: { limit: 20, ttl: 600_000 } })
  @Post('apprendre/:jeton/devoirs/:leconId')
  @UseInterceptors(FilesInterceptor('fichiers', FICHIERS_MAX, { limits: { fileSize: TAILLE_MAX_RENDU, files: FICHIERS_MAX } }))
  rendre(
    @Param('jeton') jeton: string,
    @Param('leconId') leconId: string,
    @Body() dto: RenduDto,
    @UploadedFiles() fichiers?: FichierRecuDevoir[],
  ) {
    return this.devoirs.rendre(jeton, leconId, dto.texte, fichiers ?? []);
  }

  @Get('apprendre/:jeton/devoirs/:leconId/fichiers/:n')
  async fichierRendu(
    @Param('jeton') jeton: string,
    @Param('leconId') leconId: string,
    @Param('n', ParseIntPipe) n: number,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { flux, nom, type } = await this.devoirs.fichierApprenant(jeton, leconId, n);
    envoyerFichier(res, flux, nom, type);
  }

  /* --------------------------------------------- les classes virtuelles */

  @Get('classes/:id')
  classe(@Param('id') id: string) {
    return this.classes.lire(id);
  }

  @Throttle({ default: { limit: 30, ttl: 600_000 } })
  @Post('classes/:id/rejoindre')
  rejoindreClasse(
    @Param('id') id: string,
    @Headers('x-apprenant') s: string | undefined,
    @Body() corps: RejoindreClasseDto,
    @Query('animateur') animateur?: string,
  ) {
    return this.classes.rejoindre(id, {
      animateur: corps.animateur || animateur,
      jetonInscription: corps.jeton,
      sessionApprenant: s,
      prenom: corps.prenom,
    });
  }
}

/**
 * L'API POUR DÉVELOPPEURS.
 *
 * Authentifiée par une clé d'API de l'académie (`Authorization: Bearer pk_…`),
 * créée et révoquée depuis ses paramètres. Lecture des formations, des
 * apprenants et des ventes ; inscription d'un apprenant. Plafonnée comme une
 * intégration, pas comme un navigateur.
 */
@Controller('v1/academie')
@UseGuards(CleApiGuard)
@Throttle({ default: { limit: 120, ttl: 60_000 } })
export class EcoleApiController {
  constructor(private readonly outils: OutilsEcoleService) {}

  @Get('formations')
  formations(@CleApiAcademie() accountId: string) {
    return this.outils.apiFormations(accountId);
  }

  @Get('apprenants')
  apprenantsListe(@CleApiAcademie() accountId: string, @Query('coursId') coursId?: string) {
    return this.outils.apiApprenants(accountId, coursId || undefined);
  }

  @Post('inscriptions')
  inscrire(@CleApiAcademie() accountId: string, @Body() dto: InscriptionApiDto) {
    return this.outils.apiInscrire(accountId, dto);
  }

  @Get('ventes')
  ventes(@CleApiAcademie() accountId: string) {
    return this.outils.apiVentes(accountId);
  }
}
