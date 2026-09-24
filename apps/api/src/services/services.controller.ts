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
   * Catalogue (authentifié) des ateliers publiés, depuis un compte actif.
   */
  @Get('catalog')
  @UseGuards(AccountGuard)
  catalog(@Query() query: QueryServicesDto) {
    return this.services.findCatalog(query);
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
   * Réserver un atelier : crée un Booking REQUESTED, au nom du compte actif.
   * Plus de droit déclaré ni de rôle à vérifier sur Les Extras depuis le
   * 24/09/2026 : un compte, une personne.
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
