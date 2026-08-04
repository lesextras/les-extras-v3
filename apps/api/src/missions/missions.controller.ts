import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AccountRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { AccountRolesGuard } from '../common/guards/account-roles.guard';
import { EmailVerifieGuard } from '../common/guards/email-verifie.guard';
import { AccountRoles } from '../common/decorators/account-roles.decorator';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { MissionsService } from './missions.service';
import { EngagementsService } from './engagements.service';
import { DeciderEngagementDto, SengagerDto } from './dto/engagement.dto';
import { CreateMissionDto } from './dto/create-mission.dto';
import { PublishMissionDto } from './dto/publish-mission.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { QueryMissionsDto } from './dto/query-missions.dto';

interface AccountCtx {
  id: string;
  type: string;
  role: AccountRole;
}

@Controller('missions')
@UseGuards(JwtAuthGuard)
export class MissionsController {
  constructor(
    private readonly missions: MissionsService,
    private readonly engagements: EngagementsService,
  ) {}

  /** Marketplace public (authentifié) : missions publiées + filtres. */
  @Get('marketplace')
  marketplace(@Query() query: QueryMissionsDto) {
    return this.missions.findMarketplace(query);
  }

  /** Missions du compte établissement actif. */
  @Get()
  @UseGuards(AccountGuard)
  findMine(@CurrentAccount() account: AccountCtx, @Query('take') take?: string) {
    return this.missions.findAllByAccount(account.id, take ? Number(take) : undefined);
  }

  @Get(':id')
  @UseGuards(AccountGuard)
  findOne(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.missions.findOne(id, account.id);
  }

  @Post()
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  create(@CurrentAccount() account: AccountCtx, @Body() dto: CreateMissionDto) {
    return this.missions.create(account.id, account.type, dto);
  }

  @Patch(':id')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  update(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto: UpdateMissionDto,
  ) {
    return this.missions.update(id, account.id, dto);
  }

  @Delete(':id')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  remove(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.missions.remove(id, account.id);
  }

  /**
   * Publier : DRAFT -> PUBLISHED. Démarre la cascade au palier le plus
   * restreint utile ; `visibility` permet de forcer (ex. urgence -> PUBLIC).
   *
   * EmailVerifieGuard : diffuser une annonce engage la plateforme auprès de
   * tiers. On ne l'exige QU'ICI — consulter, candidater, préparer un brouillon
   * restent ouverts à un compte non confirmé (voir le commentaire du garde).
   */
  @Post(':id/publish')
  @UseGuards(AccountGuard, AccountRolesGuard, EmailVerifieGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  publish(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto?: PublishMissionDto,
  ) {
    return this.missions.publish(id, account.id, dto?.visibility, account.role);
  }

  /** Republier : duplique la mission en brouillon (une semaine plus tard par défaut). */
  @Post(':id/dupliquer')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  dupliquer(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto?: { startDate?: string },
  ) {
    return this.missions.dupliquer(id, account.id, dto?.startDate);
  }

  /** Approbation d'une mission en attente de validation hiérarchique. */
  @Post(':id/approve')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN)
  approve(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto?: PublishMissionDto,
  ) {
    return this.missions.approve(id, account.id, dto?.visibility);
  }

  /** Élargir la diffusion d'un cran (SALARIES -> RESERVED -> PUBLIC). */
  @Post(':id/broaden')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  broaden(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.missions.broaden(id, account.id);
  }

  /** Candidater (FREELANCE) : crée un Booking REQUESTED. */
  @Post(':id/candidate')
  @UseGuards(AccountGuard)
  candidate(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.missions.candidate(id, account.id, account.type);
  }

  /**
   * SOS Renfort — accepter la mission (FREELANCE) : premier arrivé, premier servi.
   * La mission passe en « pourvue » et n'est plus disponible ; contrat généré.
   * En mode « file d'engagement », le service redirige vers /sengager.
   */
  @Post(':id/accept')
  @UseGuards(AccountGuard)
  accept(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.missions.accept(id, account.id, account.type);
  }

  // ── File d'engagement ────────────────────────────────────────────────────

  /**
   * « Je prends la mission » (FREELANCE) : l'intervenant s'engage et prend
   * rang dans la file. Rien n'est confirmé tant que l'établissement n'a pas
   * validé son profil — et le contrat n'est émis qu'à ce moment-là.
   */
  @Post(':id/sengager')
  @UseGuards(AccountGuard)
  sengager(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto?: SengagerDto,
  ) {
    return this.engagements.sengager(id, account.id, account.type, dto?.message);
  }

  /** Se retirer de la file (FREELANCE) : tant qu'il n'a pas signé, il est libre. */
  @Delete(':id/sengager')
  @UseGuards(AccountGuard)
  seRetirer(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.engagements.retirer(id, account.id);
  }

  /**
   * La file d'engagement d'une mission (ESTABLISHMENT propriétaire).
   * Lisible par tout membre du compte, comme le pipeline de candidatures ;
   * seule la DÉCISION est réservée aux responsables.
   */
  @Get(':id/engagements')
  @UseGuards(AccountGuard)
  engagementsDe(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.engagements.liste(id, account.id);
  }

  /**
   * Accepter ou refuser le profil présenté. L'acceptation pourvoit la mission
   * et émet le contrat ; le refus présente aussitôt le suivant de la file.
   */
  @Post(':id/engagements/:engagementId/decision')
  @UseGuards(AccountGuard, AccountRolesGuard)
  @AccountRoles(AccountRole.OWNER, AccountRole.ADMIN, AccountRole.MANAGER)
  deciderEngagement(
    @Param('id') id: string,
    @Param('engagementId') engagementId: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto: DeciderEngagementDto,
  ) {
    return this.engagements.decider(id, engagementId, account.id, dto.decision, dto.motif);
  }
}
