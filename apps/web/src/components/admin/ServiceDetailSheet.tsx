"use client";

import { Eye, EyeOff, Star, UserRound } from "lucide-react";
import { type AdminServiceDetail } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type ServiceDetailSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: AdminServiceDetail | null;
  isLoading: boolean;
  isPending: boolean;
  onToggleFeature: (serviceId: string) => void;
  onToggleHide: (serviceId: string) => void;
};

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const moneyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function getTypeLabel(type: AdminServiceDetail["type"]): string {
  return type === "WORKSHOP" ? "Atelier" : "Formation";
}

export function ServiceDetailSheet({
  open,
  onOpenChange,
  service,
  isLoading,
  isPending,
  onToggleFeature,
  onToggleHide,
}: ServiceDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg glass-surface">
        <SheetHeader>
          <SheetTitle>Détail service</SheetTitle>
          <SheetDescription>Lecture rapide du contenu publié.</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Chargement du service…</p>
        ) : service ? (
          <div className="mt-6 space-y-5 text-sm">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Titre</p>
              <p className="text-base font-medium text-foreground">{service.title}</p>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              <span>
                {service.freelanceName} ({service.freelanceEmail})
              </span>
            </div>

            <div className="rounded-md border border-border/50 bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">Description complète</p>
              <p className="mt-1 text-foreground">
                {service.description?.trim() || "Aucune description fournie."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-md border border-border/50 bg-muted/50 p-3">
              <div>
                <p className="text-xs text-muted-foreground">Prix</p>
                <p className="font-medium text-foreground">{moneyFormatter.format(service.price)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium text-foreground">{getTypeLabel(service.type)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Mise en avant</p>
                <p className="font-medium text-foreground">{service.isFeatured ? "Oui" : "Non"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Visibilité</p>
                <p className="font-medium text-foreground">{service.isHidden ? "Masqué" : "Visible"}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={service.isFeatured ? "default" : "outline"}
                disabled={isPending}
                onClick={() => onToggleFeature(service.id)}
              >
                <Star className="h-4 w-4" aria-hidden="true" />
                {service.isFeatured ? "Retirer de la mise en avant" : "Mettre en avant"}
              </Button>
              <Button
                variant={service.isHidden ? "glass" : "outline"}
                disabled={isPending}
                onClick={() => onToggleHide(service.id)}
              >
                {service.isHidden ? (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                )}
                {service.isHidden ? "Afficher" : "Masquer"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant={service.isFeatured ? "amber" : "quiet"}>
                {service.isFeatured ? "Featured" : "Standard"}
              </Badge>
              <Badge variant={service.isHidden ? "outline" : "default"}>
                {service.isHidden ? "Masqué" : "Visible"}
              </Badge>
            </div>

            <div className="text-xs text-muted-foreground">
              Publié le {dateFormatter.format(new Date(service.createdAt))}
            </div>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">Aucun service sélectionné.</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
