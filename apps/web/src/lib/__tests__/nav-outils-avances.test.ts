import { describe, expect, it } from 'vitest';
import { compterOutilsAvances, getNavForRole } from '../nav';

/**
 * LES OUTILS AVANCÉS S'AJOUTENT AU MENU — ILS NE LE REMPLACENT PLUS.
 *
 * ⚠⚠ CE QUE CES TESTS PROTÈGENT, ET POURQUOI IL FAUT LE DIRE PLUTÔT QUE DE
 * FAIRE COMME SI L'ANCIENNE RÈGLE N'AVAIT JAMAIS EXISTÉ.
 *
 * Le 12/08/2026, le réglage a été transformé en aiguillage : activer les outils
 * avancés masquait tout le reste du menu. Le motif d'alors était juste — les
 * activer ajoutait des entrées AU MILIEU de vingt autres, et on cherchait dans
 * un menu devenu plus long ce qu'on venait précisément d'ouvrir. Mais la
 * réponse coûtait plus cher que le défaut : un chef de service qui ouvrait
 * « Contrats CDD » perdait l'accès à ses renforts, à ses réservations et à LEX
 * tant qu'il n'avait pas retrouvé le bouton du bas. Et comme il ne reste que
 * DEUX entrées avancées, l'aiguillage produisait un menu de deux lignes réparti
 * en deux rubriques d'une seule entrée — ce que la règle « deux entrées ne font
 * pas une rubrique » interdit partout ailleurs dans ce même fichier.
 *
 * Trois choses doivent tenir, et chacune a son test :
 *   1. le menu du quotidien reste entier quand on affiche la gestion RH ;
 *   2. les entrées avancées sont groupées dans UNE rubrique, jamais éparpillées
 *      en rubriques d'une entrée ;
 *   3. sans le réglage, aucune entrée avancée ne s'affiche.
 */

const entrees = (sections: ReturnType<typeof getNavForRole>) =>
  sections.flatMap((s) => s.items.map((i) => i.label));

describe('Les outils avancés du menu établissement', () => {
  const quotidien = getNavForRole('ESTABLISHMENT', 'OWNER');
  const avecRh = getNavForRole('ESTABLISHMENT', 'OWNER', { outilsAvances: true });

  it('n’affiche aucune entrée avancée tant qu’on ne les demande pas', () => {
    expect(entrees(quotidien)).not.toContain('Contrats CDD');
    expect(entrees(quotidien)).not.toContain('Temps de travail & congés');
  });

  /**
   * ⚠ LE TEST QUI COMPTE. Si quelqu'un remet le filtre en aiguillage, c'est
   * celui-ci qui tombe : le menu du quotidien serait vide.
   */
  it('garde TOUT le menu du quotidien quand on affiche la gestion RH', () => {
    for (const label of entrees(quotidien)) {
      expect(entrees(avecRh)).toContain(label);
    }
    expect(entrees(avecRh).length).toBeGreaterThan(entrees(quotidien).length);
  });

  /**
   * ⚠ CE TEST A ÉTÉ REPRIS LE 21/09/2026, ET IL FAUT DIRE POURQUOI.
   *
   * Il exigeait UNE rubrique nommée « Gestion RH » portant PLUS D'UNE entrée.
   * C'était vrai tant qu'il y avait deux entrées avancées. Le jour où
   * « Contrats CDD » a été conditionné à l'offre publique (le remplacement de
   * poste en CDD est sorti de l'offre le 19/09), il n'en reste qu'une — et la
   * règle « deux entrées ne font pas une rubrique » veut alors qu'elle rejoigne
   * le menu SANS titre.
   *
   * Le test vérifie donc l'intention, pas la forme d'un seul état : les
   * entrées avancées s'ajoutent en UN SEUL bloc, nommé s'il y en a plusieurs,
   * anonyme s'il n'y en a qu'une. Les deux autres tests du fichier — le menu
   * du quotidien intégralement conservé, et aucune rubrique titrée d'une seule
   * entrée — tiennent la règle dans les deux cas.
   */
  it('ajoute les entrées avancées en un seul bloc, nommé seulement s’il en porte plusieurs', () => {
    // Le bloc ajouté est le dernier : `filtrerAvances` le pose en queue.
    expect(avecRh.length).toBe(quotidien.length + 1);
    const ajoute = avecRh[avecRh.length - 1];
    expect(ajoute.items.length).toBeGreaterThan(0);
    if (ajoute.items.length > 1) {
      expect(ajoute.title).toBe('Gestion RH');
    } else {
      expect(ajoute.title).toBeUndefined();
    }
  });

  /**
   * ⚠ AUCUNE RUBRIQUE D'UNE SEULE ENTRÉE, nulle part, dans aucun des deux
   * états. C'est la règle écrite dans `nav.ts` (« deux entrées ne font pas une
   * rubrique »), et c'est exactement ce que l'aiguillage produisait.
   */
  it('ne produit jamais de rubrique titrée d’une seule entrée', () => {
    for (const sections of [quotidien, avecRh]) {
      for (const s of sections) {
        if (s.title) expect(s.items.length).toBeGreaterThan(1);
      }
    }
  });

  it('compte les entrées avancées indépendamment de l’état du réglage', () => {
    expect(compterOutilsAvances('ESTABLISHMENT', 'OWNER')).toBe(
      entrees(avecRh).length - entrees(quotidien).length,
    );
  });
});

/**
 * ⚠ LE SALARIÉ N'A PAS D'OUTILS AVANCÉS, et le bouton ne doit pas s'afficher
 * pour lui. Son entrée « Mes congés & mes heures » mène au même écran que
 * l'entrée des responsables mais ne porte PAS `avance` — c'est délibéré (voir
 * le commentaire de `nav.ts`), et c'est ce qui lui a rendu un chemin vers ses
 * demandes d'absence le 16/09/2026.
 */
describe('Le menu d’un salarié', () => {
  it('porte ses congés dans le menu du quotidien, sans réglage à trouver', () => {
    const menu = getNavForRole('ESTABLISHMENT', 'MEMBER');
    expect(entrees(menu)).toContain('Mes congés & mes heures');
    expect(compterOutilsAvances('ESTABLISHMENT', 'MEMBER')).toBe(0);
  });
});
