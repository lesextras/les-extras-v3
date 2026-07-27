import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min, Max } from "class-validator";

/**
 * Payload envoyé à chaque step du wizard d'onboarding.
 * Certains champs sont des alias métier (ex. `establishmentName` → `companyName`)
 * résolus dans users.service.ts pour éviter de polluer le controller.
 */
export class UpdateOnboardingDto {
    @IsNumber()
    @Min(1)
    @Max(10)
    step!: number;

    // ── Identité personnelle ──────────────────────────────────────
    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    /**
     * Alias wizard : "Jean Dupont" → firstName="Jean", lastName="Dupont"
     * Utilisé par EstablishmentFlow step 3 (contact prioritaire).
     */
    @IsOptional()
    @IsString()
    contactName?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsString()
    jobTitle?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    skills?: string[];

    // ── Localisation ──────────────────────────────────────────────
    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsString()
    city?: string;

    @IsOptional()
    @IsString()
    zipCode?: string;

    // ── Établissement ─────────────────────────────────────────────
    /**
     * Alias wizard ESTABLISHMENT → companyName dans Profile.
     */
    @IsOptional()
    @IsString()
    establishmentName?: string;

    /**
     * Alias wizard ESTABLISHMENT → jobTitle dans Profile
     * (stocke le type de structure : IME, MECS, FAM…).
     */
    @IsOptional()
    @IsString()
    establishmentType?: string;    @IsOptional()
    @IsString()
    siret?: string;

    // ── Disponibilite ──────────────────────────────────────────────
    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    // ── Documents (reference URL apres upload) ──────────────────────
    @IsOptional()
    @IsString()
    diplomaUrl?: string;
}

