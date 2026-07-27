import { redirect } from "next/navigation";
import { getSession, deleteSession } from "@/lib/session";
import { getMyDeskRequestsSafe } from "@/app/actions/desk";
import { UserDeskRequestForm } from "@/components/dashboard/UserDeskRequestForm";
import { DeskRequestsClient } from "./DeskRequestsClient";

export const dynamic = "force-dynamic";

export default async function MesDemandesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "FREELANCE" && session.user.role !== "ESTABLISHMENT") redirect("/dashboard");

  const result = await getMyDeskRequestsSafe(session.token);
  if (!result.ok && result.unauthorized) {
    await deleteSession();
    redirect("/login");
  }

  const requests = result.ok ? result.data : [];
  const loadError = result.ok ? null : result.error;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="space-y-1.5">
        <p className="text-overline uppercase tracking-widest text-muted-foreground">Espace assistance</p>
        <h1 className="font-display text-heading-xl tracking-tight">Mes demandes</h1>
        <p className="max-w-3xl text-body-md text-muted-foreground">
          Créez une demande Desk et suivez son traitement par l&apos;équipe Les Extras, sans échange direct hors plateforme.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-6">
          <UserDeskRequestForm />
        </aside>
        <DeskRequestsClient requests={requests} loadError={loadError} />
      </div>
    </div>
  );
}
