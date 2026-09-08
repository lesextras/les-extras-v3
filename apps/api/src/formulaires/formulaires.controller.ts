import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import type { RequestAccount } from '../common/types/request-context';
import { FormulairesService } from './formulaires.service';
import { CreerFormulaireDto, ModifierFormulaireDto, RepondreDto } from './dto/formulaire.dto';

/**
 * LES FORMULAIRES DU COMPTE.
 *
 * Le même jeu de routes sert les deux espaces : le formulaire appartient au
 * compte, qu'il soit une association ou une académie. C'est le guard de compte
 * qui garantit qu'on ne voit que les siens.
 */
@Controller('formulaires')
@UseGuards(JwtAuthGuard, AccountGuard)
export class FormulairesController {
  constructor(private readonly formulaires: FormulairesService) {}

  @Get()
  lister(@CurrentAccount() account: RequestAccount) {
    return this.formulaires.lister(account.id);
  }

  @Post()
  creer(@CurrentAccount() account: RequestAccount, @Body() dto: CreerFormulaireDto) {
    return this.formulaires.creer(account.id, dto);
  }

  @Get(':id')
  lire(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.formulaires.lire(account.id, id);
  }

  @Patch(':id')
  modifier(
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Body() dto: ModifierFormulaireDto,
  ) {
    return this.formulaires.modifier(account.id, id, dto);
  }

  @Delete(':id')
  supprimer(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.formulaires.supprimer(account.id, id);
  }

  @Post(':id/dupliquer')
  dupliquer(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.formulaires.dupliquer(account.id, id);
  }

  @Get(':id/reponses')
  reponses(@CurrentAccount() account: RequestAccount, @Param('id') id: string) {
    return this.formulaires.reponses(account.id, id);
  }

  @Delete(':id/reponses/:reponseId')
  supprimerReponse(
    @CurrentAccount() account: RequestAccount,
    @Param('id') id: string,
    @Param('reponseId') reponseId: string,
  ) {
    return this.formulaires.supprimerReponse(account.id, id, reponseId);
  }
}

/**
 * LA FACE PUBLIQUE : la page qu'on partage, et l'envoi de la réponse.
 *
 * Aucune session ici — c'est le principe. On limite le nombre d'envois par
 * adresse IP : un formulaire ouvert au monde entier attire les robots.
 */
@Controller('public/formulaires')
export class FormulairesPublicController {
  constructor(private readonly formulaires: FormulairesService) {}

  @Get(':slug')
  page(@Param('slug') slug: string) {
    return this.formulaires.pagePublique(slug);
  }

  @Post(':slug')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  repondre(
    @Param('slug') slug: string,
    @Body() dto: RepondreDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.formulaires.repondre(slug, dto, userAgent);
  }
}
