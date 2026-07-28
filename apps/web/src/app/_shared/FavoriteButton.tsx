"use client";

// Cœur « mettre de côté ». Le favori est enregistré côté serveur : un
// directeur qui repère trois ateliers depuis son bureau les retrouve le
// lendemain sur son téléphone. Sans compte, le bouton renvoie vers la
// connexion en gardant la page d'origine.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

export function FavoriteButton({
  serviceId,
  initial = false,
  connecte,
  retour,
  className,
}: {
  serviceId: string;
  initial?: boolean;
  connecte: boolean;
  /** Chemin vers lequel revenir après connexion. */
  retour: string;
  className?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [favori, setFavori] = useState(initial);
  const [occupe, setOccupe] = useState(false);

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
      router.refresh();
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
