"use client";

// Visuel d'une carte, avec repli. Le composant sert un seul but : qu'une carte
// n'affiche JAMAIS l'icône d'image cassée du navigateur. Une vignette en panne
// ne se clique pas, et la publicité amène des visiteurs qui ne reviendront pas.
//
// Deux protections :
//  - pas de source exploitable → on rend directement le repli (`children`),
//    donc dès le rendu serveur : aucun clignotement, et le robot d'indexation
//    ne voit pas d'image morte ;
//  - la source échoue dans le navigateur (fichier retiré de la médiathèque,
//    hôte muet) → bascule sur le même repli.
import Image from "next/image";
import { useState, type ReactNode } from "react";

export function VisuelCarte({
  src,
  alt,
  sizes,
  priority = false,
  className = "object-cover",
  children,
}: {
  /** URL déjà normalisée (voir `@/lib/media`). */
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** Ce qu'on affiche à la place du visuel : dégradé de marque, libellé… */
  children: ReactNode;
}) {
  const [casse, setCasse] = useState(false);

  if (!src || casse) return <>{children}</>;

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className}
      onError={() => setCasse(true)}
    />
  );
}
