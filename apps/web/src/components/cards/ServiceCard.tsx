"use client";

import Link from "next/link";
import { Clock3, Users, CalendarDays, ChevronRight, FileText } from "lucide-react";
import { AvatarFallback, Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { SerializedService } from "@/app/actions/marketplace";
import { getCategoryLabel, getPublicCibleLabels, formatDuration } from "@/lib/atelier-config";

export type ServiceCardProps = {
  service: SerializedService;
};

const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function getAvatarFallback(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ServiceCard({ service }: ServiceCardProps) {
  const ownerName = service.owner?.profile
    ? `${service.owner.profile.firstName} ${service.owner.profile.lastName}`
    : "Freelance";

  const ownerJob = service.owner?.profile?.jobTitle ?? "Expert";
  const slotCount = Array.isArray(service.slots) ? service.slots.length : 0;
  const publicLabels = getPublicCibleLabels((service.publicCible ?? []).slice(0, 2));

  const priceLabel = () => {
    if (service.pricingType === "QUOTE") return "Sur devis";
    if (service.pricingType === "PER_PARTICIPANT" && service.pricePerParticipant) {
      return `${moneyFormatter.format(service.pricePerParticipant)} / pers.`;
    }
    return `${moneyFormatter.format(service.price)}`;
  };

  return (
    <Link href={`/marketplace/services/${service.id}`} className="block h-full group">
      <Card className="flex h-full flex-col border border-border/60 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md overflow-hidden">
        {service.imageUrl && (
          <div className="relative h-32 overflow-hidden">
            <img
              src={service.imageUrl}
              alt={service.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <CardHeader className="p-4 pb-2 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={service.type === "WORKSHOP" ? "info" : "default"} className="font-medium">
              {service.type === "WORKSHOP" ? "Atelier" : "Formation"}
            </Badge>
            {service.category && (
              <Badge variant="outline" className="text-xs font-normal">
                {getCategoryLabel(service.category)}
              </Badge>
            )}
          </div>

          <h3 className="font-bold text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {service.title}
          </h3>

          {/* Meta row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {service.durationMinutes > 0 && (
              <span className="flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                {formatDuration(service.durationMinutes)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Max {service.capacity}
            </span>
            {service.scheduleInfo ? (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                <span className="truncate max-w-[140px]">{service.scheduleInfo}</span>
              </span>
            ) : slotCount > 0 ? (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {slotCount} créneau{slotCount > 1 ? "x" : ""}
              </span>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-4 pb-3 space-y-3">
          {service.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>
          )}

          {/* Public cible pills */}
          {publicLabels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {publicLabels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))] text-[10px] font-medium border border-[hsl(var(--primary)/0.20)]"
                >
                  {label}
                </span>
              ))}
              {(service.publicCible?.length ?? 0) > 2 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px]">
                  +{(service.publicCible?.length ?? 0) - 2}
                </span>
              )}
            </div>
          )}

          {/* Owner */}
          <div className="flex items-center gap-2 pt-1 mt-auto border-t border-dashed">
            <Avatar className="h-7 w-7 border">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                {getAvatarFallback(ownerName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="text-xs font-medium">{ownerName}</span>
              <span className="text-[10px] text-muted-foreground block line-clamp-1">{ownerJob}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="px-4 py-3 bg-muted/30 flex items-center justify-between border-t">
          <div>
            {service.pricingType === "QUOTE" ? (
              <div className="flex items-center gap-1 text-amber-700">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-sm font-semibold">Sur devis</span>
              </div>
            ) : (
              <div>
                <span className="text-xs text-muted-foreground">Tarif</span>
                <div className="text-base font-bold">{priceLabel()}</div>
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
