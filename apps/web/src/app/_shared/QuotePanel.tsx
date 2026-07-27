"use client";

// Panneau d'action d'un devis :
//  - intervenant  : saisie des lignes (libellé / quantité / prix) puis envoi
//  - établissement : acceptation (crée la réservation) ou refus motivé
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "./form-fields";

export interface QuoteLine {
  label: string;
  quantity: number;
  unitPrice: number;
}

const euros = (v: number) =>
  v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/** Côté intervenant : chiffrage et envoi. */
export function QuoteEditor({
  quoteId,
  initialLines,
  initialMessage,
  initialScheduledAt,
}: {
  quoteId: string;
  initialLines?: QuoteLine[];
  initialMessage?: string | null;
  initialScheduledAt?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [lines, setLines] = useState<QuoteLine[]>(
    initialLines?.length ? initialLines : [{ label: "", quantity: 1, unitPrice: 0 }],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = lines.reduce(
    (s, l) => s + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0),
    0,
  );

  function update(i: number, patch: Partial<QuoteLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const valides = lines.filter((l) => l.label.trim() && Number(l.unitPrice) > 0);
    if (valides.length === 0) {
      setError("Ajoutez au moins une ligne avec un libellé et un prix.");
      return;
    }
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const scheduledAt = String(form.get("scheduledAt") || "");
    const validUntil = String(form.get("validUntil") || "");
    try {
      await apiRequest(`/quotes/${quoteId}/send`, {
        method: "POST",
        body: {
          lines: valides.map((l) => ({
            label: l.label.trim(),
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice),
          })),
          message: String(form.get("message") || "") || undefined,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        },
      });
      toast({ title: "Devis envoyé", description: "L'établissement est prévenu." });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-3">
        {lines.map((line, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1fr_5rem_7rem_2rem] sm:items-end">
            <Field label={i === 0 ? "Prestation" : ""} htmlFor={`label-${i}`}>
              <Input
                id={`label-${i}`}
                value={line.label}
                onChange={(e) => update(i, { label: e.target.value })}
                placeholder="Atelier médiation animale — séance de 2 h"
              />
            </Field>
            <Field label={i === 0 ? "Qté" : ""} htmlFor={`qty-${i}`}>
              <Input
                id={`qty-${i}`}
                type="number"
                min={0}
                step="0.5"
                value={line.quantity}
                onChange={(e) => update(i, { quantity: Number(e.target.value) })}
              />
            </Field>
            <Field label={i === 0 ? "Prix unitaire" : ""} htmlFor={`pu-${i}`}>
              <Input
                id={`pu-${i}`}
                type="number"
                min={0}
                step="0.01"
                value={line.unitPrice}
                onChange={(e) => update(i, { unitPrice: Number(e.target.value) })}
              />
            </Field>
            {lines.length > 1 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLines((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Retirer la ligne"
              >
                ✕
              </Button>
            ) : (
              <span />
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setLines((prev) => [...prev, { label: "", quantity: 1, unitPrice: 0 }])
          }
        >
          + Ajouter une ligne
        </Button>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
        <span className="text-sm text-muted-foreground">Total TTC</span>
        <span className="text-lg font-bold text-foreground">{euros(total)}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date d'intervention" htmlFor="scheduledAt">
          <Input
            id="scheduledAt"
            name="scheduledAt"
            type="date"
            defaultValue={initialScheduledAt?.slice(0, 10)}
          />
        </Field>
        <Field label="Devis valable jusqu'au" htmlFor="validUntil">
          <Input id="validUntil" name="validUntil" type="date" />
        </Field>
      </div>

      <Field label="Message / conditions" htmlFor="message">
        <Textarea
          id="message"
          name="message"
          rows={4}
          defaultValue={initialMessage ?? ""}
          placeholder="Matériel fourni, déplacement inclus, modalités d'annulation…"
        />
      </Field>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={loading}>
        {loading ? "Envoi…" : "Envoyer le devis"}
      </Button>
    </form>
  );
}

/** Côté établissement : décision. */
export function QuoteDecision({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [refusing, setRefusing] = useState(false);
  const [reason, setReason] = useState("");

  async function act(action: "accept" | "refuse") {
    setLoading(action);
    try {
      await apiRequest(`/quotes/${quoteId}/${action}`, {
        method: "POST",
        body: action === "refuse" ? { reason: reason || undefined } : {},
      });
      toast({
        title: action === "accept" ? "Devis accepté" : "Devis refusé",
        description:
          action === "accept"
            ? "La prestation est confirmée : la réservation vient d'être créée."
            : "L'intervenant a été prévenu.",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : "Réessayez.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => act("accept")} disabled={loading !== null}>
          {loading === "accept" ? "Validation…" : "Accepter le devis"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setRefusing((v) => !v)}
          disabled={loading !== null}
        >
          Refuser
        </Button>
      </div>
      {refusing ? (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <Field label="Motif (facultatif)" htmlFor="reason">
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Budget, date, autre intervenant retenu…"
            />
          </Field>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => act("refuse")}
            disabled={loading !== null}
          >
            {loading === "refuse" ? "Envoi…" : "Confirmer le refus"}
          </Button>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        En acceptant, la réservation est créée automatiquement et le contrat
        devient disponible.
      </p>
    </div>
  );
}
