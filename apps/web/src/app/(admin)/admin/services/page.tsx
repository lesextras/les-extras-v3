import { getAdminServices } from "@/app/actions/admin";
import { ServicesTable } from "@/components/admin/ServicesTable";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const services = await getAdminServices();

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h2 className="font-display text-heading-xl tracking-tight">Ateliers</h2>
        <p className="text-sm text-muted-foreground">
          Supervision des services publiés, mise en avant et contrôle de visibilité.
        </p>
      </header>

      <ServicesTable services={services} />
    </section>
  );
}
