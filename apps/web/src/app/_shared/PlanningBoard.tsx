"use client";

// Vue agenda des shifts (planning) + gestion.
//  - ESTABLISHMENT : liste chronologique des créneaux du compte, changement de
//    statut, suppression, création (modal) avec gestion des CONFLITS (force).
//  - FREELANCE : ses créneaux + section « Mes disponibilités » (ajout/suppression).
import { useCallback, useMemo, useState } from "react";
import {
  CalendarPlus,
  Trash2,
  Clock,
  AlertTriangle,
  Plus,
  CalendarDays,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest, ApiError } from "@/lib/api";
import { EmptyState } from "./ui";
import { Field, Textarea } from "./form-fields";
import { initials, fullName } from "./format";
import type { BadgeVariant } from "./format";
import type { AccountType } from "./types";

// --- Types (miroir des contrats /planning, /shifts, /availability) ---------
export type ShiftStatus = "PLANNED" | "CONFIRMED" | "DONE" | "CANCELLED";

export interface Shift {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  status: ShiftStatus;
  notes?: string | null;
  freelance?: { id: string; firstName?: string | null; lastName?: string | null; avatarUrl?: string | null } | null;
  mission?: { id: string; title: string } | null;
}

export interface Availability {
  id: string;
  weekday?: number | null;
  date?: string | null;
  startTime: string;
  endTime: string;
  type: "AVAILABLE" | "UNAVAILABLE";
}

interface Conflict {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
}

interface MissionOption {
  id: string;
  title: string;
}

const STATUS_LABEL: Record<ShiftStatus, string> = {
  PLANNED: "Planifié",
  CONFIRMED: "Confirmé",
  DONE: "Terminé",
  CANCELLED: "Annulé",
};

const STATUS_VARIANT: Record<ShiftStatus, BadgeVariant> = {
  PLANNED: "outline",
  CONFIRMED: "default",
  DONE: "success",
  CANCELLED: "destructive",
};

const WEEKDAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
function dayKey(iso: string) {
  return new Date(iso).toISOString().slice(0, 10);
}
function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function PlanningBoard({
  accountType,
  accountId,
  fromISO,
  toISO,
  initialShifts,
  missions,
  initialAvailability,
}: {
  accountType: AccountType;
  accountId: string;
  fromISO: string;
  toISO: string;
  initialShifts: Shift[];
  missions: MissionOption[];
  initialAvailability: Availability[];
}) {
  const { toast } = useToast();
  const isEstablishment = accountType === "ESTABLISHMENT";
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [availability, setAvailability] = useState<Availability[]>(initialAvailability);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reloadShifts = useCallback(async () => {
    try {
      const data = await apiRequest<Shift[]>(
        `/planning?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`,
        { accountId },
      );
      setShifts(data ?? []);
    } catch {
      /* on garde l'état courant */
    }
  }, [accountId, fromISO, toISO]);

  const reloadAvailability = useCallback(async () => {
    try {
      const data = await apiRequest<Availability[]>("/availability", { accountId });
      setAvailability(data ?? []);
    } catch {
      /* noop */
    }
  }, [accountId]);

  // Groupement chronologique par jour.
  const groups = useMemo(() => {
    const sorted = [...shifts].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
    const map = new Map<string, Shift[]>();
    for (const s of sorted) {
      const k = dayKey(s.startAt);
      const arr = map.get(k) ?? [];
      arr.push(s);
      map.set(k, arr);
    }
    return Array.from(map.entries());
  }, [shifts]);

  // Intervenants déjà présents dans le planning → ids fiables pour l'affectation.
  const people = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of shifts) {
      if (s.freelance?.id) m.set(s.freelance.id, fullName(s.freelance.firstName, s.freelance.lastName));
    }
    return Array.from(m.entries()).map(([id, name]) => ({ id, name }));
  }, [shifts]);

  async function changeStatus(id: string, status: ShiftStatus) {
    setBusyId(id);
    try {
      await apiRequest(`/shifts/${id}/status`, { method: "PATCH", body: { status }, accountId });
      setShifts((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
      toast({ title: `Statut : ${STATUS_LABEL[status]}` });
    } catch (err) {
      toast({
        title: "Changement de statut impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function removeShift(id: string) {
    setBusyId(id);
    try {
      await apiRequest(`/shifts/${id}`, { method: "DELETE", accountId });
      setShifts((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Créneau supprimé" });
    } catch (err) {
      toast({
        title: "Suppression impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-8">
      {isEstablishment ? (
        <div className="flex justify-end">
          <NewShiftModal
            accountId={accountId}
            missions={missions}
            people={people}
            onCreated={reloadShifts}
          />
        </div>
      ) : null}

      {groups.length === 0 ? (
        <EmptyState
          icon={<CalendarDays />}
          title="Aucun créneau planifié"
          description={
            isEstablishment
              ? "Créez un premier créneau pour organiser vos interventions."
              : "Vos créneaux confirmés apparaîtront ici."
          }
          action={
            isEstablishment ? (
              <NewShiftModal
                accountId={accountId}
                missions={missions}
                people={people}
                onCreated={reloadShifts}
              />
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-6">
          {groups.map(([key, items]) => (
            <div key={key} className="space-y-3">
              <h2 className="text-sm font-semibold capitalize text-muted-foreground">
                {dayLabel(items[0].startAt)}
              </h2>
              <Card>
                <CardContent className="divide-y divide-border p-0">
                  {items.map((s) => (
                    <div key={s.id} className="flex flex-wrap items-center gap-4 p-4">
                      <div className="flex w-20 shrink-0 flex-col items-center gap-0.5 text-center">
                        <span className="text-sm font-semibold text-primary">{hhmm(s.startAt)}</span>
                        <span className="text-xs text-muted-foreground">{hhmm(s.endAt)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{s.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {s.freelance ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={s.freelance.avatarUrl ?? undefined} />
                                <AvatarFallback className="text-[9px]">
                                  {initials(s.freelance.firstName, s.freelance.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              {fullName(s.freelance.firstName, s.freelance.lastName)}
                            </span>
                          ) : (
                            <span>Non affecté</span>
                          )}
                          {s.mission ? <span>· {s.mission.title}</span> : null}
                        </div>
                        {s.notes ? (
                          <p className="mt-1 truncate text-xs text-muted-foreground/80">{s.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_VARIANT[s.status]}>
                          {STATUS_LABEL[s.status]}
                        </Badge>
                        {isEstablishment ? (
                          <>
                            <div className="w-36">
                              <Select
                                value={s.status}
                                onValueChange={(v) => changeStatus(s.id, v as ShiftStatus)}
                              >
                                <SelectTrigger className="h-9">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {(Object.keys(STATUS_LABEL) as ShiftStatus[]).map((st) => (
                                    <SelectItem key={st} value={st}>
                                      {STATUS_LABEL[st]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-muted-foreground hover:text-destructive"
                              disabled={busyId === s.id}
                              onClick={() => removeShift(s.id)}
                              aria-label="Supprimer le créneau"
                            >
                              <Trash2 />
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      )}

      {!isEstablishment ? (
        <AvailabilitySection
          accountId={accountId}
          items={availability}
          onChanged={reloadAvailability}
        />
      ) : null}
    </div>
  );
}

// --------------------------------------------------------------------------
// Modal « Nouveau créneau » avec gestion des conflits (force:true).
// --------------------------------------------------------------------------
function NewShiftModal({
  accountId,
  missions,
  people,
  onCreated,
}: {
  accountId: string;
  missions: MissionOption[];
  people: { id: string; name: string }[];
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[] | null>(null);
  const [pendingBody, setPendingBody] = useState<Record<string, unknown> | null>(null);
  const [missionId, setMissionId] = useState("");
  const [freelanceId, setFreelanceId] = useState("");

  function reset() {
    setError(null);
    setConflicts(null);
    setPendingBody(null);
    setMissionId("");
    setFreelanceId("");
  }

  async function post(body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    try {
      await apiRequest("/shifts", { method: "POST", body, accountId });
      toast({ title: "Créneau créé" });
      setOpen(false);
      reset();
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        const payload = err.payload as { message?: string; conflicts?: Conflict[] } | null;
        if (payload?.conflicts?.length) {
          setConflicts(payload.conflicts);
          setPendingBody(body);
          setLoading(false);
          return;
        }
      }
      setError(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const date = String(fd.get("date") || "");
    const startTime = String(fd.get("startTime") || "");
    const endTime = String(fd.get("endTime") || "");
    if (!date || !startTime || !endTime) {
      setError("Renseignez la date et les heures de début et de fin.");
      return;
    }
    const startAt = new Date(`${date}T${startTime}`).toISOString();
    const endAt = new Date(`${date}T${endTime}`).toISOString();
    if (new Date(endAt) <= new Date(startAt)) {
      setError("L'heure de fin doit être postérieure à l'heure de début.");
      return;
    }
    const body: Record<string, unknown> = {
      title: String(fd.get("title") || ""),
      startAt,
      endAt,
      notes: String(fd.get("notes") || "") || undefined,
      missionId: missionId && missionId !== "__all__" ? missionId : undefined,
      freelanceId: freelanceId && freelanceId !== "__none__" ? freelanceId : undefined,
    };
    post(body);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <CalendarPlus />
          Nouveau créneau
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nouveau créneau</DialogTitle>
          <DialogDescription>
            Planifiez une intervention. Un conflit avec un créneau existant vous sera signalé.
          </DialogDescription>
        </DialogHeader>

        {conflicts ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
                <AlertTriangle className="size-4" />
                Conflit détecté ({conflicts.length})
              </div>
              <ul className="mt-3 space-y-2">
                {conflicts.map((c) => (
                  <li key={c.id} className="text-sm text-foreground">
                    <span className="font-medium">{c.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {dayLabel(c.startAt)} · {hhmm(c.startAt)} – {hhmm(c.endAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setConflicts(null)}>
                Modifier
              </Button>
              <Button
                type="button"
                variant="secondary"
                loading={loading}
                onClick={() => pendingBody && post({ ...pendingBody, force: true })}
              >
                Créer quand même
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Intitulé" htmlFor="title" required>
              <Input id="title" name="title" required placeholder="Internat — soirée" />
            </Field>
            <Field label="Date" htmlFor="date" required>
              <Input id="date" name="date" type="date" required />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Heure début" htmlFor="startTime" required>
                <Input id="startTime" name="startTime" type="time" required />
              </Field>
              <Field label="Heure fin" htmlFor="endTime" required>
                <Input id="endTime" name="endTime" type="time" required />
              </Field>
            </div>
            {people.length > 0 ? (
              <Field label="Intervenant" hint="Optionnel — parmi les intervenants du planning.">
                <Select value={freelanceId} onValueChange={setFreelanceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Non affecté" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Non affecté</SelectItem>
                    {people.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
            {missions.length > 0 ? (
              <Field label="Mission liée" hint="Optionnel.">
                <Select value={missionId} onValueChange={setMissionId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune mission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Aucune mission</SelectItem>
                    {missions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : null}
            <Field label="Notes" htmlFor="notes">
              <Textarea id="notes" name="notes" rows={3} placeholder="Consignes, contexte…" />
            </Field>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" loading={loading}>
                Créer le créneau
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --------------------------------------------------------------------------
// Section « Mes disponibilités » (FREELANCE).
// --------------------------------------------------------------------------
function AvailabilitySection({
  accountId,
  items,
  onChanged,
}: {
  accountId: string;
  items: Availability[];
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [weekday, setWeekday] = useState("1");
  const [type, setType] = useState<"AVAILABLE" | "UNAVAILABLE">("AVAILABLE");
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const startTime = String(fd.get("startTime") || "");
    const endTime = String(fd.get("endTime") || "");
    if (!startTime || !endTime) return;
    setLoading(true);
    try {
      await apiRequest("/availability", {
        method: "POST",
        body: { weekday: Number(weekday), startTime, endTime, type },
        accountId,
      });
      toast({ title: "Disponibilité ajoutée" });
      (e.target as HTMLFormElement).reset();
      onChanged();
    } catch (err) {
      toast({
        title: "Ajout impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    try {
      await apiRequest(`/availability/${id}`, { method: "DELETE", accountId });
      toast({ title: "Disponibilité supprimée" });
      onChanged();
    } catch (err) {
      toast({
        title: "Suppression impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="size-4 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Mes disponibilités</h2>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end">
            <Field label="Jour">
              <Select value={weekday} onValueChange={setWeekday}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Début">
              <Input name="startTime" type="time" required className="w-full" />
            </Field>
            <Field label="Fin">
              <Input name="endTime" type="time" required className="w-full" />
            </Field>
            <Field label="Type">
              <Select value={type} onValueChange={(v) => setType(v as "AVAILABLE" | "UNAVAILABLE")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVAILABLE">Disponible</SelectItem>
                  <SelectItem value="UNAVAILABLE">Indisponible</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Button type="submit" loading={loading}>
              <Plus />
              Ajouter
            </Button>
          </form>

          {items.length === 0 ? (
            <p className="rounded-lg bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
              Aucune disponibilité renseignée. Ajoutez vos créneaux hebdomadaires.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex items-center gap-3">
                    <Badge variant={a.type === "AVAILABLE" ? "success" : "muted"}>
                      {a.type === "AVAILABLE" ? "Disponible" : "Indisponible"}
                    </Badge>
                    <span className="text-sm text-foreground">
                      {a.weekday != null ? WEEKDAYS[a.weekday] : a.date}
                      <span className="ml-2 text-muted-foreground">
                        {a.startTime} – {a.endTime}
                      </span>
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={busyId === a.id}
                    onClick={() => remove(a.id)}
                    aria-label="Supprimer la disponibilité"
                  >
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
