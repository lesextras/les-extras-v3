import { getDeskRequests, getAdminUsers } from "@/app/actions/admin";
import { FinanceIncidentsTable } from "@/components/admin/FinanceIncidentsTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FINANCE_DESK_REQUEST_TYPES } from "@/lib/desk-labels";
import { fetchAdminSafe } from "@/lib/admin-safe-fetch";

export const dynamic = "force-dynamic";

const FINANCE_TYPES = new Set<string>(FINANCE_DESK_REQUEST_TYPES);

export default async function AdminIncidentsPage() {
  const [requestsResult, adminsResult] = await Promise.all([
    fetchAdminSafe(getDeskRequests, [], "Incidents Desk"),
    fetchAdminSafe(() => getAdminUsers({ role: "ADMIN" }), [], "Administrateurs Desk"),
  ]);

  const incidents = requestsResult.data.filter((r) => FINANCE_TYPES.has(r.type));
  const errors = [requestsResult.error, adminsResult.error].filter(
    (error): error is string => Boolean(error),
  );

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h2 className="font-display text-heading-xl tracking-tight">
          Incidents Finance / Commerce
        </h2>
        <p className="text-sm text-muted-foreground">
          Incidents signalés par les utilisateurs ou créés manuellement par Le Desk&nbsp;:
          paiements bloqués, réservations échouées, achats de packs et publications de missions.
          Commission plateforme&nbsp;: <strong>3&nbsp;%</strong> — tous les montants sont&nbsp;TTC.
        </p>
      </header>

      {errors.length > 0 && (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertTitle>Données Desk partiellement indisponibles</AlertTitle>
          <AlertDescription>{errors.join(" ")}</AlertDescription>
        </Alert>
      )}

      <FinanceIncidentsTable requests={incidents} admins={adminsResult.data} />
    </section>
  );
}
