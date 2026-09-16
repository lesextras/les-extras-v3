import { describe, it, expect } from 'vitest';
import { PARCOURS, CHOIX_COMPTE, type CleCompte } from '@/app/(auth)/register/parcours';
import { GROUPES_DROITS, DROITS } from '@/lib/droits';
import { registerSchema } from '@/lib/validation';

/**
 * LE PARCOURS D'INSCRIPTION — ce qui doit rester vrai côté écran.
 *
 * ⚠ CE FICHIER VERROUILLE UN ORDRE, PAS UNE MAQUETTE.
 *
 * Le compte a d'abord été créé au tout premier écran, avant qu'on sache ce
 * qu'était la personne, puis « qualifié » ensuite. Ça obligeait à corriger le
 * compte après coup — son type, son nom, et son SLUG. Or le slug est calculé à
 * la création et jamais recalculé : une MECS gardait pour toujours l'adresse
 * publique du prénom de la personne qui l'avait ouverte.
 *
 * D'où l'ordre actuel, que ces tests tiennent : la situation d'abord (une carte
 * à cliquer, pas un formulaire), le nom de l'établissement AVEC les
 * identifiants, et le compte créé complet du premier coup.
 */
describe('parcours d’inscription', () => {
  describe('⚠ l’ordre des étapes', () => {
    it('commence TOUJOURS par la situation', () => {
      for (const type of Object.keys(PARCOURS) as CleCompte[]) {
        expect(PARCOURS[type][0].cle).toBe('profil');
      }
    });

    it('crée le compte à la deuxième étape, « vos identifiants »', () => {
      for (const type of Object.keys(PARCOURS) as CleCompte[]) {
        expect(PARCOURS[type][1].cle).toBe('identite');
      }
    });

    /**
     * ⚠ NE PAS « RÉPARER » CE TEST en ajoutant une étape de lieu de travail.
     *
     * L'établissement, l'entité qui emploie, le service et le poste sont
     * saisis DANS « vos identifiants », et le nom de l'établissement doit y
     * rester : c'est lui qui fixe le slug, calculé une seule fois à la
     * création. Une étape « établissement » séparée, avant ou après, ramène
     * l'un des deux défauts qu'on a payés — l'adresse publique au prénom de la
     * personne, ou un écran entier pour taper « Internat ».
     */
    it('ne fait pas d’étape à part du lieu de travail', () => {
      const cles = PARCOURS.ESTABLISHMENT.map((e) => e.cle);
      expect(cles).toEqual(['profil', 'identite', 'poste']);
    });

    it('n’impose aucune étape de lieu à un intervenant ni à un particulier', () => {
      for (const type of ['FREELANCE', 'PARTICULIER'] as const) {
        const cles = PARCOURS[type].map((e) => e.cle);
        expect(cles).not.toContain('poste');
      }
    });

    /**
     * ⚠ LA STRUCTURE VIENT APRÈS LA CRÉATION DU COMPTE, ET C'EST LA RÈGLE.
     *
     * Elle est facultative pour entrer et exigée pour publier — le refus est
     * posé côté serveur, au moment de la publication. La déplacer avant
     * « identite » reviendrait à demander un SIRET à quelqu'un qui vient
     * seulement se rendre disponible pour un remplacement en CDD, c'est-à-dire
     * à fermer la porte à ceux pour qui elle a été ouverte.
     */
    it('demande sa structure à l’intervenant, APRÈS la création du compte', () => {
      const cles = PARCOURS.FREELANCE.map((e) => e.cle);
      expect(cles).toContain('structure');
      expect(cles.indexOf('structure')).toBeGreaterThan(cles.indexOf('identite'));
    });

    it('demande à l’intervenant ce qu’il vient faire', () => {
      expect(PARCOURS.FREELANCE.map((e) => e.cle)).toContain('activites');
    });

    /**
     * ⚠ LE COMPTE PARTICULIER N'EST PLUS SEULEMENT CELUI D'UN PARENT : il
     * ouvre aussi la porte à quelqu'un qui veut faire des remplacements en
     * CDD. C'est le chemin le plus propre juridiquement, et c'est ce qui manque
     * le plus au renfort. Retirer cette étape referme cette porte.
     */
    it('demande au particulier ce qu’il vient chercher', () => {
      expect(PARCOURS.PARTICULIER.map((e) => e.cle)).toContain('disponibilite');
    });

    it('tient en quatre étapes au plus', () => {
      for (const type of Object.keys(PARCOURS) as CleCompte[]) {
        expect(PARCOURS[type].length).toBeLessThanOrEqual(4);
      }
    });

    it('chaque étape explique ce qu’elle sert à faire', () => {
      for (const type of Object.keys(PARCOURS) as CleCompte[]) {
        for (const e of PARCOURS[type]) {
          expect(e.titre.length).toBeGreaterThan(3);
          expect(e.explication.length).toBeGreaterThan(20);
        }
      }
    });
  });

  describe('les cartes de situation', () => {
    it('en propose trois — « Salarié » a été fusionnée avec « Établissement »', () => {
      expect(CHOIX_COMPTE).toHaveLength(3);
      expect(CHOIX_COMPTE.map((c) => c.key)).toEqual([
        'ESTABLISHMENT',
        'FREELANCE',
        'PARTICULIER',
      ]);
    });

    it('chaque carte a un recto ET un verso renseignés', () => {
      for (const c of CHOIX_COMPTE) {
        expect(c.titre.length).toBeGreaterThan(3);
        expect(c.accroche.length).toBeGreaterThan(10);
        expect(c.detail.length).toBeGreaterThan(40);
      }
    });

    /**
     * ⚠ LE RECTO DIT POURQUOI, PAS SEULEMENT QUI. Le verso ne se lit qu'au
     * survol — c'est-à-dire jamais sur un téléphone, et jamais avant d'avoir
     * décidé. Une carte sans sa phrase de bénéfice laisse le visiteur choisir
     * sur la seule foi de son intitulé.
     */
    it('chaque carte dit en une phrase pourquoi on ouvrirait ce compte', () => {
      for (const c of CHOIX_COMPTE) {
        expect(c.benefice.length).toBeGreaterThan(30);
        // Une phrase, pas un paragraphe : elle tient sous le titre.
        expect(c.benefice.length).toBeLessThanOrEqual(90);
      }
    });

    /**
     * ⚠ TROIS TEINTES DISTINCTES. Trois portes vers trois produits différents
     * ne doivent pas se ressembler trait pour trait : c'est le contour qui les
     * sépare, et deux cartes de la même couleur annuleraient tout l'effet.
     */
    it('porte trois teintes différentes', () => {
      const teintes = CHOIX_COMPTE.map((c) => c.teinte);
      expect(new Set(teintes).size).toBe(3);
    });

    /**
     * ⚠ LA PASTILLE NE RÉPÈTE PAS LE TITRE. Elle est l'étiquette qu'on repère
     * sans lire ; le titre est la phrase qu'on lit. Y recopier le titre
     * supprimerait tout son intérêt.
     */
    it('porte une catégorie courte, distincte du titre', () => {
      for (const c of CHOIX_COMPTE) {
        expect(c.categorie.length).toBeGreaterThan(3);
        expect(c.categorie.length).toBeLessThanOrEqual(20);
        expect(c.categorie).not.toBe(c.titre);
      }
      expect(new Set(CHOIX_COMPTE.map((c) => c.categorie)).size).toBe(3);
    });

    /**
     * ⚠ LE VERSO EST CONTRAINT PAR LA HAUTEUR DE LA CARTE (`min-h` dans
     * CarteChoix.tsx) : il est en `absolute inset-0`, donc du texte trop long
     * se fait couper au survol. Ce plafond est volontairement bas.
     */
    it('le verso reste assez court pour ne pas déborder de la carte', () => {
      for (const c of CHOIX_COMPTE) {
        expect(c.detail.length).toBeLessThanOrEqual(160);
        expect(c.points?.length ?? 0).toBeLessThanOrEqual(3);
      }
    });

    it('aucune carte ne parle de « salarié » comme d’une situation à part', () => {
      const titres = CHOIX_COMPTE.map((c) => c.titre.toLowerCase());
      expect(titres.some((t) => t.startsWith('salarié'))).toBe(false);
    });

    /**
     * ⚠ « PARENT » A ÉTÉ RETIRÉ DU NOM, et il ne doit pas revenir. Le compte
     * particulier ne sert plus seulement à réserver pour un enfant : il ouvre
     * aussi aux remplacements en CDD. Le remettre dans le titre exclurait
     * d'un mot la moitié des gens à qui cette carte s'adresse.
     */
    it('la carte particulier ne se dit plus « parent »', () => {
      const particulier = CHOIX_COMPTE.find((c) => c.key === 'PARTICULIER');
      expect(particulier?.titre.toLowerCase()).not.toContain('parent');
      expect(particulier?.categorie.toLowerCase()).not.toContain('parent');
    });
  });

  describe('les droits déclarés', () => {
    it('sont uniques — aucune clé en double entre les groupes', () => {
      const cles = DROITS.map((d) => d.cle);
      expect(new Set(cles).size).toBe(cles.length);
    });

    it('portent ceux demandés : publier un article, une actualité, un atelier', () => {
      const cles = DROITS.map((d) => d.cle);
      expect(cles).toContain('PUBLIER_ARTICLE');
      expect(cles).toContain('PUBLIER_ACTUALITE');
      expect(cles).toContain('PUBLIER_ATELIER');
    });

    /**
     * ⚠ CES TROIS-LÀ EXISTAIENT EN BASE SANS ÊTRE PROPOSÉS NULLE PART.
     * « Inviter des collègues » est celui qui fait vivre tout le modèle : sans
     * lui à l'écran, un chef de service ne pouvait pas se l'accorder, donc pas
     * constituer son équipe.
     */
    it('proposent inviter, gérer le planning et voir les factures', () => {
      const cles = DROITS.map((d) => d.cle);
      expect(cles).toContain('INVITER_MEMBRES');
      expect(cles).toContain('GERER_PLANNING');
      expect(cles).toContain('VOIR_FACTURES');
    });

    it('isolent les deux droits sensibles dans un groupe signalé', () => {
      const sensible = GROUPES_DROITS.find((g) => g.sensible);
      expect(sensible).toBeDefined();
      const cles = sensible!.droits.map((d) => d.cle);
      expect(cles).toContain('VOIR_CONFORMITE');
      expect(cles).toContain('UTILISER_CREDITS_LEX');
      expect(sensible!.intro).toBeTruthy();
    });

    it('expliquent chacun ce qu’il ouvre', () => {
      for (const d of DROITS) {
        expect(d.libelle.length).toBeGreaterThan(5);
        expect(d.aide.length).toBeGreaterThan(10);
      }
    });
  });

  describe('la validation du formulaire', () => {
    const base = {
      firstName: 'Camille',
      lastName: 'Durand',
      email: 'camille@exemple.fr',
      // Obligatoire depuis le 16/09/2026 : il fait partie du socle commun,
      // sans quoi chaque cas ci-dessous échouerait pour la mauvaise raison.
      phone: '06 12 34 56 78',
      password: 'motdepasse1',
      confirmPassword: 'motdepasse1',
      acceptTerms: true as const,
    };

    /**
     * ⚠ OBLIGATOIRE, ET IL DOIT LE RESTER. Le type est connu avant la création
     * précisément pour que le compte naisse juste. Le rendre facultatif
     * ramènerait un compte qu'il faut corriger après — et le slug, lui, ne se
     * corrige pas.
     */
    it('exige la situation', () => {
      const r = registerSchema.safeParse({ ...base });
      expect(r.success).toBe(false);
    });

    it("exige le nom de l'établissement pour un établissement", () => {
      const r = registerSchema.safeParse({ ...base, accountType: 'ESTABLISHMENT' });
      expect(r.success).toBe(false);
    });

    it("n'exige pas de nom d'établissement pour un intervenant", () => {
      const r = registerSchema.safeParse({ ...base, accountType: 'FREELANCE' });
      expect(r.success).toBe(true);
    });

    it('accepte un établissement complet', () => {
      const r = registerSchema.safeParse({
        ...base,
        accountType: 'ESTABLISHMENT',
        organizationName: 'MECS Les Tilleuls',
      });
      expect(r.success).toBe(true);
    });

    /**
     * ⚠ OBLIGATOIRE DEPUIS LE 16/09/2026 — demande de Siham.
     *
     * Il a été facultatif jusque-là. Ne pas « réparer » ces tests en remettant
     * `.optional()` : c'est le numéro sur lequel on rappelle quand un renfort
     * se décide dans l'heure.
     */
    describe('le téléphone — obligatoire', () => {
      it.each([
        ['06 12 34 56 78'],
        ['0612345678'],
        ['06.12.34.56.78'],
        ['+33 6 12 34 56 78'],
        ['01 45 67 89 10'],
      ])('accepte %s', (phone) => {
        const r = registerSchema.safeParse({ ...base, accountType: 'FREELANCE', phone });
        expect(r.success).toBe(true);
      });

      it('refuse un champ vide', () => {
        const r = registerSchema.safeParse({ ...base, accountType: 'FREELANCE', phone: '' });
        expect(r.success).toBe(false);
      });

      it('refuse un champ absent', () => {
        const { phone: _ignore, ...sansTelephone } = base;
        const r = registerSchema.safeParse({ ...sansTelephone, accountType: 'FREELANCE' });
        expect(r.success).toBe(false);
      });

      /**
       * Un champ vide et un numéro faux ne disent pas la même chose : « requis »
       * pour l'un, « invalide » pour l'autre. Confondus, le message laisse
       * croire que ce qui a été tapé est rejeté alors que rien ne l'a été.
       */
      it('distingue « requis » de « invalide »', () => {
        const vide = registerSchema.safeParse({
          ...base,
          accountType: 'FREELANCE',
          phone: '   ',
        });
        const faux = registerSchema.safeParse({
          ...base,
          accountType: 'FREELANCE',
          phone: 'appelez-moi',
        });
        expect(vide.success).toBe(false);
        expect(faux.success).toBe(false);
        const msg = (r: typeof vide) =>
          r.success ? '' : r.error.issues.map((i) => i.message).join(' ');
        expect(msg(vide)).toContain('requis');
        expect(msg(faux)).toContain('invalide');
      });
    });

    it('refuse deux mots de passe différents', () => {
      const r = registerSchema.safeParse({
        ...base,
        accountType: 'FREELANCE',
        confirmPassword: 'autrechose1',
      });
      expect(r.success).toBe(false);
    });

    it('refuse un mot de passe sans chiffre', () => {
      const r = registerSchema.safeParse({
        ...base,
        accountType: 'FREELANCE',
        password: 'motdepasse',
        confirmPassword: 'motdepasse',
      });
      expect(r.success).toBe(false);
    });

    it('refuse les conditions non acceptées', () => {
      const r = registerSchema.safeParse({
        ...base,
        accountType: 'FREELANCE',
        acceptTerms: false,
      });
      expect(r.success).toBe(false);
    });
  });
});
