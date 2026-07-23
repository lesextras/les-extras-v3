import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

/** Génère une facture pour le compte actif, éventuellement liée à un booking. */
export class CreateInvoiceDto {
  @IsOptional()
  @IsString()
  bookingId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount!: number;
}
