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
    /** Nom de l'établissement OU nom d'affichage du freelance. */
    name: z.string().min(2, 'Ce champ doit contenir au moins 2 caractères.'),
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
  });
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
