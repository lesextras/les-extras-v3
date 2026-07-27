import { IsEnum } from "class-validator";

export enum CreditPackType {
  STARTER = "STARTER",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

export class BuyCreditsDto {
  @IsEnum(CreditPackType)
  packType!: CreditPackType;
}
