import { getAdminUsers } from "@/app/actions/admin";
import { UsersTable } from "@/components/admin/UsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const initialUsers = await getAdminUsers();

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h2 className="font-display text-heading-xl tracking-tight">Utilisateurs</h2>
        <p className="text-sm text-muted-foreground">
          Validation des comptes, suspension et contrôle rapide des profils.
        </p>
      </header>

      <UsersTable initialUsers={initialUsers} />
    </section>
  );
}
