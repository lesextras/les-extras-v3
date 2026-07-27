"use client";

import { useMemo, useState, useTransition } from "react";
import { MessageSquareReply } from "lucide-react";
import { toast } from "sonner";
import {
  banUser,
  monitorContactBypassEvent,
  sendAdminOutreach,
  type ContactBypassEventRow,
} from "@/app/actions/admin";
import {
  getContactBypassReasonLabel,
  getContactBypassRiskLabel,
  getContactBypassRiskScore,
  getContactBypassRiskVariant,
  sortContactBypassEvents,
} from "@/lib/contact-bypass-risk";
import { DataTableShell } from "@/components/data/DataTableShell";
import { FilterBar, type FilterDefinition } from "@/components/data/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TableCell, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

// ─── Types ───────────────────────────────────────────────────────────────────

type ContactBypassEventsTableProps = {
  events: ContactBypassEventRow[];
};

type DateFilter = "ALL" | "TODAY" | "7D" | "30D";

// ─── Constants ───────────────────────────────────────────────────────────────

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const REASON_VARIANTS: Record<
  ContactBypassEventRow["blockedReason"],
  "default" | "secondary" | "warning" | "outline" | "coral"
> = {
  EMAIL: "default",
  PHONE: "secondary",
  WHATSAPP: "warning",
  TELEGRAM: "outline",
  EXTERNAL_URL: "coral",
};

const USER_STATUS_LABELS: Record<string, string> = {
  VERIFIED: "Vérifié",
  PENDING: "En attente",
  BANNED: "Banni",
};

const FILTERS: FilterDefinition[] = [
  {
    key: "date",
    label: "Toutes dates",
    options: [
      { label: "Aujourd'hui", value: "TODAY" },
      { label: "7 derniers jours", value: "7D" },
      { label: "30 derniers jours", value: "30D" },
    ],
  },
  {
    key: "blockedReason",
    label: "Toutes raisons",
    options: [
      { label: getContactBypassReasonLabel("EMAIL"), value: "EMAIL" },
      { label: getContactBypassReasonLabel("PHONE"), value: "PHONE" },
      { label: getContactBypassReasonLabel("WHATSAPP"), value: "WHATSAPP" },
      { label: getContactBypassReasonLabel("TELEGRAM"), value: "TELEGRAM" },
      { label: getContactBypassReasonLabel("EXTERNAL_URL"), value: "EXTERNAL_URL" },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matchesDateFilter(createdAt: string, dateFilter: DateFilter): boolean {
  if (dateFilter === "ALL") return true;
  const createdAtDate = new Date(createdAt);
  if (isNaN(createdAtDate.getTime())) return false;
  const now = new Date();
  if (dateFilter === "TODAY") return createdAtDate.toDateString() === now.toDateString();
  const diffMs = now.getTime() - createdAtDate.getTime();
  const maxDays = dateFilter === "7D" ? 7 : 30;
  return diffMs <= maxDays * 24 * 60 * 60 * 1000;
}

function buildWarnMessage(event: ContactBypassEventRow): string {
  const reason = getContactBypassReasonLabel(event.blockedReason).toLowerCase();
  return [
    "Le Desk a détecté une tentative de partage de coordonnées ou de lien externe dans la messagerie.",
    `Motif relevé : ${reason}.`,
    "Merci de poursuivre vos échanges uniquement sur la plateforme Les Extras.",
    "En cas de récidive, votre compte pourra être suspendu manuellement.",
  ].join("\n");
}

// ─── Outreach Sheet ───────────────────────────────────────────────────────────

type OutreachSheetProps = {
  target: ContactBypassEventRow | null;
  message: string;
  onMessageChange: (v: string) => void;
  onClose: () => void;
  onSend: () => void;
  onWarn: () => void;
  isPending: boolean;
};

function OutreachSheet({
  target,
  message,
  onMessageChange,
  onClose,
  onSend,
  onWarn,
  isPending,
}: OutreachSheetProps) {
  if (!target) return null;

  const riskScore = getContactBypassRiskScore(target);

  return (
    <Sheet open={!!target} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Contacter l&apos;utilisateur</SheetTitle>
          <SheetDescription>
            {target.sender.name} — {getContactBypassReasonLabel(target.blockedReason)}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Résumé événement */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant={getContactBypassRiskVariant(riskScore)}>
                Risque {getContactBypassRiskLabel(riskScore)}
              </Badge>
              <Badge variant={REASON_VARIANTS[target.blockedReason]}>
                {getContactBypassReasonLabel(target.blockedReason)}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{target.rawExcerpt}</p>
            <p className="text-xs text-muted-foreground">
              {target.sender.email}
              {target.sender.role ? ` · ${target.sender.role}` : ""}
            </p>
          </div>

          {/* Message personnalisé */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Message personnalisé
            </p>
            <Textarea
              rows={5}
              className="resize-none"
              placeholder="Rédigez votre message à l'attention de l'utilisateur… (5 caractères minimum)"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
            />
            <Button
              className="w-full gap-2"
              disabled={isPending || message.trim().length < 5}
              onClick={onSend}
            >
              <MessageSquareReply className="h-4 w-4" aria-hidden="true" />
              {isPending ? "Envoi…" : "Envoyer le message"}
            </Button>
          </div>

          {/* Avertissement rapide */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Avertissement standard
            </p>
            <Button variant="outline" className="w-full" disabled={isPending} onClick={onWarn}>
              Envoyer l&apos;avertissement pré-rédigé
            </Button>
          </div>

          {/* Contexte */}
          {(target.conversationId || target.bookingId) && (
            <div className="rounded-lg border bg-muted/10 p-3 space-y-1 font-mono text-xs text-muted-foreground">
              <p className="not-italic text-[10px] font-semibold uppercase tracking-widest">
                Contexte
              </p>
              {target.conversationId && <p>conv : {target.conversationId}</p>}
              {target.bookingId && <p>booking : {target.bookingId}</p>}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Table ───────────────────────────────────────────────────────────────

export function ContactBypassEventsTable({ events }: ContactBypassEventsTableProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>("ALL");
  const [reasonFilter, setReasonFilter] = useState<
    "ALL" | ContactBypassEventRow["blockedReason"]
  >("ALL");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [outreachTarget, setOutreachTarget] = useState<ContactBypassEventRow | null>(null);
  const [outreachMsg, setOutreachMsg] = useState("");

  const sortedAndFiltered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const sorted = sortContactBypassEvents(events);

    return sorted.filter((event) => {
      if (!matchesDateFilter(event.createdAt, dateFilter)) return false;
      if (reasonFilter !== "ALL" && event.blockedReason !== reasonFilter) return false;
      if (!normalizedSearch) return true;
      const haystack = `${event.sender.name} ${event.sender.email}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [dateFilter, events, reasonFilter, search]);

  const handleFilterChange = (key: string, value: string) => {
    if (key === "date") setDateFilter(value as DateFilter);
    if (key === "blockedReason")
      setReasonFilter(value as "ALL" | ContactBypassEventRow["blockedReason"]);
  };

  const handleReset = () => {
    setDateFilter("ALL");
    setReasonFilter("ALL");
    setSearch("");
  };

  const handleMonitor = (eventId: string) => {
    startTransition(async () => {
      try {
        await monitorContactBypassEvent(eventId);
        toast.success("Événement ajouté à la surveillance.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Surveillance impossible.");
      }
    });
  };

  const handleWarn = (event: ContactBypassEventRow) => {
    startTransition(async () => {
      try {
        await sendAdminOutreach(event.sender.id, buildWarnMessage(event), {
          origin: "CONTACT_BYPASS",
          contextId: event.id,
        });
        toast.success("Avertissement envoyé au user.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Avertissement impossible.");
      }
    });
  };

  const handleCustomOutreach = () => {
    if (!outreachTarget || outreachMsg.trim().length < 5) return;
    startTransition(async () => {
      try {
        await sendAdminOutreach(outreachTarget.sender.id, outreachMsg.trim(), {
          origin: "CONTACT_BYPASS",
          contextId: outreachTarget.id,
        });
        toast.success("Message envoyé à l'utilisateur.");
        closeOutreach();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Envoi impossible.");
      }
    });
  };

  const handleSuspend = (userId: string) => {
    startTransition(async () => {
      try {
        await banUser(userId);
        toast.success("Compte suspendu.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Suspension impossible.");
      }
    });
  };

  const openOutreach = (event: ContactBypassEventRow) => {
    setOutreachTarget(event);
    setOutreachMsg("");
  };

  const closeOutreach = () => {
    setOutreachTarget(null);
    setOutreachMsg("");
  };

  return (
    <>
      <DataTableShell
        columns={[
          "Date",
          "Raison",
          "Risque",
          "Expéditeur",
          "Statut",
          "Extrait",
          "Contexte",
          "Actions",
        ]}
        emptyTitle="Aucun contournement détecté"
        emptyDescription="Les tentatives bloquées apparaîtront ici."
        filterSlot={
          <FilterBar
            filters={FILTERS}
            activeFilters={{ date: dateFilter, blockedReason: reasonFilter }}
            onFilterChange={handleFilterChange}
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Rechercher un expéditeur…"
            onReset={handleReset}
          />
        }
      >
        {sortedAndFiltered.map((event) => {
          const riskScore = getContactBypassRiskScore(event);

          return (
            <TableRow key={event.id}>
              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                {isNaN(new Date(event.createdAt).getTime())
                  ? "Date à confirmer"
                  : dateFormatter.format(new Date(event.createdAt))}
              </TableCell>

              <TableCell>
                <Badge variant={REASON_VARIANTS[event.blockedReason]}>
                  {getContactBypassReasonLabel(event.blockedReason)}
                </Badge>
              </TableCell>

              <TableCell>
                <Badge variant={getContactBypassRiskVariant(riskScore)}>
                  {getContactBypassRiskLabel(riskScore)}
                </Badge>
              </TableCell>

              <TableCell className="max-w-[200px]">
                <p className="font-medium text-foreground">{event.sender.name}</p>
                <p className="truncate text-xs text-muted-foreground">{event.sender.email}</p>
                <p className="truncate text-[11px] text-muted-foreground/60">
                  {event.sender.role}
                </p>
              </TableCell>

              <TableCell>
                <Badge variant={event.sender.status === "BANNED" ? "error" : "quiet"}>
                  {USER_STATUS_LABELS[event.sender.status] ?? event.sender.status}
                </Badge>
              </TableCell>

              <TableCell className="max-w-[320px]">
                <p className="line-clamp-2 text-sm text-foreground">{event.rawExcerpt}</p>
              </TableCell>

              <TableCell className="space-y-1 font-mono text-xs text-muted-foreground">
                <p>conv: {event.conversationId ?? "—"}</p>
                <p>booking: {event.bookingId ?? "—"}</p>
              </TableCell>

              <TableCell className="min-w-[280px]">
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => openOutreach(event)}
                  >
                    Contacter
                  </Button>
                  <Button
                    size="xs"
                    variant="quiet"
                    disabled={isPending}
                    onClick={() => handleMonitor(event.id)}
                  >
                    Surveiller
                  </Button>
                  <Button
                    size="xs"
                    variant="danger-soft"
                    disabled={isPending || event.sender.status === "BANNED"}
                    onClick={() => handleSuspend(event.sender.id)}
                  >
                    Suspendre
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </DataTableShell>

      <OutreachSheet
        target={outreachTarget}
        message={outreachMsg}
        onMessageChange={setOutreachMsg}
        onClose={closeOutreach}
        onSend={handleCustomOutreach}
        onWarn={() => outreachTarget && handleWarn(outreachTarget)}
        isPending={isPending}
      />
    </>
  );
}
