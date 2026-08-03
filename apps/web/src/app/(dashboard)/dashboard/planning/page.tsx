// Planning : agenda des créneaux (shifts) du compte.
//  - ESTABLISHMENT : créneaux du compte + création/gestion.
//  - FREELANCE : ses créneaux + gestion de ses disponibilités.
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import { RenfortModal } from "../../../_shared/modals/RenfortModal";
import { RepeterSemaine } from "../../../_shared/RepeterSemaine";
import { PlanningBoard, type Shift, type Availability } from "../../../_shared/PlanningBoard";
import { InterrupteurDisponibilite } from "../../../_shared/InterrupteurDisponibilite";
import { ExportPaie } from "../../../_shared/ExportPaie";
import type { Mission } from "../../../_shared/types";
import type { Repartition } from "../../../_shared/EquipeTable";

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
  // L'export de paie porte les heures et les soldes de congés de toute
  // l'équipe : ce n'est pas une information d'équipe.
  const peutExporter =
    isEstablishment && ["OWNER", "ADMIN", "MANAGER"].includes(session.account.role);

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

  // Services de l'établissement : alimentent le filtre du calendrier. Sans
  // eux, un chef de service voit le planning de toute la structure.
  let services: { id: string; name: string }[] = [];
  if (isEstablishment) {
    const res = await fetchApi<Repartition>(session, "/memberships/repartition");
    services = (res.data?.services ?? []).map((s) => ({ id: s.id, name: s.name }));
  }

  // Disponibilités (freelance).
  let availability: Availability[] = [];
  // L'interrupteur global « je prends des missions / je suis en pause ». Le
  // champ pesait déjà 15 % dans le score de matching, mais rien ne permettait
  // de le changer : on continuait de solliciter les gens en arrêt.
  let disponible = true;
  if (!isEstablishment) {
    const [res, moi] = await Promise.all([
      fetchApi<Availability[]>(session, "/availability"),
      fetchApi<{ profile?: { available?: boolean | null } | null }>(session, "/users/me"),
    ]);
    availability = res.data ?? [];
    disponible = moi.data?.profile?.available ?? true;
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
        actions={
          // Un trou dans le planning -> on publie le renfort sans changer
          // d'outil ; une semaine type se deroule en cycle sans ressaisie.
          isEstablishment ? (
            <div className="flex flex-wrap items-center gap-2">
              {/* La paie se prépare depuis les heures : c'est ici qu'on la
                  cherche, pas sous l'onglet Congés où l'export était rangé. */}
              {peutExporter ? <ExportPaie compact /> : null}
              <RepeterSemaine accountId={session.account.id} />
              <RenfortModal accountId={session.account.id} />
            </div>
          ) : undefined
        }
      />

      {!isEstablishment ? (
        <InterrupteurDisponibilite accountId={session.account.id} disponible={disponible} />
      ) : null}

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
          services={services}
        />
      )}
    </div>
  );
}
