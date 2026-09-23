import { Body, Controller, Delete, Get, Param, ParseEnumPipe, ParseIntPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { StatutRendu, TypeEmailEcole } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AccountGuard } from '../../common/guards/account.guard';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestAccount } from '../../common/types/request-context';
import { PrismaService } from '../../prisma/prisma.service';
import { ClassesVisioService } from './classes-visio.service';
import { CommunauteService } from './communaute.service';
import { DevoirsService } from './devoirs.service';
import { EmailsEcoleService } from './emails-ecole.service';
import { OutilsEcoleService } from './outils-ecole.service';
import {
  CleApiDto,
  CollectionDto,
  CommentaireCommunauteDto,
  CorrigerRenduDto,
  EspaceCommunauteDto,
  EvenementDto,
  ModeleEmailDto,
  ModererCommentaireDto,
  ModererPublicationDto,
  ModifierEvenementDto,
  PublicationDto,
  ReglageCoursDto,
  ReglagesEcoleDto,
  TesterEmailDto,
} from './suite.dto';

/**
 * LA SUITE DE L'ÉCOLE, CÔTÉ ACADÉMIE : devoirs à corriger, courriels
 * automatiques, calendrier, communauté, salle de visio des classes, réglages
 * (domaine, référencement, liens légaux), durée d'accès, clés d'API et liste
 * de démarrage. Le garde de compte fait le tri : on ne voit jamais l'école
 * d'un autre.
 */
@Controller('ecole')
@UseGuards(JwtAuthGuard, AccountGuard)
export class EcoleSuiteController {
  constructor(
    private readonly devoirs: DevoirsService,
    private readonly emails: EmailsEcoleService,
    private readonly communaute: CommunauteService,
    private readonly classes: ClassesVisioService,
    private readonly outils: OutilsEcoleService,
    private readonly prisma: PrismaService,
  ) {}

  /* ------------------------------------------------------- les devoirs */

  @Get('devoirs')
  listerDevoirs(
    @CurrentAccount() a: RequestAccount,
    @Query('statut') statut?: string,
    @Query('coursId') coursId?: string,
  ) {
    const s = statut && (Object.values(StatutRendu) as string[]).includes(statut) ? (statut as StatutRendu) : undefined;
    return this.devoirs.lister(a.id, { statut: s, coursId: coursId || undefined });
  }

  @Patch('devoirs/:id')
  corriger(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: CorrigerRenduDto) {
    return this.devoirs.corriger(a.id, id, dto);
  }

  @Get('devoirs/:id/fichiers/:n')
  async fichierDevoir(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Param('n', ParseIntPipe) n: number,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { flux, nom, type } = await this.devoirs.fichierAcademie(a.id, id, n);
    envoyerFichier(res, flux, nom, type);
  }

  /* ------------------------------------------- les courriels automatiques */

  @Get('emails')
  listerEmails(@CurrentAccount() a: RequestAccount) {
    return this.emails.lister(a.id);
  }

  @Patch('emails/:type')
  modifierEmail(
    @CurrentAccount() a: RequestAccount,
    @Param('type', new ParseEnumPipe(TypeEmailEcole)) type: TypeEmailEcole,
    @Body() dto: ModeleEmailDto,
  ) {
    return this.emails.modifier(a.id, type, dto);
  }

  @Post('emails/:type/reinitialiser')
  reinitialiserEmail(@CurrentAccount() a: RequestAccount, @Param('type', new ParseEnumPipe(TypeEmailEcole)) type: TypeEmailEcole) {
    return this.emails.reinitialiser(a.id, type);
  }

  @Post('emails/:type/tester')
  testerEmail(
    @CurrentAccount() a: RequestAccount,
    @Param('type', new ParseEnumPipe(TypeEmailEcole)) type: TypeEmailEcole,
    @Body() dto: TesterEmailDto,
  ) {
    return this.emails.tester(a.id, type, dto.email);
  }

  /* ------------------------------------------------------ le calendrier */

  @Get('evenements')
  listerEvenements(@CurrentAccount() a: RequestAccount) {
    return this.outils.listerEvenements(a.id);
  }

  @Post('evenements')
  creerEvenement(@CurrentAccount() a: RequestAccount, @Body() dto: EvenementDto) {
    return this.outils.creerEvenement(a.id, dto);
  }

  @Patch('evenements/:id')
  modifierEvenement(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ModifierEvenementDto) {
    return this.outils.modifierEvenement(a.id, id, dto);
  }

  @Delete('evenements/:id')
  supprimerEvenement(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.outils.supprimerEvenement(a.id, id);
  }

  /* ------------------------------------------------------ la communauté */

  @Get('communaute')
  communauteAcademie(@CurrentAccount() a: RequestAccount) {
    return this.communaute.vueAcademie(a.id);
  }

  @Post('communaute/collections')
  creerCollection(@CurrentAccount() a: RequestAccount, @Body() dto: CollectionDto) {
    return this.communaute.creerCollection(a.id, dto);
  }

  @Patch('communaute/collections/:id')
  modifierCollection(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: CollectionDto) {
    return this.communaute.modifierCollection(a.id, id, dto);
  }

  @Delete('communaute/collections/:id')
  supprimerCollection(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.communaute.supprimerCollection(a.id, id);
  }

  @Post('communaute/espaces')
  creerEspace(@CurrentAccount() a: RequestAccount, @Body() dto: EspaceCommunauteDto) {
    return this.communaute.creerEspace(a.id, dto);
  }

  @Patch('communaute/espaces/:id')
  modifierEspace(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: EspaceCommunauteDto) {
    return this.communaute.modifierEspace(a.id, id, dto);
  }

  @Delete('communaute/espaces/:id')
  supprimerEspace(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.communaute.supprimerEspace(a.id, id);
  }

  @Get('communaute/espaces/:id/publications')
  fil(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.communaute.filAcademie(a.id, id);
  }

  @Post('communaute/espaces/:id/publications')
  async publier(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: PublicationDto) {
    return this.communaute.publierAcademie(a.id, id, dto, await this.nomEcole(a.id));
  }

  @Patch('communaute/publications/:id')
  moderer(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ModererPublicationDto) {
    return this.communaute.modererPublication(a.id, id, dto);
  }

  @Delete('communaute/publications/:id')
  supprimerPublication(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.communaute.supprimerPublication(a.id, id);
  }

  @Post('communaute/publications/:id/commentaires')
  async commenter(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: CommentaireCommunauteDto) {
    return this.communaute.commenterAcademie(a.id, id, dto, await this.nomEcole(a.id));
  }

  @Patch('communaute/commentaires/:id')
  modererCommentaire(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ModererCommentaireDto) {
    return this.communaute.modererCommentaire(a.id, id, dto);
  }

  /* ------------------------------------- la salle de visio d'une classe */

  @Get('visio/disponible')
  visioDisponible() {
    return this.classes.disponible();
  }

  @Post('classes/:id/salle')
  ouvrirSalle(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.classes.ouvrirSalle(a.id, id);
  }

  @Delete('classes/:id/salle')
  fermerSalle(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.classes.fermerSalle(a.id, id);
  }

  @Post('classes/:id/salle/entrer')
  async entrer(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.classes.entrerAcademie(a.id, id, await this.nomEcole(a.id));
  }

  /* -------------------------------------------------------- les réglages */

  @Get('reglages-suite')
  reglages(@CurrentAccount() a: RequestAccount) {
    return this.outils.reglages(a.id);
  }

  @Patch('reglages-suite')
  modifierReglages(@CurrentAccount() a: RequestAccount, @Body() dto: ReglagesEcoleDto) {
    return this.outils.modifierReglages(a.id, dto);
  }

  @Post('reglages-suite/domaine/verifier')
  verifierDomaine(@CurrentAccount() a: RequestAccount) {
    return this.outils.verifierDomaine(a.id);
  }

  @Get('cours/:id/reglage')
  reglageCours(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.outils.reglageCours(a.id, id);
  }

  @Patch('cours/:id/reglage')
  modifierReglageCours(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ReglageCoursDto) {
    return this.outils.modifierReglageCours(a.id, id, dto);
  }

  @Get('demarrage')
  demarrage(@CurrentAccount() a: RequestAccount) {
    return this.outils.demarrage(a.id);
  }

  /* ------------------------------------------------------- les clés d'API */

  @Get('cles-api')
  listerCles(@CurrentAccount() a: RequestAccount) {
    return this.outils.listerCles(a.id);
  }

  @Post('cles-api')
  creerCle(@CurrentAccount() a: RequestAccount, @Body() dto: CleApiDto) {
    return this.outils.creerCle(a.id, dto);
  }

  @Delete('cles-api/:id')
  revoquerCle(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.outils.revoquerCle(a.id, id);
  }

  private async nomEcole(accountId: string) {
    const e = await this.prisma.ecoleEnLigne.findUnique({ where: { accountId }, select: { nom: true } });
    if (e?.nom) return e.nom;
    const c = await this.prisma.account.findUnique({ where: { id: accountId }, select: { name: true } });
    return c?.name ?? "L'école";
  }
}

/** Sert un fichier rendu : toujours en pièce jointe, jamais affiché dans la page. */
export function envoyerFichier(res: Response, flux: NodeJS.ReadableStream, nom: string, type: string) {
  res.setHeader('Content-Type', type || 'application/octet-stream');
  res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(nom)}`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'private, no-store');
  flux.pipe(res);
}
