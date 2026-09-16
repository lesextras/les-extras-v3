'use client';

import * as React from 'react';
import { Check, Sparkles, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * LA CARTE DE CHOIX DE COMPTE, QUI SE RETOURNE AU SURVOL.
 *
 * Recto : l'icône, le titre, une phrase courte. Verso : l'explication complète
 * — pour qui, ce que ça ouvre, ce que ça n'ouvre pas. Ça règle le vrai
 * problème de cet écran : la carte tenait quatre lignes de texte gris que
 * personne ne lisait, et la décision se prenait sur le seul titre.
 *
 * ⚠⚠ LA STRUCTURE À TROIS NIVEAUX N'EST PAS DÉCORATIVE :
 *
 *     div.carte-3d          →  la perspective
 *       button.carte-3d-bouton  →  le clic, SANS transformation
 *         span.carte-3d-face    →  la rotation, en contexte 3D
 *           span.carte-recto / span.carte-verso
 *
 * La rotation a d'abord été portée par le BOUTON, et ça a produit en
 * production le pire rendu possible : les trois versos affichés en
 * permanence, EN MIROIR, sans que personne ne survole quoi que ce soit. Un
 * `<button>` gère son débordement, et la spécification impose alors
 * `transform-style: flat` — le contexte 3D disparaît, `backface-visibility`
 * n'a plus rien à masquer, et le `rotateY(180deg)` du verso se rend comme une
 * simple symétrie en 2D. **Ne remontez pas la rotation sur le bouton.**
 *
 * ⚠ POUR LA MÊME RAISON, AUCUN EFFET DE SURVOL NE PASSE PAR UNE
 * TRANSFORMATION. Pas de `-translate-y`, pas de `scale` : le relief au survol
 * se fait à l'ombre et à la bordure. Une carte qui se soulève de deux pixels
 * ne vaut pas le risque de rouvrir le défaut ci-dessus.
 *
 * ⚠ LE SURVOL SEUL NE SUFFIT PAS, d'où `focus-within` dans la feuille de
 * style : sur un téléphone il n'y a pas de survol, à la tabulation non plus.
 * Le texte du verso reste dans le DOM (jamais `display:none`) pour qu'un
 * lecteur d'écran le lise. Une information cachée derrière un mouvement est
 * une information perdue pour une partie des gens.
 */

/**
 * LES TROIS TEINTES — une par compte, et c'est le contour qui les sépare.
 *
 * Les trois cartes étaient identiques : même bordure grise, même pastille
 * rose, même bouton. Trois portes qui mènent à trois produits différents se
 * ressemblaient trait pour trait, et il fallait lire pour les distinguer.
 *
 * ⚠ LES TROIS TEINTES VIENNENT DE LA PALETTE, ELLES NE SONT PAS INVENTÉES :
 * `primary` (framboise), `secondary` (terracotta) et `success` (vert) sont
 * déjà définies pour le thème clair ET le thème sombre dans `globals.css`.
 * Une quatrième couleur écrite en dur ici serait juste sur cet écran et
 * fausse partout ailleurs — et invisible en thème sombre.
 *
 * ⚠ ON TRAVAILLE EN OPACITÉ (`/10`, `/30`) PLUTÔT QU'AVEC DES JETONS
 * « soft » : `success` n'en a pas, et une couleur posée en transparence sur
 * la carte reste lisible dans les deux thèmes sans qu'on ait à redéfinir quoi
 * que ce soit.
 */
export type TeinteCarte = 'framboise' | 'terracotta' | 'vert';

interface Habillage {
  bordure: string;
  bordureActive: string;
  fond: string;
  fondActif: string;
  pastille: string;
  pastilleActive: string;
  titre: string;
  puce: string;
  coche: string;
  verso: string;
  /**
   * L'ENCART DU « POURQUOI » : le contour porte la teinte, l'intérieur reste
   * blanc.
   *
   * ⚠ IL ÉTAIT EN APLAT TEINTÉ, ET ÇA FAISAIT TROIS FONDS SUPERPOSÉS — le
   * dégradé de la carte, puis l'aplat de l'encart, puis le bouton. La phrase
   * qui doit ressortir se noyait dans un camaïeu. Un contour et du blanc la
   * détachent au lieu de la fondre.
   */
  encart: string;
}

const TEINTES: Record<TeinteCarte, Habillage> = {
  framboise: {
    bordure: 'border-primary/30',
    bordureActive: 'border-primary',
    fond: 'bg-gradient-to-b from-primary/[0.07] to-card',
    fondActif: 'bg-gradient-to-b from-primary/20 to-card',
    pastille: 'bg-primary/10 text-primary',
    pastilleActive: 'bg-primary text-primary-foreground',
    titre: 'text-primary',
    puce: 'bg-primary',
    coche: 'bg-primary text-primary-foreground',
    verso: 'bg-gradient-to-b from-primary/[0.12] to-card',
    encart: 'border border-primary/35 bg-card text-primary',
  },
  terracotta: {
    bordure: 'border-secondary/30',
    bordureActive: 'border-secondary',
    fond: 'bg-gradient-to-b from-secondary/[0.07] to-card',
    fondActif: 'bg-gradient-to-b from-secondary/20 to-card',
    pastille: 'bg-secondary/10 text-secondary',
    pastilleActive: 'bg-secondary text-secondary-foreground',
    titre: 'text-secondary',
    puce: 'bg-secondary',
    coche: 'bg-secondary text-secondary-foreground',
    verso: 'bg-gradient-to-b from-secondary/[0.12] to-card',
    encart: 'border border-secondary/35 bg-card text-secondary',
  },
  vert: {
    bordure: 'border-success/30',
    bordureActive: 'border-success',
    fond: 'bg-gradient-to-b from-success/[0.07] to-card',
    fondActif: 'bg-gradient-to-b from-success/20 to-card',
    pastille: 'bg-success/10 text-success',
    pastilleActive: 'bg-success text-success-foreground',
    titre: 'text-success',
    puce: 'bg-success',
    coche: 'bg-success text-success-foreground',
    verso: 'bg-gradient-to-b from-success/[0.12] to-card',
    encart: 'border border-success/35 bg-card text-success',
  },
};

export interface ChoixCompte {
  key: string;
  icon: LucideIcon;
  /**
   * LA CATÉGORIE, à côté de l'icône — « Établissement », « Professionnel »,
   * « Particulier ».
   *
   * ⚠ ELLE NE RÉPÈTE PAS LE TITRE. Le titre est une phrase à la première
   * personne, qui demande d'être lue ; cette pastille est l'étiquette qu'on
   * repère sans lire, du coin de l'œil, et c'est elle qui dit en un mot de
   * quel compte il s'agit. Y remettre le texte du titre supprimerait tout son
   * intérêt.
   */
  categorie: string;
  /** Ce que la personne dit d'elle, à la première personne. */
  titre: string;
  /** Qui c'est — les métiers, la situation. */
  accroche: string;
  /**
   * POURQUOI ON OUVRIRAIT CE COMPTE — une phrase, sur le recto.
   *
   * ⚠ Elle dit un BÉNÉFICE, pas une fonctionnalité. Le recto disait qui vous
   * êtes et laissait un grand vide au milieu de la carte ; il ne disait nulle
   * part ce qu'on vient chercher. Le verso, lui, ne se lit qu'au survol —
   * c'est-à-dire jamais sur un téléphone, et jamais avant d'avoir décidé.
   */
  benefice: string;
  /** La teinte qui distingue cette carte des deux autres. */
  teinte: TeinteCarte;
  /** Le verso : ce que la personne a besoin de savoir pour choisir. */
  detail: string;
  /** Deux ou trois points concrets, au verso. */
  points?: string[];
}

/**
 * ⚠ IL N'Y A PLUS DE RECTANGLE « CRÉER UN COMPTE » SUR LES CARTES.
 *
 * Il y en avait un sur chaque face, et il donnait trois boutons identiques
 * côte à côte sous trois cartes qui SONT déjà des boutons — la même action
 * écrite quatre fois sur le même écran. La carte entière reste cliquable, le
 * curseur le dit, et la teinte au survol le confirme.
 *
 * Si quelqu'un veut le remettre : c'était un `<span>`, jamais un `<button>`.
 * Un bouton dans un bouton est du HTML invalide que chaque navigateur répare à
 * sa façon.
 */

export function CarteChoix({
  choix,
  actif,
  onSelect,
  retournee,
}: {
  choix: ChoixCompte;
  actif: boolean;
  onSelect: () => void;
  /** Force l'affichage du verso (écrans tactiles). */
  retournee?: boolean;
}) {
  const Icone = choix.icon;
  const h = TEINTES[choix.teinte];

  return (
    <div className="carte-3d group h-full" data-retournee={retournee ? 'true' : undefined}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={actif}
        className="carte-3d-bouton block h-full w-full text-left"
      >
        <span
          className={cn(
            // ⚠ LA HAUTEUR MINIMALE N'EST PAS DÉCORATIVE. Le verso est en
            // `absolute inset-0` : il est donc contraint à la hauteur que le
            // RECTO donne à la carte. Sans plancher, le verso — plus long —
            // se faisait couper au milieu d'une phrase, les trois points
            // disparaissant entièrement. Toute modification du verso doit être
            // revérifiée AU SURVOL, pas seulement dans le code.
            'carte-3d-face grid min-h-[20rem] w-full rounded-2xl border-2 transition-shadow duration-300',
            actif ? h.bordureActive : h.bordure,
            actif ? 'shadow-card' : 'shadow-soft group-hover:shadow-card',
          )}
        >
          {/* RECTO — en flux : c'est lui qui donne sa hauteur à la carte. */}
          <span
            className={cn(
              'carte-recto flex flex-col gap-2.5 rounded-[inherit] p-5',
              actif ? h.fondActif : h.fond,
            )}
          >
            {actif && (
              <span
                className={cn(
                  'absolute right-3.5 top-3.5 grid size-6 place-items-center rounded-full',
                  h.coche,
                )}
              >
                <Check className="size-3.5" />
              </span>
            )}
            {/* L'icône et l'étiquette de catégorie, sur la même ligne. */}
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  'grid size-12 shrink-0 place-items-center rounded-xl transition-colors',
                  actif ? h.pastilleActive : h.pastille,
                )}
              >
                <Icone className="size-6" />
              </span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
                  h.pastille,
                )}
              >
                {choix.categorie}
              </span>
            </span>
            {/*
              ⚠ PAS DE CÉSURE SUR LE TITRE. `hyphens-auto` coupait
              « intervenant » en « interve- / nant » au milieu d'une carte à
              moitié vide : un mot brisé se lit deux fois plus lentement, et
              donne l'impression d'un défaut d'affichage.

              ⚠ LA HAUTEUR DU TITRE EST FIXÉE À TROIS LIGNES. Les titres n'ont
              pas la même longueur — « Je suis un particulier qui souhaite
              réserver des services » en prend trois — et sans plancher commun
              les trois accroches ne commencent pas à la même hauteur : la
              rangée paraît bancale. Le plancher suit le plus long ; raccourcir
              ce titre permet de le redescendre.
            */}
            <span
              className={cn(
                'flex min-h-[3.6em] items-start text-lg font-semibold leading-tight text-balance',
                actif ? h.titre : 'text-foreground',
              )}
              lang="fr"
            >
              {choix.titre}
            </span>
            <span className="text-sm leading-relaxed text-muted-foreground" lang="fr">
              {choix.accroche}
            </span>
            {/*
              LE POURQUOI. Il occupe la place que le recto laissait vide, et
              c'est la seule phrase de la carte qui parle de ce qu'on gagne.
            */}
            <span
              className={cn(
                'flex gap-2 rounded-lg px-3 py-2.5 text-xs font-medium leading-relaxed',
                h.encart,
              )}
              lang="fr"
            >
              <Sparkles aria-hidden className="mt-px size-3.5 shrink-0" />
              <span>{choix.benefice}</span>
            </span>
          </span>

          {/* VERSO — superposé, jamais en flux (sinon la carte ferait le double). */}
          <span
            className={cn(
              'carte-verso flex flex-col gap-2.5 overflow-hidden rounded-[inherit] p-5',
              h.verso,
            )}
          >
            <span
              className={cn('text-xs font-semibold uppercase tracking-wide', h.titre)}
              lang="fr"
            >
              {choix.titre}
            </span>
            <span className="text-sm leading-relaxed" lang="fr">
              {choix.detail}
            </span>
            {choix.points && choix.points.length > 0 && (
              <ul className="space-y-1.5">
                {choix.points.map((p) => (
                  <li key={p} className="flex gap-2 text-xs leading-snug" lang="fr">
                    <span
                      aria-hidden
                      className={cn('mt-[5px] size-1.5 shrink-0 rounded-full', h.puce)}
                    />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </span>
        </span>
      </button>
    </div>
  );
}
