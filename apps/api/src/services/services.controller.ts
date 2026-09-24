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
import { EmailVerifieSiPublicationGuard } from '../common/guards/email-verifie.guard';
import { StructureRequiseSiPublicationGuard } from '../common/guards/structure-requise.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';
import { BookServiceDto } from './dto/book-service.dto';

interface AccountCtx {
  id: string;
  role: AccountRole;
}

@Controller('services')
@UseGuards(JwtAuthGuard)
export class ServicesController {
  constructor(private readonly services: ServicesService) {}

  /**
   * Catalogue (authentifié) des ateliers publiés.
   *
   * `AccountGuard` est nécessaire ici, et pas seulement pour la forme : les
   * fiches publiées par un salarié ne s'adressent qu'aux établissements
   * auxquels il est rattaché. Sans savoir QUI regarde, on ne peut pas trancher
   * — et on montrerait à tout le monde ce qui ne concerne qu'une maison.
   */
  @Get('catalog')
  @UseGuards(AccountGuard)
  catalog(@CurrentAccount() account: AccountCtx, @Query() query: QueryServicesDto) {
    return this.services.findCatalog(query, account.id);
  }

  @Get()
  @UseGuards(AccountGuard)
  findMine(@CurrentAccount() account: AccountCtx, @Query('take') take?: string) {
    return this.services.findAllByAccount(account.id, take ? Number(take) : undefined);
  }

  @Get(':id')
  @UseGuards(AccountGuard)
  findOne(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.services.findOne(id, account.id);
  }

  @Post()
  @UseGuards(AccountGuard)
  create(@CurrentAccount() account: AccountCtx, @Body() dto: CreateServiceDto) {
    return this.services.create(account.id, dto);
  }

  /**
   * Modifier — et, quand `status: PUBLISHED` est envoyé, publier. Les deux
   * derniers gardes ne se déclenchent que dans ce second cas : corriger un
   * brouillon reste possible sans adresse confirmée et sans structure.
   *
   * ⚠ LES DEUX EXIGENCES SONT DE MÊME NATURE — on ne bloque que ce qui peut
   * nuire à quelqu'un d'autre. Une adresse non confirmée, c'est du spam de
   * catalogue ; une fiche publiée sans structure, ce sont des devis et des
   * factures portant « SIRET : Non renseigné » envoyés à des établissements
   * publics.
   */
  @Patch(':id')
  @UseGuards(
    AccountGuard,
    EmailVerifieSiPublicationGuard,
    StructureRequiseSiPublicationGuard,
  )
  update(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.services.update(id, account.id, dto);
  }

  @Delete(':id')
  @UseGuards(AccountGuard)
  remove(@Param('id') id: string, @CurrentAccount() account: AccountCtx) {
    return this.services.remove(id, account.id);
  }

  /**
   * Réserver un atelier : crée un Booking REQUESTED.
   *
   * ENGAGER L'ÉTABLISSEMENT N'EST PAS UN ACTE D'ÉQUIPE. La route ne
   * demandait que d'être membre du compte : un éducateur rattaché pouvait
   * réserver — donc engager une dépense — au nom de sa structure, sans que
   * personne le lui ait accordé. Le droit « Réserver un intervenant
   * directement » existait pourtant déjà, déclaré dans « Mon poste » et
   * rangé en base, et rien ne le lisait.
   *
   * Il est lu maintenant, en OU avec le rôle : direction, administration et
   * chefs de service réservent comme avant, un particulier reste
   * propriétaire de son compte donc de sa réservation, et un salarié à qui
   * on a accordé le droit réserve aussi. Le refus, lui, renvoie vers « Mon
   * poste » plutôt que vers un code d'erreur.
   */
  @Post(':id/book')
  @UseGuards(AccountGuard)
  book(
    @Param('id') id: string,
    @CurrentAccount() account: AccountCtx,
    @Body() dto: BookServiceDto,
  ) {
    return this.services.book(id, account.id, dto);
  }
}
