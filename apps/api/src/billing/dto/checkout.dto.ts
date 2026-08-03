import { IsIn, IsOptional, IsString } from 'class-validator';

/**
 * Demande de paiement. `kind` choisit le tunnel :
 * - subscription : abonnement LEX à recharge quotidienne (planId requis)
 * - credits      : pack de crédits LEX en une fois (packId requis)
 * - invoice      : règlement d'une facture de prestation (invoiceId requis)
 *
 * La mise en relation, elle, ne se paie pas : seuls LEX et les factures
 * émises passent par ici.
 */
export class CreateCheckoutDto {
  // Le compte payeur ne figure plus ici : il vient du garde, qui a vérifié
  // l'appartenance. Le laisser dans le corps de la requête, c'était laisser
  // le client désigner qui paie.
  @IsIn(['subscription', 'credits', 'invoice'])
  kind!: 'subscription' | 'credits' | 'invoice';

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  packId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;
}
