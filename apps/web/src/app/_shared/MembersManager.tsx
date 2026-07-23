"use client";

// Gestion des sous-comptes : liste des membres (changer rôle / révoquer) +
// invitations en attente (renvoyer / annuler). Réservé OWNER/ADMIN du compte.
// Endpoints :
//   PATCH  /memberships/:id            { role }
//   DELETE /memberships/:id
//   POST   /accounts/:id/invitations/:invId/resend
//   DELETE /accounts/:id/invitations/:invId
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { EmptyState } from "./ui";
import {
  ACCOUNT_ROLE_LABEL,
  INVITATION_STATUS_LABEL,
  fullName,
  initials,
  timeAgo,
} from "./format";
import type { Invitation, Membership } from "./types";

const ASSIGNABLE_ROLES = ["ADMIN", "MANAGER", "MEMBER"] as const;

export function MembersManager({
  accountId,
  currentUserId,
  canManage,
  members,
  invitations,
}: {
  accountId: string;
  currentUserId: string;
  canManage: boolean;
  members: Membership[];
  invitations: Invitation[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function run(id: string, fn: () => Promise<unknown>, okMsg: string) {
    setBusyId(id);
    try {
      await fn();
      toast({ title: okMsg });
      startTransition(() => router.refresh());
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  const changeRole = (m: Membership, role: string) =>
    run(
      m.id,
      () => apiRequest(`/memberships/${m.id}`, { method: "PATCH", body: { role }, accountId }),
      "Rôle mis à jour",
    );

  const revokeMember = (m: Membership) =>
    run(
      m.id,
      () => apiRequest(`/memberships/${m.id}`, { method: "DELETE", accountId }),
      "Membre retiré",
    );

  const resendInvite = (inv: Invitation) =>
    run(
      inv.id,
      () =>
        apiRequest(`/accounts/${accountId}/invitations/${inv.id}/resend`, {
          method: "POST",
          accountId,
        }),
      "Invitation renvoyée",
    );

  const cancelInvite = (inv: Invitation) =>
    run(
      inv.id,
      () =>
        apiRequest(`/accounts/${accountId}/invitations/${inv.id}`, {
          method: "DELETE",
          accountId,
        }),
      "Invitation annulée",
    );

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Membres ({members.length})
        </h3>
        {members.length === 0 ? (
          <EmptyState title="Aucun membre" description="Invitez vos collègues à rejoindre ce compte." />
        ) : (
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const isOwner = m.role === "OWNER";
                  const isSelf = m.user?.id === currentUserId;
                  const locked = isOwner || !canManage || isSelf || busyId === m.id;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={m.user?.avatarUrl ?? undefined} />
                            <AvatarFallback>
                              {initials(m.user?.firstName, m.user?.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {fullName(m.user?.firstName, m.user?.lastName)}
                              {isSelf ? (
                                <span className="ml-1 text-xs text-muted-foreground">(vous)</span>
                              ) : null}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {m.user?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isOwner || !canManage || isSelf ? (
                          <Badge variant={isOwner ? "default" : "secondary"}>
                            {ACCOUNT_ROLE_LABEL[m.role]}
                          </Badge>
                        ) : (
                          <Select
                            value={m.role}
                            onValueChange={(v) => changeRole(m, v)}
                            disabled={busyId === m.id}
                          >
                            <SelectTrigger className="h-8 w-[150px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ASSIGNABLE_ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {ACCOUNT_ROLE_LABEL[r]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          disabled={locked}
                          onClick={() => revokeMember(m)}
                        >
                          Retirer
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Invitations en attente ({invitations.length})
        </h3>
        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune invitation en attente.</p>
        ) : (
          <div className="rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{ACCOUNT_ROLE_LABEL[inv.role]}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {INVITATION_STATUS_LABEL[inv.status]} · {timeAgo(inv.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {canManage ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busyId === inv.id || inv.status !== "PENDING"}
                            onClick={() => resendInvite(inv)}
                          >
                            Renvoyer
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={busyId === inv.id}
                            onClick={() => cancelInvite(inv)}
                          >
                            Annuler
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
      {pending ? <p className="text-xs text-muted-foreground">Mise à jour…</p> : null}
    </div>
  );
}
