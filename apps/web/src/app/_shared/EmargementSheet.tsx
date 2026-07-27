"use client";

// Feuille d'émargement : marque la présence d'un apprenant pour un créneau
// (demi-journée). POST /formations/inscriptions/:id/emargement.
// UX : une ligne par apprenant, deux demi-journées (Matin / Après-midi) émargées
// indépendamment pour la date sélectionnée.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

interface Row {
  id: string;
  name: string;
}

type Slot = "MORNING" | "AFTERNOON";
type Mark = "present" | "absent";

const SLOTS: { key: Slot; label: string }[] = [
  { key: "MORNING", label: "Matin" },
  { key: "AFTERNOON", label: "Après-midi" },
];

export function EmargementSheet({
  accountId,
  rows,
  defaultDate,
}: {
  accountId: string;
  rows: Row[];
  defaultDate: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [date, setDate] = useState(defaultDate);
  const [busy, setBusy] = useState<string | null>(null);
  // État local optimiste : { "<inscriptionId>:<slot>": "present" | "absent" }
  const [marks, setMarks] = useState<Record<string, Mark>>({});

  const keyOf = (id: string, slot: Slot) => `${id}:${slot}:${date}`;

  async function mark(inscriptionId: string, slot: Slot, present: boolean) {
    const cellKey = `${inscriptionId}:${slot}`;
    setBusy(cellKey);
    try {
      await apiRequest(`/formations/inscriptions/${inscriptionId}/emargement`, {
        method: "POST",
        accountId,
        body: {
          slotDate: new Date(date).toISOString(),
          slot,
          present,
        },
      });
      setMarks((m) => ({ ...m, [keyOf(inscriptionId, slot)]: present ? "present" : "absent" }));
      toast({
        title: present ? "Présence enregistrée" : "Absence enregistrée",
        description: `${slot === "MORNING" ? "Matin" : "Après-midi"} · ${new Date(
          date,
        ).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}`,
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Émargement impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-foreground">Date de la journée</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <p className="text-xs text-muted-foreground">
          Émargez chaque demi-journée. Les présences alimentent l’attestation / le certificat.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          Aucun apprenant inscrit pour le moment. Inscrivez d’abord des apprenants.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <div className="hidden grid-cols-[1fr_auto_auto] gap-4 border-b border-border bg-muted/40 px-4 py-2 text-xs font-medium text-muted-foreground sm:grid">
            <span>Apprenant</span>
            <span className="w-[150px] text-center">Matin</span>
            <span className="w-[150px] text-center">Après-midi</span>
          </div>
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 px-4 py-3 sm:grid sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
              >
                <span className="text-sm font-medium text-foreground">{r.name}</span>
                {SLOTS.map((slotDef) => {
                  const state = marks[keyOf(r.id, slotDef.key)];
                  const cellKey = `${r.id}:${slotDef.key}`;
                  const isBusy = busy === cellKey;
                  return (
                    <div key={slotDef.key} className="flex items-center gap-2 sm:w-[150px] sm:justify-center">
                      <span className="text-xs text-muted-foreground sm:hidden">{slotDef.label}</span>
                      <Button
                        size="sm"
                        variant={state === "present" ? "primary" : "outline"}
                        disabled={isBusy}
                        onClick={() => mark(r.id, slotDef.key, true)}
                        aria-pressed={state === "present"}
                      >
                        Présent
                      </Button>
                      <Button
                        size="sm"
                        variant={state === "absent" ? "destructive" : "ghost"}
                        disabled={isBusy}
                        onClick={() => mark(r.id, slotDef.key, false)}
                        aria-pressed={state === "absent"}
                      >
                        Absent
                      </Button>
                    </div>
                  );
                })}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
