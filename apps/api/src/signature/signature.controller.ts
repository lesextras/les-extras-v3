import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ArrayMaxSize,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import { TypeDocumentSigne } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import type { RequestAccount } from '../common/types/request-context';
import { SignatureService } from './signature.service';

class DemanderDto {
  @IsEnum(TypeDocumentSigne)
  documentType!: TypeDocumentSigne;

  @IsString()
  @MaxLength(40)
  documentId!: string;

  @IsString()
  @MaxLength(160)
  signataireNom!: string;

  @IsEmail()
  signataireEmail!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  userId?: string;
}

class SignerDto {
  /** Six chiffres, exactement. */
  @IsString()
  @Length(6, 6)
  code!: string;
}

class RefuserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motif?: string;
}

/**
 * SIGNATURE ÉLECTRONIQUE.
 *
 * Deux publics et deux régimes d'accès. Demander, annuler et consulter
 * relèvent des responsables : c'est l'établissement qui met un document à la
 * signature. Signer et refuser sont ouverts à toute personne authentifiée,
 * car le signataire est souvent un salarié ou un intervenant sans rôle
 * d'encadrement — et c'est bien le principe : on ne signe pas à sa place.
 *
 * L'adresse IP et le navigateur sont relevés à la signature. Ce ne sont pas
 * des données de confort : ce sont deux pièces du faisceau de preuves.
 */
@Controller('signatures')
@UseGuards(JwtAuthGuard, AccountGuard, AccountRolesGuard)
@AccountRoles('OWNER', 'ADMIN', 'MANAGER')
export class SignatureController {
  constructor(private readonly signature: SignatureService) {}

  /**
   * Qui appelle : le compte actif, l'adresse de la personne connectée et son
   * rôle. Ces trois éléments décident si la demande de signature la concerne
   * (voir SignatureService.signatureConcernee).
   */
  private qui(req: Request, a: RequestAccount) {
    const user = (req as Request & { user?: { email?: string } }).user;
    return { accountId: a.id, userEmail: user?.email ?? '', role: a.role };
  }

  /** L'adresse d'origine, derrière le proxy inverse s'il y en a un. */
  private trace(req: Request) {
    const entete = (req.headers['x-forwarded-for'] as string | undefined) ?? '';
    const ip = entete.split(',')[0]?.trim() || req.ip || null;
    return { ip, userAgent: (req.headers['user-agent'] as string | undefined) ?? null };
  }

  @Post()
  demander(@CurrentAccount() a: RequestAccount, @Body() dto: DemanderDto) {
    return this.signature.demander(a.id, dto);
  }

  /** Les signatures d'un document. */
  @Get('document')
  pourDocument(
    @CurrentAccount() a: RequestAccount,
    @Query('type') type: TypeDocumentSigne,
    @Query('id') id: string,
  ) {
    return this.signature.pourDocument(a.id, type, id);
  }

  /**
   * Ouvert au signataire lui-même : le service restreint un simple membre aux
   * demandes adressées à sa propre adresse.
   */
  @Get(':id')
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  lire(
    @CurrentAccount() a: RequestAccount,
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const user = (req as Request & { user?: { email?: string } }).user;
    return this.signature.lirePourSignataire(a.id, id, user?.email ?? '', a.role);
  }

  /** Le dossier de preuve complet — signataire et responsables seulement. */
  @Get(':id/dossier')
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  dossier(
    @CurrentAccount() a: RequestAccount,
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.signature.dossier(id, this.qui(req, a));
  }

  /** Renvoie un code : le premier a pu se perdre ou expirer. */
  @Post(':id/code')
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  renvoyerCode(
    @CurrentAccount() a: RequestAccount,
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    return this.signature.envoyerCode(id, this.qui(req, a));
  }

  /** Le geste lui-même. Réservé au signataire désigné. */
  @Post(':id/signer')
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  signer(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Body() dto: SignerDto,
    @Req() req: Request,
  ) {
    return this.signature.signer(id, dto.code, this.trace(req), this.qui(req, a));
  }

  @Post(':id/refuser')
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  refuser(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Body() dto: RefuserDto,
    @Req() req: Request,
  ) {
    return this.signature.refuser(id, dto.motif, this.trace(req), this.qui(req, a));
  }

  /** L'établissement retire sa demande. Une signature recueillie, jamais. */
  @Delete(':id')
  annuler(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.signature.annuler(a.id, id);
  }
}

/** Réservé pour un futur envoi groupé ; borné dès maintenant. */
export class DemanderPlusieursDto {
  @ArrayMaxSize(50)
  demandes!: DemanderDto[];
}
