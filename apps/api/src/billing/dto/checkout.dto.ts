import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Demande de paiement. `kind` choisit le tunnel :
 * - credit_pack   : rechargement de crédits (packId requis)
 * - subscription  : abonnement mensuel (planId requis)
 * - invoice       : paiement en une fois d'une facture (invoiceId requis)
 */
export class CreateCheckoutDto {
  @IsString()
  @MinLength(1)
  accountId!: string;

  @IsIn(['credit_pack', 'subscription', 'invoice'])
  kind!: 'credit_pack' | 'subscription' | 'invoice';

  @IsOptional()
  @IsString()
  packId?: string;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  invoiceId?: string;
}
