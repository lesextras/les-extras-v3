"use client";

// Feuille de temps (pointage) : le freelance déclare ses créneaux, l'établissement valide.
// Sur une mission (Booking). Base de la facturation.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

interface Entry {
  id: string;
  startedAt: string;
  endedAt?: string | null;
  note?: string | null;
  status: "PENDING" | "VALIDATED" | "REJECTED";
}
interface Payload {
  entries: Entry[];
  side: "freelance" | "establishment" | "none";
  validatedMinutes: number;
  pendingMinutes: number;
  /** Fenêtre d'ajustement de 72 h après la fin de mission. */
  ajustement?: { limite: string | null; ouverte: boolean };
  /** Garde-fous temps de travail : messages par créneau (informatifs). */
  alertes?: Record<string, string[]>;
}

function fmtDur(a: string, b?: string | null): string {
  if (!b) return "en cours";
  const min = Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000));
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m ? String(m).padStart(2, "0") : "00"}`;
}
function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" });
}
function hoursLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m ? String(m).padStart(2, "0") : "00"}`;
}

const STATUS_LABEL: Record<Entry["status"], string> = {
  PENDING: "En attente",
  VALIDATED: "Validé",
  REJECTED: "Refusé",
};

export function TimeSheet({ bookingId, accountId }: { bookingId: string; accountId: string }) {
  const { toast } = useToast();
  const [data, setData] = useState<Payload | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const d = await apiRequest<Payload>(`/bookings/${bookingId}/time-entries`, { accountId });
      setData(d);
    } catch {
      /* silencieux */
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const startedAt = String(fd.get("startedAt") || "");
    const endedAt = String(fd.get("endedAt") || "");
    if (!startedAt) return;
    setBusy(true);
    try {
      await apiRequest(`/bookings/${bookingId}/time-entries`, {
        method: "POST",
        accountId,
        body: {
          startedAt: new Date(startedAt).toISOString(),
          endedAt: endedAt ? new Date(endedAt).toISOString() : undefined,
          note: String(fd.get("note") || "") || undefined,
        },
      });
      form.reset();
      await load();
    } catch (err) {
      toast({ title: "Ajout impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function review(id: string, status: "VALIDATED" | "REJECTED") {
    setBusy(true);
    try {
      await apiRequest(`/bookings/time-entries/${id}`, { method: "PATCH", accountId, body: { status } });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      await apiRequest(`/bookings/time-entries/${id}`, { method: "DELETE", accountId });
      await load();
    } catch (err) {
      toast({ title: "Suppression impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  if (!data || data.side === "none") return null;
  const isFreelance = data.side === "freelance";
  const isEstablishment = data.side === "establishment";
  const fenetre = data.ajustement;
  const verrouille = fenetre ? !fenetre.ouverte : false;

  return (
    <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border bg-card p-6 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">Pointage — temps travaillé</h2>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{hoursLabel(data.validatedMinutes)}</span> validé
          {data.pendingMinutes ? <> · {hoursLabel(data.pendingMinutes)} en attente</> : null}
        </div>
      </div>

      {fenetre?.limite ? (
        verrouille ? (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            La fenêtre d&apos;ajustement de 72 h est terminée : le pointage est verrouillé et les
            créneaux non contestés ont été validés automatiquement.
          </p>
        ) : (
          <p className="mt-3 rounded-lg border border-[#b8860b]/30 bg-[#b8860b]/10 px-3 py-2 text-xs text-foreground">
            Fenêtre d&apos;ajustement ouverte jusqu&apos;au{" "}
            <span className="font-medium">{fmtWhen(fenetre.limite)}</span> — après cette date, les
            heures déclarées sont validées telles quelles et tout est verrouillé.
          </p>
        )
      ) : null}

      <ul className="mt-4 divide-y divide-border">
        {data.entries.length === 0 ? (
          <li className="py-3 text-sm text-muted-foreground">Aucun créneau déclaré pour le moment.</li>
        ) : (
          data.entries.map((e) => (
            <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="text-sm">
                <span className="font-medium text-foreground">{fmtWhen(e.startedAt)}</span>
                <span className="text-muted-foreground"> → {e.endedAt ? fmtWhen(e.endedAt) : "…"}</span>
                <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">{fmtDur(e.startedAt, e.endedAt)}</span>
                {e.note ? <span className="block text-xs text-muted-foreground">{e.note}</span> : null}
                {(data.alertes?.[e.id] ?? []).map((a) => (
                  <span key={a} className="mt-1 block text-xs font-medium text-[#b8860b]">
                    ⚠ {a}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={
                    e.status === "VALIDATED"
                      ? "text-xs font-medium text-[#156d6b]"
                      : e.status === "REJECTED"
                        ? "text-xs font-medium text-destructive"
                        : "text-xs font-medium text-muted-foreground"
                  }
                >
                  {STATUS_LABEL[e.status]}
                </span>
                {isEstablishment && e.status === "PENDING" && !verrouille ? (
                  <>
                    <Button size="sm" variant="secondary" disabled={busy} onClick={() => review(e.id, "VALIDATED")}>
                      Valider
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busy} onClick={() => review(e.id, "REJECTED")}>
                      Refuser
                    </Button>
                  </>
                ) : null}
                {isFreelance && e.status !== "VALIDATED" && !verrouille ? (
                  <button
                    type="button"
                    onClick={() => remove(e.id)}
                    disabled={busy}
                    className="text-xs text-destructive hover:underline"
                  >
                    Supprimer
                  </button>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>

      {isFreelance && !verrouille ? (
        <form onSubmit={add} className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Début</span>
            <Input type="datetime-local" name="startedAt" required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Fin</span>
            <Input type="datetime-local" name="endedAt" />
          </label>
          <label className="text-sm sm:col-span-2">
            <span className="mb-1 block text-muted-foreground">Note (optionnel)</span>
            <Input name="note" placeholder="Nuit, réunion d'équipe…" />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" size="sm" disabled={busy}>
              Ajouter le créneau
            </Button>
          </div>
        </form>
      ) : isEstablishment && !verrouille ? (
        <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
          Validez les créneaux déclarés par l&apos;intervenant. Le total validé sert de base à la facturation.
        </p>
      ) : null}
    </div>
  );
}
