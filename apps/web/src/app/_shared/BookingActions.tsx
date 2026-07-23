"use client";

// Actions sur une candidature/réservation (côté ESTABLISHMENT).
// Flow SOS Renfort — étape 3 : accepter -> confirmer (booking) une candidature.
//   PATCH /bookings/:id { status }
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

  async function setStatus(next: BookingStatus, okMsg: string) {
    setLoading(next);
    try {
      await apiRequest(`/bookings/${bookingId}`, {
        method: "PATCH",
        body: { status: next },
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
