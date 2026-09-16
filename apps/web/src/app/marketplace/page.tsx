// Catalogue marketplace : missions renfort + ateliers, avec filtres.
// Endpoints réels : GET /missions/marketplace et GET /services/catalog
// renvoient un objet paginé { items, total, take, skip[, page] }.
import type { Metadata } from "next";
import Link from "next/link";
import { requireSession, fetchApi } from "../_shared/server";
import { PageHeader, EmptyState, ErrorState } from "../_shared/ui";
import { MarketplaceFilters } from "../_shared/MarketplaceFilters";
import { MissionCard, ServiceCard } from "../_shared/cards";
import type { Mission, Service } from "../_shared/types";

export const metadata: Metadata = { title: "Marketplace" };

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
  searchParams: searchParamsPromesse,
}: {
  searchParams: Promise<{
    q?: string;
    type?: string;
    category?: string;
    cp?: string;
    rayon?: string;
    format?: string;
  }>;
}) {
  const searchParams = await searchParamsPromesse;
  const session = await requireSession();
  const type = searchParams.type ?? "";
  const category = searchParams.category || undefined;

  /**
   * ⚠ LE FORMAT EST LA PORTE D'ENTRÉE DU RENFORT PERSONNALISÉ.
   *
   * `?format=INDIVIDUEL` n'est pas un filtre de confort : c'est l'adresse vers
   * laquelle pointe « demander un renfort personnalisé » depuis RenforTeam. Un
   * accompagnement 1 pour 1 se facture en prestation ; un poste à couvrir se
   * conclut en CDD et n'a rien à faire dans ce catalogue. Les deux ne
   * s'affichent donc jamais mélangés — d'où le masquage des missions plus bas
   * dès qu'un format est demandé.
   */
  const format =
    searchParams.format === "INDIVIDUEL" || searchParams.format === "COLLECTIF"
      ? searchParams.format
      : undefined;

  const wantMissions = (!type || type === "missions") && !format;
  const wantServices = !type || type === "services" || Boolean(format);

  const missionCategory = category && MISSION_CATEGORIES.has(category) ? category : undefined;
  const serviceCategory = category && SERVICE_CATEGORIES.has(category) ? category : undefined;

  const missionsQuery = qs({
    search: searchParams.q,
    category: missionCategory,
    postalCode: searchParams.cp,
    rayonKm: searchParams.cp ? searchParams.rayon : undefined,
  });
  // La recherche s'applique aux DEUX listes. Elle n'était transmise qu'aux
  // missions : on tapait « médiation », les ateliers ne bougeaient pas, alors
  // que la page annonce « missions de renfort et ateliers ».
  const servicesQuery = qs({ search: searchParams.q, category: serviceCategory, format });

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
        title={format === "INDIVIDUEL" ? "Renforts personnalisés" : "Marketplace"}
        subtitle={
          format === "INDIVIDUEL"
            ? "Des accompagnements 1 pour 1, facturés en prestation par la structure de l’intervenant. Un poste à couvrir, lui, se publie sur RenforTeam et se conclut en CDD."
            : "Toutes les missions de renfort et ateliers ouverts à la candidature."
        }
      />
      <MarketplaceFilters />

      {/*
        Le filtre de format n'est pas dans la barre : il vient d'un lien, et il
        doit pouvoir se retirer là où il s'affiche — sinon on est enfermé dans
        un catalogue réduit sans savoir pourquoi.
      */}
      {format ? (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {format === "INDIVIDUEL" ? "Renfort personnalisé" : "Ateliers collectifs"}
          </span>
          <Link href="/marketplace" className="font-medium text-primary hover:underline">
            Voir tout le catalogue
          </Link>
        </p>
      ) : null}

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
                {format === "INDIVIDUEL" ? "Renforts personnalisés" : "Ateliers"}{" "}
                <span className="text-muted-foreground">({services.length})</span>
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
