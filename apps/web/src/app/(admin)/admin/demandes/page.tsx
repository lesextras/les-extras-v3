import { getAdminUsers, getDeskRequests } from "@/app/actions/admin";
import { DeskRequestsTable } from "@/components/admin/DeskRequestsTable";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { fetchAdminSafe } from "@/lib/admin-safe-fetch";

export const dynamic = "force-dynamic";

export default async function AdminDemandesPage() {
  const [requestsResult, adminsResult] = await Promise.all([
    fetchAdminSafe(getDeskRequests, [], "Inbox Desk"),
    fetchAdminSafe(() => getAdminUsers({ role: "ADMIN" }), [], "Administrateurs Desk"),
  ]);
  const errors = [requestsResult.error, adminsResult.error].filter(
    (error): error is string => Boolean(error),
  );

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h2 className="font-display text-heading-xl tracking-tight">Inbox Desk</h2>
        <p className="text-sm text-muted-foreground">
          Tickets utilisateurs, demandes mission et signalements non-finance à traiter par la plateforme.
        </p>
      </header>

      {errors.length > 0 && (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertTitle>Données Desk partiellement indisponibles</AlertTitle>
          <AlertDescription>{errors.join(" ")}</AlertDescription>
        </Alert>
      )}

      <DeskRequestsTable requests={requestsResult.data} admins={adminsResult.data} />
    </section>
  );
}
