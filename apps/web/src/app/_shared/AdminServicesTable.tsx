"use client";

// Table ateliers/services (back-office ADMIN) : recherche + filtre statut,
// modération. Alimentée par /admin/services (Server Component parent).
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
import { ModerateServiceActions } from "./AdminActions";
import { EmptyState } from "./ui";
import {
  SERVICE_CATEGORY_LABEL,
  SERVICE_STATUS_LABEL,
  serviceBadgeVariant,
  formatMoney,
} from "./format";
import type { Service } from "./types";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "DRAFT", label: "À modérer" },
  { value: "PUBLISHED", label: "Publiés" },
  { value: "ARCHIVED", label: "Archivés" },
];

export function AdminServicesTable({
  services,
  accountId,
}: {
  services: Service[];
  accountId?: string;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return services.filter((s) => {
      if (status && s.status !== status) return false;
      if (!needle) return true;
      const hay = `${s.title ?? ""} ${s.account?.name ?? ""} ${s.city ?? ""}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [services, q, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un atelier, un établissement, une ville…"
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
          title="Aucun atelier"
          description="Aucun atelier ne correspond à votre recherche."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Atelier</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Tarif</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Modération</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{s.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {s.account?.name ?? "Établissement"}
                            {s.city ? ` · ${s.city}` : ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {(s as { categoryRef?: { title?: string } }).categoryRef?.title ?? SERVICE_CATEGORY_LABEL[s.category] ?? s.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatMoney(s.price)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={serviceBadgeVariant(s.status)}>
                          {SERVICE_STATUS_LABEL[s.status] ?? s.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <ModerateServiceActions
                          serviceId={s.id}
                          accountId={accountId}
                          status={s.status}
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
