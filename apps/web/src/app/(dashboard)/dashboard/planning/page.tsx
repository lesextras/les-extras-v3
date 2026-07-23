// Planning : agenda des créneaux (shifts) du compte.
//  - ESTABLISHMENT : créneaux du compte + création/gestion.
//  - FREELANCE : ses créneaux + gestion de ses disponibilités.
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { PlanningBoard, type Shift, type Availability } from "../../../_shared/PlanningBoard";
import type { Mission } from "../../../_shared/types";

export const metadata: Metadata = { title: "Planning · Les Extras" };

/** Début de la semaine courante (lundi 00:00). */
function startOfWeek(d = new Date()): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = dimanche
  const diff = (day === 0 ? -6 : 1) - day; // reculer jusqu'au lundi
  date.setDate(date.getDate() + diff);
  return date;
}

export default async function PlanningPage() {
  const session = await requireSession();
  const isEstablishment = session.account.type === "ESTABLISHMENT";

  const from = startOfWeek();
  const to = new Date(from);
  to.setDate(to.getDate() + 28); // fenêtre de 4 semaines
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
            ? "Organisez vos créneaux d'intervention et suivez les affectations."
            : "Vos créneaux confirmés et vos disponibilités hebdomadaires."
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
