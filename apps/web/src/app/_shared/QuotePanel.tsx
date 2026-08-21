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
import { DecompositionPrix } from "./DecompositionPrix";

export interface QuoteLine {
  label: string;
  quantity: number;
  /** Unité de compte : heure, journée, séance, forfait. */
  unit?: string;
  /** Prix unitaire HORS TAXES. */
  unitPrice: number;
  /** Taux de TVA de la ligne, en pourcentage. Absent ou nul : non soumise. */
  vatRate?: number;
}

/**
 * Unités proposées à la saisie. Un devis qui annonce « 3 » sans dire trois
 * quoi n'engage personne — et c'est pourtant ce que l'établissement signe.
 */
const UNITES = ["heure", "demi-journée", "journée", "séance", "forfait"];

/**
 * Taux de TVA proposés. Zéro d'abord, parce que c'est le cas de la quasi-
 * totalité des intervenants : franchise en base, article 293 B du code
 * général des impôts.
 */
const TAUX_TVA = [0, 5.5, 10, 20];

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
    initialLines?.length ? initialLines : [{ label: "", quantity: 1, unit: "forfait", unitPrice: 0, vatRate: 0 }],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Totaux calcules ligne par ligne, arrondis au centime avant d'etre sommes,
  // exactement comme le serveur (apps/api/src/quotes/totaux.ts). Un ecart d'un
  // centime entre ce que l'intervenant voit ici et ce que porte le document
  // envoye lui ferait perdre confiance dans les deux.
  const centimes = (v: number) => Math.round(v * 100);
  const totalHt =
    lines.reduce((s, l) => s + centimes((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0)), 0) /
    100;
  const totalTva =
    lines.reduce((s, l) => {
      const ht = centimes((Number(l.quantity) || 0) * (Number(l.unitPrice) || 0));
      return s + Math.round((ht * (Number(l.vatRate) || 0)) / 100);
    }, 0) / 100;
  const total = Math.round((totalHt + totalTva) * 100) / 100;
  const soumisTva = lines.some((l) => (Number(l.vatRate) || 0) > 0);

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
            unit: (l.unit || "forfait").trim(),
            unitPrice: Number(l.unitPrice),
            vatRate: Number(l.vatRate) || 0,
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
          <div
            key={i}
            className="grid gap-2 sm:grid-cols-[1fr_4.5rem_7rem_7rem_5.5rem_2rem] sm:items-end"
          >
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
            <Field label={i === 0 ? "Unité" : ""} htmlFor={`unit-${i}`}>
              <Input
                id={`unit-${i}`}
                list="unites-devis"
                value={line.unit ?? ""}
                onChange={(e) => update(i, { unit: e.target.value })}
                placeholder="forfait"
              />
            </Field>
            <Field label={i === 0 ? "P.U. HT" : ""} htmlFor={`pu-${i}`}>
              <Input
                id={`pu-${i}`}
                type="number"
                min={0}
                step="0.01"
                value={line.unitPrice}
                onChange={(e) => update(i, { unitPrice: Number(e.target.value) })}
              />
            </Field>
            <Field label={i === 0 ? "TVA" : ""} htmlFor={`tva-${i}`}>
              <select
                id={`tva-${i}`}
                className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                value={line.vatRate ?? 0}
                onChange={(e) => update(i, { vatRate: Number(e.target.value) })}
              >
                {TAUX_TVA.map((t) => (
                  <option key={t} value={t}>
                    {t === 0 ? "Aucune" : `${String(t).replace(".", ",")} %`}
                  </option>
                ))}
              </select>
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
            setLines((prev) => [...prev, { label: "", quantity: 1, unit: "forfait", unitPrice: 0, vatRate: 0 }])
          }
        >
          + Ajouter une ligne
        </Button>
      </div>

      <datalist id="unites-devis">
        {UNITES.map((u) => (
          <option key={u} value={u} />
        ))}
      </datalist>

      {/* Le recapitulatif que portera le document. On l'affiche ici pour que
          l'intervenant valide ce qu'il envoie, pas une approximation. */}
      <div className="rounded-xl border border-border bg-muted/20 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total hors taxes</span>
          <span className="font-medium text-foreground">{euros(totalHt)}</span>
        </div>
        {soumisTva ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">TVA</span>
            <span className="font-medium text-foreground">{euros(totalTva)}</span>
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            TVA non applicable, article 293 B du code général des impôts. Cette
            mention figurera sur le devis.
          </p>
        )}
        <div className="mt-2 flex justify-between border-t border-border pt-2">
          <span className="font-semibold text-foreground">Total à régler</span>
          <span className="text-lg font-bold text-foreground">{euros(total)}</span>
        </div>
      </div>

      <DecompositionPrix tarifIntervenant={total} vue="intervenant" />

      <p className="text-xs text-muted-foreground">
        Sans date de fin de validité, le devis reste valable trente jours à
        compter de son envoi.
      </p>

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
        variant: "error",
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
      {/* CE QUE VAUT LE CLIC. Accepter un devis n'est pas « valider une
          demande » : c'est un engagement contractuel, au meme titre que la
          mention « bon pour accord » portee a la main sur un devis papier.
          L'ecran doit le dire avant, pas apres. */}
      <p className="text-xs text-muted-foreground">
        Accepter vaut <strong>bon pour accord</strong> : votre nom et votre
        fonction sont portés sur le devis, la réservation est créée et le
        contrat devient disponible. Le document reste téléchargeable ensuite.
      </p>
    </div>
  );
}
