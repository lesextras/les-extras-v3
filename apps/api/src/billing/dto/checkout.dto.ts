import { IsIn, IsOptional, IsString } from 'class-validator';

/**
 * Demande de paiement. `kind` choisit le tunnel :
 * - subscription : adhésion mensuelle à l'association (planId requis)
 * - invoice      : règlement d'une facture de prestation (invoiceId requis)
 *
 * Il n'y a pas de monnaie interne : une prestation se règle à sa facture.
 */
export class CreateCheckoutDto {
  // Le compte payeur ne figure plus ici : il vient du garde, qui a vérifié
  // l'appartenance. Le laisser dans le corps de la requête, c'était laisser
  // le client désigner qui paie.
  @IsIn(['subscription', 'invoice'])
  kind!: 'subscription' | 'invoice';

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;
}
