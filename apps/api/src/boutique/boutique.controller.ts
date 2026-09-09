import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountGuard } from '../common/guards/account.guard';
import { CurrentAccount } from '../common/decorators/current-account.decorator';
import type { RequestAccount } from '../common/types/request-context';
import { BoutiqueService } from './boutique.service';
import { BoutiqueDto, ProduitDto, SuiviCommandeDto } from './dto/boutique.dto';

/**
 * LA BOUTIQUE, CÔTÉ ASSOCIATION.
 *
 * Le garde de compte fait le tri : on ne voit jamais la boutique d'un autre.
 */
@Controller('boutique')
@UseGuards(JwtAuthGuard, AccountGuard)
export class BoutiqueController {
  constructor(private readonly boutique: BoutiqueService) {}

  @Get('vitrine')
  vitrine(@CurrentAccount() a: RequestAccount) {
    return this.boutique.vitrine(a.id);
  }

  @Patch('vitrine')
  modifierVitrine(@CurrentAccount() a: RequestAccount, @Body() dto: BoutiqueDto) {
    return this.boutique.modifierVitrine(a.id, dto);
  }

  @Get('produits')
  produits(@CurrentAccount() a: RequestAccount) {
    return this.boutique.listerProduits(a.id);
  }

  @Post('produits')
  creerProduit(@CurrentAccount() a: RequestAccount, @Body() dto: ProduitDto) {
    return this.boutique.creerProduit(a.id, dto);
  }

  @Patch('produits/:id')
  modifierProduit(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Body() dto: ProduitDto,
  ) {
    return this.boutique.modifierProduit(a.id, id, dto);
  }

  @Delete('produits/:id')
  supprimerProduit(@CurrentAccount() a: RequestAccount, @Param('id') id: string) {
    return this.boutique.supprimerProduit(a.id, id);
  }

  @Get('commandes')
  commandes(@CurrentAccount() a: RequestAccount) {
    return this.boutique.listerCommandes(a.id);
  }

  @Patch('commandes/:id')
  suivreCommande(
    @CurrentAccount() a: RequestAccount,
    @Param('id') id: string,
    @Body() dto: SuiviCommandeDto,
  ) {
    return this.boutique.suivreCommande(a.id, id, dto);
  }
}
