"use client";

// Table utilisateurs (back-office ADMIN) : recherche + filtre statut/rôle,
// actions bannir/débannir. Alimentée par /admin/users (Server Component parent).
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserStatusActions } from "./AdminActions";
import { EmptyState } from "./ui";
import {
  formatDate,
  fullName,
  initials,
  GLOBAL_ROLE_LABEL,
  USER_STATUS_LABEL,
  userStatusBadgeVariant,
} from "./format";

export interface AdminUser {
  id: string;
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  role?: string;
  status?: string;
  createdAt?: string;
}

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "VERIFIED", label: "Vérifiés" },
  { value: "PENDING", label: "En attente" },
  { value: "BANNED", label: "Bannis" },
  { value: "ANONYMIZED", label: "Supprimés (RGPD)" },
];

const ROLE_OPTIONS = [
  { value: "", label: "Tous les rôles" },
  { value: "USER", label: "Utilisateurs" },
  { value: "ADMIN", label: "Administrateurs" },
];

export function AdminUsersTable({
  users,
  accountId,
}: {
  users: AdminUser[];
  accountId?: string;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return users.filter((u) => {
      if (status && (u.status ?? "PENDING") !== status) return false;
      if (role && (u.role ?? "USER") !== role) return false;
      if (!needle) return true;
      const hay = `${u.firstName ?? ""} ${u.lastName ?? ""} ${u.email ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [users, q, status, role]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un nom ou un e-mail…"
          className="flex-1"
        />
        <Select value={status || "__all_status"} onValueChange={(v) => setStatus(v === "__all_status" ? "" : v)}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value || "__all_status"}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={role || "__all_role"} onValueChange={(v) => setRole(v === "__all_role" ? "" : v)}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value || "__all_role"}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucun utilisateur"
          description="Aucun utilisateur ne correspond à votre recherche."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.avatarUrl ?? undefined} />
                            <AvatarFallback>{initials(u.firstName, u.lastName)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">
                              {fullName(u.firstName, u.lastName)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === "ADMIN" ? "default" : "outline"}>
                          {GLOBAL_ROLE_LABEL[u.role ?? "USER"] ?? u.role ?? "Utilisateur"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={userStatusBadgeVariant(u.status ?? "PENDING")}>
                          {USER_STATUS_LABEL[u.status ?? "PENDING"] ?? u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.role !== "ADMIN" ? (
                          <UserStatusActions
                            userId={u.id}
                            status={u.status ?? "PENDING"}
                            accountId={accountId}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
