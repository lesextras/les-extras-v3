"use client";

// Lecteur vidéo « à la demande » : tant que le visiteur n'a pas cliqué, aucune
// requête n'est envoyée à YouTube et aucun cookie n'est déposé. C'est ce qui
// permet d'afficher une vidéo sans bandeau de consentement supplémentaire.
import { useState } from "react";
import { Play } from "lucide-react";

export function VideoFacade({
  id,
  titre,
  couverture,
}: {
  id: string;
  titre: string;
  couverture?: string;
}) {
  const [lance, setLance] = useState(false);
  const vignette = couverture ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

  if (lance) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-black shadow-card">
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={titre}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLance(true)}
      className="group relative block aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`Lire la vidéo : ${titre}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={vignette}
        alt=""
        loading="lazy"
        className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-card transition-transform duration-300 group-hover:scale-110">
          <Play className="size-7 translate-x-0.5 fill-current" />
        </span>
      </span>
      <span className="absolute inset-x-0 bottom-0 p-5 text-left text-sm font-semibold text-white">
        {titre}
      </span>
    </button>
  );
}
