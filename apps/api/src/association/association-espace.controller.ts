import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import type { FichierRecu } from '../storage/files.service';
import { TAILLE_MAX_GLOBALE } from '../storage/file-rules';
import { EspaceService } from './espace.service';
import { IaFinanceursDto, IaDossierDto } from './dto/espace.dto';
import {
  ActionDto,
  ContactDto,
  MouvementDto,
  ModifierMouvementDto,
  DocumentDto,
  DossierDto,
  EtapeFaiteDto,
  FabriqueDto,
  ModifierActionDto,
  ModifierContactDto,
  ModifierDossierDto,
  ModifierOrganisationDto,
  ModifierPieceDto,
  ProjetDto,
  RattacherOrganisationDto,
  VieStatutaireDto,
} from './dto/espace.dto';

/**
 * L'ESPACE CONNECTÉ D'UNE ASSOCIATION.
 *
 * Réservé aux comptes de type ASSOCIATION : le service refuse les autres.
 * Aucune notion de crédits ici (pas de MemberGuard) : l'espace est gratuit
 * au premier lot.
 */
@Controller('association')
@UseGuards(JwtAuthGuard, AccountGuard)
export class AssociationEspaceController {
  constructor(private readonly espace: EspaceService) {}

  @Get('espace')
  espaceComplet(@CurrentAccount() account: RequestAccount) {
    return this.espace.espace(account.id);
  }

  @Post('organisation/rattacher')
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  rattacher(@CurrentAccount() account: RequestAccount, @Body() dto: RattacherOrganisationDto) {
    return this.espace.rattacher(account.id, dto.siren);
  }

  @Patch('organisation')
  modifierOrganisation(@CurrentAccount() account: RequestAccount, @Body() dto: ModifierOrganisationDto) {
    return this.espace.modifierOrganisation(account.id, dto);
  }

  @Post('classeur/:type')
  @Throttle({ default: { limit: 60, ttl: 3_600_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: TAILLE_MAX_GLOBALE, files: 1 } }))
  deposerPiece(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('type') type: string,
    @UploadedFile() fichier: FichierRecu | undefined,
    @Body() dto: ModifierPieceDto,
  ) {
    if (!fichier) throw new BadRequestException('Aucun fichier reçu.');
    return this.espace.deposerPiece(account.id, user.id, type.toUpperCase(), fichier, this.nettoyer(dto));
  }

  @Patch('classeur/:type')
  modifierPiece(@CurrentAccount() account: RequestAccount, @Param('type') type: string, @Body() dto: ModifierPieceDto) {
    return this.espace.modifierPiece(account.id, type.toUpperCase(), this.nettoyer(dto));
  }

  @Delete('classeur/:type/fichier')
  retirerFichier(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('type') type: string,
  ) {
    return this.espace.retirerFichier(account.id, user.id, user.role, type.toUpperCase());
  }

  @Post('chemin/:slug')
  marquerEtape(@CurrentAccount() account: RequestAccount, @Param('slug') slug: string, @Body() dto: EtapeFaiteDto) {
    return this.espace.marquerEtape(account.id, slug, dto.faite);
  }

  @Post('dossiers')
  creerDossier(@CurrentAccount() account: RequestAccount, @Body() dto: DossierDto) {
    return this.espace.creerDossier(account.id, dto);
  }

  @Get('dossiers/:id')
  dossier(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.espace.dossier(account.id, id);
  }

  @Patch('dossiers/:id')
  modifierDossier(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: ModifierDossierDto) {
    return this.espace.modifierDossier(account.id, id, dto);
  }

  @Delete('dossiers/:id')
  supprimerDossier(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.espace.supprimerDossier(account.id, id);
  }

  // ------------------------------------------------ projet, vie statutaire

  @Patch('projet')
  modifierProjet(@CurrentAccount() account: RequestAccount, @Body() dto: ProjetDto) {
    return this.espace.modifierProjet(account.id, dto);
  }

  @Patch('vie-statutaire')
  modifierVieStatutaire(@CurrentAccount() account: RequestAccount, @Body() dto: VieStatutaireDto) {
    return this.espace.modifierVieStatutaire(account.id, dto);
  }

  // ------------------------------------------------------------ répertoire

  @Get('repertoire')
  contacts(@CurrentAccount() account: RequestAccount) {
    return this.espace.contacts(account.id);
  }

  @Post('repertoire')
  creerContact(@CurrentAccount() account: RequestAccount, @Body() dto: ContactDto) {
    return this.espace.creerContact(account.id, dto);
  }

  @Patch('repertoire/:id')
  modifierContact(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: ModifierContactDto) {
    return this.espace.modifierContact(account.id, id, dto);
  }

  @Delete('repertoire/:id')
  supprimerContact(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.espace.supprimerContact(account.id, id);
  }

  // --------------------------------------------------------------- actions

  @Get('actions')
  actions(@CurrentAccount() account: RequestAccount) {
    return this.espace.actions(account.id);
  }

  @Post('actions')
  creerAction(@CurrentAccount() account: RequestAccount, @Body() dto: ActionDto) {
    return this.espace.creerAction(account.id, dto);
  }

  @Patch('actions/:id')
  modifierAction(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: ModifierActionDto) {
    return this.espace.modifierAction(account.id, id, dto);
  }

  @Delete('actions/:id')
  supprimerAction(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.espace.supprimerAction(account.id, id);
  }

  // --------------------------------------------------------------- l'IA

  /** Des pistes de financeurs et de mécènes, à partir du projet de l'association. */
  @Post('ia/financeurs')
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  financeurs(@CurrentAccount() account: RequestAccount, @Body() dto: IaFinanceursDto) {
    return this.espace.chercherFinanceurs(account.id, dto.precision);
  }

  /** Les textes d'une demande, rédigés à partir de ce qui est déjà noté. */
  @Post('ia/dossier/:id')
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  redigerDossier(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: IaDossierDto) {
    return this.espace.redigerDossier(account.id, id, dto.precision);
  }

  // ------------------------------------------------------ gestion budgétaire

  @Get('mouvements')
  mouvements(@CurrentAccount() account: RequestAccount) {
    return this.espace.mouvements(account.id);
  }

  @Post('mouvements')
  creerMouvement(@CurrentAccount() account: RequestAccount, @Body() dto: MouvementDto) {
    return this.espace.creerMouvement(account.id, dto);
  }

  @Patch('mouvements/:id')
  modifierMouvement(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: ModifierMouvementDto) {
    return this.espace.modifierMouvement(account.id, id, dto);
  }

  @Delete('mouvements/:id')
  supprimerMouvement(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.espace.supprimerMouvement(account.id, id);
  }

  // ------------------------------------------------------------- documents

  /** Fabriquer un document ET le ranger : au classeur si c'est une pièce, sinon dans mes documents. */
  @Post('fabrique/:code')
  @Throttle({ default: { limit: 60, ttl: 3_600_000 } })
  fabriquer(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('code') code: string,
    @Body() dto: FabriqueDto,
  ) {
    return this.espace.fabriquer(account.id, user.id, code, dto.valeurs ?? {});
  }

  @Get('documents')
  documents(@CurrentAccount() account: RequestAccount) {
    return this.espace.documents(account.id);
  }

  @Post('documents')
  @Throttle({ default: { limit: 60, ttl: 3_600_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: TAILLE_MAX_GLOBALE, files: 1 } }))
  deposerDocument(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @UploadedFile() fichier: FichierRecu | undefined,
    @Body() dto: DocumentDto,
  ) {
    if (!fichier) throw new BadRequestException('Aucun fichier reçu.');
    const propre: DocumentDto = { titre: dto.titre };
    if (dto.categorie) propre.categorie = dto.categorie;
    if (dto.note) propre.note = dto.note;
    return this.espace.deposerDocument(account.id, user.id, fichier, propre);
  }

  @Delete('documents/:id')
  supprimerDocument(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.espace.supprimerDocument(account.id, user.id, user.role, id);
  }

  /** Les champs d'un formulaire multipart arrivent en chaînes : vide = absent. */
  private nettoyer(dto: ModifierPieceDto): ModifierPieceDto {
    const propre: ModifierPieceDto = {};
    if (dto.dateEmission) propre.dateEmission = dto.dateEmission;
    if (dto.dateExpiration) propre.dateExpiration = dto.dateExpiration;
    if (dto.exercice !== undefined && dto.exercice !== null && String(dto.exercice) !== '') propre.exercice = Number(dto.exercice);
    if (dto.note !== undefined && dto.note !== null) propre.note = dto.note;
    return propre;
  }
}
