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

  @Get(':id')
  lire(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.signature.lire(a.id, id);
  }

  /** Le dossier de preuve complet. */
  @Get(':id/dossier')
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  dossier(@Param('id') id: string) {
    return this.signature.dossier(id);
  }

  /** Renvoie un code : le premier a pu se perdre ou expirer. */
  @Post(':id/code')
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  renvoyerCode(@Param('id') id: string) {
    return this.signature.envoyerCode(id);
  }

  /** Le geste lui-même. Ouvert à toute personne authentifiée. */
  @Post(':id/signer')
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  signer(@Param('id') id: string, @Body() dto: SignerDto, @Req() req: Request) {
    return this.signature.signer(id, dto.code, this.trace(req));
  }

  @Post(':id/refuser')
  @AccountRoles('OWNER', 'ADMIN', 'MANAGER', 'MEMBER')
  refuser(@Param('id') id: string, @Body() dto: RefuserDto, @Req() req: Request) {
    return this.signature.refuser(id, dto.motif, this.trace(req));
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
