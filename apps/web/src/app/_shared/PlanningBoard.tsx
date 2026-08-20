"use client";

// Vue agenda des shifts (planning) + gestion.
//  - ESTABLISHMENT : liste chronologique des créneaux du compte, changement de
//    statut, suppression, création (modal) avec gestion des CONFLITS (force)
//    et des PLAFONDS de durée du travail (dérogation motivée).
//  - FREELANCE : ses créneaux + section « Mes disponibilités » (ajout/suppression).
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarPlus,
  Trash2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  Plus,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
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
import { BandeauPanne } from "./BandeauPanne";
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
  /** D'où vient la ligne : saisie manuelle, ou activité réelle du compte. */
  origine?: "MANUEL" | "RENFORT" | "ATELIER" | "FORMATION";
  /**
   * Une ligne déduite d'une réservation ne se modifie pas ici : sa date engage
   * les deux parties et se change sur la réservation elle-même. La déplacer
   * dans le planning donnerait l'illusion d'avoir prévenu l'intervenant.
   */
  modifiable?: boolean;
  /** Contrat ou fiche formation, pour aller à la source en un clic. */
  lien?: string | null;
}

/**
 * Dépassement d'un plafond de durée du travail renvoyé par l'API à la création
 * d'un créneau. `BLOQUANT` empêche l'enregistrement tant qu'aucun motif de
 * dérogation n'est fourni ; `INFO` est purement indicatif.
 */
export interface Constat {
  code: string;
  gravite: "INFO" | "BLOQUANT";
  message: string;
  regle: string;
  valeur: number;
  plafond: number;
}

const ORIGINE_LABEL: Record<string, string> = {
  RENFORT: "RenforTeam",
  ATELIER: "Atelier",
  FORMATION: "Formation",
};

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

type Vue = "mois" | "semaine" | "jour";

const JOURS_COURTS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Couleur de la pastille selon l'origine : on lit le planning d'un coup d'œil. */
const COULEUR_ORIGINE: Record<string, string> = {
  MANUEL: "bg-primary/20 text-primary ring-1 ring-inset ring-primary/30",
  RENFORT: "bg-amber-500/20 text-amber-200 ring-1 ring-inset ring-amber-500/30",
  ATELIER: "bg-emerald-500/20 text-emerald-200 ring-1 ring-inset ring-emerald-500/30",
  FORMATION: "bg-sky-500/20 text-sky-200 ring-1 ring-inset ring-sky-500/30",
};

const LEGENDE: { cle: string; libelle: string }[] = [
  { cle: "MANUEL", libelle: "Créneau ajouté" },
  { cle: "RENFORT", libelle: "RenforTeam" },
  { cle: "ATELIER", libelle: "Atelier" },
  { cle: "FORMATION", libelle: "Formation" },
];

function dayLabel(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}
function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}
/** Clé de jour dans le fuseau de l'utilisateur (pas UTC : sinon 00h30 bascule la veille). */
function cleJour(d: Date) {
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const j = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${j}`;
}
function debutJour(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
/** Lundi de la semaine de `d`. La semaine française commence le lundi. */
function debutSemaine(d: Date) {
  const x = debutJour(d);
  const jour = x.getDay(); // 0 = dimanche
  x.setDate(x.getDate() + ((jour === 0 ? -6 : 1) - jour));
  return x;
}
function debutMois(d: Date) {
  const x = debutJour(d);
  x.setDate(1);
  return x;
}
function ajouterJours(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function PlanningBoard({
  accountType,
  accountId,
  initialShifts,
  missions,
  initialAvailability,
  services = [],
}: {
  accountType: AccountType;
  accountId: string;
  /** Conservés pour compatibilité : la fenêtre est désormais pilotée par le calendrier. */
  fromISO?: string;
  toISO?: string;
  initialShifts: Shift[];
  missions: MissionOption[];
  initialAvailability: Availability[];
  /**
   * Les services de l'établissement. Dès qu'il y en a un, le filtre apparaît :
   * un chef de service pilote son service, pas la structure entière.
   */
  services?: { id: string; name: string }[];
}) {
  const { toast } = useToast();
  const isEstablishment = accountType === "ESTABLISHMENT";
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [availability, setAvailability] = useState<Availability[]>(initialAvailability);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [panne, setPanne] = useState(false);

  // Navigation dans le temps : la vue et la date de référence font la fenêtre.
  const [vue, setVue] = useState<Vue>("mois");
  /** Filtre par service. « __tous__ » = pas de filtre. */
  const [service, setService] = useState<string>("__tous__");
  const [curseur, setCurseur] = useState<Date>(() => debutJour(new Date()));
  const [jourOuvert, setJourOuvert] = useState<string | null>(() => cleJour(new Date()));

  const plage = useMemo(() => {
    if (vue === "jour") {
      const debut = debutJour(curseur);
      return { debut, fin: ajouterJours(debut, 1), cases: 1 };
    }
    if (vue === "semaine") {
      const debut = debutSemaine(curseur);
      return { debut, fin: ajouterJours(debut, 7), cases: 7 };
    }
    const debut = debutSemaine(debutMois(curseur));
    return { debut, fin: ajouterJours(debut, 42), cases: 42 };
  }, [vue, curseur]);

  const fromISO = plage.debut.toISOString();
  const toISO = plage.fin.toISOString();

  /** L'adresse de la période affichée, filtre de service compris. */
  const urlPlanning = useMemo(() => {
    const p = new URLSearchParams({ from: fromISO, to: toISO });
    if (service !== "__tous__") p.set("orgUnitId", service);
    return `/planning?${p.toString()}`;
  }, [fromISO, toISO, service]);

  const reloadShifts = useCallback(async () => {
    try {
      const data = await apiRequest<Shift[]>(urlPlanning, { accountId });
      setShifts(data ?? []);
      setPanne(false);
    } catch {
      // On garde l'état courant, mais on le DIT : un planning figé qu'on croit
      // à jour, c'est un créneau qu'on oublie de pourvoir.
      setPanne(true);
    }
  }, [accountId, urlPlanning]);

  // À chaque changement de fenêtre, on recharge : le calendrier montre toujours
  // la période affichée, jamais un reste de la précédente.
  useEffect(() => {
    let annule = false;
    setChargement(true);
    apiRequest<Shift[]>(urlPlanning, { accountId })
      .then((d) => {
        if (!annule) {
          setShifts(d ?? []);
          setPanne(false);
        }
      })
      .catch(() => {
        if (!annule) setPanne(true);
      })
      .finally(() => {
        if (!annule) setChargement(false);
      });
    return () => {
      annule = true;
    };
  }, [accountId, urlPlanning]);

  const reloadAvailability = useCallback(async () => {
    try {
      const data = await apiRequest<Availability[]>("/availability", { accountId });
      setAvailability(data ?? []);
      setPanne(false);
    } catch {
      // Les disponibilités décident des missions qu'on vous propose : les
      // croire vides alors qu'elles n'ont pas chargé, c'est disparaître.
      setPanne(true);
    }
  }, [accountId]);

  /** Créneaux rangés par jour : la structure même du calendrier. */
  const parJour = useMemo(() => {
    const map = new Map<string, Shift[]>();
    const tries = [...shifts].sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
    for (const s of tries) {
      const k = cleJour(new Date(s.startAt));
      const arr = map.get(k);
      if (arr) arr.push(s);
      else map.set(k, [s]);
    }
    return map;
  }, [shifts]);

  const jours = useMemo(
    () => Array.from({ length: plage.cases }, (_, i) => ajouterJours(plage.debut, i)),
    [plage],
  );

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

  function decaler(sens: -1 | 1) {
    setCurseur((prev) => {
      if (vue === "jour") return ajouterJours(prev, sens);
      if (vue === "semaine") return ajouterJours(prev, 7 * sens);
      const x = debutMois(prev);
      x.setMonth(x.getMonth() + sens);
      return x;
    });
  }

  const titrePeriode = useMemo(() => {
    if (vue === "jour") {
      return curseur.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (vue === "semaine") {
      const d = debutSemaine(curseur);
      const f = ajouterJours(d, 6);
      const memeMois = d.getMonth() === f.getMonth();
      return `${d.getDate()} ${memeMois ? "" : d.toLocaleDateString("fr-FR", { month: "long" }) + " "}– ${f.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`;
    }
    return curseur.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }, [vue, curseur]);

  const cleAujourdhui = cleJour(new Date());
  const moisAffiche = debutMois(curseur).getMonth();
  const creneauxDuJourOuvert = jourOuvert ? (parJour.get(jourOuvert) ?? []) : [];

  const ligne = (s: Shift) => (
    <LigneCreneau
      key={s.id}
      s={s}
      isEstablishment={isEstablishment}
      busy={busyId === s.id}
      onStatus={changeStatus}
      onDelete={removeShift}
    />
  );

  return (
    <div className="space-y-6">
      {/* Barre de navigation du calendrier */}
      {panne ? <BandeauPanne quoi="le planning" onReessayer={() => void reloadShifts()} /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => decaler(-1)}
            aria-label="Période précédente"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurseur(debutJour(new Date()))}>
            Aujourd’hui
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => decaler(1)}
            aria-label="Période suivante"
          >
            <ChevronRight className="size-4" />
          </Button>
          <h2 className="ml-1 text-lg font-semibold capitalize text-foreground">{titrePeriode}</h2>
          {chargement ? (
            <span className="text-xs text-muted-foreground">Chargement…</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isEstablishment && services.length > 0 ? (
            <Select value={service} onValueChange={setService}>
              <SelectTrigger className="h-9 w-52" aria-label="Filtrer par service">
                <SelectValue placeholder="Tous les services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__tous__">Tous les services</SelectItem>
                {services.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
                <SelectItem value="sans-service">Sans service</SelectItem>
              </SelectContent>
            </Select>
          ) : null}
          <div
            className="inline-flex overflow-hidden rounded-lg border border-input"
            role="group"
            aria-label="Vue du calendrier"
          >
            {(["mois", "semaine", "jour"] as Vue[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVue(v)}
                aria-pressed={vue === v}
                className={`px-3 py-1.5 text-sm capitalize transition-colors ${
                  vue === v
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          {isEstablishment ? (
            <NewShiftModal
              accountId={accountId}
              missions={missions}
              people={people}
              onCreated={reloadShifts}
            />
          ) : null}
        </div>
      </div>

      {/* Légende des couleurs */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {LEGENDE.map((l) => (
          <span key={l.cle} className="inline-flex items-center gap-1.5">
            <span
              className={`size-2.5 rounded-full ${COULEUR_ORIGINE[l.cle].split(" ")[0]}`}
              aria-hidden
            />
            {l.libelle}
          </span>
        ))}
      </div>

      {/* Calendrier */}
      {vue === "jour" ? (
        <Card>
          <CardContent className="p-0">
            {creneauxDuJourOuvertOuDuCurseur(parJour, curseur).length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<CalendarDays />}
                  title="Rien ce jour-là"
                  description={
                    isEstablishment
                      ? "Ajoutez un créneau ou changez de journée."
                      : "Aucune intervention prévue ce jour."
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {creneauxDuJourOuvertOuDuCurseur(parJour, curseur).map(ligne)}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* En-tête des jours */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/40">
              {JOURS_COURTS.map((j) => (
                <div
                  key={j}
                  className="px-2 py-2 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground"
                >
                  {j}
                </div>
              ))}
            </div>
            {/* Grille */}
            <div className="grid grid-cols-7">
              {jours.map((d) => {
                const k = cleJour(d);
                const items = parJour.get(k) ?? [];
                const horsMois = vue === "mois" && d.getMonth() !== moisAffiche;
                const aujourdhui = k === cleAujourdhui;
                const visibles = vue === "semaine" ? items : items.slice(0, 3);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setJourOuvert(k)}
                    className={`flex min-h-[112px] flex-col gap-1 border-b border-r border-border p-1.5 text-left align-top transition-colors last:border-r-0 hover:bg-accent/40 ${
                      horsMois ? "bg-muted/20" : ""
                    } ${jourOuvert === k ? "ring-1 ring-inset ring-primary/50" : ""} ${
                      vue === "semaine" ? "min-h-[220px]" : ""
                    }`}
                  >
                    <span
                      className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                        aujourdhui
                          ? "bg-primary text-primary-foreground"
                          : horsMois
                            ? "text-muted-foreground/50"
                            : "text-foreground"
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    <span className="flex flex-col gap-1">
                      {visibles.map((s) => (
                        <span
                          key={s.id}
                          title={`${hhmm(s.startAt)} – ${hhmm(s.endAt)} · ${s.title}`}
                          className={`block truncate rounded px-1.5 py-0.5 text-[11px] leading-tight ${
                            COULEUR_ORIGINE[s.origine ?? "MANUEL"] ?? COULEUR_ORIGINE.MANUEL
                          } ${s.status === "CANCELLED" ? "line-through opacity-60" : ""}`}
                        >
                          <span className="font-medium">{hhmm(s.startAt)}</span> {s.title}
                        </span>
                      ))}
                      {items.length > visibles.length ? (
                        <span className="px-1.5 text-[11px] text-muted-foreground">
                          +{items.length - visibles.length} autre
                          {items.length - visibles.length > 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Détail du jour sélectionné */}
      {vue !== "jour" && jourOuvert ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold capitalize text-muted-foreground">
            {new Date(`${jourOuvert}T12:00:00`).toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>
          <Card>
            <CardContent className="p-0">
              {creneauxDuJourOuvert.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">
                  Aucun créneau ce jour-là. Cliquez sur une autre date du calendrier.
                </p>
              ) : (
                <div className="divide-y divide-border">{creneauxDuJourOuvert.map(ligne)}</div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

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

/** En vue « jour », c'est la date du curseur qui fait foi. */
function creneauxDuJourOuvertOuDuCurseur(parJour: Map<string, Shift[]>, curseur: Date) {
  return parJour.get(cleJour(curseur)) ?? [];
}

/** Une ligne détaillée : horaires, intervenant, origine, statut, actions. */
function LigneCreneau({
  s,
  isEstablishment,
  busy,
  onStatus,
  onDelete,
}: {
  s: Shift;
  isEstablishment: boolean;
  busy: boolean;
  onStatus: (id: string, status: ShiftStatus) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4">
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
        {s.notes ? <p className="mt-1 truncate text-xs text-muted-foreground/80">{s.notes}</p> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {s.origine && s.origine !== "MANUEL" ? (
          <Badge variant="secondary">{ORIGINE_LABEL[s.origine]}</Badge>
        ) : null}
        <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
        {s.lien ? (
          <Button asChild size="sm" variant="ghost">
            <a href={s.lien}>Ouvrir</a>
          </Button>
        ) : null}
        {isEstablishment && s.modifiable !== false ? (
          <>
            <div className="w-36">
              <Select value={s.status} onValueChange={(v) => onStatus(s.id, v as ShiftStatus)}>
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
              disabled={busy}
              onClick={() => onDelete(s.id)}
              aria-label="Supprimer le créneau"
            >
              <Trash2 />
            </Button>
          </>
        ) : null}
      </div>
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
  const [constats, setConstats] = useState<Constat[] | null>(null);
  const [motif, setMotif] = useState("");
  const [pendingBody, setPendingBody] = useState<Record<string, unknown> | null>(null);
  const [missionId, setMissionId] = useState("");
  const [freelanceId, setFreelanceId] = useState("");

  function reset() {
    setError(null);
    setConflicts(null);
    setConstats(null);
    setMotif("");
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
        const payload = err.payload as {
          message?: string;
          code?: string;
          conflicts?: Conflict[];
          constats?: Constat[];
        } | null;
        if (payload?.conflicts?.length) {
          setConflicts(payload.conflicts);
          setPendingBody(body);
          setLoading(false);
          return;
        }
        // Plafond de durée du travail : on ne referme pas la porte, on demande
        // un motif. Le créneau reste créable, mais la décision est tracée.
        if (payload?.code === "CONFORMITE_HORAIRE" && payload.constats?.length) {
          setConstats(payload.constats);
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

        {constats ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                <ShieldAlert className="size-4" />
                {constats.length === 1
                  ? "Un plafond de durée du travail serait dépassé"
                  : `${constats.length} plafonds de durée du travail seraient dépassés`}
              </div>
              <ul className="mt-3 space-y-3">
                {constats.map((c) => (
                  <li key={c.code}>
                    <p className="text-sm text-foreground">{c.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.regle}</p>
                    {/* Jauge : on voit d'un coup d'oeil de combien on deborde. */}
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-destructive"
                        style={{
                          width: `${Math.min(100, Math.round((c.valeur / c.plafond) * 100))}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.valeur.toFixed(1).replace(".", ",")} pour un plafond de{" "}
                      {c.plafond.toFixed(1).replace(".", ",")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              Ces plafonds se calculent sur <strong>tous les employeurs</strong> de
              l&apos;intervenant, pas seulement sur votre établissement. Vous pouvez passer
              outre, mais le motif sera enregistré avec votre nom et la date, et restera
              consultable en cas de contrôle.
            </p>
            <Field
              label="Motif de la dérogation"
              htmlFor="derogationMotif"
              required
              hint="Par exemple : autorisation de l'inspection du travail, accord de branche, circonstances exceptionnelles."
            >
              <Textarea
                id="derogationMotif"
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={3}
                placeholder="Pourquoi ce dépassement est-il justifié ?"
              />
            </Field>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConstats(null);
                  setMotif("");
                  setError(null);
                }}
              >
                Modifier le créneau
              </Button>
              <Button
                type="button"
                variant="destructive"
                loading={loading}
                disabled={motif.trim().length < 5}
                onClick={() =>
                  pendingBody && post({ ...pendingBody, derogationMotif: motif.trim() })
                }
              >
                Passer outre et créer
              </Button>
            </DialogFooter>
          </div>
        ) : conflicts ? (
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
