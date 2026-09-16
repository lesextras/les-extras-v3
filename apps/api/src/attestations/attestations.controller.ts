import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';
import { AttestationsService } from './attestations.service';
import {
  AnnulerAttestationDto,
  CommanderAttestationDto,
} from './dto/attestation.dto';

/**
 * L'ATTESTATION DE SUIVI — la commande est PUBLIQUE, la délivrance est
 * réservée à l'administration.
 *
 * ⚠ LA COMMANDE N'A PAS DE GARDE, ET C'EST VOULU. Les parcours gratuits se
 * suivent hors de la plateforme, sans compte : exiger une connexion pour
 * acheter le document qui atteste du parcours qu'on vient de finir ferait
 * abandonner presque tout le monde. Le plafond de débit remplace la garde —
 * même réglage que les autres formulaires ouverts du site.
 */
@Controller('attestations')
export class AttestationsController {
  constructor(private readonly attestations: AttestationsService) {}

  /** POST /attestations — ouvre le paiement. Public. */
  @Throttle({ default: { limit: 8, ttl: 3_600_000 } })
  @Post()
  commander(@Body() dto: CommanderAttestationDto) {
    return this.attestations.commander(dto);
  }

  /**
   * GET /attestations/admin — la file des commandes.
   *
   * ⚠ LE SEGMENT « admin » EST DANS LE CHEMIN plutôt que dans le contrôleur
   * d'administration, pour que la règle de cette ressource — publique à la
   * commande, fermée au reste — se lise dans un seul fichier. Nest garde la
   * PREMIÈRE route déclarée quand deux se ressemblent, sans le dire : un
   * `@Get(':id')` posé au-dessus avalerait celle-ci.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin')
  lister() {
    return this.attestations.lister();
  }

  /**
   * GET /attestations/admin/:id/document.pdf — l'aperçu, avant d'envoyer.
   *
   * ⚠ REGARDER N'EST PAS DÉLIVRER : cette route ne change aucun statut et
   * n'envoie aucun message. Sans elle, la seule façon de vérifier l'orthographe
   * d'un nom sur le document serait de l'envoyer à la personne — c'est-à-dire
   * trop tard. Elle sert aussi à renvoyer le document à la main le jour où un
   * courriel se perd.
   *
   * ⚠ Elle est déclarée AVANT les routes en `admin/:id/...` en POST, mais
   * surtout après `admin` tout court : Nest garde la première route déclarée
   * quand deux se ressemblent, sans le dire.
   */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/:id/document.pdf')
  async document(@Param('id') id: string, @Res() res: Response) {
    const piece = await this.attestations.apercu(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${piece.nom}"`);
    res.send(piece.contenu);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/:id/delivrer')
  delivrer(@Param('id') id: string) {
    return this.attestations.delivrer(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/:id/annuler')
  annuler(@Param('id') id: string, @Body() dto: AnnulerAttestationDto) {
    return this.attestations.annuler(id, dto?.motif);
  }
}
