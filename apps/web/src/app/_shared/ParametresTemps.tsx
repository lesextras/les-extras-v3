"use client";

/**
 * LES RÈGLES DE TEMPS DE TRAVAIL DE L'ÉTABLISSEMENT.
 *
 * Cet écran existe parce qu'un logiciel de planning ne peut pas deviner ces
 * valeurs, et ne doit surtout pas les inventer.
 *
 * Dans le secteur social et médico-social, la seule majoration imposée par la
 * loi est celle du 1er mai. Le travail de nuit ouvre un repos compensateur
 * obligatoire, mais la compensation salariale n'est due que « le cas échéant »
 * (article L. 3122-8). Le travail du dimanche n'ouvre aucune majoration
 * légale : les établissements figurent nommément dans les dérogations
 * permanentes au repos dominical, et cette dérogation n'emporte pas de
 * contrepartie. Les dix fêtes légales autres que le 1er mai sont travaillables
 * sans majoration.
 *
 * Tout cela vient donc de la convention collective de la structure — CCN 51,
 * CCN 66, accords CHRS — ou de son accord d'entreprise. L'écran le dit à
 * chaque champ, plutôt que d'afficher un zéro qui passerait pour une panne.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field } from "./form-fields";

export interface Parametres {
  renseigne: boolean;
  convention: string | null;
  accordEntreprise: boolean;
  nuitDebutHeure: number;
  nuitFinHeure: number;
  nuitPct: number;
  dimanchePct: number;
  feriePct: number;
  cumulDimancheEtFerie: boolean;
  droitLocal: boolean;
  vendrediSaint: boolean;
  majorationHS1Pct: number;
  majorationHS2Pct: number;
  seuilBasculeHS: number;
  contingentAnnuel: number;
  seuilDeclenchementHS: number;
  limiteHebdoHaute: number | null;
  limiteHebdoBasse: number | null;
  delaiPrevenanceJours: number;
  congesTrimestrielsEducatif: number;
  congesTrimestrielsAutres: number;
}

function Bascule({
  libelle,
  aide,
  valeur,
  onChange,
}: {
  libelle: string;
  aide?: string;
  valeur: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={valeur}
      onClick={() => onChange(!valeur)}
      className="flex w-full items-start justify-between gap-4 rounded-lg border border-border p-3 text-left hover:border-primary/40"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{libelle}</span>
        {aide ? <span className="mt-0.5 block text-xs text-muted-foreground">{aide}</span> : null}
      </span>
      <span
        className={
          valeur
            ? "mt-0.5 h-5 w-9 shrink-0 rounded-full bg-primary p-0.5"
            : "mt-0.5 h-5 w-9 shrink-0 rounded-full bg-muted p-0.5"
        }
      >
        <span
          className={
            valeur
              ? "block h-4 w-4 translate-x-4 rounded-full bg-white transition-transform"
              : "block h-4 w-4 rounded-full bg-white transition-transform"
          }
        />
      </span>
    </button>
  );
}

export function ParametresTemps({
  initial,
  accountId,
  modifiable,
}: {
  initial: Parametres;
  accountId: string;
  /** Seules la direction et l'administration peuvent écrire : cela engage la paie. */
  modifiable: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [p, setP] = useState<Parametres>(initial);
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const set = <K extends keyof Parametres>(cle: K, v: Parametres[K]) =>
    setP((x) => ({ ...x, [cle]: v }));

  const nombre = (v: string, defaut = 0) => {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : defaut;
  };

  async function enregistrer() {
    setBusy(true);
    setErreur(null);
    try {
      await apiRequest("/parametres-temps", {
        method: "PUT",
        accountId,
        body: {
          convention: p.convention || undefined,
          accordEntreprise: p.accordEntreprise,
          nuitDebutHeure: p.nuitDebutHeure,
          nuitFinHeure: p.nuitFinHeure,
          nuitPct: p.nuitPct,
          dimanchePct: p.dimanchePct,
          feriePct: p.feriePct,
          cumulDimancheEtFerie: p.cumulDimancheEtFerie,
          droitLocal: p.droitLocal,
          vendrediSaint: p.vendrediSaint,
          majorationHS1Pct: p.majorationHS1Pct,
          majorationHS2Pct: p.majorationHS2Pct,
          seuilBasculeHS: p.seuilBasculeHS,
          contingentAnnuel: p.contingentAnnuel,
          seuilDeclenchementHS: p.seuilDeclenchementHS,
          limiteHebdoHaute: p.limiteHebdoHaute ?? undefined,
          limiteHebdoBasse: p.limiteHebdoBasse ?? undefined,
          delaiPrevenanceJours: p.delaiPrevenanceJours,
          congesTrimestrielsEducatif: p.congesTrimestrielsEducatif,
          congesTrimestrielsAutres: p.congesTrimestrielsAutres,
        },
      });
      toast({
        title: "Règles enregistrées",
        description: "Les chiffrages et les compteurs les appliquent immédiatement.",
      });
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Enregistrement impossible");
    } finally {
      setBusy(false);
    }
  }

  const zero = p.nuitPct === 0 && p.dimanchePct === 0 && p.feriePct === 0;

  return (
    <div className="space-y-6">
      {/* L'avertissement qui donne son sens à tout l'écran. Sans lui, un
          directeur qui voit des zéros croit à une panne du logiciel. */}
      <div className="rounded-xl border border-amber-300/40 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/5">
        <p className="text-sm font-medium text-foreground">
          Ces valeurs viennent de votre convention, pas de la loi.
        </p>
        <p className="mt-1 max-w-prose text-sm text-muted-foreground">
          Dans le médico-social, la seule majoration imposée par la loi est celle du 1er mai —
          l&apos;article L.&nbsp;3133-6 la fixe à 100&nbsp;%, et le logiciel l&apos;applique tout
          seul. Le travail de nuit ouvre un repos compensateur obligatoire, mais la compensation
          en argent n&apos;est due que « le cas échéant ». Le dimanche n&apos;ouvre aucune
          majoration légale : votre établissement bénéficie d&apos;une dérogation permanente au
          repos dominical, qui n&apos;emporte pas de contrepartie. Les dix autres jours fériés
          sont travaillables sans majoration.
        </p>
        <p className="mt-2 max-w-prose text-sm text-muted-foreground">
          Ouvrez votre convention — CCN 51, CCN 66, accords CHRS — ou votre accord
          d&apos;entreprise, et reportez ici ce qui y est écrit. Un zéro laissé en place est
          honnête ; un taux inventé par le logiciel ne le serait pas.
        </p>
      </div>

      {zero ? (
        <Badge variant="warning">
          Aucune majoration renseignée — les chiffrages ne comporteront que le 1er mai
        </Badge>
      ) : null}

      {/* --- Convention --- */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-foreground">Votre texte de référence</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field
            label="Convention appliquée"
            htmlFor="convention"
            hint="À titre documentaire : le logiciel n'en déduit aucune valeur, il se fie à ce que vous saisissez ci-dessous."
          >
            <Input
              id="convention"
              value={p.convention ?? ""}
              disabled={!modifiable}
              onChange={(e) => set("convention", e.target.value)}
              placeholder="CCN 66, CCN 51, accords CHRS…"
            />
          </Field>
          <Bascule
            libelle="Nous avons un accord d'entreprise ou d'établissement"
            aide="Quand il existe, c'est lui qui prime sur les valeurs supplétives du code du travail."
            valeur={p.accordEntreprise}
            onChange={(v) => modifiable && set("accordEntreprise", v)}
          />
        </CardContent>
      </Card>

      {/* --- Nuit --- */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-foreground">Travail de nuit</h3>
          <p className="text-xs text-muted-foreground">
            L&apos;accord de branche du 17 avril 2002 demande neuf heures continues à positionner
            dans l&apos;amplitude 21 h – 7 h. À défaut d&apos;accord, la loi retient 21 h – 6 h.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="La nuit commence à" htmlFor="nuitDebut" hint="Au plus tôt 21 h">
              <Input
                id="nuitDebut"
                type="number"
                min={21}
                max={23}
                disabled={!modifiable}
                value={p.nuitDebutHeure}
                onChange={(e) => set("nuitDebutHeure", nombre(e.target.value, 21))}
              />
            </Field>
            <Field label="Et s'achève à" htmlFor="nuitFin" hint="Au plus tard 7 h">
              <Input
                id="nuitFin"
                type="number"
                min={5}
                max={7}
                disabled={!modifiable}
                value={p.nuitFinHeure}
                onChange={(e) => set("nuitFinHeure", nombre(e.target.value, 6))}
              />
            </Field>
            <Field
              label="Majoration de nuit (%)"
              htmlFor="nuitPct"
              hint="Conventionnelle. Aucune n'est imposée par la loi."
            >
              <Input
                id="nuitPct"
                type="number"
                min={0}
                step="0.01"
                disabled={!modifiable}
                value={p.nuitPct}
                onChange={(e) => set("nuitPct", nombre(e.target.value))}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* --- Dimanche et fériés --- */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-foreground">Dimanche et jours fériés</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Majoration du dimanche (%)" htmlFor="dimanchePct">
              <Input
                id="dimanchePct"
                type="number"
                min={0}
                step="0.01"
                disabled={!modifiable}
                value={p.dimanchePct}
                onChange={(e) => set("dimanchePct", nombre(e.target.value))}
              />
            </Field>
            <Field
              label="Majoration des jours fériés (%)"
              htmlFor="feriePct"
              hint="Hors 1er mai, dont la majoration de 100 % est légale et appliquée automatiquement."
            >
              <Input
                id="feriePct"
                type="number"
                min={0}
                step="0.01"
                disabled={!modifiable}
                value={p.feriePct}
                onChange={(e) => set("feriePct", nombre(e.target.value))}
              />
            </Field>
          </div>
          <Bascule
            libelle="Cumuler dimanche et jour férié quand ils tombent le même jour"
            aide="La CCN 51 l'exclut expressément : « lorsqu'un jour férié tombe un dimanche il n'y a pas de cumul ». D'autres textes sont muets — vérifiez le vôtre."
            valeur={p.cumulDimancheEtFerie}
            onChange={(v) => modifiable && set("cumulDimancheEtFerie", v)}
          />
          <Bascule
            libelle="Nous relevons du droit local d'Alsace-Moselle"
            aide="Ajoute la Saint-Étienne le 26 décembre (Moselle, Bas-Rhin, Haut-Rhin)."
            valeur={p.droitLocal}
            onChange={(v) => modifiable && set("droitLocal", v)}
          />
          {p.droitLocal ? (
            <Bascule
              libelle="Notre commune a un temple protestant ou une église mixte"
              aide="Le Vendredi saint n'est pas départemental mais communal : l'article L. 3134-13 le réserve à ces communes. Un simple drapeau Alsace-Moselle serait faux."
              valeur={p.vendrediSaint}
              onChange={(v) => modifiable && set("vendrediSaint", v)}
            />
          ) : null}
        </CardContent>
      </Card>

      {/* --- Heures supplémentaires --- */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-foreground">Heures supplémentaires</h3>
          <p className="text-xs text-muted-foreground">
            Les valeurs proposées — 25 %, 50 %, 220 heures — ne sont pas d&apos;ordre public : ce
            sont celles qui s&apos;appliquent à défaut d&apos;accord. Un accord peut les modifier,
            sans jamais descendre sous 10 % (article L.&nbsp;3121-33).
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Premier taux (%)" htmlFor="hs1" hint="Plancher légal : 10 %">
            <Input
              id="hs1"
              type="number"
              min={10}
              step="0.01"
              disabled={!modifiable}
              value={p.majorationHS1Pct}
              onChange={(e) => set("majorationHS1Pct", nombre(e.target.value, 25))}
            />
          </Field>
          <Field label="Second taux (%)" htmlFor="hs2">
            <Input
              id="hs2"
              type="number"
              min={10}
              step="0.01"
              disabled={!modifiable}
              value={p.majorationHS2Pct}
              onChange={(e) => set("majorationHS2Pct", nombre(e.target.value, 50))}
            />
          </Field>
          <Field label="Bascule après (h)" htmlFor="bascule" hint="8 h à défaut d'accord">
            <Input
              id="bascule"
              type="number"
              min={0}
              disabled={!modifiable}
              value={p.seuilBasculeHS}
              onChange={(e) => set("seuilBasculeHS", nombre(e.target.value, 8))}
            />
          </Field>
          <Field label="Contingent annuel (h)" htmlFor="contingent" hint="220 h à défaut d'accord">
            <Input
              id="contingent"
              type="number"
              min={0}
              disabled={!modifiable}
              value={p.contingentAnnuel}
              onChange={(e) => set("contingentAnnuel", nombre(e.target.value, 220))}
            />
          </Field>
        </CardContent>
      </Card>

      {/* --- Annualisation --- */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-foreground">Annualisation</h3>
          <p className="max-w-prose text-xs text-muted-foreground">
            Attention à ne pas confondre deux nombres qui se ressemblent. Le{" "}
            <strong className="text-foreground">seuil de déclenchement</strong> décide à partir de
            combien d&apos;heures une heure devient supplémentaire : 1 607 h par défaut, et
            c&apos;est un plafond — un accord peut descendre en dessous, jamais monter au-dessus.
            Le <strong className="text-foreground">volume planifiable</strong>, lui, se calcule à
            partir du calendrier de chaque salarié, congés trimestriels déduits : un éducateur
            avec dix-huit jours de congés trimestriels tourne autour de 1 450 h, et il ne peut
            donc pas atteindre 1 607 h. Les confondre est l&apos;erreur la plus coûteuse de tout
            ce domaine.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field
              label="Seuil de déclenchement (h)"
              htmlFor="seuil"
              hint="Plafond légal : 1 607 h"
            >
              <Input
                id="seuil"
                type="number"
                min={1}
                max={1607}
                disabled={!modifiable}
                value={p.seuilDeclenchementHS}
                onChange={(e) => set("seuilDeclenchementHS", nombre(e.target.value, 1607))}
              />
            </Field>
            <Field
              label="Limite hebdo haute (h)"
              htmlFor="haute"
              hint="44 h dans l'accord de branche de 1999"
            >
              <Input
                id="haute"
                type="number"
                min={35}
                max={48}
                disabled={!modifiable}
                value={p.limiteHebdoHaute ?? ""}
                onChange={(e) =>
                  set("limiteHebdoHaute", e.target.value === "" ? null : nombre(e.target.value, 44))
                }
              />
            </Field>
            <Field label="Limite hebdo basse (h)" htmlFor="basse" hint="21 h dans le même accord">
              <Input
                id="basse"
                type="number"
                min={0}
                max={48}
                disabled={!modifiable}
                value={p.limiteHebdoBasse ?? ""}
                onChange={(e) =>
                  set("limiteHebdoBasse", e.target.value === "" ? null : nombre(e.target.value, 21))
                }
              />
            </Field>
            <Field
              label="Délai de prévenance (jours)"
              htmlFor="prevenance"
              hint="7 jours à défaut d'accord"
            >
              <Input
                id="prevenance"
                type="number"
                min={0}
                disabled={!modifiable}
                value={p.delaiPrevenanceJours}
                onChange={(e) => set("delaiPrevenanceJours", nombre(e.target.value, 7))}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Congés trimestriels — personnel éducatif (j/an)"
              htmlFor="ctEduc"
              hint="18 jours en CCN 66 (annexe 3, art. 6) et en CCN 51 pour les établissements accueillant des personnes handicapées."
            >
              <Input
                id="ctEduc"
                type="number"
                min={0}
                disabled={!modifiable}
                value={p.congesTrimestrielsEducatif}
                onChange={(e) => set("congesTrimestrielsEducatif", nombre(e.target.value))}
              />
            </Field>
            <Field
              label="Congés trimestriels — autres personnels (j/an)"
              htmlFor="ctAutres"
              hint="9 jours pour l'administratif en CCN 66, 9 jours en CHRS."
            >
              <Input
                id="ctAutres"
                type="number"
                min={0}
                disabled={!modifiable}
                value={p.congesTrimestrielsAutres}
                onChange={(e) => set("congesTrimestrielsAutres", nombre(e.target.value))}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}

      {modifiable ? (
        <div className="flex justify-end">
          <Button onClick={enregistrer} disabled={busy}>
            {busy ? "Enregistrement…" : "Enregistrer les règles"}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Ces règles engagent la paie de toute l&apos;équipe : seules la direction et
          l&apos;administration peuvent les modifier.
        </p>
      )}
    </div>
  );
}
