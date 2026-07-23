// Back-office ADMIN — réservations : supervision globale (GET /admin/bookings).
import type { Metadata } from "next";
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

export const metadata: Metadata = { title: "Réservations · Administration" };

interface AdminBooking {
  id: string;
  status: string;
  totalAmount?: string | number | null;
  scheduledAt?: string | null;
  createdAt: string;
  account?: { name?: string; type?: string } | null;
  mission?: { title?: string } | null;
  service?: { title?: string } | null;
}

export default async function AdminReservationsPage() {
  const session = await requireAdmin();
  const res = await fetchApi<AdminBooking[]>(session, "/admin/bookings");
  const bookings = Array.isArray(res.data) ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Réservations"
        subtitle="Toutes les réservations d’ateliers et de missions de la plateforme."
      />
      {res.error ? (
        <ErrorState retryHref="/admin/reservations" />
      ) : bookings.length === 0 ? (
        <EmptyState title="Aucune réservation" description="Aucune réservation enregistrée pour le moment." />
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
