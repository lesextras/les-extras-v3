import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { TypeDocumentSession } from '@prisma/client';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AccountGuard } from '../../common/guards/account.guard';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import type { RequestAccount } from '../../common/types/request-context';
import { SessionsAdminService } from './sessions-admin.service';
import { EmargementService } from './emargement.service';
import { DocumentsSessionService } from './documents-session.service';
import { FacturationOrganismeService } from './facturation-organisme.service';
import { QualiteSessionService } from './qualite-session.service';
import { BpfService } from './bpf.service';
import { EdofService } from './edof';
import {
  AvoirDto,
  CreneauDto,
  EnvoiDocumentDto,
  ModifierCreneauDto,
  FactureDto,
  FacturerSessionDto,
  FormateurDto,
  ModifierFactureOrgDto,
  ModifierFormateurDto,
  ModifierSalleDto,
  ModifierSessionAdminDto,
  ModifierStagiaireDto,
  OuvrirSeanceDto,
  PaiementFactureDto,
  PresenceDto,
  ProgrammeBpfDto,
  ReglagesAdministrationDto,
  SaisiesBpfDto,
  SalleDto,
  SerieCreneauxDto,
  SignatureFormateurDto,
  StagiaireDto,
} from './dto/gestion.dto';

const annee = (a?: string) => {
  const n = Number(a);
  return Number.isInteger(n) && n > 2000 && n < 2100 ? n : new Date().getFullYear();
};

function ip(req: Request): string | null {
  const entete = (req.headers['x-forwarded-for'] as string | undefined) ?? '';
  return entete.split(',')[0]?.trim() || req.ip || null;
}

function envoyerFichier(res: Response, f: { contenu: Buffer; nom: string }, type: string) {
  res.setHeader('Content-Type', type);
  res.setHeader('Content-Disposition', `attachment; filename="${f.nom}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.end(f.contenu);
}

/**
 * L'ADMINISTRATION DES SESSIONS D'UNE ACADÉMIE (pilote.toulali.fr/academie).
 *
 * Tout passe par `ContexteGestion` : une session n'est lisible que par
 * l'académie qui porte son programme. ⚠ Les routes nommées d'une même famille
 * (« factures/journal.csv ») sont déclarées AVANT les routes à paramètre
 * (« factures/:id ») : Nest les enregistre dans l'ordre.
 */
@Controller('academie/gestion')
@UseGuards(JwtAuthGuard, AccountGuard)
export class GestionController {
  constructor(
    private readonly sessions: SessionsAdminService,
    private readonly emargement: EmargementService,
    private readonly documents: DocumentsSessionService,
    private readonly facturation: FacturationOrganismeService,
    private readonly qualite: QualiteSessionService,
    private readonly bpf: BpfService,
    private readonly edof: EdofService,
  ) {}

  /* ------------------------------------------------------------ annuaire */

  @Get('formateurs')
  formateurs(@CurrentAccount() a: RequestAccount) {
    return this.sessions.formateurs(a.id);
  }
  @Post('formateurs')
  creerFormateur(@CurrentAccount() a: RequestAccount, @Body() dto: FormateurDto) {
    return this.sessions.creerFormateur(a.id, dto);
  }
  @Patch('formateurs/:id')
  modifierFormateur(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ModifierFormateurDto) {
    return this.sessions.modifierFormateur(a.id, id, dto);
  }
  @Delete('formateurs/:id')
  supprimerFormateur(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.sessions.supprimerFormateur(a.id, id);
  }

  @Get('salles')
  salles(@CurrentAccount() a: RequestAccount) {
    return this.sessions.salles(a.id);
  }
  @Post('salles')
  creerSalle(@CurrentAccount() a: RequestAccount, @Body() dto: SalleDto) {
    return this.sessions.creerSalle(a.id, dto);
  }
  @Patch('salles/:id')
  modifierSalle(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ModifierSalleDto) {
    return this.sessions.modifierSalle(a.id, id, dto);
  }
  @Delete('salles/:id')
  supprimerSalle(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.sessions.supprimerSalle(a.id, id);
  }

  @Patch('reglages')
  reglages(@CurrentAccount() a: RequestAccount, @Body() dto: ReglagesAdministrationDto) {
    return this.sessions.reglages(a.id, dto);
  }

  @Patch('formations/:id/bpf')
  programmeBpf(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ProgrammeBpfDto) {
    return this.sessions.modifierProgrammeBpf(a.id, id, dto);
  }

  @Get('planning')
  planning(@CurrentAccount() a: RequestAccount, @Query('de') de: string, @Query('a') fin: string) {
    return this.sessions.planning(a.id, de, fin);
  }

  /* ------------------------------------------------------------ qualité, BPF, EDOF */

  @Get('qualite.csv')
  async qualiteCsv(@CurrentAccount() a: RequestAccount, @Query('annee') an: string | undefined, @Res() res: Response) {
    const texte = await this.qualite.indicateursCsv(a.id, annee(an));
    envoyerFichier(res, { contenu: Buffer.from(texte, 'utf8'), nom: `indicateurs-${annee(an)}.csv` }, 'text/csv; charset=utf-8');
  }
  @Get('qualite')
  indicateurs(@CurrentAccount() a: RequestAccount, @Query('annee') an?: string) {
    return this.qualite.indicateurs(a.id, annee(an));
  }

  @Get('bpf.xlsx')
  async bpfXlsx(@CurrentAccount() a: RequestAccount, @Query('annee') an: string | undefined, @Res() res: Response) {
    const { nom, fichier } = await this.bpf.xlsx(a.id, annee(an));
    envoyerFichier(res, { contenu: fichier, nom }, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  }
  @Get('bpf')
  bpfCalcul(@CurrentAccount() a: RequestAccount, @Query('annee') an?: string) {
    return this.bpf.calculer(a.id, annee(an));
  }
  @Patch('bpf')
  bpfSaisir(@CurrentAccount() a: RequestAccount, @Query('annee') an: string | undefined, @Body() dto: SaisiesBpfDto) {
    return this.bpf.enregistrer(a.id, annee(an), dto.saisies);
  }
  @Post('bpf/depose')
  bpfDepose(@CurrentAccount() a: RequestAccount, @Query('annee') an: string | undefined, @Body() body: { depose?: boolean }) {
    return this.bpf.marquerDepose(a.id, annee(an), body?.depose !== false);
  }

  @Get('edof')
  edofPreparation(@CurrentAccount() a: RequestAccount) {
    return this.edof.preparation(a.id);
  }

  /* ------------------------------------------------------------ facturation */

  @Get('factures/journal.csv')
  async journal(@CurrentAccount() a: RequestAccount, @Query('annee') an: string | undefined, @Res() res: Response) {
    const texte = await this.facturation.journalCsv(a.id, annee(an));
    envoyerFichier(res, { contenu: Buffer.from(texte, 'utf8'), nom: `journal-des-ventes-${annee(an)}.csv` }, 'text/csv; charset=utf-8');
  }
  @Get('factures')
  factures(
    @CurrentAccount() a: RequestAccount,
    @Query('type') type?: string,
    @Query('statut') statut?: string,
    @Query('sessionId') sessionId?: string,
    @Query('annee') an?: string,
  ) {
    return this.facturation.liste(a.id, { type, statut, sessionId, annee: annee(an) });
  }
  @Post('factures')
  creerFacture(@CurrentAccount() a: RequestAccount, @Body() dto: FactureDto) {
    return this.facturation.creer(a.id, dto);
  }
  @Get('factures/:id/pdf')
  async facturePdf(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Res() res: Response) {
    envoyerFichier(res, await this.facturation.pdf(a.id, id), 'application/pdf');
  }
  @Post('factures/:id/emettre')
  emettre(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.facturation.emettre(a.id, id);
  }
  @Post('factures/:id/envoyer')
  envoyerFacture(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.facturation.envoyer(a.id, id);
  }
  @Post('factures/:id/paiement')
  paiement(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: PaiementFactureDto) {
    return this.facturation.paiement(a.id, id, dto);
  }
  @Post('factures/:id/avoir')
  avoir(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: AvoirDto) {
    return this.facturation.avoir(a.id, id, dto);
  }
  @Post('factures/:id/accepter')
  accepter(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.facturation.decisionDevis(a.id, id, true);
  }
  @Post('factures/:id/refuser')
  refuser(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.facturation.decisionDevis(a.id, id, false);
  }
  @Post('factures/:id/facturer')
  facturerDevis(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.facturation.facturerDevis(a.id, id);
  }
  @Get('factures/:id')
  facture(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.facturation.detail(a.id, id);
  }
  @Patch('factures/:id')
  modifierFacture(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ModifierFactureOrgDto) {
    return this.facturation.modifier(a.id, id, dto);
  }
  @Delete('factures/:id')
  supprimerFacture(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.facturation.supprimer(a.id, id);
  }

  /* ------------------------------------------------------------ stagiaires */

  @Patch('stagiaires/:id')
  modifierStagiaire(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ModifierStagiaireDto) {
    return this.sessions.modifierStagiaire(a.id, id, dto);
  }
  @Post('stagiaires/:id/lien')
  renouvelerLien(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.sessions.renouvelerLien(a.id, id);
  }
  @Put('stagiaires/:id/presence')
  presence(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: PresenceDto) {
    return this.emargement.declarerPresence(a.id, id, dto);
  }
  @Delete('stagiaires/:id')
  retirerStagiaire(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.sessions.retirerStagiaire(a.id, id);
  }

  /* ------------------------------------------------------------ sessions */

  @Get('sessions')
  liste(@CurrentAccount() a: RequestAccount, @Query('de') de?: string, @Query('a') fin?: string) {
    return this.sessions.liste(a.id, { de, a: fin });
  }
  @Get('sessions/:id')
  detail(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.sessions.detail(a.id, id);
  }
  @Patch('sessions/:id')
  modifierSession(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: ModifierSessionAdminDto) {
    return this.sessions.modifierSession(a.id, id, dto);
  }

  @Post('sessions/:id/creneaux/serie')
  serie(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: SerieCreneauxDto) {
    return this.sessions.ajouterSerie(a.id, id, dto);
  }
  @Post('sessions/:id/creneaux')
  ajouterCreneau(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: CreneauDto) {
    return this.sessions.ajouterCreneau(a.id, id, dto);
  }
  @Patch('sessions/:id/creneaux/:creneauId')
  modifierCreneau(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Param('creneauId') c: string, @Body() dto: ModifierCreneauDto) {
    return this.sessions.modifierCreneau(a.id, id, c, dto);
  }
  @Delete('sessions/:id/creneaux/:creneauId')
  supprimerCreneau(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Param('creneauId') c: string) {
    return this.sessions.supprimerCreneau(a.id, id, c);
  }

  @Post('sessions/:id/stagiaires')
  ajouterStagiaire(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: StagiaireDto) {
    return this.sessions.ajouterStagiaire(a.id, id, dto);
  }

  @Get('sessions/:id/emargement')
  etatEmargement(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.emargement.etat(a.id, id);
  }
  @Post('sessions/:id/seances')
  ouvrirSeance(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: OuvrirSeanceDto) {
    return this.emargement.ouvrir(a.id, id, dto);
  }
  @Post('sessions/:id/seances/:seanceId/fermer')
  fermerSeance(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Param('seanceId') s: string) {
    return this.emargement.fermer(a.id, id, s);
  }
  @Post('sessions/:id/seances/:seanceId/code')
  nouveauCode(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Param('seanceId') s: string) {
    return this.emargement.nouveauCode(a.id, id, s);
  }
  @Post('sessions/:id/seances/:seanceId/signature')
  signerFormateur(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Param('seanceId') s: string,
    @Body() dto: SignatureFormateurDto,
    @Req() req: Request,
  ) {
    return this.emargement.signerFormateur(a.id, id, s, dto, ip(req));
  }

  @Get('sessions/:id/documents')
  registre(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.documents.registre(a.id, id);
  }
  @Post('sessions/:id/documents/envoyer')
  envoyerDocument(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: EnvoiDocumentDto) {
    return this.documents.envoyer(a.id, id, dto.type, dto);
  }
  @Get('sessions/:id/documents/:type/zip')
  async archive(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Param('type') type: string, @Res() res: Response) {
    envoyerFichier(res, await this.documents.archive(a.id, id, typeDocument(type)), 'application/zip');
  }
  @Get('sessions/:id/documents/:type/pdf')
  async document(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Param('type') type: string,
    @Query('inscriptionId') inscriptionId: string | undefined,
    @Query('entreprise') entreprise: string | undefined,
    @Res() res: Response,
  ) {
    envoyerFichier(res, await this.documents.fabriquer(a.id, id, typeDocument(type), { inscriptionId, entreprise }), 'application/pdf');
  }

  @Get('sessions/:id/qualite')
  rapport(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.qualite.rapportSession(a.id, id);
  }

  @Post('sessions/:id/facturer')
  facturerSession(@CurrentAccount() a: RequestAccount, @Param('id') id: string, @Body() dto: FacturerSessionDto) {
    return this.facturation.facturerSession(a.id, id, dto);
  }
}

export function typeDocument(type: string): TypeDocumentSession {
  const t = type.toUpperCase().replace(/-/g, '_');
  if (!(t in TypeDocumentSession)) throw new BadRequestException('Type de document inconnu.');
  return t as TypeDocumentSession;
}
