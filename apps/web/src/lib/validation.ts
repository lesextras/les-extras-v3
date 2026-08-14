import { z } from 'zod';
import { VALEURS_METIERS } from './metiers';

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

/** Mot de passe oublié — demande du lien. */
export const motDePasseOublieSchema = z.object({
  email: z.string().min(1, 'L’e-mail est requis.').email('Adresse e-mail invalide.'),
});
export type MotDePasseOublieValues = z.infer<typeof motDePasseOublieSchema>;

/**
 * Choix du nouveau mot de passe.
 *
 * Exactement les mêmes règles qu'à l'inscription — et l'API les applique de
 * son côté (voir password-reset.dto.ts). Deux exigences qui divergeraient
 * seraient une porte laissée entrouverte.
 */
export const nouveauMotDePasseSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Au moins 8 caractères.')
      .regex(/[A-Za-z]/, 'Ajoutez au moins une lettre.')
      .regex(/[0-9]/, 'Ajoutez au moins un chiffre.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirmPassword'],
  });
export type NouveauMotDePasseValues = z.infer<typeof nouveauMotDePasseSchema>;

/** Étape 1 du wizard d'onboarding : informations de profil. */
export const onboardingProfileSchema = z.object({
  // Un champ vide n'est pas « invalide » : c'est juste vide. Avant, un
  // téléphone ou un code postal non renseigné affichait « invalide », ce qui
  // laissait croire que la valeur tapée était rejetée — alors que rien n'avait
  // été saisi. Un premier refine dédié distingue les deux cas, comme le fait
  // déjà « Ville requise. » ci-dessous.
  phone: z
    .string()
    .refine((v) => v.trim().length > 0, 'Téléphone requis.')
    .refine((v) => v.trim().length >= 10 && /^[0-9 +().-]+$/.test(v.trim()), 'Numéro de téléphone invalide.'),
  // La ville n'est pas un ornement : la proximité pèse 25 % du score de
  // correspondance, et un intervenant sans ville ne remonte sur aucune
  // recherche locale. Elle était déjà exigée par ce schéma ; ce qui manquait,
  // c'est que l'écran ne laisse plus la contourner (voir wizard-form).
  city: z.string().min(2, 'Ville requise.'),
  postalCode: z
    .string()
    .refine((v) => v.trim().length > 0, 'Code postal requis.')
    .refine((v) => /^\d{5}$/.test(v.trim()), 'Code postal invalide (5 chiffres).'),
  /**
   * Métier — obligatoire pour un INTERVENANT, sans objet pour un
   * établissement. Le schéma de base l'accepte vide (parcours établissement)
   * et `onboardingProfileSchemaPour('FREELANCE')` l'exige : un seul objet de
   * formulaire, deux exigences selon le type de compte.
   */
  job: z.string().optional().or(z.literal('')),
  bio: z.string().max(600, '600 caractères maximum.').optional().or(z.literal('')),
});
export type OnboardingProfileValues = z.infer<typeof onboardingProfileSchema>;

/**
 * Le schéma d'onboarding SELON LE TYPE DE COMPTE.
 *
 * Le métier pèse 30 % du score de correspondance — le premier critère du
 * moteur — et le tunnel ne le demandait pas : trois profils sur
 * quatre-vingt-dix-neuf l'avaient renseigné en production, tous les autres
 * partaient invisibles au matching. Il devient donc obligatoire pour les
 * intervenants, choisi dans la liste des métiers du secteur (voir
 * `lib/metiers.ts` : un intitulé libre ne se rapproche de rien).
 *
 * Un établissement, lui, n'a pas de métier : lui imposer ce champ n'aurait
 * aucun sens, et son parcours n'est pas touché.
 */
export function onboardingProfileSchemaPour(typeDeCompte: 'ESTABLISHMENT' | 'FREELANCE') {
  if (typeDeCompte !== 'FREELANCE') return onboardingProfileSchema;
  return onboardingProfileSchema.extend({
    job: z
      .string()
      .refine((v) => v.trim().length > 0, 'Indiquez votre métier.')
      .refine(
        (v) => VALEURS_METIERS.includes(v.trim()),
        'Choisissez un métier dans la liste proposée.',
      ),
  });
}
