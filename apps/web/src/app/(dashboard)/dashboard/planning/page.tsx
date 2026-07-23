// Planning : agenda des missions & réservations à venir, groupé par jour.
import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../../../_shared/ui";
import {
  BOOKING_STATUS_LABEL,
  bookingBadgeVariant,
  formatMoney,
} from "../../../_shared/format";
import type { Booking } from "../../../_shared/types";

export const metadata: Metadata = { title: "Planning · Les Extras" };

function dayKey(iso?: string | null) {
  if (!iso) return "Sans date";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function hour(iso?: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default async function PlanningPage() {
  const session = await requireSession();
  const { data, error } = await fetchApi<Booking[]>(
    session,
    "/bookings?scope=account&upcoming=1&order=asc",
  );

  const bookings = (data ?? []).slice().sort((a, b) => {
    const da = new Date(a.scheduledAt ?? a.createdAt).getTime();
    const db = new Date(b.scheduledAt ?? b.createdAt).getTime();
    return da - db;
  });

  // groupement par jour
  const groups = new Map<string, Booking[]>();
  for (const b of bookings) {
    const key = dayKey(b.scheduledAt ?? b.createdAt);
    const arr = groups.get(key) ?? [];
    arr.push(b);
    groups.set(key, arr);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning"
        subtitle="Vos missions et réservations à venir, organisées par jour."
      />

      {error ? (
        <ErrorState retryHref="/dashboard/planning" />
      ) : groups.size === 0 ? (
        <EmptyState
          title="Aucun événement à venir"
          description="Vos missions confirmées et réservations apparaîtront ici."
        />
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([day, items]) => (
            <div key={day} className="space-y-3">
              <h2 className="text-sm font-semibold capitalize text-muted-foreground">{day}</h2>
              <Card>
                <CardContent className="divide-y divide-border p-0">
                  {items.map((b) => {
                    const title = b.mission?.title ?? b.service?.title ?? "Réservation";
                    const time = hour(b.scheduledAt);
                    return (
                      <div key={b.id} className="flex items-center gap-4 p-4">
                        <div className="w-16 shrink-0 text-center">
                          <span className="text-sm font-semibold text-primary">{time || "—"}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-foreground">{title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {b.mission?.city ?? b.service?.city ?? b.account?.name ?? ""}
                            {b.totalAmount ? ` · ${formatMoney(b.totalAmount)}` : ""}
                          </p>
                        </div>
                        <Badge variant={bookingBadgeVariant(b.status)}>
                          {BOOKING_STATUS_LABEL[b.status]}
                        </Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
