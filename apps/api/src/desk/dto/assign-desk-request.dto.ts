import { IsOptional, IsString } from "class-validator";

export class AssignDeskRequestDto {
  @IsOptional()
  @IsString()
  adminId?: string | null;
}
