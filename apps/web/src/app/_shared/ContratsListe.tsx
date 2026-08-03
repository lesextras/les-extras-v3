"use client";

// Liste des CDD du compte + création d'un brouillon.
//
// Le geste vendu tient en une phrase : la plateforme a trouvé la personne,
// l'établissement l'embauche lui-même en CDD, et l'outil calcule à sa place
// ce que personne ne calcule (période d'essai, précarité, carence, DPAE).
// La création ne demande donc que le strict nécessaire pour ouvrir un
// brouillon — tout le reste se complète sur la fiche, où la synthèse répond
// en direct.
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FilePlus2, FileText, AlertTriangle } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { EmptyState } from "./ui";
import { Field } from "./form-fields";
import { formatDate, fullName } from "./format";
import type { BadgeVariant } from "./format";
import {
  STATUT_LABEL,
  type Contrat,
  type MotifRecoursOption,
  type SalariePossible,
} from "./contrats-types";

function variante(statut: string): BadgeVariant {
  if (statut === "BROUILLON") return "outline";
  if (statut === "TERMINE") return "secondary";
  if (statut === "ROMPU") return "destructive";
  return "default";
}

export function ContratsListe({
  initialContrats,
  motifs,
  salaries,
}: {
  initialContrats: Contrat[];
  motifs: MotifRecoursOption[];
  salaries: SalariePossible[];
}) {
  const contrats = initialContrats;

  const enCours = useMemo(
    () => contrats.filter((c) => c.statut !== "TERMINE" && c.statut !== "ROMPU"),
    [contrats],
  );
  const clos = useMemo(
    () => contrats.filter((c) => c.statut === "TERMINE" || c.statut === "ROMPU"),
    [contrats],
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <NouveauContrat motifs={motifs} salaries={salaries} />
      </div>

      {contrats.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Aucun contrat pour l’instant"
          description="Quand vous embauchez quelqu’un en CDD — un remplacement, un renfort trouvé sur la plateforme — créez son contrat ici : les échéances et les montants se calculent tout seuls."
          action={<NouveauContrat motifs={motifs} salaries={salaries} />}
        />
      ) : (
        <div className="space-y-6">
          <Tableau titre="Contrats en cours" items={enCours} />
          {clos.length > 0 ? <Tableau titre="Contrats clos" items={clos} /> : null}
        </div>
      )}
    </div>
  );
}

function Tableau({ titre, items }: { titre: string; items: Contrat[] }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">{titre}</h2>
      <div className="space-y-2">
        {items.map((c) => (
          <Card key={c.id} className="transition-colors hover:border-primary/40">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/contrats/${c.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {fullName(c.user?.firstName, c.user?.lastName) || "Salarié à préciser"}
                  </Link>
                  <Badge variant={variante(c.statut)}>{STATUT_LABEL[c.statut] ?? c.statut}</Badge>
                  {c.statut === "BROUILLON" && c.emissible === false ? (
                    <Badge variant="warning" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />À compléter
                    </Badge>
                  ) : null}
                </div>
                <p className="truncate text-sm text-muted-foreground">
                  {c.poste ?? "Poste à préciser"} · du {formatDate(c.dateDebut)}
                  {c.dateFin ? ` au ${formatDate(c.dateFin)}` : " (terme imprécis)"}
                </p>
              </div>
              <Button asChild variant="outline" size="sm" className="shrink-0">
                <Link href={`/dashboard/contrats/${c.id}`}>Ouvrir</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function NouveauContrat({
  motifs,
  salaries,
}: {
  motifs: MotifRecoursOption[];
  salaries: SalariePossible[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [userId, setUserId] = useState("");
  const [motif, setMotif] = useState(motifs[0]?.code ?? "REMPLACEMENT_SALARIE_ABSENT");

  const motifChoisi = motifs.find((m) => m.code === motif);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    const f = new FormData(e.currentTarget);
    const dateDebut = String(f.get("dateDebut") ?? "");
    const dateFin = String(f.get("dateFin") ?? "");
    if (!userId) {
      setErreur("Choisissez la personne que vous embauchez.");
      return;
    }
    setLoading(true);
    try {
      const cree = (await apiRequest("/contrats", {
        method: "POST",
        body: {
          userId,
          motif,
          dateDebut: new Date(`${dateDebut}T00:00:00`).toISOString(),
          ...(dateFin ? { dateFin: new Date(`${dateFin}T00:00:00`).toISOString() } : {}),
          poste: String(f.get("poste") ?? "") || undefined,
        },
      })) as { contrat: { id: string } };
      toast({
        title: "Brouillon créé",
        description: "Complétez les mentions obligatoires, puis transmettez le contrat.",
      });
      setOpen(false);
      router.push(`/dashboard/contrats/${cree.contrat.id}`);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "La création a échoué.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FilePlus2 className="h-4 w-4" />
          Nouveau contrat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Embaucher en CDD</DialogTitle>
          <DialogDescription>
            Vous êtes l’employeur : le contrat est conclu entre votre établissement et la
            personne. L’outil calcule les échéances et vérifie les mentions obligatoires.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            label="Personne embauchée"
            required
            hint={
              salaries.length === 0
                ? "Aucune personne éligible pour l’instant : invitez-la dans votre équipe ou retenez sa candidature sur une mission."
                : "Votre pool interne, vos intervenants au planning et les candidatures que vous avez retenues."
            }
          >
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir…" />
              </SelectTrigger>
              <SelectContent>
                {salaries.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {fullName(s.firstName, s.lastName) || s.email} — {s.origine}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Motif de recours" required hint={motifChoisi?.aide}>
            <Select value={motif} onValueChange={setMotif}>
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Début" htmlFor="dateDebut" required>
              <Input id="dateDebut" name="dateDebut" type="date" required />
            </Field>
            <Field
              label="Fin"
              htmlFor="dateFin"
              hint="Laissez vide si le terme est imprécis (retour du salarié remplacé)."
            >
              <Input id="dateFin" name="dateFin" type="date" />
            </Field>
          </div>

          <Field label="Poste" htmlFor="poste" hint="Vous pourrez le préciser ensuite.">
            <Input id="poste" name="poste" placeholder="Éducateur spécialisé — internat" />
          </Field>

          {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={loading}>
              Créer le brouillon
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
