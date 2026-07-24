import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Diplôme / formation du CV freelance. */
export class CreateQualificationDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  organization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  year?: string;
}

/** Expérience professionnelle du CV freelance. */
export class CreateExperienceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  year?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
