import { IsArray, IsBoolean, IsOptional, IsString } from "class-validator";

/**
 * DTO pour PATCH /users/me — mise à jour directe du profil utilisateur
 * (hors wizard). Tous les champs sont optionnels (partial update).
 */
export class UpdateProfileDto {
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    jobTitle?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    zipCode?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    @IsOptional()
    @IsString()
    companyName?: string;

    @IsOptional()
    @IsString()
    siret?: string;

    @IsOptional()
    @IsString()
    tvaNumber?: string;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    availableDays?: string[];
}
