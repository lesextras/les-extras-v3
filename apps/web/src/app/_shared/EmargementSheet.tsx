"use client";

// Feuille d'émargement : marque la présence d'un apprenant pour un créneau
// (demi-journée). POST /formations/inscriptions/:id/emargement.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

interface Row {
  id: string;
  name: string;
}

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
  const [slot, setSlot] = useState("MORNING");
  const [busy, setBusy] = useState<string | null>(null);

  async function mark(inscriptionId: string, present: boolean) {
    setBusy(inscriptionId);
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
      toast({ title: present ? "Présence enregistrée" : "Absence enregistrée" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Émargement impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="mb-1 block text-muted-foreground">Date</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
        </label>
        <div className="w-40">
          <span className="mb-1 block text-sm text-muted-foreground">Créneau</span>
          <Select value={slot} onValueChange={setSlot}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MORNING">Matin</SelectItem>
              <SelectItem value="AFTERNOON">Après-midi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Aucun apprenant inscrit.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm font-medium text-foreground">{r.name}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => mark(r.id, true)}>
                  Présent
                </Button>
                <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => mark(r.id, false)}>
                  Absent
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
