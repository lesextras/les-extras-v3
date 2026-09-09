'use client';

// UNE FENÊTRE SE POSE SUR L'ÉCRAN, PAS DANS LA COLONNE (09/09/2026).
//
// `position: fixed` est ancré à la fenêtre du navigateur — SAUF si un parent
// porte un `transform`, un `filter` ou une `perspective` : ce parent devient
// alors le bloc de référence, et le « plein écran » se réduit à lui. Dans cet
// espace, `<main>` porte l'animation d'entrée `.monte` (translateY) : toute
// fenêtre écrite dedans se retrouvait enfermée dans la colonne de contenu,
// avec sa propre barre de défilement et son bouton de validation sous le bord.
// C'est le défaut que Siham a vu le 08/09 sur « Ajouter une formation ».
//
// L'animation de `<main>` a été retirée, mais on ne veut pas que le défaut
// puisse revenir au premier `transform` ajouté un jour dans la coque. Une
// fenêtre passe donc TOUJOURS par ce portail : son HTML est déplacé à la
// racine du document, hors d'atteinte de tout parent transformé.
import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Portail({ children }: { children: ReactNode }) {
  // Rien au premier rendu : `document` n'existe pas côté serveur, et rendre le
  // même arbre des deux côtés évite l'avertissement d'hydratation.
  const [pose, setPose] = useState(false);
  useEffect(() => setPose(true), []);
  if (!pose) return null;
  return createPortal(children, document.body);
}
