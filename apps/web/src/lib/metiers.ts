/**
 * LES MÉTIERS DU SECTEUR, TELS QU'ON LES DEMANDE À L'INSCRIPTION.
 *
 * Le métier pèse 30 % du score de correspondance : c'est, de loin, le premier
 * critère qui décide si un intervenant reçoit une offre de renfort. Or le
 * tunnel d'inscription ne le demandait pas — trois profils sur quatre-vingt-
 * dix-neuf l'avaient renseigné en production, et tous les autres partaient
 * avec le score plancher du métier inconnu, quelles que soient leurs
 * compétences réelles.
 *
 * Pourquoi une LISTE et non un champ libre : « éducateur spé », « ES » et
 * « Éducateur Spécialisé » ne se rencontrent jamais dans un rapprochement de
 * chaînes, et c'est l'intervenant qui en paie le prix en offres non reçues.
 *
 * `valeur` est ce qu'on enregistre — l'intitulé complet, celui qu'emploient
 * les offres des établissements. `libelle` est ce qu'on affiche : il porte le
 * sigle du métier, parce que personne ne se présente comme « accompagnant
 * éducatif et social » mais tout le monde dit « AES ».
 *
 * Cette liste est propre à l'inscription des INTERVENANTS. Celle de
 * `app/_shared/gap.ts` sert au fil d'entraide : ses regroupements (« AES /
 * AMP », « Chef de service / Direction », « Autre ») conviennent à un filtre
 * de discussion, pas à un moteur de correspondance qui doit distinguer un
 * psychomotricien d'un ergothérapeute. On ne les fusionne donc pas.
 *
 * Un intervenant dont l'intitulé exact ne figure pas ici choisit le plus
 * proche, puis précise depuis « Mon profil » — le champ y reste libre.
 */
export const METIERS_INTERVENANT = [
  { valeur: 'Éducateur spécialisé', libelle: 'Éducateur spécialisé (DEES)' },
  { valeur: 'Moniteur-éducateur', libelle: 'Moniteur-éducateur (DEME)' },
  { valeur: 'Éducateur technique spécialisé', libelle: 'Éducateur technique spécialisé (DEETS)' },
  { valeur: 'Éducateur de jeunes enfants', libelle: 'Éducateur de jeunes enfants (EJE)' },
  { valeur: 'Accompagnant éducatif et social', libelle: 'Accompagnant éducatif et social (AES)' },
  {
    valeur: 'Technicien de l’intervention sociale et familiale',
    libelle: 'Technicien de l’intervention sociale et familiale (TISF)',
  },
  { valeur: 'Psychologue', libelle: 'Psychologue' },
  { valeur: 'Psychomotricien', libelle: 'Psychomotricien' },
  { valeur: 'Ergothérapeute', libelle: 'Ergothérapeute' },
  { valeur: 'Orthophoniste', libelle: 'Orthophoniste' },
  {
    valeur: 'Conseiller en insertion professionnelle',
    libelle: 'Conseiller en insertion professionnelle (CIP)',
  },
  { valeur: 'Moniteur d’atelier', libelle: 'Moniteur d’atelier' },
  { valeur: 'Chef de service éducatif', libelle: 'Chef de service éducatif' },
] as const;

/** Les seules valeurs acceptées par le tunnel d'inscription. */
export const VALEURS_METIERS: string[] = METIERS_INTERVENANT.map((m) => m.valeur);

export type MetierIntervenant = (typeof METIERS_INTERVENANT)[number]['valeur'];
