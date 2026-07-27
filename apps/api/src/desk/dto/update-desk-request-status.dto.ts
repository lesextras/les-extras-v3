import { IsEnum } from "class-validator";
import { DeskRequestStatus } from "@prisma/client";

export class UpdateDeskRequestStatusDto {
  @IsEnum(DeskRequestStatus)
  status!: DeskRequestStatus;
}
