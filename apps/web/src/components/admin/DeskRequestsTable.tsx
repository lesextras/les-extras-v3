"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, Clock, MessageSquareReply, UserRound, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  assignDeskRequest,
  type AdminUserRow,
  type DeskRequestPriority,
  type DeskRequestRow,
  type DeskRequestStatus,
  updateDeskRequestStatus,
  respondToDeskRequest,
} from "@/app/actions/admin";
import {
  DESK_REQUEST_TYPE_LABELS,
  getDeskContextLabel,
  getDeskRequestTypeLabel,
} from "@/lib/desk-labels";
import {
  getDeskPriorityLabel,
  getDeskPriorityVariant,
  getDeskStatusLabel,
  getDeskStatusVariant,
  isDeskRequestLate,
  isDeskRequestOpen,
  sortDeskRequestsByPriority,
} from "@/lib/desk-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FilterBar, type FilterDefinition } from "@/components/data/FilterBar";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function safeFormatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Date à confirmer";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "Date à confirmer";
  return dateFormatter.format(date);
}

const ROLE_LABELS: Record<string, string> = {
  FREELANCE: "Freelance",
  ESTABLISHMENT: "Établissement",
  ADMIN: "Administrateur",
};

const RESPONSE_TEMPLATES = [
  {
    label: "Problème technique",
    text: "Bonjour,\n\nNous avons bien reçu votre signalement. Notre équipe technique analyse la situation et revient vers vous dans les plus brefs délais.\n\nCordialement,\nL'équipe Les Extras",
  },
  {
    label: "Litige",
    text: "Bonjour,\n\nNous prenons en charge votre signalement de litige. Nous examinons la situation et vous revenons rapidement avec des éléments de résolution.\n\nCordialement,\nL'équipe Les Extras",
  },
  {
    label: "Demande mission",
    text: "Bonjour,\n\nSuite à votre demande concernant la mission, voici les précisions demandées : [à compléter].\n\nN'hésitez pas à nous recontacter pour toute question complémentaire.\n\nCordialement,\nL'équipe Les Extras",
  },
  {
    label: "Paiement",
    text: "Bonjour,\n\nNous accusons réception de votre message concernant un problème de paiement. Votre dossier est traité en priorité et nous vous contactons très prochainement.\n\nCordialement,\nL'équipe Les Extras",
  },
];

const FILTERS: FilterDefinition[] = [
  {
    key: "status",
    label: "Tous les statuts",
    options: [
      { label: getDeskStatusLabel("OPEN"), value: "OPEN" },
      { label: getDeskStatusLabel("IN_PROGRESS"), value: "IN_PROGRESS" },
      { label: getDeskStatusLabel("ANSWERED"), value: "ANSWERED" },
      { label: getDeskStatusLabel("CLOSED"), value: "CLOSED" },
    ],
  },
  {
    key: "type",
    label: "Tous les types",
    options: (Object.keys(DESK_REQUEST_TYPE_LABELS) as DeskRequestRow["type"][]).map((key) => ({
      label: getDeskRequestTypeLabel(key),
      value: key,
    })),
  },
  {
    key: "priority",
    label: "Toutes priorités",
    options: (["LOW", "NORMAL", "HIGH", "URGENT"] as DeskRequestPriority[]).map((p) => ({
      label: getDeskPriorityLabel(p),
      value: p,
    })),
  },
  {
    key: "assigned",
    label: "Assignation",
    options: [
      { label: "Assignées", value: "ASSIGNED" },
      { label: "Non assignées", value: "UNASSIGNED" },
    ],
  },
];

function getRequesterName(requester: DeskRequestRow["requester"]): string {
  if (requester.profile) {
    return `${requester.profile.firstName} ${requester.profile.lastName}`.trim();
  }
  return requester.email;
}

function getAdminName(admin: NonNullable<DeskRequestRow["assignedToAdmin"]> | AdminUserRow): string {
  if ("name" in admin) return admin.name;
  if (admin.profile) {
    return `${admin.profile.firstName} ${admin.profile.lastName}`.trim();
  }
  return admin.email;
}

type DeskRequestsTableProps = {
  requests: DeskRequestRow[];
  admins: AdminUserRow[];
  currentAdminId?: string;
};

export function DeskRequestsTable({ requests, admins, currentAdminId }: DeskRequestsTableProps) {
  const router = useRouter();
  const now = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState<DeskRequestRow | null>(null);
  const [replyText, setReplyText] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assignedFilter, setAssignedFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  const sortedAndFiltered = useMemo(() => {
    const filtered = requests.filter((request) => {
      if (statusFilter !== "ALL" && request.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && request.type !== typeFilter) return false;
      if (priorityFilter !== "ALL" && request.priority !== priorityFilter) return false;
      if (assignedFilter === "ASSIGNED" && !request.assignedToAdminId) return false;
      if (assignedFilter === "UNASSIGNED" && request.assignedToAdminId) return false;
      return true;
    });
    return sortDeskRequestsByPriority(filtered, now);
  }, [assignedFilter, now, priorityFilter, requests, statusFilter, typeFilter]);

  const openSheet = (req: DeskRequestRow) => {
    setSelected(req);
    setReplyText(req.response ?? "");
  };

  const closeSheet = () => {
    setSelected(null);
    setReplyText("");
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") setStatusFilter(value);
    if (key === "type") setTypeFilter(value);
    if (key === "priority") setPriorityFilter(value);
    if (key === "assigned") setAssignedFilter(value);
  };

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setPriorityFilter("ALL");
    setAssignedFilter("ALL");
  };

  const handleStatusChange = (id: string, status: DeskRequestStatus) => {
    startTransition(async () => {
      try {
        await updateDeskRequestStatus(id, status);
        toast.success("Statut mis à jour");
        setSelected((current) => (current?.id === id ? { ...current, status } : current));
        router.refresh();
      } catch {
        toast.error("Erreur lors de la mise à jour");
      }
    });
  };

  const handleAssign = (id: string, adminId: string | null) => {
    startTransition(async () => {
      try {
        await assignDeskRequest(id, adminId);
        toast.success(adminId ? "Demande assignée" : "Assignation retirée");
        const assignedAdmin = admins.find((admin) => admin.id === adminId);
        setSelected((current) =>
          current?.id === id
            ? {
                ...current,
                assignedToAdminId: adminId,
                assignedToAdmin: assignedAdmin
                  ? { id: assignedAdmin.id, email: assignedAdmin.email, profile: null }
                  : null,
              }
            : current,
        );
        router.refresh();
      } catch {
        toast.error("Erreur lors de l'assignation");
      }
    });
  };

  const handleRespond = () => {
    if (!selected || replyText.trim().length < 5) return;
    startTransition(async () => {
      try {
        await respondToDeskRequest(selected.id, replyText.trim());
        toast.success("Réponse envoyée — l'utilisateur a été notifié");
        closeSheet();
        router.refresh();
      } catch {
        toast.error("Erreur lors de l'envoi de la réponse");
      }
    });
  };

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
        Aucun ticket Desk pour le moment.
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="border-b border-border/50 p-4">
          <FilterBar
            filters={FILTERS}
            activeFilters={{
              status: statusFilter,
              type: typeFilter,
              priority: priorityFilter,
              assigned: assignedFilter,
            }}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Contexte</TableHead>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Assigné</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedAndFiltered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                  Aucune demande ne correspond aux filtres.
                </TableCell>
              </TableRow>
            ) : (
              sortedAndFiltered.map((req) => {
                const isLate = isDeskRequestLate(req, now);
                return (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium max-w-[150px] truncate">
                      {getDeskRequestTypeLabel(req.type)}
                    </TableCell>
                    <TableCell className="font-medium max-w-[160px] truncate">
                      {getDeskContextLabel(req)}
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate">
                      {getRequesterName(req.requester)}
                      <span className="block text-xs text-muted-foreground truncate">
                        {req.requester.email}
                      </span>
                      {req.requester.role && (
                        <span className="block text-xs text-muted-foreground/60">
                          {ROLE_LABELS[req.requester.role] ?? req.requester.role}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="text-sm text-muted-foreground line-clamp-2">{req.message}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getDeskPriorityVariant(req.priority)}>
                        {getDeskPriorityLabel(req.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={getDeskStatusVariant(req.status)}>
                          {getDeskStatusLabel(req.status)}
                        </Badge>
                        {isLate && (
                          <AlertTriangle
                            className="h-3.5 w-3.5 text-amber-500 shrink-0"
                            aria-label="En retard"
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">
                      {req.assignedToAdmin ? getAdminName(req.assignedToAdmin) : "Non assignée"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {safeFormatDate(req.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant={isDeskRequestOpen(req.status) ? "default" : "outline"}
                        className="gap-1.5"
                        onClick={() => openSheet(req)}
                      >
                        <MessageSquareReply className="h-3.5 w-3.5" aria-hidden="true" />
                        Traiter
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{getDeskRequestTypeLabel(selected.type)}</SheetTitle>
                <SheetDescription>
                  {getDeskContextLabel(selected)} — {getRequesterName(selected.requester)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                {/* Contexte */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge variant={getDeskPriorityVariant(selected.priority)}>
                    {getDeskPriorityLabel(selected.priority)}
                  </Badge>
                  <Badge variant={getDeskStatusVariant(selected.status)}>
                    {getDeskStatusLabel(selected.status)}
                  </Badge>
                  {isDeskRequestLate(selected, now) && (
                    <span className="flex items-center gap-1 text-xs text-amber-500">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      En retard
                    </span>
                  )}
                </div>

                {/* Actions rapides */}
                <div className="flex flex-wrap gap-2">
                  {selected.status === "OPEN" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      className="gap-1.5"
                      onClick={() => handleStatusChange(selected.id, "IN_PROGRESS")}
                    >
                      <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                      Marquer en cours
                    </Button>
                  )}
                  {selected.status !== "CLOSED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => handleStatusChange(selected.id, "CLOSED")}
                    >
                      Clôturer
                    </Button>
                  )}
                </div>

                {/* Demande utilisateur */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Demande utilisateur
                  </p>
                  <div className="rounded-lg border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                    {selected.message}
                  </div>
                </div>

                {/* Assignation */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Assignation
                  </p>
                  <div className="flex gap-2">
                    <Select
                      value={selected.assignedToAdminId ?? "UNASSIGNED"}
                      disabled={isPending}
                      onValueChange={(value) => {
                        handleAssign(selected.id, value === "UNASSIGNED" ? null : value);
                      }}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Assigner à un admin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNASSIGNED">Non assignée</SelectItem>
                        {admins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {currentAdminId && selected.assignedToAdminId !== currentAdminId && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleAssign(selected.id, currentAdminId)}
                      >
                        Me l'assigner
                      </Button>
                    )}
                  </div>
                </div>

                {/* Statut */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Statut
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED"] as DeskRequestStatus[]).map(
                      (s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={selected.status === s ? "default" : "outline"}
                          disabled={isPending}
                          onClick={() => handleStatusChange(selected.id, s)}
                        >
                          {getDeskStatusLabel(s)}
                        </Button>
                      ),
                    )}
                  </div>
                </div>

                {/* Historique réponse */}
                {selected.response && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                      Historique de réponse
                    </p>
                    <div className="rounded-lg border bg-emerald-500/5 border-emerald-500/20 p-4 text-sm whitespace-pre-wrap">
                      {selected.response}
                    </div>
                    {selected.answeredAt && (
                      <p className="text-xs text-muted-foreground">
                        {safeFormatDate(selected.answeredAt)}
                        {selected.answeredBy?.profile
                          ? ` — ${selected.answeredBy.profile.firstName} ${selected.answeredBy.profile.lastName}`
                          : ""}
                      </p>
                    )}
                  </div>
                )}

                {/* Zone de réponse */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {selected.response ? "Modifier la réponse" : "Répondre à l'utilisateur"}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {RESPONSE_TEMPLATES.map((template) => (
                      <Button
                        key={template.label}
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => setReplyText(template.text)}
                      >
                        {template.label}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    rows={5}
                    className="resize-none"
                    placeholder="Rédigez votre réponse… Elle sera visible par l'utilisateur dans son espace."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <Button
                    className="w-full gap-2"
                    disabled={isPending || replyText.trim().length < 5}
                    onClick={handleRespond}
                  >
                    <MessageSquareReply className="h-4 w-4" aria-hidden="true" />
                    {isPending ? "Envoi…" : "Envoyer la réponse"}
                  </Button>
                </div>

                {/* Infos utilisateur */}
                <div className="rounded-lg border bg-muted/20 p-4 space-y-1 text-sm">
                  <p className="font-medium flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                    {getRequesterName(selected.requester)}
                  </p>
                  <p className="text-muted-foreground">{selected.requester.email}</p>
                  {selected.requester.role && (
                    <p className="text-xs text-muted-foreground/80">
                      {ROLE_LABELS[selected.requester.role] ?? selected.requester.role}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Demande reçue le {safeFormatDate(selected.createdAt)}
                  </p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
