import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import type { FichierRecu } from '../storage/files.service';
import { TAILLE_MAX_GLOBALE } from '../storage/file-rules';
import { BillingService } from '../billing/billing.service';
import { FacturesService } from './factures.service';
import { EnveloppesService } from './enveloppes.service';
import { FournisseursService } from './fournisseurs.service';
import { RelevesService } from './releves.service';
import { FraisService } from './frais.service';
import { BilanService } from './bilan.service';
import { DevisService } from './devis.service';
import { TresorerieService } from './tresorerie.service';
import { SessionsService } from './sessions.service';
import { IngestionService } from './ingestion.service';
import {
  AbonnerDto,
  DeposerDevisDto,
  DeposerFactureDto,
  ModifierDevisDto,
  SaisirDevisDto,
  EnveloppeDto,
  ModifierEnveloppeDto,
  ModifierFactureDto,
  ModifierOperationDto,
  NoteDeFraisDto,
  ReglagesDto,
  SaisirFactureDto,
  StatutNoteDto,
} from './dto/factures.dto';

/**
 * MES FACTURES : réservé aux deux espaces de Pilote (ASSOCIATION, ACADEMIE).
 * Tout ce qui lit ou écrit une facture exige un abonnement actif (le service
 * le vérifie) ; seuls l'état de l'abonnement et le bouton d'abonnement sont
 * ouverts à un compte sans abonnement.
 */
@Controller('factures')
@UseGuards(JwtAuthGuard, AccountGuard)
export class FacturesController {
  constructor(
    private readonly factures: FacturesService,
    private readonly billing: BillingService,
    private readonly config: ConfigService,
    private readonly enveloppes: EnveloppesService,
    private readonly fournisseurs: FournisseursService,
    private readonly releves: RelevesService,
    private readonly frais: FraisService,
    private readonly bilan: BilanService,
    private readonly devis: DevisService,
    private readonly tresorerie: TresorerieService,
    private readonly sessions: SessionsService,
    private readonly ingestion: IngestionService,
  ) {}

  /** Tout ce qui suit l'abonnement : le service refuse sans abonnement actif, on le vérifie ici une fois. */
  private async actif(account: RequestAccount) {
    this.pilote(account);
    const a = await this.factures.abonnement(account.id);
    if (!a.actif) throw new ForbiddenException("« Mes factures » est un outil premium : il s'ouvre avec l'abonnement.");
  }

  private annee(q?: string) {
    const a = q ? Number.parseInt(q, 10) : NaN;
    return Number.isFinite(a) && a > 2000 && a < 2100 ? a : new Date().getFullYear();
  }

  private pilote(account: RequestAccount) {
    if (account.type !== 'ASSOCIATION' && account.type !== 'ACADEMIE') {
      throw new ForbiddenException('« Mes factures » est un outil des espaces Pilote.');
    }
  }

  @Get()
  async liste(@CurrentAccount() account: RequestAccount) {
    this.pilote(account);
    const abonnement = await this.factures.abonnement(account.id);
    if (!abonnement.actif) return { abonnement, factures: [], resume: null, postes: [] };
    return this.factures.liste(account.id);
  }

  @Get('abonnement')
  abonnement(@CurrentAccount() account: RequestAccount) {
    this.pilote(account);
    return this.factures.abonnement(account.id);
  }

  @Post('abonnement')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  abonner(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Body() dto: AbonnerDto) {
    this.pilote(account);
    const base = (this.config.get<string>('PILOTE_WEB_URL') ?? 'https://pilote.toulali.fr').replace(/\/$/, '');
    const page = dto.espace === 'academie' ? `${base}/academie/factures` : `${base}/association/espace/factures`;
    return this.billing.createFacturesCheckout(user.id, account.id, {
      succes: `${page}?abonnement=succes`,
      annule: `${page}?abonnement=annule`,
    });
  }

  @Post()
  @Throttle({ default: { limit: 120, ttl: 3_600_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: TAILLE_MAX_GLOBALE, files: 1 } }))
  deposer(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @UploadedFile() fichier: FichierRecu | undefined,
    @Body() dto: DeposerFactureDto,
  ) {
    this.pilote(account);
    if (!fichier) throw new BadRequestException('Aucun fichier reçu.');
    return this.factures.deposer(account.id, user.id, fichier, dto.poste || undefined, dto.enveloppeId || null);
  }

  @Post('saisie')
  saisir(@CurrentAccount() account: RequestAccount, @Body() dto: SaisirFactureDto) {
    this.pilote(account);
    return this.factures.saisir(account.id, dto);
  }

  // ⚠ Les routes génériques d'une facture (`PATCH :id`, `DELETE :id`) sont
  // déclarées EN FIN de classe : Nest enregistre les routes dans l'ordre de
  // déclaration, et `PATCH :id` posé ici avalait `PATCH reglages` (vérifié en
  // production le 28/09/2026 : le réglage du seuil répondait « formulaire
  // obsolète », parce que le corps était validé contre ModifierFactureDto).

  // ─── Enveloppes (subventions, projets, sessions) ─────────────────────────

  @Get('enveloppes')
  async enveloppesListe(@CurrentAccount() account: RequestAccount) {
    await this.actif(account);
    return this.enveloppes.liste(account.id);
  }

  @Post('enveloppes')
  async enveloppeCreer(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Body() dto: EnveloppeDto) {
    await this.actif(account);
    const e = await this.enveloppes.creer(account.id, dto);
    await this.frais.journaliser(account.id, user.id, 'enveloppe.creee', e.id, { nom: e.nom });
    return e;
  }

  @Post('enveloppes/importer')
  async enveloppesImporter(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    await this.actif(account);
    const r = await this.enveloppes.importer(account.id);
    await this.frais.journaliser(account.id, user.id, 'enveloppes.importees', undefined, r);
    return r;
  }

  @Patch('enveloppes/:id')
  async enveloppeModifier(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: ModifierEnveloppeDto) {
    await this.actif(account);
    return this.enveloppes.modifier(account.id, id, dto);
  }

  @Delete('enveloppes/:id')
  async enveloppeSupprimer(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.actif(account);
    await this.frais.journaliser(account.id, user.id, 'enveloppe.supprimee', id);
    return this.enveloppes.supprimer(account.id, id);
  }

  @Get('enveloppes/:id/compte-rendu.xlsx')
  async compteRendu(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Res() res: Response) {
    await this.actif(account);
    const { nom, fichier } = await this.enveloppes.compteRendu(account.id, id);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nom}"`);
    res.send(fichier);
  }

  // ─── Fournisseurs ─────────────────────────────────────────────────────────

  @Get('fournisseurs')
  async fournisseursListe(@CurrentAccount() account: RequestAccount) {
    await this.actif(account);
    return { fiches: await this.fournisseurs.liste(account.id), comparatif: await this.fournisseurs.comparatif(account.id) };
  }

  // ─── Relevés de compte ────────────────────────────────────────────────────

  @Get('releves')
  async relevesListe(@CurrentAccount() account: RequestAccount, @Query('annee') annee?: string) {
    await this.actif(account);
    return this.releves.liste(account.id, this.annee(annee));
  }

  @Post('releves')
  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: TAILLE_MAX_GLOBALE, files: 1 } }))
  async releveDeposer(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @UploadedFile() fichier: FichierRecu | undefined) {
    await this.actif(account);
    if (!fichier) throw new BadRequestException('Aucun fichier reçu.');
    const r = await this.releves.deposer(account.id, user.id, fichier);
    await this.frais.journaliser(account.id, user.id, 'releve.depose', r.releveId, { operations: r.operations, rapprochees: r.rapprochees });
    return r;
  }

  @Patch('releves/operations/:id')
  async operationModifier(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: ModifierOperationDto) {
    await this.actif(account);
    return this.releves.modifierOperation(account.id, id, dto);
  }

  @Delete('releves/:id')
  async releveSupprimer(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.actif(account);
    await this.frais.journaliser(account.id, user.id, 'releve.supprime', id);
    return this.releves.supprimerReleve(account.id, user.id, user.role, id);
  }

  @Get('budget')
  async budget(@CurrentAccount() account: RequestAccount, @Query('annee') annee?: string) {
    await this.actif(account);
    return this.releves.budgetRealise(account.id, this.annee(annee));
  }

  // ─── Notes de frais ───────────────────────────────────────────────────────

  @Get('frais')
  async fraisListe(@CurrentAccount() account: RequestAccount, @Query('annee') annee?: string) {
    await this.actif(account);
    return this.frais.liste(account.id, this.annee(annee));
  }

  @Post('frais')
  @Throttle({ default: { limit: 120, ttl: 3_600_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: TAILLE_MAX_GLOBALE, files: 1 } }))
  async fraisCreer(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @UploadedFile() fichier: FichierRecu | undefined, @Body() dto: NoteDeFraisDto) {
    await this.actif(account);
    return this.frais.creer(account.id, user.id, dto, fichier);
  }

  @Patch('frais/:id/statut')
  async fraisStatut(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: StatutNoteDto) {
    await this.actif(account);
    return this.frais.changerStatut(account.id, user.id, id, dto.statut);
  }

  @Delete('frais/:id')
  async fraisSupprimer(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.actif(account);
    return this.frais.supprimer(account.id, user.id, user.role, id);
  }

  // ─── Devis fournisseurs ───────────────────────────────────────────────────

  @Get('devis')
  async devisListe(@CurrentAccount() account: RequestAccount) {
    await this.actif(account);
    return this.devis.liste(account.id);
  }

  @Post('devis')
  @Throttle({ default: { limit: 120, ttl: 3_600_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: TAILLE_MAX_GLOBALE, files: 1 } }))
  async devisDeposer(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @UploadedFile() fichier: FichierRecu | undefined, @Body() dto: DeposerDevisDto) {
    await this.actif(account);
    if (!fichier) throw new BadRequestException('Aucun fichier reçu.');
    return this.devis.deposer(account.id, user.id, fichier, dto.poste || undefined);
  }

  @Post('devis/saisie')
  async devisSaisir(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Body() dto: SaisirDevisDto) {
    await this.actif(account);
    return this.devis.saisir(account.id, user.id, dto);
  }

  @Patch('devis/:id')
  async devisModifier(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ModifierDevisDto) {
    await this.actif(account);
    return this.devis.modifier(account.id, user.id, id, dto);
  }

  @Delete('devis/:id')
  async devisSupprimer(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.actif(account);
    return this.devis.supprimer(account.id, user.id, user.role, id);
  }

  // ─── Trésorerie prévisionnelle, coût par session ──────────────────────────

  @Get('tresorerie')
  async tresoreriePrevision(@CurrentAccount() account: RequestAccount) {
    await this.actif(account);
    return this.tresorerie.prevision(account.id);
  }

  @Get('sessions')
  async coutParSession(@CurrentAccount() account: RequestAccount, @Query('annee') annee?: string) {
    await this.actif(account);
    return this.sessions.coutParSession(account.id, this.annee(annee));
  }

  // ─── Dépôt par e-mail ─────────────────────────────────────────────────────

  @Get('depot')
  async depot(@CurrentAccount() account: RequestAccount) {
    await this.actif(account);
    return this.ingestion.depot(account.id);
  }

  @Post('depot/activer')
  async depotActiver(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Query('renouveler') renouveler?: string) {
    await this.actif(account);
    return this.ingestion.activer(account.id, user.id, renouveler === '1');
  }

  @Post('depot/desactiver')
  async depotDesactiver(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    await this.actif(account);
    return this.ingestion.desactiver(account.id, user.id);
  }

  // ─── Journal, réglages, bilan ─────────────────────────────────────────────

  @Get('journal')
  async journal(@CurrentAccount() account: RequestAccount) {
    await this.actif(account);
    return this.frais.journal(account.id);
  }

  @Get('reglages')
  async reglages(@CurrentAccount() account: RequestAccount) {
    await this.actif(account);
    return this.frais.reglages(account.id);
  }

  @Patch('reglages')
  async regler(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Body() dto: ReglagesDto) {
    await this.actif(account);
    return this.frais.regler(account.id, user.id, dto);
  }

  @Get('bilan')
  async bilanResume(@CurrentAccount() account: RequestAccount, @Query('annee') annee?: string) {
    await this.actif(account);
    return this.bilan.resume(account.id, this.annee(annee));
  }

  @Get('bilan.xlsx')
  async bilanXlsx(@CurrentAccount() account: RequestAccount, @Query('annee') annee: string | undefined, @Res() res: Response) {
    await this.actif(account);
    const { nom, fichier } = await this.bilan.classeur(account.id, this.annee(annee));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nom}"`);
    res.send(fichier);
  }

  @Get('export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="mes-factures.csv"')
  export(@CurrentAccount() account: RequestAccount, @Query('annee') annee?: string) {
    this.pilote(account);
    const a = annee ? Number.parseInt(annee, 10) : undefined;
    return this.factures.exportCsv(account.id, Number.isFinite(a) ? a : undefined);
  }

  // ─── Une facture : routes génériques, EN DERNIER (voir la note plus haut) ─

  @Patch(':id')
  modifier(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: ModifierFactureDto) {
    this.pilote(account);
    return this.factures.modifier(account.id, id, dto, user.id);
  }

  /** Validation à deux : une personne valide ; au-dessus du seuil, il en faut une seconde. */
  @Post(':id/valider')
  async valider(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string) {
    await this.actif(account);
    return this.frais.valider(account.id, user.id, id);
  }

  @Delete(':id')
  supprimer(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string) {
    this.pilote(account);
    return this.factures.supprimer(account.id, user.id, user.role, id);
  }
}
