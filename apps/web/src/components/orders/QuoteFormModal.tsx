"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, X } from "lucide-react";
import { createQuote, getQuotePrefill } from "@/app/actions/orders";

type QuoteLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
};

type QuoteFormModalProps = {
  bookingId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function QuoteFormModal({ bookingId, onClose, onSuccess }: QuoteFormModalProps) {
  const [lines, setLines] = useState<QuoteLine[]>([
    { description: "", quantity: 1, unitPrice: 0, unit: "heure" },
  ]);
  const [conditions, setConditions] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [prefillLoaded, setPrefillLoaded] = useState(false);

  // Load prefill data
  useEffect(() => {
    if (prefillLoaded) return;
    setPrefillLoaded(true);
    getQuotePrefill(bookingId).then((result) => {
      if ("lines" in result && result.lines && result.lines.length > 0) {
        setLines(
          result.lines.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            unit: l.unit,
          })),
        );
      }
    });
  }, [bookingId, prefillLoaded]);

  const subtotalHT = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  const totalAmount = Math.round(subtotalHT * 100) / 100;

  function updateLine(index: number, field: keyof QuoteLine, value: string | number) {
    setLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    );
  }

  function addLine() {
    setLines((prev) => [...prev, { description: "", quantity: 1, unitPrice: 0, unit: "heure" }]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  function handleSubmit() {
    setError(null);
    const validLines = lines.filter((l) => l.description.trim() && l.quantity > 0 && l.unitPrice > 0);
    if (validLines.length === 0) {
      setError("Ajoutez au moins une ligne valide.");
      return;
    }

    startTransition(async () => {
      const result = await createQuote(
        bookingId,
        validLines,
        {
          conditions: conditions || undefined,
          notes: notes || undefined,
        },
      );
      if (result.error) {
        setError(result.error);
      } else {
        onSuccess();
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border bg-card p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Créer un devis</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-muted transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <Separator />

        {/* Lines */}
        <div className="space-y-3">
          <Label>Lignes du devis</Label>
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_70px_90px_60px_32px] gap-2 items-end">
              <div>
                {idx === 0 && <Label className="text-xs text-muted-foreground">Description</Label>}
                <Input
                  value={line.description}
                  onChange={(e) => updateLine(idx, "description", e.target.value)}
                  placeholder="Prestation…"
                />
              </div>
              <div>
                {idx === 0 && <Label className="text-xs text-muted-foreground">Qté</Label>}
                <Input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, "quantity", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                {idx === 0 && <Label className="text-xs text-muted-foreground">Prix unit.</Label>}
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={line.unitPrice}
                  onChange={(e) => updateLine(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                {idx === 0 && <Label className="text-xs text-muted-foreground">Unité</Label>}
                <select
                  className="flex h-9 w-full rounded-md border bg-background px-2 text-sm"
                  value={line.unit}
                  onChange={(e) => updateLine(idx, "unit", e.target.value)}
                >
                  <option value="heure">h</option>
                  <option value="séance">séance</option>
                  <option value="participant">pers.</option>
                  <option value="forfait">forfait</option>
                </select>
              </div>
              <button
                onClick={() => removeLine(idx)}
                className="flex h-9 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground"
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addLine} type="button">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Ajouter une ligne
          </Button>
        </div>

        <Separator />

        {/* Totals */}
        <div className="space-y-1 text-sm rounded-lg bg-muted p-3">
          <div className="flex justify-between font-semibold">
            <span>Montant</span>
            <span className="tabular-nums">{totalAmount.toFixed(2)} €</span>
          </div>
        </div>

        {/* Conditions / Notes */}
        <div className="space-y-2">
          <div>
            <Label className="text-xs text-muted-foreground">Conditions générales (optionnel)</Label>
            <textarea
              className="flex w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--color-teal-500))]"
              rows={2}
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="Conditions de paiement, délais…"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Notes (optionnel)</Label>
            <textarea
              className="flex w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[hsl(var(--color-teal-500))]"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Remarques internes…"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="bg-[hsl(var(--color-teal-500))] hover:bg-[hsl(var(--color-teal-600))] text-white"
          >
            {isPending ? "Envoi…" : "Envoyer le devis"}
          </Button>
        </div>
      </div>
    </div>
  );
}
