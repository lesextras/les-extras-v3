"use client";

// Actions ADMIN sur une réservation : changement de statut libre.
//   PATCH /admin/bookings/:id/status  { status: BookingStatus }
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { BOOKING_STATUS_LABEL } from "./format";
import type { BookingStatus } from "./types";

const STATUS_ORDER: BookingStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export function AdminBookingActions({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [value, setValue] = useState<BookingStatus>(status);
  const [loading, setLoading] = useState(false);

  async function apply(next: BookingStatus) {
    setLoading(true);
    try {
      await apiRequest(`/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        body: { status: next },
      });
      toast({
        title: "Statut mis à jour",
        description: BOOKING_STATUS_LABEL[next] ?? next,
        variant: "success",
      });
      setValue(next);
      router.refresh();
    } catch (err) {
      toast({
        title: "Mise à jour impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
      setValue(status);
    } finally {
      setLoading(false);
    }
  }

  const canCancel = status !== "CANCELLED" && status !== "COMPLETED";

  return (
    <div className="flex items-center justify-end gap-2">
      <select
        value={value}
        disabled={loading}
        onChange={(e) => setValue(e.target.value as BookingStatus)}
        aria-label="Nouveau statut de la réservation"
        className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
      >
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {BOOKING_STATUS_LABEL[s] ?? s}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        disabled={loading || value === status}
        onClick={() => apply(value)}
      >
        {loading ? "…" : "Appliquer"}
      </Button>
      {canCancel ? (
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          disabled={loading}
          onClick={() => apply("CANCELLED")}
        >
          Annuler
        </Button>
      ) : null}
    </div>
  );
}
