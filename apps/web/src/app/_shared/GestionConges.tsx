"use client";

// GTA — congés & compteurs : demande d'absence, décision du responsable,
// compteurs par membre, export des éléments de paie, cycles de planning.
// Même logique et même design que le reste du dashboard (cartes, badges).
import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

interface Conge {
  id: string;
  type: "CONGE" | "RTT" | "MALADIE" | "SANS_SOLDE" | "AUTRE";
  debut: string;
  fin: string;
  motif?: string | null;
  statut: "EN_ATTENTE" | "APPROUVE" | "REFUSE";
  user: { id: string; firstName?: string | null; lastName?: string | null };
}

interface Compteur {
  userId: string;
  nom: string;
  role: string;
  heuresPlanifieesMois: number;
  joursCongesPris: number;
  soldeConges: number;
  semainesAuDela48h: { semaine: string; heures: number }[];
}

const TYPES: { value: Conge["type"]; label: string }[] = [
  { value: "CONGE", label: "Congés payés" },
  { value: "RTT", label: "RTT" },
  { value: "MALADIE", label: "Arrêt maladie" },
  { value: "SANS_SOLDE", label: "Sans solde" },
  { value: "AUTRE", label: "Autre absence" },
];

const STATUT_LABEL: Record<Conge["statut"], string> = {
  EN_ATTENTE: "En attente",
  APPROUVE: "Approuvé",
  REFUSE: "Refusé",
};

function nom(u: Conge["user"]): string {
  return [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
}

export function GestionConges({
  accountId,
  canDecide,
}: {
  accountId: string;
  canDecide: boolean;
}) {
  const { toast } = useToast();
  const [conges, setConges] = useState<Conge[]>([]);
  const [compteurs, setCompteurs] = useState<Compteur[]>([]);
  const [busy, setBusy] = useState(false);

  const charger = useCallback(async () => {
    try {
      const [c, k] = await Promise.all([
        apiRequest<Conge[]>("/gta/conges", { accountId }),
        apiRequest<Compteur[]>("/gta/compteurs", { accountId }),
      ]);
      setConges(c);
      setCompteurs(k);
    } catch {
      /* silencieux : la page reste utilisable */
    }
  }, [accountId]);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function demander(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setBusy(true);
    try {
      await apiRequest("/gta/conges", {
        method: "POST",
        accountId,
        body: {
          type: String(fd.get("type") || "CONGE"),
          debut: String(fd.get("debut") || ""),
          fin: String(fd.get("fin") || ""),
          motif: String(fd.get("motif") || "") || undefined,
        },
      });
      form.reset();
      toast({ title: "Demande envoyée", description: "Vos responsables ont été prévenus." });
      await charger();
    } catch (err) {
      toast({
        title: "Demande impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function decider(id: string, statut: "APPROUVE" | "REFUSE") {
    setBusy(true);
    try {
      await apiRequest(`/gta/conges/${id}`, { method: "PATCH", accountId, body: { statut } });
      toast({ title: statut === "APPROUVE" ? "Congé approuvé" : "Congé refusé" });
      await charger();
    } catch (err) {
      toast({
        title: "Décision impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Demande */}
      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-foreground">Demander une absence</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={demander} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Type</span>
              <select
                name="type"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              >
                {TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Du</span>
              <Input type="date" name="debut" required />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Au</span>
              <Input type="date" name="fin" required />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-muted-foreground">Motif (optionnel)</span>
              <Input name="motif" placeholder="Précision utile au responsable" />
            </label>
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit" size="sm" disabled={busy}>
                Envoyer la demande
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Demandes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">Demandes</h2>
          {canDecide ? (
            <Button asChild size="sm" variant="outline">
              <a href="/api/proxy/gta/export/evp.csv" download>
                Exporter les éléments de paie (CSV)
              </a>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {conges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune demande pour le moment.</p>
          ) : (
            <ul className="divide-y divide-border">
              {conges.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-foreground">{nom(c.user)}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {TYPES.find((t) => t.value === c.type)?.label ?? c.type} · du{" "}
                      {new Date(c.debut).toLocaleDateString("fr-FR")} au{" "}
                      {new Date(c.fin).toLocaleDateString("fr-FR")}
                    </span>
                    {c.motif ? (
                      <span className="block text-xs text-muted-foreground">{c.motif}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        c.statut === "APPROUVE"
                          ? "success"
                          : c.statut === "REFUSE"
                            ? "destructive"
                            : "outline"
                      }
                    >
                      {STATUT_LABEL[c.statut]}
                    </Badge>
                    {canDecide && c.statut === "EN_ATTENTE" ? (
                      <>
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => decider(c.id, "APPROUVE")}>
                          Approuver
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => decider(c.id, "REFUSE")}>
                          Refuser
                        </Button>
                      </>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Compteurs */}
      {canDecide ? (
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold text-foreground">Compteurs du mois</h2>
            <p className="text-sm text-muted-foreground">
              Heures planifiées (hors absences), congés pris sur l&apos;année et solde restant
              (base 25 jours). Une alerte apparaît si une semaine dépasse 48 h.
            </p>
          </CardHeader>
          <CardContent>
            {compteurs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucun membre actif.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-4">Membre</th>
                      <th className="py-2 pr-4">Heures planifiées</th>
                      <th className="py-2 pr-4">Congés pris</th>
                      <th className="py-2 pr-4">Solde</th>
                      <th className="py-2">Alertes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compteurs.map((k) => (
                      <tr key={k.userId} className="border-b border-border/60">
                        <td className="py-2 pr-4 font-medium text-foreground">{k.nom}</td>
                        <td className="py-2 pr-4">{String(k.heuresPlanifieesMois).replace(".", ",")} h</td>
                        <td className="py-2 pr-4">{k.joursCongesPris} j</td>
                        <td className="py-2 pr-4">{k.soldeConges} j</td>
                        <td className="py-2">
                          {k.semainesAuDela48h.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : (
                            k.semainesAuDela48h.map((s) => (
                              <span key={s.semaine} className="block text-xs font-medium text-[#b8860b]">
                                ⚠ Semaine du {new Date(s.semaine).toLocaleDateString("fr-FR")} :{" "}
                                {String(s.heures).replace(".", ",")} h
                              </span>
                            ))
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
