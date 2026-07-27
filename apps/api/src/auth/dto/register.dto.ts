import { IsEmail, IsIn, IsString, MinLength } from "class-validator";

const PUBLIC_REGISTER_ROLES = ["ESTABLISHMENT", "FREELANCE"] as const;
type PublicRegisterRole = (typeof PUBLIC_REGISTER_ROLES)[number];

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsIn(PUBLIC_REGISTER_ROLES)
  role!: PublicRegisterRole;
}
