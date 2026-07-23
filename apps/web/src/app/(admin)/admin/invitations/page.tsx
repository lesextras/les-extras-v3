// Back-office ADMIN — Invitations (établissements & freelances).
import type { Metadata } from "next";
import { requireAdmin, fetchApi } from "../../../_shared/server";
import { PageHeader, ErrorState } from "../../../_shared/ui";
import {
  AdminInvitationsManager,
  type AdminInvitation,
} from "../../../_shared/AdminInvitationsManager";

export const metadata: Metadata = { title: "Invitations · Administration" };

export default async function AdminInvitationsPage() {
  const session = await requireAdmin();
  const res = await fetchApi<AdminInvitation[]>(session, "/admin/invitations");
  const invitations = Array.isArray(res.data) ? res.data : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invitations"
        subtitle="Suivez les invitations envoyées par les structures pour rattacher leurs membres (salariés, responsables)."
      />
      {res.error ? (
        <ErrorState retryHref="/admin/invitations" />
      ) : (
        <AdminInvitationsManager invitations={invitations} />
      )}
    </div>
  );
}
