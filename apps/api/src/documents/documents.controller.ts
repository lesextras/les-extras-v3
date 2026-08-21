import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { DocumentsService } from './documents.service';

/**
 * LES PIÈCES.
 *
 * Un contrat de travail et une facture sont des documents qu'on imprime,
 * qu'on signe et qu'on archive. Le produit vend de la conformité : il doit
 * donc produire la pièce, pas seulement l'écran qui la décrit.
 *
 * Réservé aux responsables, pour la même raison que les écrans qui y mènent :
 * un contrat porte une rémunération, une facture porte les comptes de la
 * structure.
 */
@Controller('documents')
@UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
@AccountRoles('OWNER', 'ADMIN', 'MANAGER')
export class DocumentsController {
  /*
   * LE TYPE DE CONTENU EST POSÉ JUSTE AVANT L'ENVOI, PAS PAR DÉCORATEUR.
   *
   * `@Header('Content-Type', 'application/pdf')` s'applique dès l'entrée dans
   * le gestionnaire : quand le service levait ensuite « Devis introuvable. »,
   * la réponse d'erreur partait en JSON sous un en-tête annonçant un PDF. Un
   * client qui se fie à l'en-tête tente alors d'ouvrir un message d'erreur
   * comme un document, et affiche un fichier corrompu au lieu de la raison du
   * refus. On n'annonce donc un PDF qu'au moment où l'on en a un.
   */

  constructor(private readonly documents: DocumentsService) {}

  @Get('contrat-cdd/:id.pdf')
  async contratCdd(
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { pdf, nom } = await this.documents.contratCdd(account.id, id);
    if (!pdf) throw new NotFoundException('Contrat introuvable.');
    // `inline` : le navigateur affiche le document plutôt que de le télécharger
    // sans prévenir. On relit avant d'imprimer.
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nom}"`);
    res.end(pdf);
  }

  @Get('proposition/:bookingId.pdf')
  async proposition(
    @CurrentAccount() account: RequestAccount,
    @Param('bookingId') bookingId: string,
    @Res() res: Response,
  ) {
    const { pdf, nom } = await this.documents.proposition(account.id, bookingId);
    if (!pdf) throw new NotFoundException('Proposition introuvable.');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nom}"`);
    res.end(pdf);
  }

  /**
   * LE DEVIS — la pièce qui contractualise.
   *
   * Dans ce métier ce n'est pas la facture qui engage, c'est le devis
   * accepté : un directeur ne débloque pas une dépense sur un écran, il lui
   * faut l'offre écrite, chiffrée et datée à porter à son conseil ou à son
   * financeur. Le document manquait ; la facture ne faisait que constater
   * après coup une contractualisation qui n'avait jamais eu de support.
   */
  @Get('devis/:id.pdf')
  async devis(
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { pdf, nom } = await this.documents.devis(account.id, id);
    if (!pdf) throw new NotFoundException('Devis introuvable.');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nom}"`);
    res.end(pdf);
  }

  @Get('facture/:id.pdf')
  async facture(
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { pdf, nom } = await this.documents.facture(account.id, id);
    if (!pdf) throw new NotFoundException('Facture introuvable.');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nom}"`);
    res.end(pdf);
  }

  /**
   * ATTESTATION D'ASSIDUITÉ.
   *
   * `@AccountRoles` au niveau de la classe ne s'applique pas ici : la règle des
   * formations est différente et plus fine — c'est le formateur désigné sur la
   * session qui délivre les pièces, et il n'est ni propriétaire, ni
   * administrateur, ni chef de service du compte. Le contrôle est donc porté
   * par `FormationsService`, qui connaît les trois cas légitimes.
   */
  @Get('attestation/:inscriptionId.pdf')
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  async attestation(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('inscriptionId') inscriptionId: string,
    @Res() res: Response,
  ) {
    const { pdf, nom } = await this.documents.formation(
      account.id,
      user.id,
      inscriptionId,
      'attestation',
    );
    if (!pdf) throw new NotFoundException('Attestation introuvable.');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nom}"`);
    res.end(pdf);
  }

  /** CERTIFICAT DE RÉALISATION — la pièce que réclame le financeur. */
  @Get('certificat/:inscriptionId.pdf')
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  async certificat(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('inscriptionId') inscriptionId: string,
    @Res() res: Response,
  ) {
    const { pdf, nom } = await this.documents.formation(
      account.id,
      user.id,
      inscriptionId,
      'certificat',
    );
    if (!pdf) throw new NotFoundException('Certificat introuvable.');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nom}"`);
    res.end(pdf);
  }

  /** FEUILLE D'ÉMARGEMENT — la preuve de réalisation la plus contrôlée. */
  @Get('emargement/:sessionId.pdf')
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  async emargement(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Param('sessionId') sessionId: string,
    @Res() res: Response,
  ) {
    const { pdf, nom } = await this.documents.emargement(account.id, user.id, sessionId);
    if (!pdf) throw new NotFoundException('Session introuvable.');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${nom}"`);
    res.end(pdf);
  }
}
