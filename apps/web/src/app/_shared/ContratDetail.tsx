"use client";

// Fiche d'un CDD : le formulaire à gauche, la synthèse à droite.
//
// La synthèse est le produit. Un directeur d'établissement sait embaucher ;
// ce qu'il ne fait pas, c'est recalculer à chaque contrat la période d'essai
// maximale, l'indemnité de précarité, le délai de carence avant de repourvoir
// le poste et la date limite de transmission. Ici, tout cela se met à jour
// pendant qu'il tape, et la transmission est refusée tant qu'une mention de
// l'article L. 1242-12 manque — parce qu'un CDD incomplet vaut CDI.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CircleAlert,
  Coins,
  Hourglass,
  Send,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest, ApiError } from "@/lib/api";
import { Field, Textarea } from "./form-fields";
import { formatDate, formatMoney, fullName } from "./format";
import {
  CAUSE_FIN_LABEL,
  STATUT_LABEL,
  type CauseFinContrat,
  type Contrat,
  type MentionManquante,
  type MotifRecoursOption,
  type SyntheseContrat,
} from "./contrats-types";

/** ISO → valeur d'un <input type="date"> (aaaa-mm-jj), sans décalage. */
function jourISO(v?: string | null): string {
  if (!v) return "";
  return new Date(v).toISOString().slice(0, 10);
}

export function ContratDetail({
  contrat: initial,
  synthese: syntheseInitiale,
  motifs,
}: {
  contrat: Contrat;
  synthese: SyntheseContrat;
  motifs: MotifRecoursOption[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [contrat, setContrat] = useState(initial);
  const [synthese, setSynthese] = useState(syntheseInitiale);
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [manquantes, setManquantes] = useState<MentionManquante[]>(
    syntheseInitiale.mentionsManquantes,
  );

  const modifiable = contrat.statut === "BROUILLON";
  const clos = contrat.statut === "TERMINE" || contrat.statut === "ROMPU";
  const motifChoisi = motifs.find((m) => m.code === contrat.motif);

  // État local du formulaire : une seule source, l'objet contrat lui-même.
  const set = useCallback(<K extends keyof Contrat>(champ: K, valeur: Contrat[K]) => {
    setContrat((c) => ({ ...c, [champ]: valeur }));
  }, []);

  async function enregistrer() {
    setErreur(null);
    setEnregistrement(true);
    try {
      const res = (await apiRequest(`/contrats/${contrat.id}`, {
        method: "PATCH",
        body: {
          motif: contrat.motif,
          salarieRemplaceNom: contrat.salarieRemplaceNom ?? undefined,
          salarieRemplaceQualification: contrat.salarieRemplaceQualification ?? undefined,
          dateDebut: new Date(`${jourISO(contrat.dateDebut)}T00:00:00`).toISOString(),
          dateFin: contrat.dateFin
            ? new Date(`${jourISO(contrat.dateFin)}T00:00:00`).toISOString()
            : undefined,
          dureeMinimaleJours: contrat.dureeMinimaleJours ?? undefined,
          poste: contrat.poste ?? undefined,
          qualification: contrat.qualification ?? undefined,
          posteARisques: contrat.posteARisques ?? undefined,
          conventionCollective: contrat.conventionCollective ?? undefined,
          remunerationBrute:
            contrat.remunerationBrute == null || contrat.remunerationBrute === ""
              ? undefined
              : Number(contrat.remunerationBrute),
          remunerationDetail: contrat.remunerationDetail ?? undefined,
          caisseRetraiteComplementaire: contrat.caisseRetraiteComplementaire ?? undefined,
          organismePrevoyance: contrat.organismePrevoyance ?? undefined,
        },
      })) as { contrat: Contrat; synthese: SyntheseContrat };
      setContrat((c) => ({ ...res.contrat, user: res.contrat.user ?? c.user }));
      setSynthese(res.synthese);
      setManquantes(res.synthese.mentionsManquantes);
      toast({ title: "Enregistré" });
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L’enregistrement a échoué.");
    } finally {
      setEnregistrement(false);
    }
  }

  async function transmettre() {
    setErreur(null);
    setEnregistrement(true);
    try {
      const res = (await apiRequest(`/contrats/${contrat.id}/transmettre`, {
        method: "POST",
      })) as { contrat: Contrat; synthese: SyntheseContrat };
      setContrat((c) => ({ ...res.contrat, user: res.contrat.user ?? c.user }));
      setSynthese(res.synthese);
      setManquantes([]);
      toast({
        title: "Contrat transmis",
        description:
          "Remettez-en un exemplaire signé au salarié dans les deux jours ouvrables suivant l’embauche.",
      });
      router.refresh();
    } catch (err) {
      const payload = err instanceof ApiError ? (err.payload as Record<string, unknown>) : null;
      const liste = payload?.manquantes as MentionManquante[] | undefined;
      if (payload?.code === "MENTIONS_OBLIGATOIRES" && liste?.length) {
        setManquantes(liste);
        setErreur(String(payload.message ?? ""));
      } else {
        setErreur(err instanceof Error ? err.message : "La transmission a échoué.");
      }
    } finally {
      setEnregistrement(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-2">
          <Link href="/dashboard/contrats">
            <ArrowLeft className="h-4 w-4" />
            Tous les contrats
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={clos ? "muted" : contrat.statut === "BROUILLON" ? "outline" : "default"}>
            {STATUT_LABEL[contrat.statut] ?? contrat.statut}
          </Badge>
          {modifiable ? (
            <>
              <Button variant="outline" onClick={enregistrer} loading={enregistrement}>
                Enregistrer
              </Button>
              <Button
                className="gap-2"
                onClick={transmettre}
                loading={enregistrement}
                disabled={!synthese.emissible}
                title={
                  synthese.emissible
                    ? undefined
                    : "Complétez les mentions obligatoires avant de transmettre."
                }
              >
                <Send className="h-4 w-4" />
                Transmettre au salarié
              </Button>
            </>
          ) : null}
          {!modifiable && !clos ? <ActionsSuivantes contrat={contrat} /> : null}
        </div>
      </div>

      {manquantes.length > 0 ? (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="space-y-3 p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-warning-foreground">
              <ShieldAlert className="h-4 w-4" />
              {manquantes.length === 1
                ? "Une mention obligatoire manque"
                : `${manquantes.length} mentions obligatoires manquent`}
            </p>
            <p className="text-sm text-muted-foreground">
              Un CDD auquel il manque la définition précise de son motif est réputé conclu pour
              une durée indéterminée. C’est la seule chose que cet outil refuse de laisser
              passer.
            </p>
            <ul className="space-y-1.5">
              {manquantes.map((m) => (
                <li key={m.champ} className="text-sm text-foreground">
                  {m.message}{" "}
                  <span className="text-xs text-muted-foreground">({m.article})</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Card>
          <CardContent className="space-y-5 p-5">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Salarié</p>
              <p className="font-medium text-foreground">
                {fullName(contrat.user?.firstName, contrat.user?.lastName) ||
                  contrat.user?.email ||
                  "—"}
              </p>
            </div>

            <Field label="Motif de recours" required hint={motifChoisi?.aide}>
              <Select
                value={contrat.motif}
                onValueChange={(v) => set("motif", v)}
                disabled={!modifiable}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {motifs.map((m) => (
                    <SelectItem key={m.code} value={m.code}>
                      {m.libelle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {motifChoisi?.exigeSalarieRemplace ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Personne remplacée" required>
                  <Input
                    value={contrat.salarieRemplaceNom ?? ""}
                    disabled={!modifiable}
                    onChange={(e) => set("salarieRemplaceNom", e.target.value)}
                    placeholder="Camille Roy"
                  />
                </Field>
                <Field label="Sa qualification" required>
                  <Input
                    value={contrat.salarieRemplaceQualification ?? ""}
                    disabled={!modifiable}
                    onChange={(e) => set("salarieRemplaceQualification", e.target.value)}
                    placeholder="Éducatrice spécialisée"
                  />
                </Field>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Début" required>
                <Input
                  type="date"
                  value={jourISO(contrat.dateDebut)}
                  disabled={!modifiable}
                  onChange={(e) => set("dateDebut", e.target.value)}
                />
              </Field>
              <Field label="Fin" hint="Vide = terme imprécis">
                <Input
                  type="date"
                  value={jourISO(contrat.dateFin)}
                  disabled={!modifiable}
                  onChange={(e) => set("dateFin", e.target.value || null)}
                />
              </Field>
              <Field label="Durée minimale (jours)" hint="Si le terme est imprécis">
                <Input
                  type="number"
                  min={1}
                  value={contrat.dureeMinimaleJours ?? ""}
                  disabled={!modifiable || !!contrat.dateFin}
                  onChange={(e) =>
                    set("dureeMinimaleJours", e.target.value ? Number(e.target.value) : null)
                  }
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Poste occupé" required>
                <Input
                  value={contrat.poste ?? ""}
                  disabled={!modifiable}
                  onChange={(e) => set("poste", e.target.value)}
                  placeholder="Éducateur spécialisé — internat"
                />
              </Field>
              <Field label="Qualification du salarié">
                <Input
                  value={contrat.qualification ?? ""}
                  disabled={!modifiable}
                  onChange={(e) => set("qualification", e.target.value)}
                  placeholder="Éducateur spécialisé"
                />
              </Field>
            </div>

            <Field
              label="Poste à risques particuliers"
              required
              hint="La réponse est obligatoire, même négative : elle conditionne la formation renforcée à la sécurité."
            >
              <Select
                value={contrat.posteARisques === null ? "" : contrat.posteARisques ? "oui" : "non"}
                onValueChange={(v) => set("posteARisques", v === "oui")}
                disabled={!modifiable}
              >
                <SelectTrigger>
                  <SelectValue placeholder="À renseigner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="non">Non</SelectItem>
                  <SelectItem value="oui">Oui — formation renforcée à la sécurité</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field label="Convention collective applicable" required>
              <Input
                value={contrat.conventionCollective ?? ""}
                disabled={!modifiable}
                onChange={(e) => set("conventionCollective", e.target.value)}
                placeholder="CCN 66"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Rémunération brute (€)" required hint="Primes comprises.">
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={contrat.remunerationBrute ?? ""}
                  disabled={!modifiable}
                  onChange={(e) => set("remunerationBrute", e.target.value)}
                />
              </Field>
              <Field label="Détail de la rémunération">
                <Input
                  value={contrat.remunerationDetail ?? ""}
                  disabled={!modifiable}
                  onChange={(e) => set("remunerationDetail", e.target.value)}
                  placeholder="Indemnité de sujétion, prime de dimanche…"
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Caisse de retraite complémentaire" required>
                <Input
                  value={contrat.caisseRetraiteComplementaire ?? ""}
                  disabled={!modifiable}
                  onChange={(e) => set("caisseRetraiteComplementaire", e.target.value)}
                  placeholder="AG2R La Mondiale"
                />
              </Field>
              <Field label="Organisme de prévoyance" required>
                <Input
                  value={contrat.organismePrevoyance ?? ""}
                  disabled={!modifiable}
                  onChange={(e) => set("organismePrevoyance", e.target.value)}
                  placeholder="Malakoff Humanis"
                />
              </Field>
            </div>

            {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
          </CardContent>
        </Card>

        <SyntheseCard contrat={contrat} synthese={synthese} />
      </div>
    </div>
  );
}

function Ligne({
  icone,
  libelle,
  valeur,
  aide,
}: {
  icone: React.ReactNode;
  libelle: string;
  valeur: React.ReactNode;
  aide?: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-muted-foreground">{icone}</div>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm text-muted-foreground">{libelle}</p>
        <p className="text-sm font-medium text-foreground">{valeur}</p>
        {aide ? <p className="text-xs text-muted-foreground">{aide}</p> : null}
      </div>
    </div>
  );
}

function SyntheseCard({
  contrat,
  synthese,
}: {
  contrat: Contrat;
  synthese: SyntheseContrat;
}) {
  const indemnite = synthese.indemniteFinDeContrat;
  return (
    <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <Card>
        <CardContent className="space-y-4 p-5">
          <p className="text-sm font-medium text-foreground">Ce que ce contrat implique</p>

          <Ligne
            icone={<CalendarClock className="h-4 w-4" />}
            libelle="Durée"
            valeur={
              synthese.dureeJours > 0
                ? `${synthese.dureeJours} jours`
                : "À définir (fin ou durée minimale)"
            }
            aide={synthese.termePrecis ? "Terme précis." : "Terme imprécis : durée minimale."}
          />
          <Ligne
            icone={<Timer className="h-4 w-4" />}
            libelle="Période d’essai maximale"
            valeur={`${synthese.periodeEssaiMaxJours} jours`}
            aide="Un jour par semaine de contrat, plafonné (art. L. 1242-10)."
          />
          <Ligne
            icone={<Coins className="h-4 w-4" />}
            libelle="Indemnité de fin de contrat"
            valeur={indemnite.due ? formatMoney(indemnite.montant) : "Non due"}
            aide={indemnite.due ? "10 % du brut versé (art. L. 1243-8)." : indemnite.motif}
          />
          <Ligne
            icone={<Hourglass className="h-4 w-4" />}
            libelle="Carence avant de repourvoir le poste"
            valeur={`${synthese.carenceApres.jours} jours d’ouverture`}
            aide="Jours d’ouverture de l’établissement, pas jours calendaires."
          />
          <Ligne
            icone={<Send className="h-4 w-4" />}
            libelle="À transmettre au plus tard le"
            valeur={formatDate(synthese.limiteTransmission)}
            aide="Deux jours ouvrables après l’embauche (art. L. 1242-13)."
          />
          <Ligne
            icone={<BadgeCheck className="h-4 w-4" />}
            libelle="DPAE"
            valeur={
              contrat.dpaeEffectueeLe
                ? `Déclarée le ${formatDate(contrat.dpaeEffectueeLe)}`
                : "À déclarer"
            }
            aide={`Possible à partir du ${formatDate(synthese.dpaeAuPlusTot)}, au plus tard avant l’embauche.`}
          />
        </CardContent>
      </Card>

      <Card className="border-muted bg-muted/40">
        <CardContent className="flex gap-3 p-4">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {synthese.avertissement}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/** Après transmission : déclarer la DPAE, puis clore le contrat. */
function ActionsSuivantes({ contrat }: { contrat: Contrat }) {
  return (
    <div className="flex items-center gap-2">
      <DpaeDialog contrat={contrat} />
      <TerminerDialog contrat={contrat} />
    </div>
  );
}

function DpaeDialog({ contrat }: { contrat: Contrat }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    const f = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await apiRequest(`/contrats/${contrat.id}/dpae`, {
        method: "POST",
        body: {
          effectueeLe: new Date(`${String(f.get("effectueeLe"))}T00:00:00`).toISOString(),
          reference: String(f.get("reference") ?? "") || undefined,
        },
      });
      toast({ title: "DPAE enregistrée" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "L’enregistrement a échoué.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {contrat.dpaeEffectueeLe ? "Modifier la DPAE" : "Déclarer la DPAE"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Déclaration préalable à l’embauche</DialogTitle>
          <DialogDescription>
            Faite sur net-entreprises.fr, au plus tôt huit jours avant l’embauche et
            obligatoirement avant. Notez ici sa date et sa référence pour garder la trace.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Date de la déclaration" htmlFor="effectueeLe" required>
            <Input
              id="effectueeLe"
              name="effectueeLe"
              type="date"
              required
              defaultValue={jourISO(contrat.dpaeEffectueeLe)}
            />
          </Field>
          <Field label="Référence" htmlFor="reference" hint="Le numéro donné par l’URSSAF.">
            <Input id="reference" name="reference" defaultValue={contrat.dpaeReference ?? ""} />
          </Field>
          {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              Enregistrer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TerminerDialog({ contrat }: { contrat: Contrat }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [cause, setCause] = useState<CauseFinContrat>("TERME_NORMAL");
  const [brut, setBrut] = useState<string>(
    contrat.remunerationBrute == null ? "" : String(contrat.remunerationBrute),
  );

  // L'établissement voit le montant AVANT de valider : c'est la question qu'il
  // se pose au moment de clore, pas après.
  const apercu = useMemo(() => {
    const base = Number(brut || 0);
    return cause === "TERME_NORMAL" ? Math.round(base * 10) / 100 : 0;
  }, [brut, cause]);

  async function valider() {
    setErreur(null);
    setLoading(true);
    try {
      await apiRequest(`/contrats/${contrat.id}/terminer`, {
        method: "POST",
        body: {
          cause,
          ...(brut ? { remunerationBruteTotale: Number(brut) } : {}),
        },
      });
      toast({ title: "Contrat clos" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "La clôture a échoué.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Clore le contrat</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Clore le contrat</DialogTitle>
          <DialogDescription>
            La cause décide de l’indemnité de fin de contrat : elle n’est pas due si le salarié
            refuse un CDI, rompt lui-même, commet une faute grave, ou en cas de force majeure.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Cause de la fin" required>
            <Select value={cause} onValueChange={(v) => setCause(v as CauseFinContrat)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CAUSE_FIN_LABEL) as CauseFinContrat[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CAUSE_FIN_LABEL[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field
            label="Rémunération brute totale versée (€)"
            hint="Base de calcul de l’indemnité de précarité."
          >
            <Input
              type="number"
              min={0}
              step="0.01"
              value={brut}
              onChange={(e) => setBrut(e.target.value)}
            />
          </Field>
          <div className="rounded-md border border-border bg-muted/40 p-3">
            <p className="text-sm text-foreground">
              Indemnité de fin de contrat : <strong>{formatMoney(apercu)}</strong>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {cause === "TERME_NORMAL"
                ? "10 % de la rémunération brute totale (art. L. 1243-8)."
                : "Non due dans ce cas (art. L. 1243-10)."}
            </p>
          </div>
          {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={valider} loading={loading}>
              Clore le contrat
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
