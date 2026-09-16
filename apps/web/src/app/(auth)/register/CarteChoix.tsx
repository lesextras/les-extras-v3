'use client';

import * as React from 'react';
import { Check, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * LA CARTE DE CHOIX DE COMPTE, QUI SE RETOURNE AU SURVOL.
 *
 * Recto : l'icône, le titre, une phrase courte. Verso : l'explication complète
 * — pour qui, ce que ça ouvre, ce que ça n'ouvre pas. Ça règle le vrai
 * problème de cet écran : la carte tenait quatre lignes de texte gris que
 * personne ne lisait, et la décision se prenait sur le seul titre.
 *
 * ⚠ LE SURVOL SEUL NE SUFFIT PAS, ET C'EST POUR ÇA QUE `focus-within` EST DANS
 * LA FEUILLE DE STYLE. Sur un téléphone il n'y a pas de survol ; à la
 * tabulation non plus. Le verso doit donc être atteignable au clavier, et son
 * texte reste dans le DOM (jamais `display:none`) pour qu'un lecteur d'écran
 * le lise. Une information cachée derrière un mouvement est une information
 * perdue pour une partie des gens.
 *
 * Sur écran tactile, où il n'y a rien à survoler, `data-retournee` permet à la
 * page de montrer le verso autrement (premier appui, bouton « en savoir plus »).
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
        className={cn(
          // ⚠ LA HAUTEUR MINIMALE N'EST PAS DÉCORATIVE. Le verso est en
          // `absolute inset-0` : il est donc contraint à la hauteur que le
          // RECTO donne à la carte. Sans plancher, le verso — plus long —
          // débordait et se faisait couper au milieu d'une phrase, les trois
          // points disparaissant entièrement. Toute modification du verso doit
          // être reverifiée au survol, pas seulement dans le code.
          'carte-3d-face relative grid min-h-[13.5rem] w-full rounded-xl border-2 text-left',
          actif
            ? 'border-primary shadow-soft'
            : 'border-border hover:border-primary/40',
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
          {/* Un mot long ne doit ni déborder de la carte ni la faire grandir :
              la carte reste large de sa colonne, et c'est le mot qui se coupe. */}
          <span
            className="text-sm font-semibold leading-snug text-balance hyphens-auto [overflow-wrap:anywhere]"
            lang="fr"
          >
            {choix.titre}
          </span>
          <span className="text-xs leading-relaxed text-muted-foreground hyphens-auto" lang="fr">
            {choix.accroche}
          </span>
        </span>

        {/* VERSO — superposé, jamais en flux (sinon la carte ferait le double). */}
        <span className="carte-verso flex flex-col gap-2 overflow-hidden rounded-[inherit] bg-accent p-4 text-accent-foreground">
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            {choix.titre}
          </span>
          <span className="text-xs leading-relaxed hyphens-auto" lang="fr">
            {choix.detail}
          </span>
          {choix.points && choix.points.length > 0 && (
            <ul className="mt-auto space-y-1">
              {choix.points.map((p) => (
                <li key={p} className="flex gap-1.5 text-[11px] leading-snug">
                  <span aria-hidden className="mt-[3px] size-1 shrink-0 rounded-full bg-primary" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </span>
      </button>
    </div>
  );
}
