"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Inbox,
  MessageSquare,
} from "lucide-react";
import type { MyDeskRequest, MyDeskRequestStatus } from "@/app/actions/desk";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";
import { getDeskContextLabel, getDeskRequestTypeLabel } from "@/lib/desk-labels";

type DeskRequestFilter = "ALL" | MyDeskRequestStatus;

type DeskRequestsClientProps = {
  requests: MyDeskRequest[];
  loadError?: string | null;
};

const STATUS_LABELS: Record<MyDeskRequestStatus, string> = {
  OPEN: "Ouverte",
  IN_PROGRESS: "En cours",
  ANSWERED: "Répondue",
  CLOSED: "Clôturée",
};

const STATUS_COUNTER_LABELS: Record<MyDeskRequestStatus, string> = {
  OPEN: "Ouvertes",
  IN_PROGRESS: "En cours",
  ANSWERED: "Répondues",
  CLOSED: "Clôturées",
};

const STATUS_VARIANTS = {
  OPEN: "amber",
  IN_PROGRESS: "teal",
  ANSWERED: "emerald",
  CLOSED: "quiet",
} as const;

const FILTERS: Array<{ value: DeskRequestFilter; label: string }> = [
  { value: "ALL", label: "Toutes" },
  { value: "OPEN", label: "Ouvertes" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "ANSWERED", label: "Répondues" },
  { value: "CLOSED", label: "Clôturées" },
];

const dateTimeFormatter = (value: string | null | undefined) => {
  if (!value) return "date indisponible";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "date indisponible";

  return format(date, "d MMMM yyyy 'à' HH:mm", { locale: fr });
};

function StatusIcon({ status }: { status: MyDeskRequestStatus }) {
  if (status === "ANSWERED") {
    return <CheckCircle2 className="h-4 w-4 text-[hsl(var(--emerald))] shrink-0" aria-hidden="true" />;
  }

  return <Clock className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />;
}

function DeskRequestCard({ req }: { req: MyDeskRequest }) {
  const contextLabel = getDeskContextLabel(req);

  return (
    <article className="rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-[hsl(var(--surface-2))]/40">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{getDeskRequestTypeLabel(req.type)}</Badge>
              <h3 className="text-sm font-semibold text-foreground">{contextLabel}</h3>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              Demande créée le {dateTimeFormatter(req.createdAt)}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <StatusIcon status={req.status} />
            <Badge variant={STATUS_VARIANTS[req.status]}>{STATUS_LABELS[req.status]}</Badge>
          </div>
        </div>

        <div className="rounded-lg border border-border/70 bg-[hsl(var(--surface-2))] p-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            Votre demande
          </p>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{req.message}</p>
        </div>

        {req.response && (
          <div className="rounded-lg border border-[hsl(var(--emerald)/0.22)] bg-[hsl(var(--color-emerald-50))] p-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[hsl(var(--color-emerald-700))]">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Réponse de l&apos;équipe
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{req.response}</p>
            {req.answeredAt && (
              <p className="mt-3 text-xs text-muted-foreground">
                Répondu le {dateTimeFormatter(req.answeredAt)}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function StatusCounter({
  label,
  count,
  status,
}: {
  label: string;
  count: number;
  status: MyDeskRequestStatus;
}) {
  return (
    <GlassCard variant="solid" className="p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Badge variant={STATUS_VARIANTS[status]}>{count}</Badge>
      </div>
    </GlassCard>
  );
}

export function DeskRequestsClient({ requests, loadError = null }: DeskRequestsClientProps) {
  const [activeFilter, setActiveFilter] = useState<DeskRequestFilter>("ALL");

  const counts = useMemo(() => {
    return requests.reduce<Record<MyDeskRequestStatus, number>>(
      (acc, request) => {
        acc[request.status] += 1;
        return acc;
      },
      {
        OPEN: 0,
        IN_PROGRESS: 0,
        ANSWERED: 0,
        CLOSED: 0,
      },
    );
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (activeFilter === "ALL") return requests;
    return requests.filter((request) => request.status === activeFilter);
  }, [activeFilter, requests]);

  const activeLabel =
    activeFilter === "ALL" ? "Toutes" : STATUS_COUNTER_LABELS[activeFilter];

  return (
    <section className="space-y-4" aria-label="Suivi des demandes Desk">
      {loadError && (
        <div className="rounded-xl border border-[hsl(var(--color-amber-300))] bg-[hsl(var(--color-amber-50))] p-4 text-sm text-[hsl(var(--color-amber-800))]">
          {loadError}
        </div>
      )}

      <GlassCard variant="solid" className="overflow-hidden">
        <div className="border-b border-border/60 px-5 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <h2 className="font-display text-heading-sm">Suivi des demandes</h2>
              <p className="text-sm text-muted-foreground">
                Consultez l&apos;avancement de vos tickets et les réponses transmises par l&apos;équipe Les Extras.
              </p>
            </div>
            <Badge variant="quiet" className="w-fit">
              {requests.length} demande{requests.length > 1 ? "s" : ""}
            </Badge>
          </div>
        </div>

        <GlassCardContent className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {(["OPEN", "IN_PROGRESS", "ANSWERED", "CLOSED"] as MyDeskRequestStatus[]).map((status) => (
              <StatusCounter
                key={status}
                status={status}
                label={STATUS_COUNTER_LABELS[status]}
                count={counts[status]}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Filtres des demandes">
            {FILTERS.map((filter) => {
              const count = filter.value === "ALL" ? requests.length : counts[filter.value];
              const isActive = activeFilter === filter.value;

              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActiveFilter(filter.value)}
                  className={cn(
                    "inline-flex h-9 items-center justify-center rounded-full border px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "border-[hsl(var(--teal)/0.25)] bg-[hsl(var(--teal-light))] text-[hsl(var(--teal))]"
                      : "border-border bg-background text-muted-foreground hover:bg-[hsl(var(--surface-2))] hover:text-foreground",
                  )}
                >
                  {filter.label}
                  <span className="ml-2 tabular-nums text-xs opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {requests.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-background">
              <EmptyState
                icon={Inbox}
                title={loadError ? "Demandes indisponibles" : "Aucune demande pour le moment"}
                description={
                  loadError
                    ? "Nous ne pouvons pas afficher vos demandes pour le moment."
                    : "Décrivez votre besoin dans le formulaire : le Desk prendra le relais depuis cet espace."
                }
                tips="Les réponses de l'équipe apparaîtront ici."
              />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-background">
              <EmptyState
                icon={FileText}
                title="Aucune demande dans ce statut"
                description={`Le filtre "${activeLabel}" ne contient aucune demande pour le moment.`}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map((req) => (
                <DeskRequestCard key={req.id} req={req} />
              ))}
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </section>
  );
}
