"use client";

// Modale « Publier un SOS Renfort » (ESTABLISHMENT).
// Flow SOS Renfort — étape 1 : création + publication de la mission.
// POST /missions  -> { visibility } pilote la diffusion en cascade côté API.
import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { FileUpload, type FichierDepose } from "../FileUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "../form-fields";

const CATEGORIES = [
  { value: "RENFORT", label: "Renfort" },
  { value: "REMPLACEMENT", label: "Remplacement" },
  { value: "ANALYSE_PRATIQUES", label: "Analyse des pratiques" },
  { value: "FORMATION", label: "Formation" },
];

const VISIBILITIES = [
  { value: "SALARIES", label: "Salariés d'abord (cascade)" },
  { value: "RESERVED", label: "Réseau réservé" },
  { value: "PUBLIC", label: "Public (marketplace)" },
];

/**
 * QUI reçoit l'offre. C'est le geste qui manquait le plus : un chef de service
 * qui a besoin de quelqu'un demain matin n'a pas envie de publier au monde
 * entier, il veut d'abord appeler les trois personnes qui connaissent la
 * maison. Tant que l'outil ne sait pas faire ça, il est court-circuité par le
 * téléphone — et il ne voit jamais passer les besoins qu'il aurait couverts.
 */
const CIBLES = [
  {
    value: "RESEAU",
    titre: "Tout le réseau, en cascade",
    aide: "Vos salariés d'abord, puis les intervenants que vous connaissez, puis la marketplace. La diffusion s'élargit toute seule tant que le besoin n'est pas couvert.",
  },
  {
    value: "CONNUS",
    titre: "Uniquement les personnes que je connais",
    aide: "Les intervenants déjà venus chez vous et ceux que vous avez retenus au vivier. L'offre ne sort pas de ce cercle et n'apparaît jamais sur la marketplace.",
  },
  {
    value: "UNITE",
    titre: "Uniquement les salariés d'un service",
    aide: "Le créneau n'est proposé qu'aux salariés rattachés au service que vous désignez. Rien ne sort de l'établissement.",
  },
  {
    value: "SELECTION",
    titre: "Uniquement les personnes que je choisis",
    aide: "Vous cochez nommément les salariés et les intervenants destinataires. Personne d'autre ne reçoit ni ne voit l'offre.",
  },
] as const;

/**
 * COMMENT la mission est attribuée. Les deux modèles ont leur usage — c'est
 * pourquoi les deux restent proposés, mission par mission.
 */
const MODES = [
  {
    value: "AUTOMATIQUE",
    titre: "Le premier qui accepte",
    aide: "Attribution immédiate, contrat émis dans la foulée. Le plus rapide : c'est ce qu'il faut pour un renfort de dernière minute.",
  },
  {
    value: "FILE_ENGAGEMENT",
    titre: "Je valide chaque profil",
    aide: "L'intervenant s'engage, son profil vous est présenté, vous acceptez ou vous refusez. En cas de refus, le suivant vous est présenté aussitôt. Comme vous gardez la main, l'offre est proposée à beaucoup plus de monde — vos chances de couvrir le besoin augmentent nettement.",
  },
] as const;

type MembreEquipe = {
  id: string;
  user?: { id: string; firstName?: string | null; lastName?: string | null; email?: string } | null;
  orgUnit?: { id: string; name: string } | null;
};
type IntervenantVivier = {
  accountId: string;
  prenom?: string | null;
  nomPersonne?: string | null;
  nom?: string | null;
  metier?: string | null;
  interventions?: number;
  retenu?: boolean;
};

/** Petite liste à cocher, pour désigner des destinataires nommément. */
function ListeCases({
  titre,
  vide,
  items,
  coches,
  onToggle,
}: {
  titre: string;
  vide: string;
  items: { id: string; label: string; detail: string | null }[];
  coches: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titre}
        {coches.length > 0 ? ` · ${coches.length} sélectionné(s)` : ""}
      </p>
      {items.length === 0 ? (
        <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">{vide}</p>
      ) : (
        <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
          {items.map((it) => (
            <label
              key={it.id}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/50"
            >
              <input
                type="checkbox"
                checked={coches.includes(it.id)}
                onChange={() => onToggle(it.id)}
                className="h-4 w-4 rounded border-input accent-primary"
              />
              <span className="text-foreground">{it.label}</span>
              {it.detail ? (
                <span className="text-xs text-muted-foreground">· {it.detail}</span>
              ) : null}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export function RenfortModal({
  accountId,
  trigger,
}: {
  accountId: string;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [piece, setPiece] = useState<FichierDepose | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("RENFORT");
  const [visibility, setVisibility] = useState("SALARIES");
  const [dbCats, setDbCats] = useState<{ id: string; title: string }[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [cible, setCible] = useState<string>("RESEAU");
  const [mode, setMode] = useState<string>("AUTOMATIQUE");
  const [unite, setUnite] = useState<string>("");
  const [equipe, setEquipe] = useState<MembreEquipe[]>([]);
  const [vivier, setVivier] = useState<IntervenantVivier[]>([]);
  const [salariesCoches, setSalariesCoches] = useState<string[]>([]);
  const [intervenantsCoches, setIntervenantsCoches] = useState<string[]>([]);
  const usingDb = dbCats.length > 0;

  function basculer(liste: string[], poser: (v: string[]) => void, id: string) {
    poser(liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]);
  }

  // La sélection nominative et le ciblage par service demandent des listes que
  // l'écran n'a pas besoin de charger tant qu'on ne les a pas choisis.
  useEffect(() => {
    if (!open || cible !== "SELECTION") return;
    if (equipe.length === 0) {
      apiRequest<{ items?: MembreEquipe[] }>("/memberships?perPage=100", { accountId })
        .then((r) => setEquipe(Array.isArray(r?.items) ? r.items : []))
        .catch(() => {});
    }
    if (vivier.length === 0) {
      apiRequest<{ items?: IntervenantVivier[] }>("/vivier", { accountId })
        .then((r) => setVivier(Array.isArray(r?.items) ? r.items : []))
        .catch(() => {});
    }
  }, [open, cible, accountId, equipe.length, vivier.length]);

  useEffect(() => {
    if (!open) return;
    apiRequest<{ id: string; title: string }[]>("/categories?type=mission", { accountId })
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) {
          setDbCats(rows);
          // Le bouton s'appelle « SOS Renfort » : la catégorie présélectionnée
          // doit être le renfort/remplacement, pas la première par ordre
          // alphabétique (« Analyse des pratiques ») — sinon une mission sur
          // deux partait mal catégorisée.
          const defaut =
            rows.find((r) => /renfort/i.test(r.title)) ??
            rows.find((r) => /remplacement/i.test(r.title)) ??
            rows[0];
          setCategory(defaut.id);
        }
      })
      .catch(() => {});
    apiRequest<{ id: string; name: string }[]>("/units", { accountId })
      .then((rows) => {
        if (Array.isArray(rows)) setUnits(rows);
      })
      .catch(() => {});
  }, [open, accountId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      title: String(fd.get("title") || ""),
      description: String(fd.get("description") || ""),
      ...(usingDb ? { categoryId: category } : { category }),
      job: String(fd.get("job") || "") || undefined,
      startDate: String(fd.get("startDate") || ""),
      endDate: String(fd.get("endDate") || "") || undefined,
      startTime: String(fd.get("startTime") || "") || undefined,
      endTime: String(fd.get("endTime") || "") || undefined,
      city: String(fd.get("city") || "") || undefined,
      postalCode: String(fd.get("postalCode") || "") || undefined,
      hourlyRate: fd.get("hourlyRate") ? Number(fd.get("hourlyRate")) : undefined,
      headcount: fd.get("headcount") ? Number(fd.get("headcount")) : 1,
      emergency: fd.get("emergency") === "on",
      attachmentUrl: String(fd.get("attachmentUrl") || "") || undefined,
      attachmentId: piece?.id,
      orgUnitId: (cible === "UNITE" ? unite : String(fd.get("orgUnitId") || "")) || undefined,
      recurrence: fd.get("recurrence") === "on" ? "HEBDO" : undefined,
      modeAttribution: mode,
      cibleDiffusion: cible,
      ...(cible === "SELECTION"
        ? {
            destinatairesSalaries: salariesCoches,
            destinatairesIntervenants: intervenantsCoches,
          }
        : {}),
    };
    try {
      const created = await apiRequest<{ id: string }>("/missions", { method: "POST", body, accountId });
      // Diffusion immédiate. Si elle échoue, on le DIT : une mission en
      // brouillon silencieux est le pire piège pour un besoin urgent.
      let publiee = false;
      let enValidation = false;
      if (created?.id) {
        try {
          const res = await apiRequest<{ attenteValidation?: boolean }>(
            `/missions/${created.id}/publish`,
            { method: "POST", accountId },
          );
          publiee = true;
          enValidation = Boolean(res?.attenteValidation);
        } catch {
          publiee = false;
        }
      }
      if (enValidation) {
        toast({
          title: "Envoyée pour validation",
          description:
            "Votre compte demande l'approbation d'un responsable avant diffusion : il vient d'être prévenu.",
        });
      } else if (publiee) {
        toast({
          title: "Renfort publié",
          description:
            cible === "RESEAU"
              ? mode === "FILE_ENGAGEMENT"
                ? "Votre demande est diffusée largement. Vous validerez chaque profil qui s'engage."
                : "Votre demande est diffusée. Vous serez notifié des candidatures."
              : "Votre demande est partie aux seules personnes désignées. Elle n'apparaîtra pas sur la marketplace.",
        });
      } else {
        toast({
          title: "Mission créée en brouillon",
          description:
            "La diffusion n'a pas pu se faire automatiquement. Ouvrez la mission dans SOS Renfort et cliquez sur « Publier ».",
          variant: "error",
        });
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publication impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>Publier un renfort</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publier un SOS Renfort</DialogTitle>
          <DialogDescription>
            Décrivez le besoin, puis choisissez qui le reçoit et comment la mission est
            attribuée.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Intitulé" htmlFor="title" required>
            <Input id="title" name="title" required placeholder="Éducateur spé — internat" />
          </Field>
          <Field label="Description" htmlFor="description" required>
            <Textarea
              id="description"
              name="description"
              required
              rows={4}
              placeholder="Contexte, public accueilli, missions attendues…"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Catégorie">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(usingDb
                    ? dbCats.map((c) => ({ value: c.id, label: c.title }))
                    : CATEGORIES
                  ).map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Métier recherché" htmlFor="job">
              <Input id="job" name="job" placeholder="Moniteur-éducateur, AES…" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Date de début" htmlFor="startDate" required>
              <Input id="startDate" name="startDate" type="date" required />
            </Field>
            <Field
              label="Date de fin"
              htmlFor="endDate"
              hint="Laissez vide si la date de fin n'est pas encore connue."
            >
              <Input id="endDate" name="endDate" type="date" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Heure début" htmlFor="startTime">
              <Input id="startTime" name="startTime" placeholder="09h00" />
            </Field>
            <Field label="Heure fin" htmlFor="endTime">
              <Input id="endTime" name="endTime" placeholder="17h00" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ville" htmlFor="city">
              <Input id="city" name="city" placeholder="Melun" />
            </Field>
            <Field label="Code postal" htmlFor="postalCode">
              <Input id="postalCode" name="postalCode" placeholder="77000" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Taux horaire (€)"
              htmlFor="hourlyRate"
              hint="Affiché aux intervenants comme rémunération de la mission."
            >
              <Input id="hourlyRate" name="hourlyRate" type="number" step="0.5" placeholder="24" />
            </Field>
            <Field
              label="Postes"
              htmlFor="headcount"
              hint="Nombre de personnes recherchées pour ce même besoin."
            >
              <Input id="headcount" name="headcount" type="number" min={1} defaultValue={1} />
            </Field>
          </div>
          {units.length > 0 && cible !== "UNITE" ? (
            <Field
              label="Unité / service concerné"
              htmlFor="orgUnitId"
              hint="Rattache la mission à un service, pour le filtrage interne."
            >
              <select
                id="orgUnitId"
                name="orgUnitId"
                defaultValue=""
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Toute la structure —</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          {/* ── Qui reçoit l'offre ─────────────────────────────────────── */}
          <fieldset className="space-y-2 rounded-xl border border-border p-4">
            <legend className="px-1 text-sm font-semibold text-foreground">
              Qui reçoit cette offre ?
            </legend>
            {CIBLES.map((c) => (
              <label
                key={c.value}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition ${
                  cible === c.value
                    ? "border-primary bg-primary-soft/40"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="cibleDiffusion"
                  value={c.value}
                  checked={cible === c.value}
                  onChange={() => setCible(c.value)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="font-medium text-foreground">{c.titre}</span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">
                    {c.aide}
                  </span>
                </span>
              </label>
            ))}

            {cible === "UNITE" ? (
              units.length > 0 ? (
                <Field label="Service concerné" htmlFor="uniteCible" required>
                  <select
                    id="uniteCible"
                    value={unite}
                    onChange={(e) => setUnite(e.target.value)}
                    required
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">— Choisir un service —</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ) : (
                <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                  Aucun service n&apos;est encore créé dans votre établissement. Créez-en un depuis
                  l&apos;écran Équipe pour pouvoir cibler un service précis.
                </p>
              )
            ) : null}

            {cible === "SELECTION" ? (
              <div className="space-y-3 pt-1">
                <ListeCases
                  titre="Salariés de l'établissement"
                  vide="Aucun salarié rattaché à ce compte pour l'instant."
                  items={equipe.map((m) => ({
                    id: m.user?.id ?? m.id,
                    label:
                      [m.user?.firstName, m.user?.lastName].filter(Boolean).join(" ") ||
                      m.user?.email ||
                      "Membre",
                    detail: m.orgUnit?.name ?? null,
                  }))}
                  coches={salariesCoches}
                  onToggle={(id) => basculer(salariesCoches, setSalariesCoches, id)}
                />
                <ListeCases
                  titre="Intervenants que vous connaissez"
                  vide="Votre vivier est vide : les intervenants apparaîtront ici après une première mission."
                  items={vivier.map((v) => ({
                    id: v.accountId,
                    label:
                      [v.prenom, v.nomPersonne].filter(Boolean).join(" ") ||
                      v.nom ||
                      "Intervenant",
                    detail:
                      [v.metier, v.interventions ? `${v.interventions} intervention(s)` : null]
                        .filter(Boolean)
                        .join(" · ") || null,
                  }))}
                  coches={intervenantsCoches}
                  onToggle={(id) => basculer(intervenantsCoches, setIntervenantsCoches, id)}
                />
                {salariesCoches.length + intervenantsCoches.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Cochez au moins une personne — sinon la mission repart en diffusion normale.
                  </p>
                ) : null}
              </div>
            ) : null}
          </fieldset>

          {/* ── Comment la mission est attribuée ───────────────────────── */}
          <fieldset className="space-y-2 rounded-xl border border-border p-4">
            <legend className="px-1 text-sm font-semibold text-foreground">
              Comment voulez-vous attribuer la mission ?
            </legend>
            {MODES.map((m) => (
              <label
                key={m.value}
                className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition ${
                  mode === m.value
                    ? "border-primary bg-primary-soft/40"
                    : "border-border hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="modeAttribution"
                  value={m.value}
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span>
                  <span className="font-medium text-foreground">{m.titre}</span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">
                    {m.aide}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <Field label="Pièce jointe" htmlFor="attachmentUrl">
            <div className="space-y-2">
              <FileUpload
                famille="mission"
                accountId={accountId}
                fichier={piece}
                onChange={(f) => setPiece(f)}
                label="Joindre un document"
                aide="Fiche de poste, planning, consignes · 10 Mo maximum"
              />
              <Input
                id="attachmentUrl"
                name="attachmentUrl"
                type="url"
                placeholder="…ou collez un lien vers un document existant"
              />
            </div>
          </Field>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <input type="checkbox" name="emergency" className="h-4 w-4 rounded border-input accent-primary" />
            <span>
              <span className="font-medium text-foreground">Mission urgente</span>
              <span className="block text-xs text-muted-foreground">
                À la publication, tous les freelances dont le profil correspond (métier, zone, disponibilité) sont notifiés par e-mail. Premier arrivé, premier servi.
              </span>
            </span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <input type="checkbox" name="recurrence" className="h-4 w-4 rounded border-input accent-primary" />
            <span>
              <span className="font-medium text-foreground">Répéter chaque semaine</span>
              <span className="block text-xs text-muted-foreground">
                L&apos;occurrence de la semaine suivante est créée et publiée automatiquement, jusqu&apos;à ce que vous décochiez la récurrence sur la mission en cours.
              </span>
            </span>
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Publication…" : "Publier le renfort"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
