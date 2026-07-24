// Back-office ADMIN — réservations : supervision + actions (GET /admin/bookings,
// PATCH /admin/bookings/:id/status). Filtrable par statut.
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState, EmptyState } from "../../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BOOKING_STATUS_LABEL, bookingBadgeVariant, formatMoney, formatDate } from "../../../_shared/format";
import { AdminBookingActions } from "../../../_shared/AdminBookingActions";
import type { BookingStatus } from "../../../_shared/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Réservations · Administration" };

interface AdminBooking {
  id: string;
  status: BookingStatus;
  totalAmount?: string | number | null;
  scheduledAt?: string | null;
  createdAt: string;
  account?: { name?: string; type?: string } | null;
  mission?: { title?: string } | null;
  service?: { title?: string } | null;
}

// Statuts proposés dans la barre de filtre (ordre du cycle de vie).
const FILTERS: BookingStatus[] = [
  "REQUESTED",
  "ACCEPTED",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export default async function AdminReservationsPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const session = await requireAdmin();

  const active =
    searchParams.status && FILTERS.includes(searchParams.status as BookingStatus)
      ? (searchParams.status as BookingStatus)
      : undefined;

  const path = active ? `/admin/bookings?status=${active}` : "/admin/bookings";
  const res = await fetchApi<AdminBooking[]>(session, path);
  const bookings = Array.isArray(res.data) ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Réservations"
        subtitle="Toutes les réservations d’ateliers et de missions de la plateforme."
      />

      {/* Filtre par statut */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip href="/admin/reservations" label="Toutes" activeState={!active} />
        {FILTERS.map((s) => (
          <FilterChip
            key={s}
            href={`/admin/reservations?status=${s}`}
            label={BOOKING_STATUS_LABEL[s] ?? s}
            activeState={active === s}
          />
        ))}
      </div>

      {res.error ? (
        <ErrorState retryHref="/admin/reservations" />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="Aucune réservation"
          description={
            active
              ? "Aucune réservation ne correspond à ce statut."
              : "Aucune réservation enregistrée pour le moment."
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Compte</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Créée le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {b.account?.name ?? "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {b.account?.type === "ESTABLISHMENT" ? "Établissement" : "Freelance"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {b.mission?.title ?? b.service?.title ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={bookingBadgeVariant(b.status)}>
                          {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatMoney(b.totalAmount)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(b.createdAt)}
                      </TableCell>
                      <TableCell>
                        <AdminBookingActions bookingId={b.id} status={b.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FilterChip({
  href,
  label,
  activeState,
}: {
  href: string;
  label: string;
  activeState: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors",
        activeState
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:bg-muted",
      )}
    >
      {label}
    </Link>
  );
}
