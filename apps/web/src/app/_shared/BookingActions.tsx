"use client";

// Actions sur une candidature de renfort (côté ESTABLISHMENT).
//
// Ces boutons appelaient `PATCH /bookings/:id { status }` — une route qui
// n'a jamais existé. Chaque clic partait donc en 404, et le message affiché
// ressemblait à une panne alors que c'était un lien mort. Le serveur expose
// une route PAR transition, parce que chaque transition fait autre chose
// que changer un champ : confirmer crée le créneau de planning, terminer
// ouvre la fenêtre de pointage de 72 h. On appelle donc la bonne.
import { useState } from "react";
import { useRouter } from "next/navigation";
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

  /** Chaque statut visé a sa route : c'est là que vit sa logique métier. */
  const ROUTE: Partial<Record<BookingStatus, string>> = {
    ACCEPTED: "accept",
    CONFIRMED: "confirm",
    IN_PROGRESS: "start",
    COMPLETED: "complete",
    CANCELLED: "cancel",
  };

  async function setStatus(next: BookingStatus, okMsg: string) {
    const action = ROUTE[next];
    if (!action) return;
    setLoading(next);
    try {
      await apiRequest(`/bookings/${bookingId}/${action}`, {
        method: "PATCH",
        // Décliner exige un motif : il est transmis à la personne. Celui-ci
        // est neutre et vrai ; un échange détaillé passe par la messagerie,
        // qui est le bon endroit pour ça.
        ...(action === "cancel"
          ? { body: { reason: "Candidature non retenue par l’établissement." } }
          : {}),
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

  if (status === "REQUESTED") {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={loading !== null}
          onClick={() => setStatus("CONFIRMED", "Candidat retenu — renfort confirmé")}
        >
          {loading === "CONFIRMED" ? "…" : "Retenir & confirmer"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          disabled={loading !== null}
          onClick={() => setStatus("CANCELLED", "Candidature déclinée")}
        >
          {loading === "CANCELLED" ? "…" : "Décliner"}
        </Button>
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled={loading !== null}
        onClick={() => setStatus("COMPLETED", "Mission marquée comme terminée")}
      >
        {loading === "COMPLETED" ? "…" : "Marquer terminée"}
      </Button>
    );
  }

  return null;
}
