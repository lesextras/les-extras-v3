import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { StructuresService } from './structures.service';
import { RattacherStructureDto } from './dto/structure.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import { RequestAccount } from '../common/types/request-context';

/**
 * Structure de rattachement d'un compte.
 *
 * ⚠ Aucune route n'est ouverte sans authentification : la recherche interroge
 * un annuaire public, mais l'exposer sans compte en ferait un proxy gratuit
 * vers l'API de l'État, et surtout la liste des structures DÉCLARÉES dit qui
 * s'est inscrit sur la plateforme — ce n'est pas une information publique.
 */
@Controller('structures')
@UseGuards(JwtAuthGuard, AccountGuard)
export class StructuresController {
  constructor(private readonly structures: StructuresService) {}

  /** Entités trouvées dans l'annuaire public des entreprises. */
  @Get('annuaire')
  annuaire(@Query('q') q: string) {
    return this.structures.rechercherEntite(q);
  }

  /** Structures déjà déclarées par d'autres comptes de la plateforme. */
  @Get('declarees')
  declarees(@Query('q') q: string) {
    return this.structures.rechercherDeclarees(q);
  }

  @Get(':id')
  fiche(@Param('id') id: string) {
    return this.structures.fiche(id);
  }

  @Post('rattacher')
  rattacher(
    @CurrentAccount() account: RequestAccount,
    @Body() dto: RattacherStructureDto,
  ) {
    return this.structures.rattacher(account, dto);
  }

  @Delete('rattacher')
  detacher(@CurrentAccount() account: RequestAccount) {
    return this.structures.detacher(account);
  }
}
