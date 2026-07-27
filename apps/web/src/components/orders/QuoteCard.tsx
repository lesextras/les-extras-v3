"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, FileText, Download } from "lucide-react";
import type { OrderQuote } from "@/app/actions/orders";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

const QUOTE_STATUS: Record<string, { label: string; variant: "success" | "warning" | "error" | "info" | "quiet" }> = {
  DRAFT: { label: "Brouillon", variant: "quiet" },
  SENT: { label: "Envoyé", variant: "info" },
  ACCEPTED: { label: "Accepté", variant: "success" },
  REJECTED: { label: "Refusé", variant: "error" },
  REVISED: { label: "Révisé", variant: "quiet" },
};

type QuoteCardProps = {
  quote: OrderQuote;
  canAct: boolean;
  onAccept: () => void;
  onReject: () => void;
  isPending: boolean;
  apiToken?: string;
};

export function QuoteCard({
  quote,
  canAct,
  onAccept,
  onReject,
  isPending,
  apiToken,
}: QuoteCardProps) {
  const statusConfig = QUOTE_STATUS[quote.status] ?? { label: quote.status, variant: "quiet" as const };
  const canManageQuote = canAct && quote.status === "SENT";

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Devis</span>
        </div>
        <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
      </div>

      {/* Lines */}
      <div className="space-y-1">
        {quote.lines.map((line) => (
          <div key={line.id} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground truncate flex-1 mr-2">{line.description}</span>
            <span className="shrink-0 tabular-nums">
              {line.quantity} × {line.unitPrice.toFixed(2)} € = {line.totalHT.toFixed(2)} €
            </span>
          </div>
        ))}
      </div>

      <Separator />

      {/* Totals */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between font-semibold">
          <span>Montant</span>
          <span className="tabular-nums">{quote.totalTTC.toFixed(2)} €</span>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Par {quote.issuer.name}</span>
        <span>{format(new Date(quote.createdAt), "dd MMM yyyy", { locale: fr })}</span>
        {quote.validUntil && (
          <span>Valide jusqu&apos;au {format(new Date(quote.validUntil), "dd MMM yyyy", { locale: fr })}</span>
        )}
      </div>

      {/* Conditions */}
      {quote.conditions && (
        <p className="text-xs text-muted-foreground whitespace-pre-wrap">{quote.conditions}</p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {apiToken && (
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const url = `${API_BASE}/quotes/${encodeURIComponent(quote.id)}/pdf`;
                const resp = await fetch(url, { headers: { Authorization: `Bearer ${apiToken}` } });
                if (!resp.ok) return;
                const blob = await resp.blob();
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = blobUrl;
                a.download = `devis-${quote.id.substring(0, 8)}.pdf`;
                a.click();
                URL.revokeObjectURL(blobUrl);
              } catch { /* ignore */ }
            }}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            PDF
          </Button>
        )}
        {canManageQuote && (
          <>
            <Button
              size="sm"
              disabled={isPending}
              onClick={onAccept}
              className="flex-1 bg-[hsl(var(--color-teal-500))] hover:bg-[hsl(var(--color-teal-600))] text-white"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Accepter
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={onReject}
              className="flex-1"
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Refuser
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
