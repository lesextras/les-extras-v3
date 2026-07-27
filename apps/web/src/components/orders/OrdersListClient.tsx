"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { GlassCard } from "@/components/ui/glass-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  ChevronRight,
  Shield,
  GraduationCap,
  Clock,
  Loader2,
  CheckCircle2,
  CreditCard,
  Star,
} from "lucide-react";
import type { BookingLine, BookingLineType } from "@/app/actions/bookings";

const STATUS_MAP: Record<
  string,
  { label: string; variant: "success" | "warning" | "error" | "info" | "quiet"; color: string }
> = {
  PENDING: { label: "En attente", variant: "warning", color: "bg-amber-500" },
  QUOTE_SENT: { label: "Devis envoyé", variant: "info", color: "bg-blue-500" },
  QUOTE_ACCEPTED: { label: "Devis accepté", variant: "info", color: "bg-blue-500" },
  CONFIRMED: { label: "Confirmé", variant: "success", color: "bg-[hsl(var(--color-teal-500))]" },
  IN_PROGRESS: { label: "En cours", variant: "info", color: "bg-blue-500" },
  COMPLETED: { label: "Terminé", variant: "quiet", color: "bg-muted-foreground" },
  AWAITING_PAYMENT: { label: "Attente paiement", variant: "warning", color: "bg-amber-500" },
  PAID: { label: "Payé", variant: "success", color: "bg-emerald-500" },
  CANCELLED: { label: "Annulé", variant: "error", color: "bg-red-500" },
  ASSIGNED: { label: "Assigné", variant: "success", color: "bg-[hsl(var(--color-teal-500))]" },
};

const PENDING_STATUSES = new Set(["PENDING", "QUOTE_SENT"]);
const ACTIVE_STATUSES = new Set(["CONFIRMED", "IN_PROGRESS", "QUOTE_ACCEPTED", "ASSIGNED"]);
const COMPLETED_STATUSES = new Set(["COMPLETED", "AWAITING_PAYMENT"]);
const PAID_STATUSES = new Set(["PAID"]);

type OrdersListClientProps = {
  lines: BookingLine[];
  error?: string | null;
};

function formatAmount(amount?: number): string | null {
  if (amount == null) return null;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
}

export function OrdersListClient({ lines, error = null }: OrdersListClientProps) {
  const orderable = useMemo(
    () => lines.filter((l) => l.relatedBookingId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [lines],
  );
  const [typeFilter, setTypeFilter] = useState<"all" | BookingLineType>("all");

  const filtered = useMemo(
    () => (typeFilter === "all" ? orderable : orderable.filter((l) => l.lineType === typeFilter)),
    [orderable, typeFilter],
  );

  // KPIs
  const kpis = useMemo(() => {
    const pending = orderable.filter((l) => PENDING_STATUSES.has(l.status)).length;
    const active = orderable.filter((l) => ACTIVE_STATUSES.has(l.status)).length;
    const completed = orderable.filter((l) => COMPLETED_STATUSES.has(l.status)).length;
    const paid = orderable.filter((l) => PAID_STATUSES.has(l.status)).length;
    return { pending, active, completed, paid };
  }, [orderable]);

  if (orderable.length === 0) {
    return (
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg border border-[hsl(var(--color-amber-300))] bg-[hsl(var(--color-amber-50))] px-4 py-3 text-sm text-[hsl(var(--color-amber-800))]">
            {error}
          </div>
        )}
        <div className="flex items-center justify-center py-20">
          <EmptyState
            icon={Package}
            title="Aucune commande"
            description="Vos commandes apparaîtront ici une fois qu'une réservation sera créée."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-[hsl(var(--color-amber-300))] bg-[hsl(var(--color-amber-50))] px-4 py-3 text-sm text-[hsl(var(--color-amber-800))]">
          {error}
        </div>
      )}

      <h1 className="text-lg font-semibold">Mes Commandes</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard variant="solid" className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium">En attente</span>
          </div>
          <p className="text-2xl font-bold tabular-nums">{kpis.pending}</p>
        </GlassCard>
        <GlassCard variant="solid" className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Loader2 className="h-4 w-4" />
            <span className="text-xs font-medium">En cours</span>
          </div>
          <p className="text-2xl font-bold tabular-nums">{kpis.active}</p>
        </GlassCard>
        <GlassCard variant="solid" className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-medium">Terminées</span>
          </div>
          <p className="text-2xl font-bold tabular-nums">{kpis.completed}</p>
        </GlassCard>
        <GlassCard variant="solid" className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-medium">Payées</span>
          </div>
          <p className="text-2xl font-bold tabular-nums">{kpis.paid}</p>
        </GlassCard>
      </div>

      {/* Type Tabs */}
      <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
        <TabsList>
          <TabsTrigger value="all">Toutes ({orderable.length})</TabsTrigger>
          <TabsTrigger value="MISSION">
            <Shield className="h-3.5 w-3.5 mr-1" />
            Renforts ({orderable.filter((l) => l.lineType === "MISSION").length})
          </TabsTrigger>
          <TabsTrigger value="SERVICE_BOOKING">
            <GraduationCap className="h-3.5 w-3.5 mr-1" />
            Ateliers ({orderable.filter((l) => l.lineType === "SERVICE_BOOKING").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={typeFilter} className="mt-4">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <EmptyState
                icon={Package}
                title="Aucune commande"
                description="Aucune commande dans cette catégorie."
              />
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((line) => (
                <OrderCard key={line.lineId} line={line} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrderCard({ line }: { line: BookingLine }) {
  const statusConfig = STATUS_MAP[line.status] ?? {
    label: line.status,
    variant: "quiet" as const,
    color: "bg-muted-foreground",
  };
  const isMission = line.lineType === "MISSION";
  const isTerminated = COMPLETED_STATUSES.has(line.status) || PAID_STATUSES.has(line.status);
  const amt = formatAmount(line.amount);

  return (
    <Link
      href={`/orders/${line.relatedBookingId}`}
      className="group flex items-stretch rounded-xl border bg-card overflow-hidden hover:bg-muted/50 transition-colors"
    >
      {/* Color bar */}
      <div className={`w-1 shrink-0 ${statusConfig.color}`} />

      <div className="flex flex-1 items-center gap-3 p-4 min-w-0">
        {/* Type icon */}
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          {isMission ? (
            <Shield className="h-4 w-4 text-[hsl(var(--color-teal-500))]" />
          ) : (
            <GraduationCap className="h-4 w-4 text-[hsl(var(--color-teal-500))]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {line.title || line.typeLabel}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {line.interlocutor} · {format(new Date(line.date), "dd MMM yyyy", { locale: fr })}
          </p>
        </div>

        {/* Amount */}
        {amt && (
          <span className="text-sm font-semibold tabular-nums shrink-0">{amt}</span>
        )}

        {/* Review indicator */}
        {isTerminated && (
          line.hasReview ? (
            <Star className="h-4 w-4 shrink-0 text-amber-400 fill-amber-400" />
          ) : (
            <Badge variant="warning" className="shrink-0 text-[10px]">Avis</Badge>
          )
        )}

        {/* Status badge */}
        <Badge variant={statusConfig.variant} className="shrink-0">
          {statusConfig.label}
        </Badge>

        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
