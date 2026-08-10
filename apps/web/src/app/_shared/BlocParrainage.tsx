"use client";

// Parrainage intervenant : lien à partager + compteur de filleuls.
// Les points tombent quand le filleul termine sa PREMIÈRE mission —
// jamais à l'inscription, pour ne récompenser que la valeur réelle.
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

interface Parrainage {
  accountId: string;
  inscrits: number;
  actifs: number;
  pointsParFilleulActif: number;
}

export function BlocParrainage({ accountId }: { accountId: string }) {
  const { toast } = useToast();
  const [data, setData] = useState<Parrainage | null>(null);

  useEffect(() => {
    apiRequest<Parrainage>("/community/parrainage", { accountId })
      .then(setData)
      .catch(() => setData(null));
  }, [accountId]);

  if (!data) return null;
  // L'origine vient du navigateur, jamais d'une constante : le domaine du site
  // a déjà changé une fois, et un lien de parrainage figé sur l'ancien nom se
  // serait mis à envoyer les filleuls sur le mauvais site sans que personne ne
  // le voie. Repli sur le domaine principal pour le rendu serveur.
  const origine =
    typeof window !== "undefined" ? window.location.origin : "https://les-extras.fr";
  const lien = `${origine}/register?parrain=${data.accountId}`;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-base font-semibold text-foreground">Parrainez un collègue</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Quand votre filleul termine sa première mission, vous gagnez tous les deux{" "}
          {data.pointsParFilleulActif} points.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="max-w-full overflow-x-auto rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-foreground">
            {lien}
          </code>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(lien);
                toast({ title: "Lien copié", description: "Partagez-le à un collègue du secteur." });
              } catch {
                toast({ title: "Copie impossible", description: lien, variant: "error" });
              }
            }}
          >
            Copier le lien
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {data.inscrits} filleul{data.inscrits > 1 ? "s" : ""} inscrit{data.inscrits > 1 ? "s" : ""}
          {" · "}
          {data.actifs} avec une première mission terminée
        </p>
      </CardContent>
    </Card>
  );
}
