"use client";

// Gestion des unités / services d'un établissement (repris de Symfony : Service/unités).
// Créer/supprimer des unités + affecter les membres. CRUD via /units + /units/assign.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

interface Unit {
  id: string;
  name: string;
  description?: string | null;
  memberCount: number;
  missionCount: number;
}
interface Member {
  id: string;
  orgUnitId?: string | null;
  user?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null;
}

export function UnitsManager({ accountId, canManage }: { accountId: string; canManage: boolean }) {
  const { toast } = useToast();
  const [units, setUnits] = useState<Unit[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      const [u, m] = await Promise.all([
        apiRequest<Unit[]>("/units", { accountId }),
        apiRequest<Member[]>("/memberships", { accountId }),
      ]);
      setUnits(Array.isArray(u) ? u : []);
      setMembers(Array.isArray(m) ? m : []);
    } catch {
      /* silencieux */
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addUnit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get("name") || "");
    if (!name) return;
    setBusy(true);
    try {
      await apiRequest("/units", {
        method: "POST",
        accountId,
        body: { name, description: String(fd.get("description") || "") || undefined },
      });
      form.reset();
      await load();
    } catch (err) {
      toast({ title: "Création impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function removeUnit(id: string) {
    setBusy(true);
    try {
      await apiRequest(`/units/${id}`, { method: "DELETE", accountId });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function assign(membershipId: string, unitId: string) {
    setBusy(true);
    try {
      await apiRequest("/units/assign", {
        method: "POST",
        accountId,
        body: { membershipId, unitId: unitId || undefined },
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  function memberName(m: Member) {
    const n = [m.user?.firstName, m.user?.lastName].filter(Boolean).join(" ");
    return n || m.user?.email || "Membre";
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold text-foreground">Unités &amp; services</h3>
        <p className="text-xs text-muted-foreground">
          Organisez votre structure en unités (internat, pôle jour, SESSAD…). Vous pourrez rattacher les membres et
          cibler vos demandes de renfort par unité.
        </p>
        <ul className="mt-3 space-y-2">
          {units.length === 0 ? (
            <li className="text-sm text-muted-foreground">Aucune unité pour l&apos;instant.</li>
          ) : (
            units.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.memberCount} membre{u.memberCount > 1 ? "s" : ""} · {u.missionCount} mission
                    {u.missionCount > 1 ? "s" : ""}
                    {u.description ? ` · ${u.description}` : ""}
                  </p>
                </div>
                {canManage ? (
                  <button
                    type="button"
                    onClick={() => removeUnit(u.id)}
                    disabled={busy}
                    className="text-xs text-destructive hover:underline"
                  >
                    Supprimer
                  </button>
                ) : null}
              </li>
            ))
          )}
        </ul>
        {canManage ? (
          <form onSubmit={addUnit} className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-3">
            <Input name="name" required placeholder="Nom de l'unité (ex. Internat)" className="sm:col-span-1" />
            <Input name="description" placeholder="Description (optionnel)" className="sm:col-span-1" />
            <Button type="submit" size="sm" variant="secondary" disabled={busy} className="sm:col-span-1">
              Ajouter l&apos;unité
            </Button>
          </form>
        ) : null}
      </section>

      {canManage && units.length > 0 && members.length > 0 ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground">Affectation des membres</h3>
          <ul className="mt-3 divide-y divide-border">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span className="text-sm text-foreground">{memberName(m)}</span>
                <select
                  value={m.orgUnitId ?? ""}
                  disabled={busy}
                  onChange={(e) => assign(m.id, e.target.value)}
                  className="h-9 rounded-lg border border-input bg-background px-2 text-sm"
                >
                  <option value="">— Sans unité —</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
