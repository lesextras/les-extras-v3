'use client';

import * as React from 'react';
import { ArrowRight, Check, type LucideIcon } from 'lucide-react';
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
 * ⚠ LE SURVOL SEUL NE SUFFIT PAS, d'où `focus-within` dans la feuille de
 * style : sur un téléphone il n'y a pas de survol, à la tabulation non plus.
 * Le texte du verso reste dans le DOM (jamais `display:none`) pour qu'un
 * lecteur d'écran le lise. Une information cachée derrière un mouvement est
 * une information perdue pour une partie des gens.
 */
export interface ChoixCompte {
  key: string;
  icon: LucideIcon;
  titre: string;
  accroche: string;
  /** Le verso : ce que la personne a besoin de savoir pour choisir. */
  detail: string;
  /** Deux ou trois points concrets, au verso. */
  points?: string[];
}

/**
 * L'APPEL À L'ACTION, PRÉSENT SUR LES DEUX FACES.
 *
 * ⚠ C'est un `<span>`, pas un `<button>` : toute la carte EST déjà un bouton,
 * et un bouton dans un bouton est du HTML invalide que les navigateurs
 * réparent chacun à leur façon. Ce rectangle est donc la partie visible du
 * bouton qui l'entoure, pas une seconde cible.
 *
 * Il figure sur le recto ET sur le verso : le verso recouvre le recto pendant
 * le survol, donc un appel à l'action posé sur une seule face disparaîtrait
 * exactement au moment où la personne vient de finir de lire.
 */
function AppelAction({ actif }: { actif: boolean }) {
  return (
    <span
      className={cn(
        'mt-auto flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors',
        actif
          ? 'border-transparent bg-primary text-primary-foreground'
          : 'border-primary/35 bg-card text-primary',
      )}
    >
      Créer un compte
      <ArrowRight aria-hidden className="size-3.5" />
    </span>
  );
}

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

  return (
    <div className="carte-3d h-full" data-retournee={retournee ? 'true' : undefined}>
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
            'carte-3d-face grid min-h-[17rem] w-full rounded-xl border-2',
            actif ? 'border-primary shadow-soft' : 'border-border hover:border-primary/40',
          )}
        >
          {/* RECTO — en flux : c'est lui qui donne sa hauteur à la carte. */}
          <span
            className={cn(
              'carte-recto flex flex-col gap-2 rounded-[inherit] p-4',
              actif ? 'bg-primary-soft/50' : 'bg-card',
            )}
          >
            {actif && (
              <span className="absolute right-3 top-3 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" />
              </span>
            )}
            <span
              className={cn(
                'grid size-10 place-items-center rounded-lg',
                actif ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground',
              )}
            >
              <Icone className="size-5" />
            </span>
            {/*
              ⚠ PAS DE CÉSURE SUR LE TITRE. `hyphens-auto` coupait
              « intervenant » en « interve- / nant » au milieu d'une carte à
              moitié vide : un mot brisé se lit deux fois plus lentement, et
              donne l'impression d'un défaut d'affichage. Les titres sont
              courts et connus — on les laisse passer à la ligne entiers.
            */}
            <span className="text-sm font-semibold leading-snug text-balance" lang="fr">
              {choix.titre}
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground" lang="fr">
              {choix.accroche}
            </span>
            <AppelAction actif={actif} />
          </span>

          {/* VERSO — superposé, jamais en flux (sinon la carte ferait le double). */}
          <span className="carte-verso flex flex-col gap-2 overflow-hidden rounded-[inherit] bg-accent p-4 text-accent-foreground">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              {choix.titre}
            </span>
            <span className="text-xs leading-relaxed" lang="fr">
              {choix.detail}
            </span>
            {choix.points && choix.points.length > 0 && (
              <ul className="space-y-1">
                {choix.points.map((p) => (
                  <li key={p} className="flex gap-1.5 text-[11px] leading-snug">
                    <span aria-hidden className="mt-[3px] size-1 shrink-0 rounded-full bg-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
            <AppelAction actif={actif} />
          </span>
        </span>
      </button>
    </div>
  );
}
