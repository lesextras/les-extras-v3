import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import type { FichierRecu } from '../storage/files.service';
import { TAILLE_MAX_GLOBALE } from '../storage/file-rules';
import { BillingService } from '../billing/billing.service';
import { FacturesService } from './factures.service';
import { AbonnerDto, DeposerFactureDto, ModifierFactureDto, SaisirFactureDto } from './dto/factures.dto';

/**
 * MES FACTURES : réservé aux deux espaces de Pilote (ASSOCIATION, ACADEMIE).
 * Tout ce qui lit ou écrit une facture exige un abonnement actif (le service
 * le vérifie) ; seuls l'état de l'abonnement et le bouton d'abonnement sont
 * ouverts à un compte sans abonnement.
 */
@Controller('factures')
@UseGuards(JwtAuthGuard, AccountGuard)
export class FacturesController {
  constructor(
    private readonly factures: FacturesService,
    private readonly billing: BillingService,
    private readonly config: ConfigService,
  ) {}

  private pilote(account: RequestAccount) {
    if (account.type !== 'ASSOCIATION' && account.type !== 'ACADEMIE') {
      throw new ForbiddenException('« Mes factures » est un outil des espaces Pilote.');
    }
  }

  @Get()
  async liste(@CurrentAccount() account: RequestAccount) {
    this.pilote(account);
    const abonnement = await this.factures.abonnement(account.id);
    if (!abonnement.actif) return { abonnement, factures: [], resume: null, postes: [] };
    return this.factures.liste(account.id);
  }

  @Get('abonnement')
  abonnement(@CurrentAccount() account: RequestAccount) {
    this.pilote(account);
    return this.factures.abonnement(account.id);
  }

  @Post('abonnement')
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  abonner(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Body() dto: AbonnerDto) {
    this.pilote(account);
    const base = (this.config.get<string>('PILOTE_WEB_URL') ?? 'https://pilote.toulali.fr').replace(/\/$/, '');
    const page = dto.espace === 'academie' ? `${base}/academie/factures` : `${base}/association/espace/factures`;
    return this.billing.createFacturesCheckout(user.id, account.id, {
      succes: `${page}?abonnement=succes`,
      annule: `${page}?abonnement=annule`,
    });
  }

  @Post()
  @Throttle({ default: { limit: 120, ttl: 3_600_000 } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: TAILLE_MAX_GLOBALE, files: 1 } }))
  deposer(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @UploadedFile() fichier: FichierRecu | undefined,
    @Body() dto: DeposerFactureDto,
  ) {
    this.pilote(account);
    if (!fichier) throw new BadRequestException('Aucun fichier reçu.');
    return this.factures.deposer(account.id, user.id, fichier, dto.poste || undefined);
  }

  @Post('saisie')
  saisir(@CurrentAccount() account: RequestAccount, @Body() dto: SaisirFactureDto) {
    this.pilote(account);
    return this.factures.saisir(account.id, dto);
  }

  @Patch(':id')
  modifier(@CurrentAccount() account: RequestAccount, @Param('id') id: string, @Body() dto: ModifierFactureDto) {
    this.pilote(account);
    return this.factures.modifier(account.id, id, dto);
  }

  @Delete(':id')
  supprimer(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser, @Param('id') id: string) {
    this.pilote(account);
    return this.factures.supprimer(account.id, user.id, user.role, id);
  }

  @Get('export.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="mes-factures.csv"')
  export(@CurrentAccount() account: RequestAccount, @Query('annee') annee?: string) {
    this.pilote(account);
    const a = annee ? Number.parseInt(annee, 10) : undefined;
    return this.factures.exportCsv(account.id, Number.isFinite(a) ? a : undefined);
  }
}
