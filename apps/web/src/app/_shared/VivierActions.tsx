"use client";

/**
 * LES TROIS GESTES DU VIVIER : retenir, annoter, rappeler.
 *
 * Retenir quelqu'un n'est pas un signet décoratif. Un intervenant retenu entre
 * dans le palier « réseau réservé » de la diffusion en cascade : il reçoit les
 * besoins de renfort avant que l'offre ne s'ouvre à toute la marketplace.
 * C'est ce qui fait qu'un vivier se fidélise au lieu de se disperser.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "./form-fields";

export function RetenirIntervenant({
  intervenantAccountId,
  nom,
  accountId,
  retenu,
  noteInterne,
}: {
  intervenantAccountId: string;
  nom: string;
  accountId: string;
  retenu: boolean;
  noteInterne?: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function enregistrer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setErreur(null);
    const fd = new FormData(e.currentTarget);
    try {
      await apiRequest(`/vivier/${intervenantAccountId}`, {
        method: "POST",
        accountId,
        body: { note: String(fd.get("note") || "").trim() || undefined },
      });
      toast({
        title: retenu ? "Note mise à jour" : `${nom} rejoint votre vivier`,
        description: retenu
          ? undefined
          : "Vos besoins de renfort lui parviendront avant d'être ouverts à toute la marketplace.",
      });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  async function retirer() {
    setBusy(true);
    try {
      await apiRequest(`/vivier/${intervenantAccountId}`, { method: "DELETE", accountId });
      toast({ title: `${nom} retiré de votre vivier` });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Retrait impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={retenu ? "secondary" : "outline"}>
          {retenu ? "Dans mon vivier ✓" : "Retenir"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{retenu ? `${nom} — note de service` : `Retenir ${nom}`}</DialogTitle>
          <DialogDescription>
            {retenu
              ? "Cette note reste interne à votre établissement."
              : "Vos besoins de renfort lui parviendront en priorité, avant l'ouverture à toute la marketplace."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={enregistrer} className="space-y-4">
          <Field
            label="Ce qu'il faut savoir"
            htmlFor="note"
            hint="Visible de votre établissement seulement. Ex : « connaît le groupe des ados », « accepte les nuits », « à prévenir la veille »."
          >
            <Textarea id="note" name="note" rows={3} defaultValue={noteInterne ?? ""} />
          </Field>
          {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
          <DialogFooter className="sm:justify-between">
            {retenu ? (
              <Button type="button" variant="ghost" onClick={retirer} disabled={busy}>
                Retirer du vivier
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={busy}>
              {busy ? "Enregistrement…" : retenu ? "Enregistrer" : "Retenir"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * RAPPELER SON VIVIER SUR UN BESOIN PRÉCIS.
 *
 * Le geste qui manquait. Jusqu'ici, retrouver quelqu'un qu'on avait déjà fait
 * venir supposait de republier une offre et d'attendre que la cascade la lui
 * présente. On peut maintenant cocher trois noms et les prévenir directement.
 */
export function RappelerVivier({
  accountId,
  missions,
  intervenants,
}: {
  accountId: string;
  /** Les missions ouvertes de l'établissement, hors diffusion strictement interne. */
  missions: { id: string; title: string; startDate: string; visibility: string }[];
  intervenants: { accountId: string; nom: string; metier: string | null }[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [missionId, setMissionId] = useState<string>(missions[0]?.id ?? "");
  const [coches, setCoches] = useState<string[]>([]);

  const eligibles = missions.filter((m) => m.visibility !== "SALARIES");

  async function envoyer() {
    if (!missionId) {
      setErreur("Choisissez un besoin.");
      return;
    }
    if (coches.length === 0) {
      setErreur("Cochez au moins une personne.");
      return;
    }
    setBusy(true);
    setErreur(null);
    try {
      const r = await apiRequest<{ notifies: number }>(`/vivier/rappel/${missionId}`, {
        method: "POST",
        accountId,
        body: { intervenantAccountIds: coches },
      });
      toast({
        title: `${r.notifies} personne${r.notifies > 1 ? "s" : ""} sollicitée${r.notifies > 1 ? "s" : ""}`,
        description: "Elles reçoivent une notification avec le lien vers le besoin.",
      });
      setOpen(false);
      setCoches([]);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={intervenants.length === 0}>Rappeler mon vivier</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rappeler des intervenants</DialogTitle>
          <DialogDescription>
            Ils reçoivent une notification nominative, sans attendre que la diffusion
            automatique leur présente l'offre.
          </DialogDescription>
        </DialogHeader>

        {eligibles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Aucun besoin ouvert au réseau réservé pour l'instant.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Publiez un RenforTeam, ou élargissez la diffusion d'un besoin encore réservé à vos
              salariés.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Field label="Sur quel besoin ?">
              <select
                value={missionId}
                onChange={(e) => setMissionId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {eligibles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title} — {new Date(m.startDate).toLocaleDateString("fr-FR")}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={`Qui prévenir ? (${coches.length} sélectionné${coches.length > 1 ? "s" : ""})`}>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                {intervenants.map((i) => {
                  const actif = coches.includes(i.accountId);
                  return (
                    <label
                      key={i.accountId}
                      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/60"
                    >
                      <input
                        type="checkbox"
                        checked={actif}
                        onChange={() =>
                          setCoches((liste) =>
                            actif
                              ? liste.filter((x) => x !== i.accountId)
                              : [...liste, i.accountId],
                          )
                        }
                        className="size-4"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                        {i.nom}
                        {i.metier ? (
                          <span className="text-muted-foreground"> · {i.metier}</span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Field>

            {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Fermer
          </Button>
          {eligibles.length > 0 ? (
            <Button onClick={envoyer} disabled={busy}>
              {busy ? "Envoi…" : "Prévenir"}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
