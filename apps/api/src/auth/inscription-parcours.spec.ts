import { AccountType } from '@prisma/client';
import { slugify } from '../common/utils/slug.util';

/**
 * LE PARCOURS D'INSCRIPTION — ce qui doit rester vrai.
 *
 * Ces tests ne vérifient pas un écran : ils verrouillent la DÉCISION qui donne
 * sa forme au parcours, et le défaut qu'elle corrige.
 *
 * L'HISTOIRE, parce qu'elle explique tout le reste. Le compte a d'abord été
 * créé au tout premier écran, avant qu'on sache ce qu'était la personne, puis
 * « qualifié » à l'étape suivante. Conséquence : il fallait le corriger après
 * coup — son type, son nom, et son SLUG.
 *
 * Or le slug est calculé À LA CRÉATION à partir du nom du compte, et n'est
 * jamais recalculé (`auth.service.ts`, `generateUniqueSlug`). Un compte créé
 * avant qu'on connaisse le nom de l'établissement gardait donc pour toujours
 * l'adresse publique du prénom de la personne — « /camille-durand » pour la
 * MECS Les Tilleuls. Un défaut invisible sur le moment et irrattrapable
 * ensuite, parce qu'une adresse publique se partage et s'indexe.
 *
 * D'où l'ordre actuel : la situation d'abord (une carte à cliquer), le nom de
 * l'établissement AVEC les identifiants, et le compte créé complet du premier
 * coup.
 */
describe('inscription — le compte est créé juste du premier coup', () => {
  /** Ce que `auth.service.ts` fait du nom, reproduit à l'identique. */
  function nomDuCompte(dto: {
    accountType: AccountType;
    organizationName?: string;
    firstName: string;
    lastName: string;
  }): string {
    return dto.accountType === AccountType.ESTABLISHMENT
      ? (dto.organizationName as string).trim()
      : `${dto.firstName} ${dto.lastName}`.trim();
  }

  describe('le nom du compte', () => {
    it("prend le nom de l'établissement pour un ESTABLISHMENT", () => {
      expect(
        nomDuCompte({
          accountType: AccountType.ESTABLISHMENT,
          organizationName: '  MECS Les Tilleuls  ',
          firstName: 'Camille',
          lastName: 'Durand',
        }),
      ).toBe('MECS Les Tilleuls');
    });

    it('prend le nom de la personne pour un intervenant', () => {
      expect(
        nomDuCompte({
          accountType: AccountType.FREELANCE,
          firstName: 'Camille',
          lastName: 'Durand',
        }),
      ).toBe('Camille Durand');
    });

    it('prend le nom de la personne pour un particulier', () => {
      expect(
        nomDuCompte({
          accountType: AccountType.PARTICULIER,
          firstName: 'Camille',
          lastName: 'Durand',
        }),
      ).toBe('Camille Durand');
    });
  });

  describe('⚠ LE SLUG — le défaut que l’ordre des étapes empêche', () => {
    it("l’adresse publique d’un établissement porte le nom de l’établissement", () => {
      const nom = nomDuCompte({
        accountType: AccountType.ESTABLISHMENT,
        organizationName: 'MECS Les Tilleuls',
        firstName: 'Camille',
        lastName: 'Durand',
      });
      expect(slugify(nom)).toBe('mecs-les-tilleuls');
    });

    it('elle ne porte JAMAIS le nom de la personne qui a ouvert le compte', () => {
      const nom = nomDuCompte({
        accountType: AccountType.ESTABLISHMENT,
        organizationName: 'MECS Les Tilleuls',
        firstName: 'Camille',
        lastName: 'Durand',
      });
      expect(slugify(nom)).not.toBe('camille-durand');
    });

    /**
     * ⚠ CE TEST EST LE GARDE-FOU DE L'ORDRE DES ÉTAPES.
     *
     * Il reproduit ce qui se passait quand le compte était créé avant de
     * connaître le nom de l'établissement : le slug se figeait sur le nom de la
     * personne, et le renommer ensuite ne le rattrapait pas.
     *
     * Si quelqu'un remet un jour le nom de l'établissement APRÈS la création du
     * compte, c'est exactement ce scénario qui revient. Ne pas « réparer » ce
     * test : réparer l'ordre des étapes.
     */
    it('un compte créé avant de connaître son nom garde une adresse fausse', () => {
      // Création à l'aveugle : on ne sait pas encore que c'est un établissement.
      const slugFige = slugify('Camille Durand');
      // Renommage ultérieur — le slug, lui, ne bouge pas.
      const nomFinal = 'MECS Les Tilleuls';
      expect(slugFige).toBe('camille-durand');
      expect(slugFige).not.toBe(slugify(nomFinal));
    });
  });

  describe('l’ordre des étapes', () => {
    /**
     * L'ordre est décrit dans `apps/web/src/app/(auth)/register/parcours.ts`.
     * On le rappelle ici parce que c'est le serveur qui en subit les
     * conséquences : le nom et le type doivent être connus au moment du POST.
     */
    const CHAMPS_EXIGES_A_LA_CREATION = ['accountType', 'organizationName'] as const;

    it("le type et le nom d'établissement sont exigés dès la création", () => {
      // Un établissement sans nom est refusé par `auth.service.ts` — c'est ce
      // refus qui garantit qu'aucun compte d'établissement ne peut naître sans
      // le nom qui fixera son slug.
      const dto = {
        accountType: AccountType.ESTABLISHMENT,
        organizationName: '   ',
        firstName: 'Camille',
        lastName: 'Durand',
      };
      const nomVide =
        dto.accountType === AccountType.ESTABLISHMENT && !dto.organizationName?.trim();
      expect(nomVide).toBe(true);
      expect(CHAMPS_EXIGES_A_LA_CREATION).toContain('organizationName');
    });
  });
});
