"use client";

import { useState } from "react";
import type { SerializedMission, SerializedService } from "@/app/actions/marketplace";
import { FreelanceJobBoard } from "./FreelanceJobBoard";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Briefcase, BookOpen, GraduationCap, X } from "lucide-react";
import { ATELIER_CATEGORIES } from "@/lib/atelier-config";
import { Button } from "@/components/ui/button";

interface FreelanceMarketplaceProps {
  missions: SerializedMission[];
  services: SerializedService[];
  missionsError?: string | null;
  servicesError?: string | null;
}

export function FreelanceMarketplace({
  missions,
  services,
  missionsError = null,
  servicesError = null,
}: FreelanceMarketplaceProps) {
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterPricing, setFilterPricing] = useState<string | null>(null);

  const workshopServices = services.filter((s) => s.type === "WORKSHOP");
  const trainingServices = services.filter((s) => s.type === "TRAINING");

  const filterServices = (sourceServices: SerializedService[]) =>
    sourceServices.filter((s) => {
      if (filterCategory && s.category !== filterCategory) return false;
      if (filterPricing && s.pricingType !== filterPricing) return false;
      return true;
    });

  const filteredWorkshops = filterServices(workshopServices);
  const filteredTrainings = filterServices(trainingServices);

  const hasFilters = filterCategory !== null || filterPricing !== null;

  const clearFilters = () => {
    setFilterCategory(null);
    setFilterPricing(null);
  };

  const getPresentCategories = (src: SerializedService[]) =>
    ATELIER_CATEGORIES.filter((cat) => src.some((s) => s.category === cat.id));

  const renderFilters = (sourceServices: SerializedService[]) => {
    const presentCategories = getPresentCategories(sourceServices);

    if (presentCategories.length === 0 && sourceServices.length === 0 && !hasFilters) {
      return null;
    }

    return (
      <div className="space-y-3">
        {presentCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground font-medium">Catégorie :</span>
            {presentCategories.map((cat) => {
              const Icon = cat.icon;
              const active = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFilterCategory(active ? null : cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? "bg-[hsl(var(--color-teal-600))] text-white border-[hsl(var(--color-teal-600))]"
                      : "border-border text-muted-foreground hover:border-[hsl(var(--color-teal-300))] hover:text-[hsl(var(--color-teal-600))]"
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground font-medium">Tarif :</span>
          {[
            { id: "SESSION", label: "Forfait séance" },
            { id: "PER_PARTICIPANT", label: "Par participant" },
            { id: "QUOTE", label: "Sur devis" },
          ].map((opt) => {
            const active = filterPricing === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilterPricing(active ? null : opt.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  active
                    ? "bg-[hsl(var(--color-teal-600))] text-white border-[hsl(var(--color-teal-600))]"
                    : "border-border text-muted-foreground hover:border-[hsl(var(--color-teal-300))] hover:text-[hsl(var(--color-teal-600))]"
                }`}
              >
                {opt.label}
              </button>
            );
          })}

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 gap-1 text-xs text-muted-foreground"
            >
              <X className="w-3 h-3" /> Effacer
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderServiceTab = ({
    sourceServices,
    filteredServices,
    allLabel,
    filteredEmptyTitle,
    emptyTitle,
    emptyDescription,
  }: {
    sourceServices: SerializedService[];
    filteredServices: SerializedService[];
    allLabel: string;
    filteredEmptyTitle: string;
    emptyTitle: string;
    emptyDescription: string;
  }) => (
    <div className="space-y-4">
      {renderFilters(sourceServices)}

      {!hasFilters && filteredServices.length >= 3 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-heading-sm font-display">Recommandés pour vous</span>
            <span className="text-xs text-muted-foreground">Sélection personnalisée</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.slice(0, 3).map((service) => (
              <ServiceCard key={`rec-${service.id}`} service={service} />
            ))}
          </div>
          <div className="h-px bg-border" role="separator" />
          <p className="text-heading-sm font-display">{allLabel}</p>
        </div>
      )}

      {filteredServices.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={hasFilters ? filteredEmptyTitle : emptyTitle}
          description={hasFilters ? "Essayez de modifier vos filtres." : emptyDescription}
          tips="Revenez régulièrement pour découvrir les nouvelles offres."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {(missionsError || servicesError) && (
        <div className="rounded-lg border border-[hsl(var(--color-amber-300))] bg-[hsl(var(--color-amber-50))] px-4 py-3 text-sm text-[hsl(var(--color-amber-800))] space-y-1">
          {missionsError && <p>{missionsError}</p>}
          {servicesError && <p>{servicesError}</p>}
        </div>
      )}

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Marketplace
        </p>
        <h1 className="font-display text-heading-xl tracking-tight">
          Missions & Services
        </h1>
        <p className="text-sm text-muted-foreground">
          Trouvez des missions de renfort et découvrez les ateliers et formations disponibles.
        </p>
      </header>

      <Tabs defaultValue="missions" className="w-full">
        <TabsList className="h-auto min-h-11 flex-wrap justify-start glass-surface border border-border/40">
          <TabsTrigger value="missions" className="gap-2 min-h-[40px]">
            <Briefcase className="h-4 w-4" aria-hidden="true" />
            Missions de renfort
            {missions.length > 0 && (
              <span className="ml-1 text-[10px] bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))] rounded-full px-1.5 py-0.5 font-semibold">
                {missions.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="workshops" className="gap-2 min-h-[40px]">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Ateliers
            {workshopServices.length > 0 && (
              <span className="ml-1 text-[10px] bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))] rounded-full px-1.5 py-0.5 font-semibold">
                {workshopServices.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="trainings" className="gap-2 min-h-[40px]">
            <GraduationCap className="h-4 w-4" aria-hidden="true" />
            Formations
            {trainingServices.length > 0 && (
              <span className="ml-1 text-[10px] bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))] rounded-full px-1.5 py-0.5 font-semibold">
                {trainingServices.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="missions" className="mt-6">
          <FreelanceJobBoard missions={missions} hideHeader />
        </TabsContent>

        <TabsContent value="workshops" className="mt-6">
          {renderServiceTab({
            sourceServices: workshopServices,
            filteredServices: filteredWorkshops,
            allLabel: "Tous les ateliers",
            filteredEmptyTitle: "Aucun atelier pour ces filtres",
            emptyTitle: "Aucun atelier disponible",
            emptyDescription: "Les ateliers seront bientôt disponibles.",
          })}
        </TabsContent>

        <TabsContent value="trainings" className="mt-6">
          {renderServiceTab({
            sourceServices: trainingServices,
            filteredServices: filteredTrainings,
            allLabel: "Toutes les formations",
            filteredEmptyTitle: "Aucune formation pour ces filtres",
            emptyTitle: "Aucune formation disponible",
            emptyDescription: "Les formations seront bientôt disponibles.",
          })}
        </TabsContent>
      </Tabs>
    </div>
  );
}
