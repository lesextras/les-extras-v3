// Jalon de campagne (esprit Vesk) : où en est-on des 4 000 € avant fin
// septembre, et quel rythme hebdomadaire il reste à tenir. Données réelles :
// réservations confirmées + factures payées.
import Link from "next/link";
import { Target, TrendingUp, CalendarClock, Radio, Compass } from "lucide-react";

export interface ObjectifData {
  cible: number;
  encaisse: number;
  reste: number;
  pourcentage: number;
  joursRestants: number;
  rythmeHebdo: number;
  detail?: { reservations: number; factures: number };
}

const euros = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export interface Activite { type: "demande" | "compte" | "reservation"; libelle: string; detail?: string; date: string }

const ilYA = (iso: string) => {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.round(h / 24)} j`;
};

const PUCE: Record<Activite["type"], string> = {
  demande: "bg-secondary",
  compte: "bg-primary",
  reservation: "bg-success",
};

export function ObjectifCampagne({ objectif, funnel, sources, inscriptionsParSource, activite }: {
  objectif: ObjectifData;
  funnel?: { vues: number; demandes: number; devis: number; reservations: number };
  sources?: { source: string; demandes: number }[];
  /** Comptes créés par campagne : la métrique qui compte quand on paie. */
  inscriptionsParSource?: {
    source: string;
    medium?: string | null;
    campagne?: string | null;
    comptes: number;
  }[];
  activite?: Activite[];
}) {
  const atteint = objectif.pourcentage >= 100;

  return (
    <section className="rounded-2xl border border-primary/20 bg-card p-6 shadow-soft md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
            <Target className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Objectif {euros(objectif.cible)} — 30 septembre</h2>
            <p className="text-sm text-muted-foreground">
              Réservations confirmées et factures payées, en temps réel.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold tracking-tight text-primary [font-variant-numeric:tabular-nums]">
            {euros(objectif.encaisse)}
          </p>
          <p className="text-xs text-muted-foreground">sur {euros(objectif.cible)}</p>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mt-5">
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${Math.max(2, objectif.pourcentage)}%` }}
          />
        </div>
        <div className="mt-2 flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{objectif.pourcentage} % atteint</span>
          <span>
            {atteint ? "Objectif atteint 🎉" : `Reste ${euros(objectif.reste)}`}
          </span>
        </div>
      </div>

      {/* Repères */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-muted/60 px-4 py-3">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" /> Jours restants
          </p>
          <p className="mt-0.5 text-lg font-semibold">{objectif.joursRestants}</p>
        </div>
        <div className="rounded-xl bg-muted/60 px-4 py-3">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <TrendingUp className="size-3.5" /> Rythme à tenir
          </p>
          <p className="mt-0.5 text-lg font-semibold">{euros(objectif.rythmeHebdo)} / semaine</p>
        </div>
        <div className="rounded-xl bg-muted/60 px-4 py-3">
          <p className="text-xs text-muted-foreground">Dont réservations</p>
          <p className="mt-0.5 text-lg font-semibold">
            {euros(objectif.detail?.reservations ?? 0)}
          </p>
        </div>
      </div>

      {/* Funnel en euros — la vue qui relie le trafic à l'argent */}
      {funnel ? (
        <div className="mt-6 border-t border-border/60 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Du visiteur à l’euro
          </p>
          <ol className="mt-3 grid gap-2 sm:grid-cols-4">
            {[
              { l: "Vues de fiches", v: funnel.vues },
              { l: "Demandes", v: funnel.demandes },
              { l: "Devis envoyés", v: funnel.devis },
              { l: "Réservations", v: funnel.reservations },
            ].map((e, i, arr) => {
              const prec = i > 0 ? arr[i - 1]!.v : 0;
              const taux = i > 0 && prec > 0 ? Math.round((e.v / prec) * 100) : null;
              return (
                <li key={e.l} className="rounded-xl border border-border/70 px-4 py-3">
                  <p className="text-xs text-muted-foreground">{e.l}</p>
                  <p className="mt-0.5 text-xl font-bold [font-variant-numeric:tabular-nums]">{e.v}</p>
                  {taux !== null ? (
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{taux} % de l’étape précédente</p>
                  ) : null}
                </li>
              );
            })}
          </ol>
          <Link
            href="/admin/tunnel"
            className="mt-3 inline-flex text-sm font-semibold text-primary hover:underline"
          >
            Voir le tunnel fiche par fiche →
          </Link>
        </div>
      ) : null}
      {/* Inscriptions par campagne — placé avant les demandes : pendant une
          campagne payante, c'est le compte créé qui se monétise, pas le clic. */}
      {inscriptionsParSource && inscriptionsParSource.length ? (
        <div className="mt-6 border-t border-border/60 pt-5">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Compass className="size-3.5" /> Comptes créés, par campagne
          </p>
          <ul className="mt-3 space-y-2">
            {inscriptionsParSource.map((s, i) => {
              const max = Math.max(...inscriptionsParSource.map((x) => x.comptes), 1);
              const detail = [s.medium, s.campagne].filter(Boolean).join(' · ');
              return (
                <li key={`${s.source}-${i}`} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 truncate text-sm text-foreground">
                    {s.source}
                    {detail ? (
                      <span className="block truncate text-xs text-muted-foreground">{detail}</span>
                    ) : null}
                  </span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full bg-success/70"
                      style={{ width: `${Math.max(6, (s.comptes / max) * 100)}%` }}
                    />
                  </span>
                  <span className="w-8 text-right text-sm font-semibold [font-variant-numeric:tabular-nums]">
                    {s.comptes}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {/* Attribution + activité en direct */}
      {(sources && sources.length) || (activite && activite.length) ? (
        <div className="mt-6 grid gap-6 border-t border-border/60 pt-5 lg:grid-cols-2">
          {sources && sources.length ? (
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Compass className="size-3.5" /> D’où viennent les demandes
              </p>
              <ul className="mt-3 space-y-2">
                {sources.map((s) => {
                  const max = Math.max(...sources.map((x) => x.demandes), 1);
                  return (
                    <li key={s.source} className="flex items-center gap-3">
                      <span className="w-28 shrink-0 truncate text-sm text-foreground">{s.source}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full bg-primary/70"
                          style={{ width: `${Math.max(6, (s.demandes / max) * 100)}%` }}
                        />
                      </span>
                      <span className="w-8 text-right text-sm font-semibold [font-variant-numeric:tabular-nums]">
                        {s.demandes}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {activite && activite.length ? (
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Radio className="size-3.5" /> Activité récente
              </p>
              <ul className="mt-3 space-y-2.5">
                {activite.map((a, i) => (
                  <li key={`${a.date}-${i}`} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${PUCE[a.type]}`} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">{a.libelle}</span>
                      <span className="text-xs text-muted-foreground">
                        {a.detail ? `${a.detail} · ` : ""}{ilYA(a.date)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
