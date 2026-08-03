import {
  Body, Controller, Delete, Get, Param, Patch, Post, UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MemberGuard } from '../common/guards/member.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestAccount, RequestUser } from '../common/types/request-context';
import { AssistantService } from './assistant.service';
import { CreditsService } from '../billing/credits.service';
import { ActiviteDto, ChatDto, EnregistrerDocumentDto, FeedbackDto, FicheDto, GenererDto, ModifierDocumentDto, GapisteDto } from './dto/assistant.dto';

/**
 * Assistant d'écriture professionnelle.
 * Toutes les routes exigent une session ET un compte actif : les documents
 * vivent dans le compte, cloisonnés par auteur.
 *
 * LEX est le produit payant de la plateforme : chaque GÉNÉRATION (écrit,
 * activité, fiche, tour de GAPiste) consomme UN crédit, débité par
 * `avecCredit` qui rembourse si la génération échoue. Le bot d'aide `chat`,
 * lui, reste gratuit : aider à se servir d'une plateforme gratuite ne se
 * facture pas. Les ADMIN de la plateforme ne consomment rien.
 */
@Controller('assistant')
@UseGuards(JwtAuthGuard, AccountGuard)
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly credits: CreditsService,
  ) {}

  /** Un crédit par génération — sauf ADMIN de la plateforme. */
  private payer<T>(user: RequestUser, account: RequestAccount, reason: string, fn: () => Promise<T>) {
    if (user.role === 'ADMIN') return fn();
    return this.credits.avecCredit(account.id, reason, fn);
  }

  @Get('trames')
  trames() {
    return this.assistant.trames();
  }

  /** Génération : plafonnée par utilisateur — le poste de coût est ici. */
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @UseGuards(MemberGuard)
  @Post('generer')
  generer(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: GenererDto,
  ) {
    return this.payer(user, account, 'LEX_ECRIT', () =>
      this.assistant.generer(dto.trame, dto.notes),
    );
  }

  /** Générateur d'activités éducatives & thérapeutiques. */
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @UseGuards(MemberGuard)
  @Post('activite')
  activite(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: ActiviteDto,
  ) {
    return this.payer(user, account, 'LEX_ACTIVITE', () =>
      this.assistant.genererActivite(dto),
    );
  }

  /**
   * Bot d'aide de l'espace connecté — GRATUIT et sans crédit : il aide à se
   * servir de la plateforme, il ne produit pas de livrable.
   */
  @Throttle({ default: { limit: 60, ttl: 3_600_000 } })
  @Post('chat')
  chat(@Body() dto: ChatDto) {
    return this.assistant.chat('dashboard', dto.message, dto.historique);
  }

  /**
   * LEX le GAPiste — animation du groupe d'analyse de pratique.
   *
   * Payant comme le reste de LEX (un crédit par tour de parole généré) :
   * le GAP entre pairs, lui, reste ouvert à tous les comptes.
   */
  @Throttle({ default: { limit: 40, ttl: 3_600_000 } })
  @UseGuards(MemberGuard)
  @Post('gapiste')
  gapiste(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: GapisteDto,
  ) {
    return this.payer(user, account, 'LEX_GAPISTE', () =>
      this.assistant.gapiste(dto.message, dto.historique, dto.contexte),
    );
  }

  /** Pré-remplissage d'une fiche atelier/formation depuis un brief. */
  @Throttle({ default: { limit: 20, ttl: 3_600_000 } })
  @UseGuards(MemberGuard)
  @Post('fiche')
  fiche(
    @CurrentUser() user: RequestUser,
    @CurrentAccount() account: RequestAccount,
    @Body() dto: FicheDto,
  ) {
    return this.payer(user, account, 'LEX_FICHE', () =>
      this.assistant.remplirFiche(dto.type, dto.brief),
    );
  }

  @Post('documents')
  enregistrer(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: EnregistrerDocumentDto,
  ) {
    return this.assistant.enregistrer(account.id, user.id, dto);
  }

  @Get('documents')
  lister(@CurrentAccount() account: RequestAccount, @CurrentUser() user: RequestUser) {
    return this.assistant.lister(account.id, user.id);
  }

  @Get('documents/:id')
  lire(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assistant.lire(id, account.id, user.id);
  }

  @Patch('documents/:id')
  modifier(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: ModifierDocumentDto,
  ) {
    return this.assistant.modifier(id, account.id, user.id, dto);
  }

  @Delete('documents/:id')
  supprimer(
    @Param('id') id: string,
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
  ) {
    return this.assistant.supprimer(id, account.id, user.id);
  }

  @Post('feedback')
  feedback(
    @CurrentAccount() account: RequestAccount,
    @CurrentUser() user: RequestUser,
    @Body() dto: FeedbackDto,
  ) {
    return this.assistant.feedback(account.id, user.id, dto);
  }
}
