import {
  Body, Controller, Delete, Get, Param, Patch, Post, Res, UploadedFile,
  UseGuards, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MemberGuard } from '../common/guards/member.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { AssistantService } from './assistant.service';
import { TramesMaisonService } from './trames-maison.service';
import { ExportService } from './export.service';
import { ExtractionService } from './extraction.service';
import { CreditsService } from '../billing/credits.service';
import type { FichierRecu } from '../storage/files.service';
import { ActiviteDto, ChatDto, EnregistrerDocumentDto, ExporterDto, FeedbackDto, FicheDto, GenererDto, ImporterTrameDto, ModifierDocumentDto, ModifierTrameDto, GapisteDto } from './dto/assistant.dto';

/**
 * Assistant d'écriture professionnelle.
 * Toutes les routes exigent une session ET un compte actif : les documents
 * vivent dans le compte, cloisonnés par auteur.
 *
 * LEX est le produit payant de la plateforme : chaque GÉNÉRATION (écrit,
 * activité, fiche, tour de GAPiste) consomme UN crédit, débité par
 * `avecCredit` qui rembourse si la génération échoue. Le bot d'aide `chat`,
 * lui, reste gratuit : aider à se servir d'une plateforme gratuite ne se
 * facture pas. Les ADMIN de la plateforme ne consomment rien.
 */
@Controller('assistant')
@UseGuards(JwtAuthGuard, AccountGuard)
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly tramesMaison: TramesMaisonService,
    private readonly exports: ExportService,
    private readonly credits: CreditsService,
  ) {}

  /** Un crédit par génération — sauf ADMIN de la plateforme. */
  private payer<T>(user: RequestUser, account: RequestAccount, reason: string, fn: () => Promise<T>) {
    if (user.role === 'ADMIN') return fn();
    return this.credits.avecCredit(account.id, reason, fn);
  }

  @Get('trames')
  trames() {
    return this.assistant.trames();
  }

  /** Génération : plafonnée par utilisateur — le poste de coût est ici. */
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @UseGuards(MemberGuard)
  @Post('generer')
  async generer(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: GenererDto,
  ) {
    // Le contrôle d'accès à la trame se joue AVANT le débit : on ne facture
    // pas un crédit pour refuser ensuite.
    const trameMaison = await this.tramesMaison.pourGeneration(
      dto.trameMaisonId,
      account.id,
      user.id,
    );
    const resultat = await this.payer(user, account, 'LEX_ECRIT', () =>
      this.assistant.generer(dto.trame, dto.notes, trameMaison),
    );
    if (trameMaison) await this.tramesMaison.compterUsage(trameMaison.id);
    return resultat;
  }

  // ── Trames maison ────────────────────────────────────────────────────────

  /**
   * Apprendre une trame à partir d'un modèle déposé ou collé.
   *
   * GRATUIT, volontairement : c'est le geste qui décide si LEX sert à quelque
   * chose dans cette maison. Faire payer l'apprentissage reviendrait à faire
   * payer l'essai. Ce sont les générations qui suivent qui sont facturées.
   */
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @UseGuards(MemberGuard)
  @Post('trames-maison')
  @UseInterceptors(FileInterceptor('fichier', { limits: { fileSize: 10 * 1024 * 1024 } }))
  importerTrame(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: ImporterTrameDto,
    @UploadedFile() fichier?: FichierRecu,
  ) {
    return this.tramesMaison.importer(account.id, user.id, account.role, dto, fichier);
  }

  /** Les trames utilisables : les siennes + celles publiées par l'établissement. */
  @Get('trames-maison')
  listerTrames(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    return this.tramesMaison.lister(account.id, user.id);
  }

  @Patch('trames-maison/:id')
  modifierTrame(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: ModifierTrameDto,
  ) {
    return this.tramesMaison.modifier(id, account.id, user.id, account.role, dto);
  }

  @Delete('trames-maison/:id')
  supprimerTrame(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
  ) {
    return this.tramesMaison.supprimer(id, account.id, user.id, account.role, user.role);
  }

  /** Les formats de modèle acceptés à l'import — l'écran s'y adapte. */
  @Get('trames-maison/formats')
  formats() {
    return { types: ExtractionService.TYPES, tailleMaxMo: 10 };
  }

  // ── Export ───────────────────────────────────────────────────────────────

  /**
   * Rend l'écrit sous forme de fichier. Gratuit : le crédit a été consommé à
   * la génération, et faire payer la sortie d'un texte qu'on a déjà produit
   * serait de la rançon.
   *
   * Le contenu vient du navigateur, donc APRÈS la relecture de l'auteur : ce
   * qu'on met dans le fichier est exactement ce qu'il a validé, y compris ses
   * corrections. Rien n'est réenvoyé au moteur au passage.
   */
  @Throttle({ default: { limit: 60, ttl: 3_600_000 } })
  @Post('export')
  async exporter(@Body() dto: ExporterDto, @Res() res: Response) {
    const buffer =
      dto.format === 'docx'
        ? await this.exports.docx(dto.titre, dto.contenu)
        : await this.exports.pdf(dto.titre, dto.contenu);
    const nom = this.exports.nomFichier(dto.titre, dto.format);
    res.set({
      'Content-Type':
        dto.format === 'docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf',
      'Content-Disposition': `attachment; filename="${nom}"`,
      'Content-Length': String(buffer.length),
    });
    res.end(buffer);
  }

  /** Générateur d'activités éducatives & thérapeutiques. */
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @UseGuards(MemberGuard)
  @Post('activite')
  activite(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: ActiviteDto,
  ) {
    return this.payer(user, account, 'LEX_ACTIVITE', () =>
      this.assistant.genererActivite(dto),
    );
  }

  /**
   * Bot d'aide de l'espace connecté — GRATUIT et sans crédit : il aide à se
   * servir de la plateforme, il ne produit pas de livrable.
   */
  @Throttle({ default: { limit: 60, ttl: 3_600_000 } })
  @Post('chat')
  chat(@Body() dto: ChatDto) {
    return this.assistant.chat('dashboard', dto.message, dto.historique);
  }

  /**
   * LEX le GAPiste — animation du groupe d'analyse de pratique.
   *
   * Payant comme le reste de LEX (un crédit par tour de parole généré) :
   * le GAP entre pairs, lui, reste ouvert à tous les comptes.
   */
  @Throttle({ default: { limit: 40, ttl: 3_600_000 } })
  @UseGuards(MemberGuard)
  @Post('gapiste')
  gapiste(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: GapisteDto,
  ) {
    return this.payer(user, account, 'LEX_GAPISTE', () =>
      this.assistant.gapiste(dto.message, dto.historique, dto.contexte),
    );
  }

  /** Pré-remplissage d'une fiche atelier/formation depuis un brief. */
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @UseGuards(MemberGuard)
  @Post('fiche')
  fiche(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: FicheDto,
  ) {
    return this.payer(user, account, 'LEX_FICHE', () =>
      this.assistant.remplirFiche(dto.type, dto.brief),
    );
  }

  @Post('documents')
  enregistrer(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: EnregistrerDocumentDto,
  ) {
    return this.assistant.enregistrer(account.id, user.id, dto);
  }

  @Get('documents')
  lister(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    return this.assistant.lister(account.id, user.id);
  }

  @Get('documents/:id')
  lire(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assistant.lire(id, account.id, user.id);
  }

  @Patch('documents/:id')
  modifier(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: ModifierDocumentDto,
  ) {
    return this.assistant.modifier(id, account.id, user.id, dto);
  }

  @Delete('documents/:id')
  supprimer(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assistant.supprimer(id, account.id, user.id);
  }

  @Post('feedback')
  feedback(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: FeedbackDto,
  ) {
    return this.assistant.feedback(account.id, user.id, dto);
  }
}
