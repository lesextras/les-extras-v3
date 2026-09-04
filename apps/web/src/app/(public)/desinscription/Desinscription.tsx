"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

export function Desinscription({ jeton }: { jeton: string }) {
  const [etat, setEtat] = useState<"attente" | "envoi" | "fait" | "erreur">("attente");

  if (!jeton) {
    return (
      <p className="text-sm text-muted-foreground">
        Ce lien est incomplet. Ouvrez-le depuis le courriel que vous avez reçu, ou écrivez-nous
        via la <Link href="/contact" className="underline">page de contact</Link>.
      </p>
    );
  }

  async function confirmer() {
    setEtat("envoi");
    try {
      await apiRequest("/public/captures/desabonnement", { method: "POST", body: { jeton } });
      setEtat("fait");
    } catch {
      setEtat("erreur");
    }
  }

  if (etat === "fait") {
    return (
      <div className="space-y-3 text-sm text-foreground">
        <p className="font-medium">C&apos;est fait. Vous ne recevrez plus la séquence des parcours.</p>
        <p className="text-muted-foreground">
          Les douze parcours restent ouverts, gratuitement, sur{" "}
          <Link href="/formations" className="underline">la page des formations</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted-foreground">
        Vous avez demandé une fiche récap et coché « recevoir les parcours suivants ». Un clic
        ci-dessous, et plus aucun message de cette séquence ne partira.
      </p>
      {etat === "erreur" ? (
        <p className="text-destructive">La demande n&apos;est pas passée. Réessayez dans un instant.</p>
      ) : null}
      <Button onClick={confirmer} disabled={etat === "envoi"}>
        {etat === "envoi" ? "Un instant…" : "Confirmer, ne plus m’écrire"}
      </Button>
    </div>
  );
}
