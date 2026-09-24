// Back-office ADMIN, invitations Piloter (association, académie).
// Un compte Les Extras ne se partage pas : seuls les espaces Piloter invitent.
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import {
  AdminInvitationsManager,
  type AdminInvitation,
} from "../../../_shared/AdminInvitationsManager";

export const metadata: Metadata = { title: "Invitations Piloter · Administration" };

export default async function AdminInvitationsPage() {
  const session = await requireAdmin();
  const res = await fetchApi<AdminInvitation[]>(session, "/admin/invitations");
  const invitations = Array.isArray(res.data) ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitations Piloter"
        subtitle="Les invitations envoyées depuis les espaces association et académie, avec le rôle proposé."
      />
      {res.error ? (
        <ErrorState retryHref="/admin/invitations" />
      ) : (
        <AdminInvitationsManager invitations={invitations} />
      )}
    </div>
  );
}
