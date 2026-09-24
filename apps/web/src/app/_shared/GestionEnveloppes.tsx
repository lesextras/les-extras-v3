"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Link2, Pause, Play, Send, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Enveloppe {
  id: string;
  email: string;
  nom: string | null;
  statut: "INVITEE" | "ACTIVE" | "SUSPENDUE";
  plafondMensuel: number;
  partageTrames: boolean;
  consommeCeMois: number;
  invitationExpireLe: string | null;
}

interface Vue {
  solde: number;
  compte: string;
  plafondsCumules: number;
  consommeCeMois: number;
  enveloppes: Enveloppe[];
}

const LIBELLE: Record<Enveloppe["statut"], string> = {
  INVITEE: "Invitation envoyée",
  ACTIVE: "Active",
  SUSPENDUE: "Suspendue",
};
const F_DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });

export function GestionEnveloppes() {
  const { toast } = useToast();
  const [vue, setVue] = useState<Vue | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [plafond, setPlafond] = useState("30");
  const [trames, setTrames] = useState(true);
  const [envoi, setEnvoi] = useState(false);
  const [lien, setLien] = useState<{ email: string; url: string } | null>(null);
  const [occupe, setOccupe] = useState<string | null>(null);

  const charger = useCallback(async () => {
    try {
      setVue(await apiRequest<Vue>("/lex/enveloppes"));
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof ApiError ? e.message : "Chargement impossible.");
    }
  }, []);

  useEffect(() => {
    void charger();
  }, [charger]);

  const echec = (e: unknown) => toast({ title: e instanceof ApiError ? e.message : "Action impossible.", variant: "error" });

  const inviter = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setEnvoi(true);
    try {
      const r = await apiRequest<{ lien: string }>("/lex/enveloppes", {
        method: "POST",
        body: { email: email.trim(), plafondMensuel: Number(plafond), partageTrames: trames },
      });
      setLien({ email: email.trim(), url: r.lien });
      setEmail("");
      toast({ title: "Invitation envoyée", variant: "success" });
      await charger();
    } catch (e) {
      echec(e);
    } finally {
      setEnvoi(false);
    }
  };

  const agir = async (id: string, fn: () => Promise<unknown>, succes: string) => {
    setOccupe(id);
    try {
      await fn();
      toast({ title: succes, variant: "success" });
      await charger();
    } catch (e) {
      echec(e);
    } finally {
      setOccupe(null);
    }
  };

  if (erreur) return <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">{erreur}</p>;
  if (!vue) return <p className="text-sm text-muted-foreground">Chargement…</p>;

  const alerte = vue.plafondsCumules > vue.solde;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Chiffre titre="Solde de votre compte" valeur={vue.solde} detail="générations disponibles" />
        <Chiffre titre="Utilisées par l’équipe" valeur={vue.consommeCeMois} detail="ce mois-ci" />
        <Chiffre titre="Plafonds cumulés" valeur={vue.plafondsCumules} detail="par mois, personnes actives" alerte={alerte} />
      </div>
      {alerte ? (
        <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          Les plafonds cumulés dépassent votre solde. Tout le monde n’ira donc pas au bout de son plafond : quand votre
          solde est vide, chacun retombe sur ses propres générations gratuites.
        </p>
      ) : null}

      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
        <p>
          <strong>Vous voyez des nombres, jamais des écrits.</strong> Chaque personne garde son propre compte ; vous
          savez combien de générations elle utilise, pas ce qu’elle écrit. Ses quinze générations gratuites restent à
          elle : votre enveloppe paie d’abord.
        </p>
      </div>

      <form onSubmit={inviter} className="space-y-4 rounded-xl border border-border bg-card p-4">
        <h2 className="text-base font-semibold">Inviter une personne</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <label className="block text-sm font-medium">
            Son adresse e-mail
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@exemple.fr" className="mt-1" />
          </label>
          <label className="block text-sm font-medium">
            Plafond par mois
            <Input type="number" min={1} max={1000} required value={plafond} onChange={(e) => setPlafond(e.target.value)} className="mt-1" />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={trames} onChange={(e) => setTrames(e.target.checked)} className="size-4" />
          Lui ouvrir les trames maison publiées sur votre compte
        </label>
        <p className="text-xs text-muted-foreground">
          Elle reçoit un lien valable 7 jours, qui ne fonctionne qu’avec cette adresse. Pas de lien ouvert à tous : chaque
          génération payée a un nom.
        </p>
        <Button type="submit" loading={envoi}>
          <Send aria-hidden /> Envoyer l’invitation
        </Button>
        {lien ? <LienACopier email={lien.email} url={lien.url} /> : null}
      </form>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">Les personnes de votre enveloppe</h2>
        {vue.enveloppes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            Personne pour l’instant.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {vue.enveloppes.map((e) => (
              <Ligne
                key={e.id}
                e={e}
                occupe={occupe === e.id}
                onPlafond={(n) => agir(e.id, () => apiRequest(`/lex/enveloppes/${e.id}`, { method: "PATCH", body: { plafondMensuel: n } }), "Plafond modifié")}
                onTrames={(v) => agir(e.id, () => apiRequest(`/lex/enveloppes/${e.id}`, { method: "PATCH", body: { partageTrames: v } }), v ? "Trames ouvertes" : "Trames fermées")}
                onStatut={(s) => agir(e.id, () => apiRequest(`/lex/enveloppes/${e.id}`, { method: "PATCH", body: { statut: s } }), s === "ACTIVE" ? "Enveloppe reprise" : "Enveloppe suspendue")}
                onLien={async () => {
                  setOccupe(e.id);
                  try {
                    const r = await apiRequest<{ lien: string }>(`/lex/enveloppes/${e.id}/lien`, { method: "POST" });
                    setLien({ email: e.email, url: r.lien });
                    toast({ title: "Nouveau lien envoyé", variant: "success" });
                    await charger();
                  } catch (err) {
                    echec(err);
                  } finally {
                    setOccupe(null);
                  }
                }}
                onRetirer={() => {
                  if (!window.confirm(`Retirer ${e.nom ?? e.email} de votre enveloppe ? Ses prochaines générations se paieront sur son propre solde.`)) return;
                  void agir(e.id, () => apiRequest(`/lex/enveloppes/${e.id}`, { method: "DELETE" }), "Personne retirée");
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Chiffre({ titre, valeur, detail, alerte }: { titre: string; valeur: number; detail: string; alerte?: boolean }) {
  return (
    <div className={cn("rounded-xl border bg-card p-4", alerte ? "border-amber-500/50" : "border-border")}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titre}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{valeur.toLocaleString("fr-FR")}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function LienACopier({ email, url }: { email: string; url: string }) {
  const [copie, setCopie] = useState(false);
  return (
    <div className="space-y-2 rounded-lg bg-muted/50 p-3 text-sm">
      <p>
        Lien envoyé à <strong>{email}</strong>. Vous pouvez aussi le lui transmettre vous-même : il ne s’affichera plus
        ensuite.
      </p>
      <div className="flex gap-2">
        <Input readOnly value={url} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setCopie(true);
            } catch {
              /* le champ reste sélectionnable */
            }
          }}
        >
          {copie ? <Check aria-hidden /> : <Copy aria-hidden />} {copie ? "Copié" : "Copier"}
        </Button>
      </div>
    </div>
  );
}

function Ligne({
  e,
  occupe,
  onPlafond,
  onTrames,
  onStatut,
  onLien,
  onRetirer,
}: {
  e: Enveloppe;
  occupe: boolean;
  onPlafond: (n: number) => void;
  onTrames: (v: boolean) => void;
  onStatut: (s: "ACTIVE" | "SUSPENDUE") => void;
  onLien: () => void;
  onRetirer: () => void;
}) {
  const [plafond, setPlafond] = useState(String(e.plafondMensuel));
  const part = Math.min(100, Math.round((e.consommeCeMois / Math.max(1, e.plafondMensuel)) * 100));
  return (
    <li className="space-y-3 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{e.nom ?? e.email}</p>
          <p className="truncate text-xs text-muted-foreground">
            {e.nom ? `${e.email} · ` : ""}
            {LIBELLE[e.statut]}
            {e.statut === "INVITEE" && e.invitationExpireLe ? `, lien valable jusqu’au ${F_DATE.format(new Date(e.invitationExpireLe))}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            e.statut === "ACTIVE" ? "bg-success/15 text-success" : e.statut === "SUSPENDUE" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
          )}
        >
          {LIBELLE[e.statut]}
        </span>
      </div>
      {e.statut !== "INVITEE" ? (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>Ce mois-ci</span>
            <span>
              {e.consommeCeMois} / {e.plafondMensuel}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full", part >= 100 ? "bg-amber-500" : "bg-primary")} style={{ width: `${part}%` }} />
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm">
          Plafond
          <Input type="number" min={1} max={1000} value={plafond} onChange={(ev) => setPlafond(ev.target.value)} className="h-9 w-24" />
        </label>
        <Button size="sm" variant="outline" disabled={occupe || Number(plafond) === e.plafondMensuel || !Number(plafond)} onClick={() => onPlafond(Number(plafond))}>
          Enregistrer
        </Button>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <input type="checkbox" checked={e.partageTrames} disabled={occupe} onChange={(ev) => onTrames(ev.target.checked)} className="size-4" />
          Trames maison
        </label>
        <span className="flex-1" />
        {e.statut === "INVITEE" ? (
          <Button size="sm" variant="ghost" disabled={occupe} onClick={onLien}>
            <Link2 aria-hidden /> Nouveau lien
          </Button>
        ) : e.statut === "ACTIVE" ? (
          <Button size="sm" variant="ghost" disabled={occupe} onClick={() => onStatut("SUSPENDUE")}>
            <Pause aria-hidden /> Suspendre
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled={occupe} onClick={() => onStatut("ACTIVE")}>
            <Play aria-hidden /> Reprendre
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={occupe} onClick={onRetirer}>
          <Trash2 aria-hidden /> Retirer
        </Button>
      </div>
    </li>
  );
}
