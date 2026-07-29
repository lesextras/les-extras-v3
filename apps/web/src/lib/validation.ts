import { z } from 'zod';

/** Schémas de validation partagés (react-hook-form + zod). */

export const loginSchema = z.object({
  email: z.string().min(1, 'L’e-mail est requis.').email('Adresse e-mail invalide.'),
  password: z.string().min(1, 'Le mot de passe est requis.'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    accountType: z.enum(['ESTABLISHMENT', 'FREELANCE'], {
      required_error: 'Choisissez un type de compte.',
    }),
    /**
     * L'API attend un prénom et un nom SÉPARÉS, plus le nom de la structure
     * à part. Un champ « nom » unique ne peut pas alimenter les trois, et
     * c'est ce qui faisait échouer toute inscription depuis le formulaire.
     */
    firstName: z.string().min(2, 'Indiquez votre prénom.').max(80, 'Prénom trop long.'),
    lastName: z.string().min(2, 'Indiquez votre nom.').max(80, 'Nom trop long.'),
    /** Requis uniquement pour un établissement — voir le refine plus bas. */
    organizationName: z.string().max(160, 'Nom trop long.').optional(),
    email: z.string().min(1, 'L’e-mail est requis.').email('Adresse e-mail invalide.'),
    password: z
      .string()
      .min(8, 'Au moins 8 caractères.')
      .regex(/[A-Za-z]/, 'Ajoutez au moins une lettre.')
      .regex(/[0-9]/, 'Ajoutez au moins un chiffre.'),
    confirmPassword: z.string(),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Vous devez accepter les conditions.' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  })
  .refine(
    (data) =>
      data.accountType !== 'ESTABLISHMENT' || (data.organizationName?.trim().length ?? 0) >= 2,
    {
      message: 'Indiquez le nom de votre établissement.',
      path: ['organizationName'],
    },
  );
export type RegisterValues = z.infer<typeof registerSchema>;

/** Étape 1 du wizard d'onboarding : informations de profil. */
export const onboardingProfileSchema = z.object({
  phone: z
    .string()
    .min(10, 'Numéro de téléphone invalide.')
    .regex(/^[0-9 +().-]+$/, 'Numéro de téléphone invalide.'),
  city: z.string().min(2, 'Ville requise.'),
  postalCode: z.string().regex(/^\d{5}$/, 'Code postal invalide (5 chiffres).'),
  bio: z.string().max(600, '600 caractères maximum.').optional().or(z.literal('')),
});
export type OnboardingProfileValues = z.infer<typeof onboardingProfileSchema>;
