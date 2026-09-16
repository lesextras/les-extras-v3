import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AccountType } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  /**
   * L'API acceptait « aaaaaaaa » : huit caractères, aucune autre exigence.
   * Le formulaire d'inscription, lui, réclame déjà une lettre ET un chiffre
   * (voir apps/web/src/lib/validation.ts). L'interface était donc plus
   * stricte que le serveur — un appel direct passait sous la règle affichée.
   * On aligne le serveur sur ce que le site promet déjà.
   */
  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(72, { message: 'Le mot de passe ne peut dépasser 72 caractères.' })
  @Matches(/[A-Za-z]/, { message: 'Le mot de passe doit contenir au moins une lettre.' })
  @Matches(/[0-9]/, { message: 'Le mot de passe doit contenir au moins un chiffre.' })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  /**
   * ⚠ EXIGÉ PAR LE FORMULAIRE, TOLÉRÉ PAR L'API — et c'est volontaire.
   *
   * Le téléphone est obligatoire à l'inscription depuis le 16/09/2026
   * (`registerSchema`, côté web) : c'est le numéro sur lequel on rappelle quand
   * un renfort se décide dans l'heure. L'API, elle, l'accepte absent, pour deux
   * raisons qui n'ont rien de théoriques :
   *
   *  1. le web et l'API se déploient séparément. Exiger le numéro ici ferait
   *     refuser en 400 toutes les inscriptions parties de l'ancien écran
   *     pendant les quelques minutes qui séparent les deux redéploiements —
   *     c'est-à-dire des comptes qui ne s'ouvrent jamais, pour un champ qui
   *     n'engage rien ;
   *  2. un numéro absent ne crée aucun risque : il ne donne aucun droit, ne
   *     signe rien et n'apparaît nulle part publiquement. La règle des fiches
   *     ateliers (« l'API fait foi, le client n'est qu'une politesse ») vaut
   *     pour ce qui protège quelqu'un, pas pour un champ de confort.
   *
   * Le format, lui, n'est pas contrôlé ici non plus : la seule borne est la
   * longueur. Deux expressions régulières de part et d'autre divergeraient au
   * premier numéro étranger.
   */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  /**
   * Type de compte créé à l'inscription :
   *  - FREELANCE : compte personnel du praticien.
   *  - ESTABLISHMENT : organisation (MECS, IME...), nécessite un nom de structure.
   */
  @IsEnum(AccountType)
  accountType!: AccountType;

  /** Nom de la structure — requis pour un compte ESTABLISHMENT. */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  organizationName?: string;

  /**
   * L'ÉTABLISSEMENT QU'ON REJOINT — ET C'EST LUI QUI ÉVITE LE DOUBLON.
   *
   * ⚠⚠ QUAND CE CHAMP EST RENSEIGNÉ, AUCUN COMPTE N'EST CRÉÉ. La personne
   * devient membre NON VÉRIFIÉ du compte existant, et c'est tout.
   *
   * Avant, reconnaître son établissement à l'inscription (« c'est le mien »)
   * créait quand même un compte homonyme — avec le nom exact de l'autre, donc
   * un slug suffixé — PUIS demandait le rattachement au vrai. Douze salariés
   * d'une même MECS produisaient douze maisons : douze organigrammes d'une
   * personne, douze catalogues, et une équipe coupée en douze sans que
   * personne ne s'en aperçoive. Et ces doublons réapparaissaient aussitôt dans
   * la liste censée les éviter.
   *
   * ⚠ UN IDENTIFIANT INCONNU NE FAIT PAS ÉCHOUER L'INSCRIPTION : on retombe
   * sur la création normale. Le champ vient d'une liste cliquée, mais une
   * inscription ne se refuse pas sur un identifiant périmé.
   */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  rejoindreEtablissementId?: string;

  /**
   * Profil SALARIÉ : la personne travaille pour un établissement et vient s'y
   * rattacher. Le compte reste de type FREELANCE — c'est bien un compte
   * personnel — mais il n'ouvre que LEX tant qu'aucun établissement ne l'a
   * accepté. Ignoré pour un compte ESTABLISHMENT, qui ne se rattache à rien.
   */
  @IsOptional()
  @IsBoolean()
  profilSalarie?: boolean;

  // --- Attribution ---------------------------------------------------------
  // Envoyés par le navigateur, donc non fiables par nature : on les borne en
  // longueur et on ne s'en sert que pour des statistiques, jamais pour une
  // décision d'accès.
  @IsOptional() @IsString() @MaxLength(60) source?: string;
  @IsOptional() @IsString() @MaxLength(60) sourceMedium?: string;
  @IsOptional() @IsString() @MaxLength(60) sourceCampaign?: string;
  @IsOptional() @IsString() @MaxLength(120) sourceLanding?: string;
  /** Compte intervenant parrain (lien de parrainage). */
  @IsOptional() @IsString() @MaxLength(60) parrain?: string;
}
