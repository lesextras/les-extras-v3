// Catalogue marketplace : missions renfort + ateliers, avec filtres.
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../_shared/ui";
import { MarketplaceFilters } from "../_shared/MarketplaceFilters";
import { MissionCard, ServiceCard } from "../_shared/cards";
import type { Mission, Service } from "../_shared/types";

export const metadata: Metadata = { title: "Marketplace · Les Extras" };

function qs(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; category?: string };
}) {
  const session = await requireSession();
  const type = searchParams.type ?? "all";
  const query = qs({ q: searchParams.q, category: searchParams.category });

  const wantMissions = type === "all" || type === "missions";
  const wantServices = type === "all" || type === "services";

  const [missionsRes, servicesRes] = await Promise.all([
    wantMissions
      ? fetchApi<Mission[]>(session, `/marketplace/missions${query}`)
      : Promise.resolve({ data: [] as Mission[] }),
    wantServices
      ? fetchApi<Service[]>(session, `/marketplace/services${query}`)
      : Promise.resolve({ data: [] as Service[] }),
  ]);

  const missions = missionsRes.data ?? [];
  const services = servicesRes.data ?? [];
  const total = missions.length + services.length;
  const anyError = missionsRes.error || servicesRes.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace"
        subtitle="Toutes les missions de renfort et ateliers ouverts à la candidature."
      />
      <MarketplaceFilters />

      {anyError ? (
        <ErrorState retryHref="/marketplace" />
      ) : total === 0 ? (
        <EmptyState
          title="Aucun résultat"
          description="Aucune offre ne correspond à votre recherche. Élargissez vos filtres."
        />
      ) : (
        <div className="space-y-10">
          {wantMissions && missions.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Missions renfort <span className="text-muted-foreground">({missions.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {missions.map((m) => (
                  <MissionCard key={m.id} mission={m} />
                ))}
              </div>
            </section>
          ) : null}

          {wantServices && services.length > 0 ? (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">
                Ateliers <span className="text-muted-foreground">({services.length})</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {services.map((s) => (
                  <ServiceCard key={s.id} service={s} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
