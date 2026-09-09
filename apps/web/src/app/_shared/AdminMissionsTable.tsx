"use client";

// Table missions (back-office ADMIN) : recherche + filtre statut, modération.
// Alimentée par /admin/missions (Server Component parent).
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { ModerateMissionActions } from "./AdminActions";
import { EmptyState } from "./ui";
import {
  MISSION_CATEGORY_LABEL,
  MISSION_STATUS_LABEL,
  missionBadgeVariant,
  formatDate,
} from "./format";
import type { Mission } from "./types";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "DRAFT", label: "À modérer" },
  { value: "PUBLISHED", label: "Publiées" },
  { value: "FILLED", label: "Pourvues" },
  { value: "CLOSED", label: "Clôturées" },
  { value: "CANCELLED", label: "Annulées" },
];

export function AdminMissionsTable({
  missions,
  accountId,
}: {
  missions: Mission[];
  accountId?: string;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return missions.filter((m) => {
      if (status && m.status !== status) return false;
      if (!needle) return true;
      const hay = `${m.title ?? ""} ${m.account?.name ?? ""} ${m.city ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [missions, q, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un titre, un établissement, une ville…"
          className="flex-1"
        />
        <Select value={status || "__all"} onValueChange={(v) => setStatus(v === "__all" ? "" : v)}>
          <SelectTrigger className="sm:w-[200px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value || "__all"}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Aucune mission"
          description="Aucune mission ne correspond à votre recherche."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mission</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="sticky right-0 z-10 bg-card text-right shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.35)]">
                      Modération
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{m.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {m.account?.name ?? "Établissement"}
                            {m.city ? ` · ${m.city}` : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(m as { categoryRef?: { title?: string } }).categoryRef?.title ?? MISSION_CATEGORY_LABEL[m.category] ?? m.category}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={missionBadgeVariant(m.status)}>
                          {MISSION_STATUS_LABEL[m.status] ?? m.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(m.startDate)}
                      </TableCell>
                      {/* EPINGLEE A DROITE : c'est la colonne qu'on vient
                          chercher, et c'etait toujours celle qui sortait du
                          cadre. Elle reste visible pendant qu'on fait defiler
                          le reste, et les boutons peuvent enfin replier au
                          lieu de pousser la largeur. */}
                      <TableCell className="sticky right-0 z-10 bg-card shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.35)]">
                        <ModerateMissionActions
                          missionId={m.id}
                          accountId={accountId}
                          status={m.status}
                        />
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
