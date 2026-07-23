// Cartes de présentation (Server Components) pour missions, services, bookings.
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MISSION_CATEGORY_LABEL,
  SERVICE_CATEGORY_LABEL,
  BOOKING_STATUS_LABEL,
  bookingBadgeVariant,
  formatDate,
  formatMoney,
  formatRate,
} from "./format";
import type { Booking, Mission, Service } from "./types";

export function MissionCard({ mission, href }: { mission: Mission; href?: string }) {
  const link = href ?? `/marketplace/missions/${mission.id}`;
  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary">{MISSION_CATEGORY_LABEL[mission.category] ?? mission.category}</Badge>
          {mission.hourlyRate ? (
            <span className="text-sm font-semibold text-primary">{formatRate(mission.hourlyRate)}</span>
          ) : null}
        </div>
        <Link href={link} className="block">
          <h3 className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">
            {mission.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        <p className="line-clamp-2">{mission.description}</p>
        <dl className="grid grid-cols-2 gap-1 text-xs">
          <div>
            <dt className="text-muted-foreground/70">Début</dt>
            <dd className="font-medium text-foreground">{formatDate(mission.startDate)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground/70">Lieu</dt>
            <dd className="font-medium text-foreground">
              {mission.city ?? "—"} {mission.postalCode ? `(${mission.postalCode})` : ""}
            </dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">
          {mission.account?.name ?? "Établissement"}
        </span>
        <Button asChild size="sm" variant="outline">
          <Link href={link}>Voir</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function ServiceCard({ service, href }: { service: Service; href?: string }) {
  const link = href ?? `/marketplace/services/${service.id}`;
  return (
    <Card className="group flex h-full flex-col transition-shadow hover:shadow-md">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline">{SERVICE_CATEGORY_LABEL[service.category] ?? service.category}</Badge>
          {service.price ? (
            <span className="text-sm font-semibold text-secondary">{formatMoney(service.price)}</span>
          ) : null}
        </div>
        <Link href={link} className="block">
          <h3 className="line-clamp-2 font-semibold text-foreground group-hover:text-primary">
            {service.title}
          </h3>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 text-sm text-muted-foreground">
        <p className="line-clamp-2">{service.description}</p>
        <div className="flex flex-wrap gap-3 text-xs">
          {service.duration ? <span>⏱ {service.duration}</span> : null}
          {service.maxParticipants ? <span>👥 {service.maxParticipants} max</span> : null}
          {service.city ? <span>📍 {service.city}</span> : null}
        </div>
      </CardContent>
      <CardFooter className="justify-between">
        <span className="text-xs text-muted-foreground">
          {service.account?.name ?? "Intervenant"}
        </span>
        <Button asChild size="sm" variant="outline">
          <Link href={link}>Voir</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export function BookingRow({ booking }: { booking: Booking }) {
  const title =
    booking.mission?.title ?? booking.service?.title ?? "Réservation";
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">
          {formatDate(booking.scheduledAt ?? booking.createdAt)}
          {booking.totalAmount ? ` · ${formatMoney(booking.totalAmount)}` : ""}
        </p>
      </div>
      <Badge variant={bookingBadgeVariant(booking.status)}>
        {BOOKING_STATUS_LABEL[booking.status] ?? booking.status}
      </Badge>
    </div>
  );
}
