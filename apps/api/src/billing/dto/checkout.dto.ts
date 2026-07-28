import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Demande de paiement. `kind` choisit le tunnel :
 * - subscription : adhésion mensuelle à l'association (planId requis)
 * - invoice      : règlement d'une facture de prestation (invoiceId requis)
 *
 * Il n'y a pas de monnaie interne : une prestation se règle à sa facture.
 */
export class CreateCheckoutDto {
  @IsString()
  @MinLength(1)
  accountId!: string;

  @IsIn(['subscription', 'invoice'])
  kind!: 'subscription' | 'invoice';

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;
}
