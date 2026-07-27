import { getContactBypassEvents } from "@/app/actions/admin";
import { ContactBypassEventsTable } from "@/components/admin/ContactBypassEventsTable";

export const dynamic = "force-dynamic";

export default async function AdminContactBypassEventsPage() {
  const events = await getContactBypassEvents();

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h2 className="font-display text-heading-xl tracking-tight">Contournements</h2>
        <p className="text-sm text-muted-foreground">
          Tentatives bloquées de partage de coordonnées ou de liens externes dans la messagerie.
        </p>
      </header>

      <ContactBypassEventsTable events={events} />
    </section>
  );
}
