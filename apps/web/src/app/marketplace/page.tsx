// Catalogue marketplace : missions renfort + ateliers, avec filtres.
// Endpoints réels : GET /missions/marketplace et GET /services/catalog
// renvoient un objet paginé { items, total, take, skip[, page] }.
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../_shared/ui";
import { MarketplaceFilters } from "../_shared/MarketplaceFilters";
import { MissionCard, ServiceCard } from "../_shared/cards";
import type { Mission, Service } from "../_shared/types";

export const metadata: Metadata = { title: "Marketplace · Les Extras" };

// Enums valides côté API (évite un 400 quand une catégorie ne correspond pas).
const MISSION_CATEGORIES = new Set([
  "RENFORT",
  "REMPLACEMENT",
  "ATELIER_EDUCATIF",
  "ATELIER_THERAPEUTIQUE",
  "FORMATION",
  "ANALYSE_PRATIQUES",
]);
const SERVICE_CATEGORIES = new Set([
  "ATELIER",
  "FORMATION",
  "MEDIATION",
  "ART_THERAPIE",
  "PREVENTION",
]);

interface Paginated<T> {
  items?: T[];
  total?: number;
}

function qs(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Lit une liste que la réponse soit un tableau direct ou un objet paginé. */
function asItems<T>(data: T[] | Paginated<T> | undefined): T[] {
  if (Array.isArray(data)) return data;
  return data?.items ?? [];
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; category?: string };
}) {
  const session = await requireSession();
  const type = searchParams.type ?? "";
  const category = searchParams.category || undefined;

  const wantMissions = !type || type === "missions";
  const wantServices = !type || type === "services";

  const missionCategory = category && MISSION_CATEGORIES.has(category) ? category : undefined;
  const serviceCategory = category && SERVICE_CATEGORIES.has(category) ? category : undefined;

  const missionsQuery = qs({ search: searchParams.q, category: missionCategory });
  const servicesQuery = qs({ category: serviceCategory });

  const [missionsRes, servicesRes] = await Promise.all([
    wantMissions
      ? fetchApi<Paginated<Mission>>(session, `/missions/marketplace${missionsQuery}`)
      : Promise.resolve<{ data?: Paginated<Mission>; error?: string }>({ data: { items: [] } }),
    wantServices
      ? fetchApi<Paginated<Service>>(session, `/services/catalog${servicesQuery}`)
      : Promise.resolve<{ data?: Paginated<Service>; error?: string }>({ data: { items: [] } }),
  ]);

  const missions = asItems<Mission>(missionsRes.data);
  const services = asItems<Service>(servicesRes.data);
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
