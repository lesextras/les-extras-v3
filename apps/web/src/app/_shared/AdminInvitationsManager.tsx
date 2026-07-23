"use client";

// Gestion des invitations (back-office ADMIN).
//   GET /admin/invitations · PATCH /admin/invitations/:id/revoke|resend
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { EmptyState } from "./ui";

const ACCOUNT_ROLE_LABEL: Record<string, string> = {
  OWNER: "Direction",
  ADMIN: "Administrateur",
  MANAGER: "Responsable de service",
  MEMBER: "Salarié",
};

const STATUS: Record<string, { label: string; variant: "warning" | "success" | "muted" | "destructive" }> = {
  PENDING: { label: "En attente", variant: "warning" },
  ACCEPTED: { label: "Acceptée", variant: "success" },
  EXPIRED: { label: "Expirée", variant: "muted" },
  REVOKED: { label: "Révoquée", variant: "destructive" },
};

export interface AdminInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt?: string | null;
  createdAt: string;
  account?: { name?: string | null; type?: string | null } | null;
  invitedBy?: { email?: string | null; firstName?: string | null; lastName?: string | null } | null;
}

function fmt(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export function AdminInvitationsManager({ invitations }: { invitations: AdminInvitation[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "revoke" | "resend") {
    setBusy(id);
    try {
      await apiRequest(`/admin/invitations/${id}/${action}`, { method: "PATCH" });
      toast({ title: action === "revoke" ? "Invitation révoquée" : "Invitation renvoyée" });
      router.refresh();
    } catch (err) {
      toast({ title: "Action impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  if (invitations.length === 0) {
    return (
      <EmptyState
        title="Aucune invitation"
        description="Les invitations envoyées par les établissements et freelances apparaîtront ici."
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail invité</TableHead>
                <TableHead>Structure</TableHead>
                <TableHead>Rôle proposé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Expire le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((i) => {
                const st = STATUS[i.status] ?? { label: i.status, variant: "muted" as const };
                return (
                  <TableRow key={i.id}>
                    <TableCell className="text-sm font-medium text-foreground">{i.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{i.account?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="muted">{ACCOUNT_ROLE_LABEL[i.role] ?? i.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={st.variant}>{st.label}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{fmt(i.expiresAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" disabled={busy === i.id || i.status === "ACCEPTED"} onClick={() => act(i.id, "resend")}>
                          Renvoyer
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy === i.id || i.status === "REVOKED"} onClick={() => act(i.id, "revoke")}>
                          Révoquer
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
