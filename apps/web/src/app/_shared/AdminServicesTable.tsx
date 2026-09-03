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
import { completude } from "@/lib/completude-fiche";

const STATUS_OPTIONS = [
  { value: "", label: "Tous les statuts" },
  { value: "DRAFT", label: "À modérer" },
  { value: "PUBLISHED", label: "Publiés" },
  { value: "ARCHIVED", label: "Archivés" },
  // Un filtre de statut ET un filtre de complétude dans la même liste : ce
  // n'est pas orthodoxe, mais c'est la question qu'on se pose vraiment devant
  // ce tableau — « lesquelles sont à finir ? » — et la liste des statuts est
  // le seul endroit où on la cherche.
  { value: "__incompletes", label: "Fiches incomplètes" },
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
      if (status === "__incompletes") {
        if (completude(s).socleComplet) return false;
      } else if (status && s.status !== status) return false;
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
                    <TableHead>Fiche</TableHead>
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
                      <TableCell className="whitespace-nowrap">
                        <Completude service={s} />
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

/** Complétude d'une fiche, en une cellule : le compte, et ce qui manque. */
function Completude({ service }: { service: Service }) {
  const c = completude(service);
  const manque = c.manquants.filter((m) => m.niveau === "socle");
  const couleur =
    c.pourcentage >= 100
      ? "text-emerald-600 dark:text-emerald-400"
      : c.pourcentage >= 70
        ? "text-primary"
        : "text-secondary";
  return (
    <div className="min-w-[7rem]">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
          <div
            className={c.pourcentage >= 100 ? "h-full bg-emerald-500" : c.pourcentage >= 70 ? "h-full bg-primary" : "h-full bg-secondary"}
            style={{ width: `${c.pourcentage}%` }}
          />
        </div>
        <span className={`text-xs font-semibold ${couleur}`}>{c.pourcentage} %</span>
      </div>
      {manque.length > 0 ? (
        <p className="mt-0.5 max-w-[16rem] truncate text-[11px] text-muted-foreground" title={manque.map((m) => m.label).join(", ")}>
          manque : {manque.map((m) => m.label).join(", ")}
        </p>
      ) : null}
    </div>
  );
}
