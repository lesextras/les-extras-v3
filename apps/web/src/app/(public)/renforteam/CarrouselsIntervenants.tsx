"use client";

// LA TEAM, MÉTIER PAR MÉTIER (01/10/2026, demande de Siham).
//
// Un carrousel par métier : éducateur spécialisé, moniteur-éducateur, AES,
// puis tout autre métier présent dans l'annuaire. Défilement horizontal
// natif (scroll-snap) : le doigt glisse sur mobile, les flèches servent à la
// souris et au clavier. Aucune bibliothèque de carrousel.
//
// ⚠ Les données viennent de GET /public/vendors (l'annuaire public), le même
// que la fiche /intervenants/[id]. Rien n'est inventé ici : nom, métier et
// ville sont ceux que l'API renvoie, photo absente = initiales.
//
// ⚠ « Demander cette personne » ne crée aucun champ d'API : il ouvre le
// formulaire #demande de la page avec `?intervenant=<id>`, et le formulaire
// écrit « Intervenant souhaité : … » dans le texte de la demande de contact.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MapPin, UserRound, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";

export type IntervenantCarte = {
  id: string;
  nom: string;
  metier: string | null;
  ville: string | null;
  logoUrl: string | null;
};

export type GroupeMetier = { metier: string; intervenants: IntervenantCarte[] };

export function CarrouselsIntervenants({
  groupes,
  demandeCiblee,
}: {
  groupes: GroupeMetier[];
  /** Faux en offre complète : le formulaire #demande n'existe pas alors. */
  demandeCiblee: boolean;
}) {
  return (
    <div className="space-y-10">
      {groupes.map((g) => (
        <Carrousel key={g.metier} groupe={g} demandeCiblee={demandeCiblee} />
      ))}
    </div>
  );
}

function Carrousel({ groupe, demandeCiblee }: { groupe: GroupeMetier; demandeCiblee: boolean }) {
  const piste = useRef<HTMLUListElement>(null);
  // Les flèches n'apparaissent que si la rangée déborde : deux cartes sur un
  // grand écran n'ont rien à faire défiler.
  const [deborde, setDeborde] = useState(false);
  useEffect(() => {
    const el = piste.current;
    if (!el) return;
    const mesurer = () => setDeborde(el.scrollWidth > el.clientWidth + 8);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const idTitre = `team-${groupe.metier
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  function defiler(sens: 1 | -1) {
    const el = piste.current;
    if (!el) return;
    const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: sens * el.clientWidth * 0.85, behavior: reduit ? "auto" : "smooth" });
  }

  return (
    <section aria-labelledby={idTitre} className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <h3 id={idTitre} className="flex items-baseline gap-2 text-xl font-semibold text-foreground">
          {groupe.metier}
          <span className="text-sm font-normal text-muted-foreground">
            {groupe.intervenants.length}
          </span>
        </h3>
        <div className={cn("flex shrink-0 gap-2", !deborde && "invisible")} aria-hidden={!deborde}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => defiler(-1)}
            aria-controls={`${idTitre}-piste`}
            aria-label={`${groupe.metier} : intervenants précédents`}
          >
            <ArrowLeft className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => defiler(1)}
            aria-controls={`${idTitre}-piste`}
            aria-label={`${groupe.metier} : intervenants suivants`}
          >
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <ul
        ref={piste}
        id={`${idTitre}-piste`}
        tabIndex={0}
        aria-label={`Intervenants : ${groupe.metier}`}
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-3 [scrollbar-width:thin] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:scroll-auto"
      >
        {groupe.intervenants.map((i) => (
          <li key={i.id} className="w-[250px] shrink-0 snap-start sm:w-[260px]">
            <Carte intervenant={i} demandeCiblee={demandeCiblee} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function Carte({ intervenant: i, demandeCiblee }: { intervenant: IntervenantCarte; demandeCiblee: boolean }) {
  const lienDemande = `/renforteam?intervenant=${encodeURIComponent(i.id)}&nom=${encodeURIComponent(i.nom)}#demande`;
  return (
    <article className="group flex h-full flex-col items-center rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Portrait nom={i.nom} src={i.logoUrl} />
      <p className="mt-3 line-clamp-1 font-semibold text-foreground">{i.nom}</p>
      <p className="line-clamp-1 text-sm text-muted-foreground">{i.metier ?? "Intervenant"}</p>
      {i.ville ? (
        <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden />
          {i.ville}
        </p>
      ) : null}
      <div className="mt-4 grid w-full gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/intervenants/${i.id}`}>Voir le profil</Link>
        </Button>
        {demandeCiblee ? (
          <Button asChild size="sm">
            <Link href={lienDemande} aria-label={`Demander ${i.nom}`}>
              <Send className="size-3.5" aria-hidden />
              Demander cette personne
            </Link>
          </Button>
        ) : null}
      </div>
    </article>
  );
}

/**
 * Photo ronde, ou initiales. ⚠ Pas `components/ui/avatar` ici : son repli ne
 * s'efface qu'au `onLoad` côté client, et une image déjà chargée avant
 * l'hydratation laissait les initiales collées à côté de la photo.
 */
function Portrait({ nom, src }: { nom: string; src: string | null }) {
  const [erreur, setErreur] = useState(false);
  return (
    <span className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/10 text-lg font-semibold text-primary ring-4 ring-primary/15">
      {src && !erreur ? (
        // eslint-disable-next-line @next/next/no-img-element -- hôtes de photos de profil non listés dans next.config
        <img src={src} alt={`Photo de ${nom}`} className="size-full object-cover" onError={() => setErreur(true)} />
      ) : (
        initials(nom) || <UserRound className="size-6" aria-hidden />
      )}
    </span>
  );
}
