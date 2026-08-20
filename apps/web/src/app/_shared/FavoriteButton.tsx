"use client";

// Cœur « mettre de côté ». Le favori est enregistré côté serveur : un
// directeur qui repère trois ateliers depuis son bureau les retrouve le
// lendemain sur son téléphone. Sans compte, le bouton renvoie vers la
// connexion en gardant la page d'origine.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useVisiteur } from "./Visiteur";

/**
 * L'état initial n'est PLUS passé en props depuis le serveur : il l'était, et
 * cela obligeait le catalogue à lire la session pendant le rendu, donc à ne
 * jamais être cachable. Le cœur lit maintenant son propre état dans le
 * contexte visiteur, alimenté par une requête unique après l'affichage.
 *
 * Conséquence assumée : le cœur s'allume avec un temps de retard, de l'ordre
 * de la centaine de millisecondes. Un cœur qui s'allume tard est un désagrément ;
 * une page recalculée à chaque visite est un coût permanent.
 */
export function FavoriteButton({
  serviceId,
  retour,
  className,
}: {
  serviceId: string;
  /** Chemin vers lequel revenir après connexion. */
  retour: string;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const visiteur = useVisiteur();
  const connecte = Boolean(visiteur?.connecte);
  const [favori, setFavori] = useState(false);
  const [occupe, setOccupe] = useState(false);

  // On ne recopie l'état serveur qu'à l'arrivée de la réponse, et jamais
  // ensuite : sans ce garde-fou, un `router.refresh()` déclenché par un autre
  // cœur de la grille écraserait un clic tout juste effectué ici.
  const [initialise, setInitialise] = useState(false);
  useEffect(() => {
    if (!visiteur || initialise) return;
    setFavori(visiteur.favoris.includes(serviceId));
    setInitialise(true);
  }, [visiteur, initialise, serviceId]);

  async function basculer(e: React.MouseEvent) {
    // La carte entière est un lien : il ne faut pas naviguer en cliquant le cœur.
    e.preventDefault();
    e.stopPropagation();

    if (!connecte) {
      router.push(`/login?next=${encodeURIComponent(retour)}`);
      return;
    }

    const cible = !favori;
    setFavori(cible); // retour visuel immédiat
    setOccupe(true);
    try {
      const res = await fetch(`/api/proxy/favorites/${serviceId}`, {
        method: cible ? "POST" : "DELETE",
      });
      if (!res.ok) throw new Error("Enregistrement impossible");
      // Plus de `router.refresh()` : la page ne connaît plus les favoris, il
      // n'y a donc rien à recalculer côté serveur. L'état local fait foi.
    } catch {
      setFavori(!cible); // on remet l'état réel
      toast({ title: "Impossible d'enregistrer ce favori", variant: "error" });
    } finally {
      setOccupe(false);
    }
  }

  return (
    <button
      type="button"
      onClick={basculer}
      disabled={occupe}
      aria-pressed={favori}
      aria-label={favori ? "Retirer des favoris" : "Mettre de côté"}
      title={favori ? "Retirer des favoris" : "Mettre de côté"}
      className={cn(
        "grid size-9 place-items-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-soft backdrop-blur transition-all hover:scale-105 hover:text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
        favori && "border-secondary/30 text-secondary",
        className,
      )}
    >
      <Heart className={cn("size-4 transition-transform", favori && "fill-current")} />
    </button>
  );
}
