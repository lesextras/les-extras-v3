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
const liensDe = (sections: ReturnType<typeof getNavForRole>) =>
  sections.flatMap((s) => s.items.map((i) => String(i.href)));

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
      expect(ajoute.title).toBeTruthy();
    } else {
      expect(ajoute.title).toBeUndefined();
    }
  });

  /**
   * ⚠⚠ LE TITRE DE LA RUBRIQUE DOIT DÉCRIRE CE QU'ELLE CONTIENT — 21/09/2026.
   *
   * Il valait « Gestion RH » en dur, et c'était exact tant que la rubrique ne
   * portait que les contrats CDD et le temps de travail. Le menu a été allégé
   * le 21/09 : elle accueille maintenant les alertes du catalogue, les
   * publications, les avis, la conformité — qui ne sont pas de la RH. Un titre
   * qui ne décrit que deux de ses huit lignes ment sur les six autres, et c'est
   * pire qu'un titre générique : on cherche ses alertes sous « Gestion RH » et
   * on ne les trouve pas.
   *
   * La règle est donc : le nom commun si toutes les entrées le partagent, le
   * nom du réglage sinon. Ce test tombe si quelqu'un refige le titre.
   */
  it('nomme la rubrique d’après ce qu’elle contient, pas d’après son passé', () => {
    const ajoute = avecRh[avecRh.length - 1];
    const rubriques = new Set(ajoute.items.map((i) => i.rubrique ?? 'Gestion RH'));
    if (rubriques.size === 1) {
      expect(ajoute.title).toBe([...rubriques][0]);
    } else {
      expect(ajoute.title).toBe('Outils avancés');
    }
  });

  /**
   * ⚠⚠ ON ALLÈGE LE MENU, ON NE FERME PAS DE PORTE (21/09/2026, demande de
   * Siham : « halve the menu »).
   *
   * Ce fichier a payé DEUX FOIS le fait d'enterrer un chemin unique — le
   * salarié sans accès aux missions ouvertes le 25/08, puis sans accès à ses
   * congés le 16/09, dans les deux cas parce qu'un filtre s'appliquait avant
   * qu'on ait regardé ce qui restait. Ces six entrées-là sont des gestes du
   * quotidien ou l'unique chemin vers un geste : elles ne passent pas derrière
   * un réglage, quel que soit le ménage qu'on fasse autour.
   */
  it('⚠ ne range JAMAIS derrière le réglage ce qui se fait tous les jours', () => {
    const intouchables = [
      'Tableau de bord',
      'RenforTeam',
      'Mes réservations',
      'Planning',
      'Devis & factures', // la quatrième marche du chemin de l'argent
      'Messagerie',
      'Mon équipe',
    ];
    for (const label of intouchables) {
      expect(entrees(quotidien)).toContain(label);
    }
  });

  /**
   * ⚠ LE CHEMIN DE L'ARGENT SE LIT DANS L'ORDRE : publier → être réservé →
   * faire → être payé. « Devis & factures » vivait vingt lignes plus bas, dans
   * « Mon établissement » : il fallait traverser le menu pour retrouver la
   * facture d'une réservation qu'on venait de terminer. Mesuré le 21/09 : six
   * factures sur onze dormaient en brouillon.
   */
  it('range la facturation APRÈS la réservation et le planning', () => {
    const labels = entrees(quotidien);
    expect(labels.indexOf('Devis & factures')).toBeGreaterThan(
      labels.indexOf('Mes réservations'),
    );
    expect(labels.indexOf('Devis & factures')).toBeGreaterThan(labels.indexOf('Planning'));
    expect(labels.indexOf('RenforTeam')).toBeLessThan(labels.indexOf('Mes réservations'));
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
 * LE MENU D'UN SALARIÉ.
 *
 * ⚠ SON ENTRÉE « Mes congés & mes heures » NE PORTE PAS `avance`, alors que
 * celle des responsables — qui mène au MÊME écran — la porte. C'est délibéré
 * (voir le commentaire de `nav.ts`) : le filtre de rôle s'applique AVANT le
 * filtre `avance`, si bien qu'il n'avait aucun chemin vers ses demandes
 * d'absence avant le 16/09/2026, pas même le bouton pour en chercher un.
 *
 * ⚠ IL AVAIT ZÉRO ENTRÉE AVANCÉE JUSQU'AU 21/09/2026 ; il en a deux depuis
 * l'allègement du menu, et le bouton s'affiche donc pour lui aussi. Ce n'est
 * pas une régression : rien de ce qu'il fait au quotidien n'est derrière.
 */
describe('Le menu d’un salarié', () => {
  /**
   * ⚠ MIS À JOUR LE 24/09/2026 : depuis le modèle du 23/09 (« le compte,
   * c'est la personne »), la gestion RH sort du menu. « Mon poste » et
   * « Temps de travail & congés » ne s'affichent plus ; leurs pages restent
   * servies à leur adresse. Ce test vérifie que la décision tient, pour qu'une
   * entrée ne revienne pas à moitié (dans le menu d'un rôle et pas des autres).
   */
  it('n’affiche plus la gestion RH, pour aucun rôle (modèle du 23/09/2026)', () => {
    for (const role of ['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'] as const) {
      const liens = liensDe(getNavForRole('ESTABLISHMENT', role));
      expect(liens).not.toContain('/dashboard/mon-poste');
      expect(liens).not.toContain('/dashboard/temps-de-travail');
    }
  });

  /**
   * ⚠⚠ LE CHEMIN VERS LES MISSIONS OUVERTES EST LE SEUL, et c'est le défaut
   * corrigé le 25/08/2026 : un salarié pouvait recevoir une diffusion en
   * cascade sans jamais pouvoir aller voir ce qui était ouvert.
   *
   * ⚠ On teste l'ADRESSE, pas le libellé : côté intervenant l'entrée
   * s'appelle « Missions RenforTeam » depuis le recentrage, et le test d'avant
   * tombait sur un changement de mot alors que le chemin était intact.
   *
   * ⚠ QU'IL N'Y AIT AUCUNE MISSION OUVERTE AUJOURD'HUI N'EST PAS UNE RAISON DE
   * LE RANGER : le menu est calculé sans aucune donnée, et le jour où il y en
   * a une, personne ne doit avoir à trouver un réglage pour la voir.
   */
  it('⚠ garde le chemin vers les missions ouvertes pour l’intervenant', () => {
    expect(liensDe(getNavForRole('FREELANCE', 'OWNER'))).toContain('/dashboard/opportunites');
    expect(liensDe(getNavForRole('FREELANCE', 'MEMBER'))).toContain('/dashboard/opportunites');
  });

  /**
   * ⚠ PLUS DE RÔLES SUR LES EXTRAS (24/09/2026). Le compte, c'est la
   * personne : le menu ne dépend plus du rôle hérité en base. Un ancien
   * « salarié » voit exactement le menu du titulaire.
   */
  it('le menu est le même quel que soit le rôle hérité en base', () => {
    for (const type of ['ESTABLISHMENT', 'FREELANCE', 'PARTICULIER'] as const) {
      const titulaire = liensDe(getNavForRole(type, 'OWNER'));
      for (const role of ['ADMIN', 'MANAGER', 'MEMBER'] as const) {
        expect(liensDe(getNavForRole(type, role))).toEqual(titulaire);
      }
    }
  });
});
