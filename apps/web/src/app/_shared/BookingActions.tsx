"use client";

/**
 * Actions sur une candidature de renfort (côté établissement).
 *
 * La machine à états du serveur est stricte, et c'est une qualité : chaque
 * transition fait un vrai travail (confirmer crée le créneau de planning,
 * terminer ouvre la fenêtre de pointage de 72 heures). L'erreur historique de
 * ce composant était de sauter des marches — « Retenir & confirmer » envoyait
 * REQUESTED → CONFIRMED, que le serveur refuse à juste titre. Résultat : une
 * erreur 400 sur chaque clic, et aucune candidature n'a jamais pu être
 * acceptée.
 *
 * Le chemin est donc affiché tel qu'il est : retenir (accept), puis confirmer
 * (confirm), puis démarrer (start), puis terminer (complete). Et au moment où
 * le renfort est confirmé, on propose LE geste que le produit vend — établir
 * le contrat à durée déterminée — au lieu de le laisser caché derrière un
 * lien non signalé.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import type { BookingStatus } from "./types";

export function BookingActions({
  bookingId,
  accountId,
  status,
}: {
  bookingId: string;
  accountId: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  async function agir(action: string, okMsg: string, body?: Record<string, unknown>) {
    setLoading(action);
    try {
      await apiRequest(`/bookings/${bookingId}/${action}`, {
        method: "PATCH",
        ...(body ? { body } : {}),
        accountId,
      });
      toast({ title: okMsg });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(null);
    }
  }

  const decliner = (
    <Button
      size="sm"
      variant="outline"
      className="text-destructive hover:text-destructive"
      loading={loading === "cancel"}
      disabled={loading !== null && loading !== "cancel"}
      onClick={() =>
        agir("cancel", "Candidature déclinée", {
          // Décliner exige un motif : il est transmis à la personne. Celui-ci
          // est neutre et vrai ; un échange détaillé passe par la messagerie.
          reason: "Candidature non retenue par l’établissement.",
        })
      }
    >
      Décliner
    </Button>
  );

  if (status === "REQUESTED") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          loading={loading === "accept"}
          disabled={loading !== null && loading !== "accept"}
          onClick={() => agir("accept", "Candidature retenue — confirmez pour bloquer le créneau")}
        >
          Retenir
        </Button>
        {decliner}
      </div>
    );
  }

  if (status === "ACCEPTED") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          loading={loading === "confirm"}
          disabled={loading !== null && loading !== "confirm"}
          onClick={() =>
            agir("confirm", "Renfort confirmé — le créneau est posé sur le planning")
          }
        >
          Confirmer le renfort
        </Button>
        {decliner}
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <div className="flex flex-wrap gap-2">
        {/* Le pont vers le CDD, au moment exact où l'on en a besoin : la
            personne est confirmée, l'établissement l'embauche. La page du
            document reprend tout ce qui est connu. */}
        <Button asChild size="sm">
          <Link href={`/documents/contrat/${bookingId}`}>Établir le CDD</Link>
        </Button>
        <Button
          size="sm"
          variant="outline"
          loading={loading === "start"}
          disabled={loading !== null && loading !== "start"}
          onClick={() => agir("start", "Mission démarrée")}
        >
          Démarrer la mission
        </Button>
      </div>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <Button
        size="sm"
        variant="outline"
        loading={loading === "complete"}
        disabled={loading !== null && loading !== "complete"}
        onClick={() =>
          agir(
            "complete",
            "Mission terminée — la fenêtre de pointage de 72 h est ouverte",
          )
        }
      >
        Marquer terminée
      </Button>
    );
  }

  return null;
}
