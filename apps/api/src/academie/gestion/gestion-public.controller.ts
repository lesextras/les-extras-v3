import { Body, Controller, Get, Param, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { EmargementService } from './emargement.service';
import { DocumentsSessionService } from './documents-session.service';
import { QualiteSessionService } from './qualite-session.service';
import {
  CodeSignatureDto,
  EvaluationCommanditaireDto,
  EvaluationStagiaireDto,
  PositionnementDto,
  RefusSignatureDto,
  SignatureStagiaireDto,
} from './dto/gestion.dto';

function trace(req: Request) {
  const entete = (req.headers['x-forwarded-for'] as string | undefined) ?? '';
  return {
    ip: entete.split(',')[0]?.trim() || req.ip || null,
    ua: (req.headers['user-agent'] as string | undefined) ?? null,
  };
}

function pdf(res: Response, f: { contenu: Buffer; nom: string }) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${f.nom}"`);
  res.setHeader('Cache-Control', 'no-store');
  res.end(f.contenu);
}

/**
 * CE QUE VOIENT, SANS COMPTE, LE STAGIAIRE, LE SIGNATAIRE ET LE COMMANDITAIRE.
 *
 * Chacun a un lien personnel (un jeton aléatoire de 24 octets) qui n'ouvre que
 * ses propres pièces. ⚠ Les routes qui écrivent sont plafonnées : un jeton ne
 * se devine pas, mais un code de séance à six chiffres, si.
 */
@Controller('public/academie')
export class GestionPublicController {
  constructor(
    private readonly emargement: EmargementService,
    private readonly documents: DocumentsSessionService,
    private readonly qualite: QualiteSessionService,
  ) {}

  /* ------------------------------------------------------------ stagiaire */

  @Get('stagiaire/:jeton')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  espace(@Param('jeton') jeton: string) {
    return this.qualite.espace(jeton);
  }

  /** Six chiffres : dix essais par quart d'heure et par adresse, pas davantage. */
  @Post('stagiaire/:jeton/emargement')
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  signer(@Param('jeton') jeton: string, @Body() dto: SignatureStagiaireDto, @Req() req: Request) {
    const t = trace(req);
    return this.emargement.signerStagiaire(jeton, dto, t.ip, t.ua);
  }

  @Get('stagiaire/:jeton/documents/:type')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async document(@Param('jeton') jeton: string, @Param('type') type: string, @Res() res: Response) {
    pdf(res, await this.qualite.document(jeton, type.toUpperCase().replace(/-/g, '_')));
  }

  @Post('stagiaire/:jeton/evaluation')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  evaluer(@Param('jeton') jeton: string, @Body() dto: EvaluationStagiaireDto) {
    return this.qualite.evaluer(jeton, dto);
  }

  @Post('stagiaire/:jeton/positionnement')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  positionner(@Param('jeton') jeton: string, @Body() dto: PositionnementDto) {
    return this.qualite.positionner(jeton, dto);
  }

  /* ------------------------------------------------------------ signature d'une convention ou d'un contrat */

  @Get('signature/:jeton')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  signature(@Param('jeton') jeton: string) {
    return this.documents.signatureInfos(jeton);
  }

  @Get('signature/:jeton/pdf')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async signaturePdf(@Param('jeton') jeton: string, @Res() res: Response) {
    pdf(res, await this.documents.pdfPourSignataire(jeton));
  }

  @Post('signature/:jeton/code')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  code(@Param('jeton') jeton: string) {
    return this.documents.envoyerCode(jeton);
  }

  @Post('signature/:jeton/signer')
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  signerDocument(@Param('jeton') jeton: string, @Body() dto: CodeSignatureDto, @Req() req: Request) {
    const t = trace(req);
    return this.documents.signer(jeton, dto.code, t.ip, t.ua);
  }

  @Post('signature/:jeton/refuser')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  refuser(@Param('jeton') jeton: string, @Body() dto: RefusSignatureDto) {
    return this.documents.refuser(jeton, dto.motif);
  }

  /* ------------------------------------------------------------ commanditaire */

  @Get('commanditaire/:jeton')
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  commanditaire(@Param('jeton') jeton: string) {
    return this.qualite.commanditaire(jeton);
  }

  @Post('commanditaire/:jeton')
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  repondre(@Param('jeton') jeton: string, @Body() dto: EvaluationCommanditaireDto) {
    return this.qualite.repondreCommanditaire(jeton, dto);
  }
}
