// Planning : agenda des créneaux (shifts) du compte.
//  - ESTABLISHMENT : créneaux du compte + création/gestion.
//  - FREELANCE : ses créneaux + gestion de ses disponibilités.
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { PlanningBoard, type Shift, type Availability } from "../../../_shared/PlanningBoard";
import type { Mission } from "../../../_shared/types";

export const metadata: Metadata = { title: "Planning" };

/** Lundi de la semaine de `d` (la semaine française commence le lundi). */
function startOfWeek(d = new Date()): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = dimanche
  date.setDate(date.getDate() + ((day === 0 ? -6 : 1) - day));
  return date;
}

/** Première case de la grille du mois : le lundi qui précède le 1er. */
function startOfMonthGrid(d = new Date()): Date {
  const premier = new Date(d);
  premier.setHours(0, 0, 0, 0);
  premier.setDate(1);
  return startOfWeek(premier);
}

export default async function PlanningPage() {
  const session = await requireSession();
  const isEstablishment = session.account.type === "ESTABLISHMENT";

  // Premier affichage : le mois courant, exactement la grille que le
  // calendrier montrera côté client (6 semaines à partir du lundi précédant le 1er).
  const from = startOfMonthGrid();
  const to = new Date(from);
  to.setDate(to.getDate() + 42);
  const fromISO = from.toISOString();
  const toISO = to.toISOString();

  const { data: shifts, error } = await fetchApi<Shift[]>(
    session,
    `/planning?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`,
  );

  // Options du modal (établissement) : missions du compte.
  let missions: { id: string; title: string }[] = [];
  if (isEstablishment) {
    const res = await fetchApi<Mission[]>(session, "/missions?scope=account");
    missions = (res.data ?? []).map((m) => ({ id: m.id, title: m.title }));
  }

  // Disponibilités (freelance).
  let availability: Availability[] = [];
  if (!isEstablishment) {
    const res = await fetchApi<Availability[]>(session, "/availability");
    availability = res.data ?? [];
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planning"
        subtitle={
          isEstablishment
            ? "Vos renforts pourvus, ateliers réservés et sessions de formation, plus les créneaux que vous ajoutez vous-même. Cliquez sur un jour pour en voir le détail."
            : "Vos interventions confirmées — missions et ateliers — et vos disponibilités hebdomadaires."
        }
      />

      {error ? (
        <ErrorState retryHref="/dashboard/planning" />
      ) : (
        <PlanningBoard
          accountType={session.account.type}
          accountId={session.account.id}
          fromISO={fromISO}
          toISO={toISO}
          initialShifts={shifts ?? []}
          missions={missions}
          initialAvailability={availability}
        />
      )}
    </div>
  );
}
