"use client";

import { MissionCard, type MissionCardProps } from "@/components/cards/MissionCard";
import { ServiceCard, type ServiceCardProps } from "@/components/cards/ServiceCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { BentoSection } from "@/components/layout/BentoSection";
import { useUIStore } from "@/lib/stores/useUIStore";
import { Filter, SlidersHorizontal, Briefcase, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type MarketListProps = {
  missions: MissionCardProps["mission"][];
  services: ServiceCardProps["service"][];
  isDegraded?: boolean;
  degradedReason?: string;
  isVerified?: boolean;
};

export function MarketList({
  missions,
  services,
  isDegraded = false,
  degradedReason,
  isVerified = true,
}: MarketListProps) {
  const userRole = useUIStore((state) => state.userRole);
  const isFreelance = userRole === "FREELANCE";

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isFreelance
              ? "Missions de Renforts disponibles pour les freelances."
              : "Ateliers et formations disponibles à la réservation."}
          </p>
        </div>

        {isFreelance && (
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="glass" size="sm" className="h-8 text-xs rounded-full">
              <Filter className="h-3 w-3 mr-1" aria-hidden="true" />
              Tous les diplômes
            </Button>
            <Button variant="glass" size="sm" className="h-8 text-xs rounded-full">
              <SlidersHorizontal className="h-3 w-3 mr-1" aria-hidden="true" />
              Spécialisation
            </Button>
            <Button variant="glass" size="sm" className="h-8 text-xs rounded-full">
              Date
            </Button>
          </div>
        )}
      </div>

      {isFreelance && missions.length > 0 && (
        <div className="text-xs text-muted-foreground font-medium">
          <Badge variant="quiet" className="mr-1">{missions.length}</Badge>
          mission{missions.length > 1 ? "s" : ""} de renfort disponible{missions.length > 1 ? "s" : ""}
        </div>
      )}

      {isDegraded && (
        <div className="rounded-lg border border-[hsl(var(--amber)/0.25)] bg-[hsl(var(--amber)/0.08)] p-4">
          <p className="text-sm font-medium text-[hsl(var(--amber))]">Mode Dégradé</p>
          <p className="text-sm text-[hsl(var(--amber)/0.8)] mt-1">
            {degradedReason ??
              "Données temporairement indisponibles, veuillez réessayer dans quelques instants."}
          </p>
        </div>
      )}

      {isFreelance ? (
        missions.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {missions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} isVerified={isVerified} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="Aucune mission de renfort ouverte"
            description="Les nouvelles urgences apparaîtront ici dès leur publication par les établissements."
            primaryAction={{ label: "Rafraîchir", onClick: () => window.location.reload() }}
            tips="Activez les notifications pour être alerté en temps réel."
          />
        )
      ) : services.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="Aucun service disponible"
          description="Revenez plus tard pour découvrir de nouvelles offres."
          tips="Les freelances publient régulièrement de nouveaux ateliers et formations."
        />
      )}
    </section>
  );
}
