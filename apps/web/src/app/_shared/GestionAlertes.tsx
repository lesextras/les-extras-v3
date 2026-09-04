"use client";

// Les alertes de recherche — création, activation, suppression.
//
// ⚠ POURQUOI CET ÉCRAN EXISTE. Un directeur cherche « médiation animale,
// Essonne », ne trouve rien, et il est perdu définitivement : personne ne
// revient vérifier un catalogue chaque semaine. Sur un catalogue jeune, c'est
// la seule mécanique qui empêche une visite sans résultat d'être une visite
// perdue.
//
// ⚠ LE NOMBRE DE FICHES DÉJÀ EN LIGNE EST ANNONCÉ À LA CRÉATION. Une alerte
// posée sur un critère qui rend déjà trente résultats n'est pas une alerte,
// c'est une recherche : mieux vaut le dire tout de suite que de laisser
// quelqu'un attendre un courriel qui n'apportera jamais rien de neuf.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BellRing, BellOff, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { DEPARTEMENTS, REGIONS, nomsDepartements } from "@/lib/territoires";
import { Field, Textarea } from "./form-fields";

export interface Alerte {
  id: string;
  type: string;
  departements: string[];
  categorie: string | null;
  publicVise: string | null;
  recherche: string | null;
  budgetMax: string | number | null;
  actif: boolean;
  signalees: number;
  dernierEnvoiAt: string | null;
  createdAt: string;
  resume: string;
}

const TYPES: { valeur: string; libelle: string }[] = [
  { valeur: "all", libelle: "Ateliers et formations" },
  { valeur: "atelier", libelle: "Ateliers seulement" },
  { valeur: "formation", libelle: "Formations seulement" },
];

/** Les critères pré-remplis depuis une recherche du catalogue restée vide. */
export interface CriteresInitiaux {
  recherche?: string;
  categorie?: string;
  publicVise?: string;
  departements?: string[];
  type?: string;
}

export function GestionAlertes({
  alertes,
  accountId,
  initiaux,
}: {
  alertes: Alerte[];
  accountId?: string;
  initiaux?: CriteresInitiaux;
}) {
  const router = useRouter();
  const { toast } = useToast();

  // Le formulaire s'ouvre tout seul quand on arrive depuis une recherche sans
  // résultat : la personne a déjà exprimé son besoin, lui redemander de cliquer
  // sur « Créer une alerte » lui fait refaire un geste qu'elle vient de faire.
  const prerempli = Boolean(
    initiaux?.recherche ||
      initiaux?.categorie ||
      initiaux?.publicVise ||
      initiaux?.departements?.length,
  );
  const [ouvert, setOuvert] = useState(prerempli || alertes.length === 0);
  const [recherche, setRecherche] = useState(initiaux?.recherche ?? "");
  const [categorie, setCategorie] = useState(initiaux?.categorie ?? "");
  const [publicVise, setPublicVise] = useState(initiaux?.publicVise ?? "");
  const [type, setType] = useState(initiaux?.type ?? "all");
  const [budget, setBudget] = useState("");
  const [territoires, setTerritoires] = useState<string[]>(initiaux?.departements ?? []);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);

  useEffect(() => {
    if (alertes.length === 0) setOuvert(true);
  }, [alertes.length]);

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    setErreur(null);
    try {
      const creee = await apiRequest<{ dejaLa: number; resume: string }>(
        "/community/alertes",
        {
          method: "POST",
          accountId,
          body: {
            type,
            departements: territoires,
            recherche: recherche.trim() || undefined,
            categorie: categorie.trim() || undefined,
            publicVise: publicVise.trim() || undefined,
            budgetMax: budget.trim() ? Number(budget) : undefined,
          },
        },
      );
      toast({
        title: "Alerte enregistrée",
        description:
          creee.dejaLa > 0
            ? `${creee.dejaLa} proposition${creee.dejaLa > 1 ? "s correspondent" : " correspond"} déjà à ces critères : allez les voir, l'alerte ne signalera que ce qui arrivera après aujourd'hui.`
            : "Rien ne correspond aujourd'hui. Vous recevrez un message dès qu'une proposition arrivera.",
      });
      setRecherche("");
      setCategorie("");
      setPublicVise("");
      setBudget("");
      setTerritoires([]);
      setOuvert(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L'enregistrement n'a pas abouti.");
    } finally {
      setEnvoi(false);
    }
  }

  async function basculer(a: Alerte) {
    setEnCours(a.id);
    try {
      await apiRequest(`/community/alertes/${a.id}`, { method: "PATCH", accountId });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnCours(null);
    }
  }

  async function supprimer(a: Alerte) {
    setEnCours(a.id);
    try {
      await apiRequest(`/community/alertes/${a.id}`, { method: "DELETE", accountId });
      router.refresh();
    } catch (err) {
      toast({
        title: "Suppression impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="space-y-6">
      {alertes.length > 0 ? (
        <div className="space-y-3">
          {alertes.map((a) => (
            <Card key={a.id} className={a.actif ? "" : "opacity-70"}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{a.resume}</p>
                    {!a.actif ? <Badge variant="outline">en pause</Badge> : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {TYPES.find((t) => t.valeur === a.type)?.libelle ??
                      "Ateliers et formations"}
                    {" · "}
                    {a.signalees > 0
                      ? `${a.signalees} proposition${a.signalees > 1 ? "s" : ""} signalée${a.signalees > 1 ? "s" : ""}`
                      : "rien signalé pour l'instant"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={enCours === a.id}
                    onClick={() => basculer(a)}
                  >
                    {a.actif ? (
                      <>
                        <BellOff className="mr-1.5 size-4" /> Mettre en pause
                      </>
                    ) : (
                      <>
                        <BellRing className="mr-1.5 size-4" /> Réactiver
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={enCours === a.id}
                    onClick={() => supprimer(a)}
                    aria-label="Supprimer cette alerte"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      {!ouvert ? (
        <Button onClick={() => setOuvert(true)} variant="outline">
          <Plus className="mr-1.5 size-4" /> Créer une alerte
        </Button>
      ) : (
        <form onSubmit={creer} className="space-y-5 rounded-xl border border-border bg-card p-6">
          <Field
            label="Ce que vous cherchez"
            hint="Un mot suffit : médiation animale, théâtre, estime de soi. Laissez vide pour être prévenu de toute nouveauté."
          >
            <Textarea
              rows={2}
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Ex : médiation animale"
            />
          </Field>

          <Field label="Rayon du catalogue">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
            >
              {TYPES.map((t) => (
                <option key={t.valeur} value={t.valeur}>
                  {t.libelle}
                </option>
              ))}
            </select>
          </Field>

          {/* ⚠ MÊME COMPOSITION QUE LA FICHE ATELIER : on ajoute par région ou à
              l'unité, et seuls les territoires retenus restent à l'écran. Une
              pastille par département, c'est cent une pastilles. */}
          <Field
            label="Où"
            hint="Rien de choisi = partout, France entière. C'est le bon réglage pour une intervention à distance."
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Ajouter une région entière"
                  value=""
                  onChange={(e) => {
                    const r = e.target.value;
                    if (!r) return;
                    const codes = DEPARTEMENTS.filter((d) => d.region === r).map((d) => d.code);
                    setTerritoires((liste) => [...new Set([...liste, ...codes])]);
                  }}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Ajouter une région entière…</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Ajouter un département"
                  value=""
                  onChange={(e) => {
                    const c = e.target.value;
                    if (!c) return;
                    setTerritoires((liste) => [...new Set([...liste, c])]);
                  }}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Ajouter un département…</option>
                  {REGIONS.map((r) => (
                    <optgroup key={r} label={r}>
                      {DEPARTEMENTS.filter((d) => d.region === r).map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code} · {d.nom}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {territoires.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => setTerritoires([])}
                    className="text-xs text-muted-foreground underline hover:text-foreground"
                  >
                    Tout enlever
                  </button>
                ) : null}
              </div>
              {territoires.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {nomsDepartements(territoires).map((nom, i) => (
                    <button
                      key={territoires[i]}
                      type="button"
                      onClick={() =>
                        setTerritoires((liste) => liste.filter((c) => c !== territoires[i]))
                      }
                      className="rounded-full border border-primary/40 bg-primary-soft px-3 py-1 text-xs text-foreground"
                    >
                      {nom} ✕
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Aucun territoire choisi : vous serez prévenu pour toute la France.
                </p>
              )}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Public concerné" hint="Facultatif.">
              <input
                value={publicVise}
                onChange={(e) => setPublicVise(e.target.value)}
                placeholder="Ex : Adolescents"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </Field>
            <Field label="Budget maximum" hint="Facultatif, en euros.">
              <input
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="Ex : 500"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </Field>
          </div>

          {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={envoi}>
              {envoi ? "Enregistrement…" : "Créer l'alerte"}
            </Button>
            {alertes.length > 0 ? (
              <Button type="button" variant="ghost" onClick={() => setOuvert(false)}>
                Annuler
              </Button>
            ) : null}
            <Link
              href="/ateliers"
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Voir le catalogue
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
