/**
 * LES DROITS DÉCLARÉS — la liste, écrite UNE seule fois.
 *
 * Deux écrans la portent : la dernière étape de l'inscription et « Mon poste ».
 * Dupliquée, elle divergeait au premier ajout — et un droit visible d'un côté,
 * absent de l'autre, c'est une case qu'on croit avoir cochée.
 *
 * ⚠ CES DROITS SONT DÉCLARATIFS. Personne ne les vérifie en amont : le premier
 * compte d'un établissement n'est pas forcément celui d'un cadre, et exiger une
 * confirmation d'en haut bloquerait tout le monde en attendant une direction
 * qui n'existe peut-être pas encore. Ce qui tient le dispositif, c'est la
 * TRAÇABILITÉ — la déclaration figure sur chaque devis et chaque réservation,
 * avec le poste.
 *
 * ⚠ TOUTE VALEUR AJOUTÉE ICI DOIT EXISTER DANS L'ÉNUMÉRATION `Capacite` DU
 * SCHÉMA PRISMA, et donc dans une migration. Le serveur refuse une valeur
 * inconnue, et le refus arrive au moment où la personne valide sa fiche.
 */

import { renfortSalarieVisible } from '@/lib/offre';

export interface Droit {
  cle: string;
  libelle: string;
  aide: string;
}

export interface GroupeDroits {
  titre: string;
  /** Ce que le groupe couvre, en une phrase. */
  intro?: string;
  /** Vrai pour le groupe qui demande une attention particulière. */
  sensible?: boolean;
  droits: Droit[];
}

export const GROUPES_DROITS: GroupeDroits[] = [
  {
    titre: 'Engager l’établissement',
    droits: [
      {
        cle: 'RESERVER_DIRECT',
        libelle: 'Réserver un intervenant directement',
        aide: 'Sinon, votre bouton dira « Demander un devis ».',
      },
      {
        cle: 'SIGNER_CONVENTIONS',
        libelle: 'Signer les conventions',
        aide: 'Engager l’établissement sur un document.',
      },
      {
        cle: 'VOIR_FACTURES',
        libelle: 'Voir les factures',
        aide: 'Les documents comptables de l’établissement.',
      },
    ],
  },
  {
    titre: 'Équipe et renfort',
    droits: [
      {
        cle: 'DEMANDER_RENFORT_INTERNE',
        libelle: 'Demander du renfort en interne',
        aide: 'Solliciter les salariés de votre établissement.',
      },
      {
        cle: 'OUVRIR_RENFORT_CDD',
        libelle: 'Ouvrir un renfort en CDD',
        aide: 'Publier une mission auprès du réseau.',
      },
      {
        // ⚠ C'est le droit qui fait vivre le modèle : inviter, c'est constituer
        // son périmètre. Il manquait à l'écran alors qu'il existait en base —
        // un chef de service ne pouvait donc pas se l'accorder.
        cle: 'INVITER_MEMBRES',
        libelle: 'Inviter des collègues',
        aide: 'Constituer votre équipe et lui accorder des droits.',
      },
      {
        cle: 'GERER_PLANNING',
        libelle: 'Gérer le planning',
        aide: 'Les disponibilités et les créneaux de votre service.',
      },
      {
        cle: 'VALIDER_INSCRIPTIONS',
        libelle: 'Valider les ateliers et les formations',
        aide: 'Pour les personnes de votre service.',
      },
    ],
  },
  {
    titre: 'Publier au nom de l’établissement',
    intro:
      'Ce qui sort sous le nom de votre établissement et se lit publiquement.',
    droits: [
      {
        cle: 'PUBLIER_ATELIER',
        libelle: 'Publier une fiche atelier',
        aide: 'Proposer un atelier au catalogue.',
      },
      {
        cle: 'PUBLIER_ARTICLE',
        libelle: 'Publier un article',
        aide: 'Écrire sur l’Édublog au nom de l’établissement.',
      },
      {
        cle: 'PUBLIER_ACTUALITE',
        libelle: 'Publier une actualité',
        aide: 'Annoncer un événement, une ouverture, un recrutement.',
      },
    ],
  },
  {
    titre: 'Données sensibles',
    intro:
      'À n’accorder qu’aux personnes dont c’est le métier. Ces deux droits ne sont jamais donnés d’office, même à un responsable.',
    sensible: true,
    droits: [
      {
        // ⚠ LE DROIT LE PLUS SENSIBLE DU PRODUIT. Le coffre-fort porte des
        // pièces d'identité, des casiers judiciaires et des diplômes. Il
        // n'avait aucun droit déclaré : il s'ouvrait sur le seul rôle
        // applicatif, sans que personne ne l'ait dit ni accordé.
        cle: 'VOIR_CONFORMITE',
        libelle: 'Consulter le coffre-fort de conformité',
        aide: 'Pièces d’identité, casiers judiciaires, diplômes de l’équipe.',
      },
      {
        // La seule chose qui coûte de l'argent sur la plateforme.
        cle: 'UTILISER_CREDITS_LEX',
        libelle: 'Utiliser les générations LEX de l’établissement',
        aide: 'Consommer le forfait partagé de l’équipe.',
      },
    ],
  },
];

/** La liste à plat — pour les écrans qui n'affichent pas de groupes. */
export const DROITS: Droit[] = GROUPES_DROITS.flatMap((g) => g.droits);

/**
 * LES GROUPES RÉELLEMENT AFFICHÉS.
 *
 * Le renfort de poste en CDD sort de l'offre publique le 19/09/2026 (voir
 * `@/lib/offre`) : on cesse de proposer le droit de l'ouvrir. Le droit
 * lui-même n'est pas supprimé — ni de cette liste, ni de l'énumération Prisma,
 * ni des comptes qui l'ont déjà déclaré. Il cesse seulement d'être offert, et
 * il revient avec NEXT_PUBLIC_OFFRE_PUBLIQUE=complete.
 *
 * ⚠ Un groupe vidé de tous ses droits disparaîtrait en laissant son titre :
 * on l'écarte donc entièrement. Ici « Équipe et renfort » en garde trois, il
 * reste.
 */
export function groupesDroitsProposes(): GroupeDroits[] {
  if (renfortSalarieVisible()) return GROUPES_DROITS;
  return GROUPES_DROITS.map((g) => ({
    ...g,
    droits: g.droits.filter((d) => d.cle !== 'OUVRIR_RENFORT_CDD'),
  })).filter((g) => g.droits.length > 0);
}
