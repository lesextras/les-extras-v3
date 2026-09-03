import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { IdeaStatus } from '@prisma/client';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { CommunityService } from './community.service';

class CreerIdeeDto {
  @IsString() @MinLength(4) @MaxLength(120) title!: string;
  @IsString() @MinLength(10) @MaxLength(2000) content!: string;
}

class ArbitrerIdeeDto {
  @IsEnum(IdeaStatus) status!: IdeaStatus;
  @IsOptional() @IsString() @MaxLength(2000) reply?: string;
}


/**
 * Les notes sont sur 5. Seule la note globale est obligatoire : un formulaire
 * qui exige quatre réponses ne se remplit pas, et une réponse partielle vaut
 * infiniment mieux qu'un onglet fermé.
 */
class DeposerRetourDto {
  @IsInt() @Min(1) @Max(5) noteGlobale!: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) noteSite?: number;
  @IsOptional() @IsInt() @Min(1) @Max(5) noteDepot?: number;
  @IsOptional() @IsString() @MaxLength(2000) probleme?: string;
  @IsOptional() @IsString() @MaxLength(4000) commentaire?: string;
  @IsOptional() @IsIn(['PREMIER_ATELIER', 'SPONTANE']) source?: string;
}

/** Points de fidélité et boîte à idées — communs à tous les comptes. */
@Controller('community')
@UseGuards(JwtAuthGuard, AccountGuard)
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('points')
  points(@CurrentAccount() account: RequestAccount) {
    return this.community.solde(account.id);
  }

  // ── Retour d'expérience ──────────────────────────────────────────────────

  /**
   * Dépôt d'un retour. Plafonné à cinq par heure : ce n'est pas un formulaire
   * public, mais rien n'empêche un compte de s'emballer.
   */
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @Post('retour-experience')
  deposerRetour(
    @Body() dto: DeposerRetourDto,
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
  ) {
    return this.community.deposerRetour(user.id, account?.id ?? null, dto);
  }

  /** Ce que cette personne a déjà déposé — l'écran s'en sert pour le dire. */
  @Get('retour-experience/mien')
  mesRetours(@CurrentUser() user: RequestUser) {
    return this.community.mesRetours(user.id);
  }

  /** Les contributions du mois — accessible à tous les comptes. */
  /** Parrainage : lien a partager + nombre de filleuls (inscrits / actifs). */
  @Get('parrainage')
  parrainage(@CurrentAccount() account: { id: string }) {
    return this.community.parrainage(account.id);
  }

  @Get('contributeurs')
  contributeurs() {
    return this.community.contributeurs();
  }

  @Get('idees')
  idees(@CurrentUser() user: RequestUser) {
    return this.community.listerIdees(user.id);
  }

  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @Post('idees')
  creerIdee(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: CreerIdeeDto,
  ) {
    return this.community.creerIdee(account.id, user.id, dto);
  }

  @Post('idees/:id/vote')
  voter(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.community.voter(id, user.id);
  }

  @Patch('idees/:id')
  arbitrer(
    @Param('id') id: string,
    @Body() dto: ArbitrerIdeeDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.community.arbitrer(id, dto, user.role === 'ADMIN');
  }
}
