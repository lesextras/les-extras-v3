"use client";

// Comptes / Organisations (back-office ADMIN) — liste + édition des fiches.
//   GET /admin/accounts · PATCH /admin/accounts/:id
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { EmptyState } from "./ui";
import { formatDate } from "./format";

/**
 * L'échéance, calculée à l'identique de `common/suppression-compte.ts` côté
 * serveur : trois mois de calendrier, avec le dernier jour du mois quand le
 * quantième n'existe pas (31 novembre).
 *
 * ⚠ CE CALCUL NE FAIT PAS FOI, c'est le serveur qui pose la date. Il ne sert
 * qu'à annoncer l'échéance AVANT le clic — sans elle, « trois mois » oblige la
 * personne à faire le calcul elle-même au moment de décider.
 */
function dansTroisMois(depuis = new Date()): Date {
  const cible = new Date(depuis.getTime());
  const jour = cible.getDate();
  cible.setDate(1);
  cible.setMonth(cible.getMonth() + 3);
  const dernier = new Date(cible.getFullYear(), cible.getMonth() + 1, 0).getDate();
  cible.setDate(Math.min(jour, dernier));
  return cible;
}

const dateFr = (d: Date) => formatDate(d);

export interface AdminMembership {
  id: string;
  role: "OWNER" | "ADMIN" | "MANAGER" | "MEMBER";
  status?: string;
  user?: { id: string; email?: string | null; firstName?: string | null; lastName?: string | null } | null;
}

export interface AdminAccount {
  id: string;
  name: string;
  type: "ESTABLISHMENT" | "FREELANCE";
  legalName?: string | null;
  siret?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  credits?: number;
  /** Accès LEX illimité accordé à la main (exonération de crédits). */
  isMember?: boolean;
  /**
   * Archivé : le compte existe, il ne se voit plus. Non nul = date à laquelle
   * il a quitté les recherches, l'annuaire, la vitrine et la marketplace.
   */
  archivedAt?: string | null;
  /** Date de la suppression réelle. Nulle = aucune suppression programmée. */
  suppressionPrevueLe?: string | null;
  /** Ce qui a empêché le planificateur de supprimer, écrit par lui. */
  suppressionMotifBlocage?: string | null;
  owner?: { email?: string; firstName?: string | null; lastName?: string | null } | null;
  memberships?: AdminMembership[];
  _count?: { memberships?: number; reliefMissions?: number; services?: number; bookings?: number };
}

const TYPE_OPTIONS = [
  { value: "", label: "Tous les types" },
  { value: "ESTABLISHMENT", label: "Établissements" },
  { value: "FREELANCE", label: "Freelances" },
];

const ACCOUNT_ROLE_LABEL: Record<string, string> = {
  OWNER: "Direction",
  ADMIN: "Administrateur",
  MANAGER: "Responsable de service",
  MEMBER: "Salarié",
};

function memberName(m: AdminMembership) {
  const n = [m.user?.firstName, m.user?.lastName].filter(Boolean).join(" ");
  return n || m.user?.email || ", ";
}

export function AdminAccountsTable({ accounts }: { accounts: AdminAccount[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<AdminAccount>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totalSubAccounts = useMemo(
    () => accounts.reduce((sum, a) => sum + (a.memberships?.length ?? a._count?.memberships ?? 0), 0),
    [accounts],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return accounts.filter((a) => {
      if (type && a.type !== type) return false;
      if (!needle) return true;
      const members = (a.memberships ?? [])
        .map((m) => `${memberName(m)} ${m.user?.email ?? ""}`)
        .join(" ");
      const hay = `${a.name} ${a.city ?? ""} ${a.siret ?? ""} ${a.owner?.email ?? ""} ${members}`.toLowerCase();
      return hay.includes(needle);
    });
  }, [accounts, q, type]);

  function startEdit(a: AdminAccount) {
    setEditing(a.id);
    setForm({
      name: a.name,
      legalName: a.legalName ?? "",
      siret: a.siret ?? "",
      city: a.city ?? "",
      postalCode: a.postalCode ?? "",
      phone: a.phone ?? "",
      credits: a.credits ?? 0,
    });
  }

  /**
   * ARCHIVER / RÉTABLIR.
   *
   * Archiver répond à « je ne veux plus voir ce compte » : il quitte les
   * recherches, l'annuaire, la vitrine et la place de marché, rien n'est
   * détruit, et ça se défait d'un clic. Sans échéance : un compte simplement
   * archivé reste indéfiniment — c'est le cas des comptes de test et des
   * doublons.
   *
   * ⚠⚠ RÉTABLIR ANNULE AUSSI LA SUPPRESSION PROGRAMMÉE, et le message doit le
   * dire quand il y en avait une. Quelqu'un qui rétablit un compte sans le
   * savoir croirait l'avoir sauvé et le perdrait quand même à l'échéance ;
   * l'inverse — croire qu'il reste condamné — fait recommencer la manœuvre.
   */
  async function basculerArchive(a: AdminAccount) {
    const archive = !a.archivedAt;
    const avaitEcheance = Boolean(a.suppressionPrevueLe);
    setBusy(a.id);
    try {
      await apiRequest(`/admin/accounts/${a.id}/archiver`, {
        method: "PATCH",
        body: { archive },
      });
      toast({
        title: archive ? `« ${a.name} » archivé` : `« ${a.name} » rétabli`,
        description: archive
          ? "Il ne s’affiche plus dans les recherches ni sur le site public. Rien n’est supprimé."
          : avaitEcheance
            ? "Il réapparaît partout, et sa suppression programmée est annulée."
            : "Il réapparaît dans les recherches et sur le site public.",
        variant: "success",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(null);
    }
  }

  /**
   * SUPPRIMER, C'EST ARCHIVER TROIS MOIS — décision de Siham, 16/09/2026.
   *
   * ⚠⚠ RIEN N'EST DÉTRUIT AU MOMENT DU CLIC, et l'avertissement doit le dire.
   * Il annonçait une destruction immédiate en cascade, factures comprises : la
   * phrase était exacte à l'époque, elle serait fausse aujourd'hui — et un
   * avertissement plus effrayant que la réalité fait renoncer à un geste devenu
   * sûr, ou pire, cesser d'être lu.
   *
   * ⚠ LA DATE EST ANNONCÉE AVANT LE CLIC. « Trois mois » sans date oblige à
   * faire le calcul soi-même, et c'est exactement l'information dont on a
   * besoin pour décider : jusqu'à quand peut-on revenir en arrière.
   */
  async function remove(a: AdminAccount) {
    const echeance = dateFr(dansTroisMois());
    if (
      !window.confirm(
        `Supprimer « ${a.name} » ?\n\n` +
          `Le compte est archivé immédiatement : il disparaît des recherches, de l’annuaire, de la vitrine et de la place de marché. ` +
          `Rien n’est détruit aujourd’hui.\n\n` +
          `Sa suppression réelle est programmée au ${echeance}. Jusque-là, « Rétablir » annule tout et le compte revient comme il était.\n\n` +
          `S’il a émis une facture ou signé un contrat de travail, il ne sera pas supprimé à cette date : la loi impose de les conserver. L’écran vous dira alors pourquoi.`,
      )
    )
      return;
    setBusy(a.id);
    try {
      /*
        ⚠ LE SERVEUR RÉPOND MAINTENANT AVEC LE MOTIF DE BLOCAGE, s'il y en a un
        (21/09/2026). Avant, il ne se découvrait qu'à l'échéance : on annonçait
        une date de suppression pendant trois mois à quelqu'un qui ne reviendrait
        pas regarder, et le compte n'était finalement jamais supprimé. Le dire
        ici, c'est le dire à la personne qui vient de décider.

        Ce n'est PAS un échec : le compte est archivé dans les deux cas, donc
        rangé, ce qui était la demande. Le message dit ce qui a eu lieu et ce
        qui n'aura pas lieu, sans transformer un geste réussi en erreur.
      */
      const r = (await apiRequest(`/admin/accounts/${a.id}`, {
        method: "DELETE",
      })) as { suppressionMotifBlocage?: string | null } | undefined;
      toast({
        title: `« ${a.name} » archivé`,
        description: r?.suppressionMotifBlocage
          ? `${r.suppressionMotifBlocage} Il restera archivé, donc invisible partout.`
          : `Suppression programmée le ${echeance}. Vous pouvez le rétablir jusque-là.`,
        variant: r?.suppressionMotifBlocage ? "warning" : "success",
      });
      router.refresh();
    } catch (err) {
      toast({ title: "Action impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  /**
   * Accorde ou retire l'accès LEX ILLIMITÉ (exonération de crédits) — pour
   * les comptes partenaires, les tests, les gestes commerciaux. La route
   * existait côté API sans aucun bouton pour l'appeler.
   */
  async function basculerLexIllimite(a: AdminAccount) {
    // Accorder un accès illimité est un geste commercial qui a un coût réel :
    // un clic de confirmation évite l'exonération accidentelle.
    const question = a.isMember
      ? `Retirer l'accès LEX illimité de « ${a.name} » ? Le compte repassera sur ses crédits.`
      : `Accorder l'accès LEX illimité à « ${a.name} » ? Ce compte utilisera LEX sans consommer de crédits.`;
    if (!window.confirm(question)) return;
    setBusy(a.id);
    try {
      await apiRequest(`/admin/accounts/${a.id}/adhesion`, {
        method: "PATCH",
        body: { isMember: !a.isMember },
      });
      toast({
        title: a.isMember ? "Accès LEX illimité retiré" : "Accès LEX illimité accordé",
        description: a.name,
      });
      router.refresh();
    } catch (err) {
      toast({ title: "Bascule impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  async function save(id: string) {
    setBusy(id);
    try {
      await apiRequest(`/admin/accounts/${id}`, {
        method: "PATCH",
        body: {
          name: form.name,
          legalName: form.legalName,
          siret: form.siret,
          city: form.city,
          postalCode: form.postalCode,
          phone: form.phone,
          credits: typeof form.credits === "number" ? form.credits : Number(form.credits) || 0,
        },
      });
      toast({ title: "Fiche mise à jour" });
      setEditing(null);
      router.refresh();
    } catch (err) {
      toast({ title: "Enregistrement impossible", description: err instanceof Error ? err.message : undefined, variant: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un compte, une ville, un SIRET…" className="flex-1" />
        <Select value={type || "__all"} onValueChange={(v) => setType(v === "__all" ? "" : v)}>
          <SelectTrigger className="sm:w-[200px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value || "__all"}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-sm">
        <p className="text-muted-foreground">
          <span className="font-semibold text-foreground">{filtered.length}</span> compte(s) ·{" "}
          <span className="font-semibold text-foreground">{totalSubAccounts}</span> sous-compte(s) rattaché(s)
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(new Set(filtered.map((a) => a.id)))}
          >
            Tout déplier
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setExpanded(new Set())}>
            Tout replier
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun compte" description="Aucun compte ne correspond à votre recherche." />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                {editing === a.id ? (
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom" />
                      <Input value={form.legalName ?? ""} onChange={(e) => setForm({ ...form, legalName: e.target.value })} placeholder="Raison sociale" />
                      <Input value={form.siret ?? ""} onChange={(e) => setForm({ ...form, siret: e.target.value })} placeholder="SIRET" />
                      <Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Ville" />
                      <Input value={form.postalCode ?? ""} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} placeholder="Code postal" />
                      <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Téléphone" />
                      <Input type="number" value={String(form.credits ?? 0)} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} placeholder="Crédits" />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" disabled={busy === a.id} onClick={() => save(a.id)}>{busy === a.id ? "…" : "Enregistrer"}</Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>Annuler</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-2">
                        <button
                          type="button"
                          onClick={() => toggle(a.id)}
                          aria-label={expanded.has(a.id) ? "Replier les sous-comptes" : "Déplier les sous-comptes"}
                          className="mt-0.5 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                        >
                          {expanded.has(a.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">{a.name}</p>
                            <Badge variant={a.type === "ESTABLISHMENT" ? "default" : "outline"}>
                              {a.type === "ESTABLISHMENT" ? "Établissement" : "Freelance"}
                            </Badge>
                            <Badge variant="muted" className="gap-1">
                              <Users className="h-3 w-3" />
                              {(a.memberships?.length ?? a._count?.memberships ?? 0)} sous-compte(s)
                            </Badge>
                            {/* Un compte archivé doit se voir dans la liste,
                                sinon on le cherche sur le site sans comprendre
                                pourquoi il n'y est plus. */}
                            {a.archivedAt ? (
                              <Badge variant="outline" className="border-secondary/50 text-secondary">
                                Archivé
                              </Badge>
                            ) : null}
                            {/*
                              ⚠ L'ÉCHÉANCE SE VOIT DANS LA LISTE, PAS AILLEURS.
                              Un compte qui va être détruit dans trois mois et un
                              compte simplement rangé se ressemblent trait pour
                              trait : sans cette pastille, on ne distingue pas
                              celui qu'il faut rétablir avant qu'il ne soit trop
                              tard de celui qu'on a volontairement mis de côté.
                            */}
                            {a.suppressionPrevueLe && !a.suppressionMotifBlocage ? (
                              <Badge variant="outline" className="border-destructive/50 text-destructive">
                                Suppression le {formatDate(a.suppressionPrevueLe)}
                              </Badge>
                            ) : null}
                            {/* Le planificateur a refusé : on affiche SA phrase,
                                pas une reformulation. C'est elle qui dit ce que
                                la loi impose de garder. */}
                            {a.suppressionMotifBlocage ? (
                              <Badge variant="outline" className="border-warning/50 text-warning" title={a.suppressionMotifBlocage}>
                                Suppression bloquée
                              </Badge>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {[a.city, a.owner?.email].filter(Boolean).join(" · ") || ", "}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {a._count?.reliefMissions ?? 0} mission(s) · {a._count?.services ?? 0} atelier(s) ·{" "}
                            {a.isMember ? "LEX illimité" : `${a.credits ?? 0} crédit(s) LEX`}
                          </p>
                          {/*
                            ⚠ LA PHRASE DU PLANIFICATEUR, EN ENTIER ET TELLE
                            QUELLE. Une pastille « Suppression bloquée » sans son
                            motif laisse croire à une panne, et quelqu'un
                            finirait par chercher comment forcer. Ce qu'elle dit
                            — trois factures émises, un contrat de travail — est
                            précisément ce que la loi impose de garder.
                          */}
                          {a.suppressionMotifBlocage ? (
                            <p className="mt-1.5 rounded-md border border-warning/40 bg-warning/5 px-2.5 py-1.5 text-xs leading-relaxed text-warning">
                              {a.suppressionMotifBlocage}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={`/admin/etablissements/${a.id}`}>Fiche</a>
                        </Button>
                        <Button
                          size="sm"
                          variant={a.isMember ? "primary" : "outline"}
                          disabled={busy === a.id}
                          title={
                            a.isMember
                              ? "Ce compte utilise LEX sans consommer de crédits, cliquer pour retirer"
                              : "Exonérer ce compte de crédits LEX (partenaire, test), cliquer pour accorder"
                          }
                          onClick={() => basculerLexIllimite(a)}
                        >
                          {a.isMember ? "Retirer LEX illimité" : "Accorder LEX illimité"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => startEdit(a)}>Éditer</Button>
                        {/*
                          ⚠ ARCHIVER EST PLACÉ AVANT SUPPRIMER, ET C'EST
                          VOLONTAIRE : c'est la réponse à « je ne veux plus voir
                          ce compte » dans presque tous les cas, et elle ne
                          détruit rien.
                        */}
                        <Button
                          size="sm"
                          variant={a.archivedAt ? "primary" : "outline"}
                          disabled={busy === a.id}
                          title={
                            a.archivedAt
                              ? "Ce compte est retiré des recherches et du site public, cliquer pour le rétablir"
                              : "Le retirer des recherches et du site public, sans rien supprimer"
                          }
                          onClick={() => basculerArchive(a)}
                        >
                          {a.archivedAt ? "Rétablir" : "Archiver"}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={busy === a.id} onClick={() => remove(a)}>Supprimer</Button>
                      </div>
                    </div>

                    {expanded.has(a.id) ? (
                      <div className="ml-8 rounded-lg border border-border bg-muted/30 p-3">
                        {(a.memberships?.length ?? 0) === 0 ? (
                          <p className="py-2 text-center text-xs text-muted-foreground">
                            Aucun sous-compte rattaché à ce compte.
                          </p>
                        ) : (
                          <ul className="divide-y divide-border">
                            {a.memberships!.map((m) => (
                              <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-foreground">{memberName(m)}</p>
                                  <p className="truncate text-xs text-muted-foreground">{m.user?.email}</p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <Badge variant={m.role === "OWNER" ? "soft" : "muted"}>
                                    {ACCOUNT_ROLE_LABEL[m.role] ?? m.role}
                                  </Badge>
                                  {m.status && m.status !== "ACTIVE" ? (
                                    <Badge variant="outline">{m.status}</Badge>
                                  ) : null}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
