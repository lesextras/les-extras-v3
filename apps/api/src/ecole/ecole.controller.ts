import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import type { RequestAccount } from '../common/types/request-context';
import { EcoleService } from './ecole.service';
import {
  AffilieDto,
  AjouterContenuDto,
  ChapitreDto,
  ClasseDto,
  CodePromoDto,
  CommentaireDto,
  CreerCoursDto,
  DeplacerLeconDto,
  EcoleDto,
  InscrireDto,
  LeconDto,
  ModifierCoursDto,
  PackDto,
  ReordonnerDto,
  VenteDto,
  LeconIaDto,
  StructureIaDto,
  TitreIaDto,
} from './dto/ecole.dto';

/**
 * L'ÉCOLE EN LIGNE DU COMPTE.
 *
 * Un seul contrôleur pour tout ce qui se pilote depuis l'espace : le
 * catalogue, les chapitres et les leçons, les apprenants, les ventes, les
 * codes promo, les packs, les classes virtuelles, la vitrine et l'affiliation.
 * Le garde de compte fait le tri : on ne voit jamais l'école d'un autre.
 */
@Controller('ecole')
@UseGuards(JwtAuthGuard, AccountGuard)
export class EcoleController {
  constructor(private readonly ecole: EcoleService) {}

  /* ------------------------------------------------------------- le cours */

  @Get('cours')
  listerCours(@CurrentAccount() a: RequestAccount) {
    return this.ecole.listerCours(a.id);
  }

  @Post('cours')
  creerCours(@CurrentAccount() a: RequestAccount, @Body() dto: CreerCoursDto) {
    return this.ecole.creerCours(a.id, dto);
  }

  @Get('cours/:id')
  lireCours(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.ecole.lireCours(a.id, id);
  }

  @Patch('cours/:id')
  modifierCours(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ModifierCoursDto) {
    return this.ecole.modifierCours(a.id, id, dto);
  }

  @Delete('cours/:id')
  supprimerCours(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.ecole.supprimerCours(a.id, id);
  }

  @Post('cours/:id/dupliquer')
  dupliquerCours(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.ecole.dupliquerCours(a.id, id);
  }

  /** Écrit la fiche programme (au sens Qualiopi) de cette formation, à partir de ce qu'on sait déjà. */
  @Post('cours/:id/programme')
  creerProgramme(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.ecole.creerProgramme(a.id, id);
  }

  /* ---------------------------------------------------------- le contenu -- */

  /** Ajouter un chapitre, une leçon, un quiz, un devoir, une classe en direct. */
  @Post('cours/:id/contenu')
  ajouterContenu(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: AjouterContenuDto) {
    return this.ecole.ajouterContenu(a.id, id, dto);
  }

  /** Ranger le premier niveau : identifiants préfixés « chapitre: » ou « lecon: ». */
  @Post('cours/:id/contenu/ordre')
  reordonnerContenu(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ReordonnerDto) {
    return this.ecole.reordonnerContenu(a.id, id, dto);
  }

  @Post('cours/:id/lecons/:leconId/dupliquer')
  dupliquerLecon(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Param('leconId') leconId: string) {
    return this.ecole.dupliquerLecon(a.id, id, leconId);
  }

  @Post('cours/:id/chapitres/:chapitreId/dupliquer')
  dupliquerChapitre(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Param('chapitreId') chapitreId: string,
  ) {
    return this.ecole.dupliquerChapitre(a.id, id, chapitreId);
  }

  /* --------------------------------------------------------- les chapitres */

  @Post('cours/:id/chapitres')
  creerChapitre(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ChapitreDto) {
    return this.ecole.creerChapitre(a.id, id, dto);
  }

  @Patch('cours/:id/chapitres/:chapitreId')
  modifierChapitre(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Param('chapitreId') chapitreId: string,
    @Body() dto: ChapitreDto,
  ) {
    return this.ecole.modifierChapitre(a.id, id, chapitreId, dto);
  }

  @Delete('cours/:id/chapitres/:chapitreId')
  supprimerChapitre(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Param('chapitreId') chapitreId: string,
  ) {
    return this.ecole.supprimerChapitre(a.id, id, chapitreId);
  }

  @Post('cours/:id/chapitres/ordre')
  reordonnerChapitres(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ReordonnerDto) {
    return this.ecole.reordonnerChapitres(a.id, id, dto);
  }

  /* ------------------------------------------------------------ les leçons */

  @Post('cours/:id/chapitres/:chapitreId/lecons')
  creerLecon(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Param('chapitreId') chapitreId: string,
    @Body() dto: LeconDto,
  ) {
    return this.ecole.creerLecon(a.id, id, chapitreId, dto);
  }

  @Post('cours/:id/chapitres/:chapitreId/lecons/ordre')
  reordonnerLecons(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Param('chapitreId') chapitreId: string,
    @Body() dto: ReordonnerDto,
  ) {
    return this.ecole.reordonnerLecons(a.id, id, chapitreId, dto);
  }

  @Patch('cours/:id/lecons/:leconId')
  modifierLecon(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Param('leconId') leconId: string,
    @Body() dto: LeconDto,
  ) {
    return this.ecole.modifierLecon(a.id, id, leconId, dto);
  }

  @Delete('cours/:id/lecons/:leconId')
  supprimerLecon(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Param('leconId') leconId: string) {
    return this.ecole.supprimerLecon(a.id, id, leconId);
  }

  @Post('cours/:id/lecons/:leconId/deplacer')
  deplacerLecon(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Param('leconId') leconId: string,
    @Body() dto: DeplacerLeconDto,
  ) {
    return this.ecole.deplacerLecon(a.id, id, leconId, dto);
  }

  /* -------------------------------------------------------- les apprenants */

  @Get('apprenants')
  apprenants(@CurrentAccount() a: RequestAccount, @Query('cours') cours?: string) {
    return this.ecole.apprenants(a.id, cours);
  }

  @Post('cours/:id/apprenants')
  inscrire(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: InscrireDto) {
    return this.ecole.inscrireApprenant(a.id, id, dto);
  }

  @Post('apprenants/:inscriptionId/bloquer')
  bloquer(
    @CurrentAccount() a: RequestAccount,
    @Param('inscriptionId') inscriptionId: string,
    @Body() dto: { bloquer?: boolean },
  ) {
    return this.ecole.bloquerApprenant(a.id, inscriptionId, dto?.bloquer !== false);
  }

  @Delete('apprenants/:inscriptionId')
  retirer(@CurrentAccount() a: RequestAccount, @Param('inscriptionId') inscriptionId: string) {
    return this.ecole.retirerApprenant(a.id, inscriptionId);
  }

  /* ------------------------------------------------------------- les packs */

  @Get('packs')
  packs(@CurrentAccount() a: RequestAccount) {
    return this.ecole.listerPacks(a.id);
  }

  @Post('packs')
  creerPack(@CurrentAccount() a: RequestAccount, @Body() dto: PackDto) {
    return this.ecole.creerPack(a.id, dto);
  }

  @Patch('packs/:id')
  modifierPack(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: PackDto) {
    return this.ecole.modifierPack(a.id, id, dto);
  }

  @Delete('packs/:id')
  supprimerPack(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.ecole.supprimerPack(a.id, id);
  }

  /* -------------------------------------------------------- les codes promo */

  @Get('codes-promo')
  codes(@CurrentAccount() a: RequestAccount) {
    return this.ecole.listerCodes(a.id);
  }

  @Post('codes-promo')
  creerCode(@CurrentAccount() a: RequestAccount, @Body() dto: CodePromoDto) {
    return this.ecole.creerCode(a.id, dto);
  }

  @Patch('codes-promo/:id')
  modifierCode(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: CodePromoDto) {
    return this.ecole.modifierCode(a.id, id, dto);
  }

  @Delete('codes-promo/:id')
  supprimerCode(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.ecole.supprimerCode(a.id, id);
  }

  /* ------------------------------------------------------------ les ventes */

  @Get('ventes')
  ventes(@CurrentAccount() a: RequestAccount) {
    return this.ecole.listerVentes(a.id);
  }

  @Post('ventes')
  creerVente(@CurrentAccount() a: RequestAccount, @Body() dto: VenteDto) {
    return this.ecole.enregistrerVente(a.id, dto);
  }

  @Patch('ventes/:id')
  modifierVente(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: VenteDto) {
    return this.ecole.modifierVente(a.id, id, dto);
  }

  @Delete('ventes/:id')
  supprimerVente(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.ecole.supprimerVente(a.id, id);
  }

  /* ------------------------------------------------- les classes virtuelles */

  @Get('classes')
  classes(@CurrentAccount() a: RequestAccount) {
    return this.ecole.listerClasses(a.id);
  }

  @Post('classes')
  creerClasse(@CurrentAccount() a: RequestAccount, @Body() dto: ClasseDto) {
    return this.ecole.creerClasse(a.id, dto);
  }

  @Patch('classes/:id')
  modifierClasse(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ClasseDto) {
    return this.ecole.modifierClasse(a.id, id, dto);
  }

  @Delete('classes/:id')
  supprimerClasse(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.ecole.supprimerClasse(a.id, id);
  }

  /* --------------------------------------------------------- la vitrine */

  @Get('vitrine')
  vitrine(@CurrentAccount() a: RequestAccount) {
    return this.ecole.lireEcole(a.id);
  }

  @Patch('vitrine')
  modifierVitrine(@CurrentAccount() a: RequestAccount, @Body() dto: EcoleDto) {
    return this.ecole.modifierEcole(a.id, dto);
  }

  /* -------------------------------------------------------- l'affiliation */

  @Get('affilies')
  affilies(@CurrentAccount() a: RequestAccount) {
    return this.ecole.listerAffilies(a.id);
  }

  @Post('affilies')
  creerAffilie(@CurrentAccount() a: RequestAccount, @Body() dto: AffilieDto) {
    return this.ecole.creerAffilie(a.id, dto);
  }

  @Patch('affilies/:id')
  modifierAffilie(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: AffilieDto) {
    return this.ecole.modifierAffilie(a.id, id, dto);
  }

  @Delete('affilies/:id')
  supprimerAffilie(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.ecole.supprimerAffilie(a.id, id);
  }

  /* ------------------------------------------------------ les commentaires */

  @Get('commentaires')
  commentaires(@CurrentAccount() a: RequestAccount, @Query('cours') cours?: string) {
    return this.ecole.commentaires(a.id, cours);
  }

  @Patch('commentaires/:id')
  modifierCommentaire(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: CommentaireDto) {
    return this.ecole.modifierCommentaire(a.id, id, dto);
  }

  @Delete('commentaires/:id')
  supprimerCommentaire(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.ecole.supprimerCommentaire(a.id, id);
  }

  /* ------------------------------------------------------ les statistiques */

  @Get('statistiques')
  statistiques(@CurrentAccount() a: RequestAccount) {
    return this.ecole.statistiques(a.id);
  }

  /* --------------------------------------------------- l'aide à l'écriture */

  /** Une proposition de plan. Rien n'est écrit tant qu'on ne la pose pas. */
  @Post('cours/:id/ia/structure')
  proposerStructure(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: StructureIaDto) {
    return this.ecole.proposerStructure(a.id, id, dto);
  }

  /** Poser un plan proposé : les chapitres et leçons s'ajoutent à la suite. */
  @Post('cours/:id/ia/structure/poser')
  poserStructure(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Body() body: { chapitres: { titre: string; lecons: { titre: string; resume?: string }[] }[] },
  ) {
    return this.ecole.poserStructure(a.id, id, body);
  }

  /** Des blocs proposés pour une leçon. */
  @Post('cours/:id/lecons/:leconId/ia')
  proposerLecon(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Param('leconId') leconId: string,
    @Body() dto: LeconIaDto,
  ) {
    return this.ecole.proposerLecon(a.id, id, leconId, dto);
  }

  /** Un titre et une description, à partir d'un sujet en une ligne. */
  @Post('ia/titre')
  proposerTitre(@Body() dto: TitreIaDto) {
    return this.ecole.proposerTitre(dto);
  }
}
