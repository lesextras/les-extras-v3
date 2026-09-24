"use client";

// Modale « Publier un RenforTeam » (ESTABLISHMENT).
// Flow RenforTeam — étape 1 : création + publication de la mission.
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
import { lancerConfettis } from "@/lib/confetti";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "../form-fields";

const CATEGORIES = [
  { value: "RENFORT", label: "Renfort" },
  { value: "REMPLACEMENT", label: "Remplacement" },
  { value: "ANALYSE_PRATIQUES", label: "Analyse des pratiques" },
  { value: "FORMATION", label: "Formation" },
];

/**
 * PAR OÙ LA DIFFUSION COMMENCE, et c'est l'établissement qui décide.
 *
 * ⚠ UN COMPTE = UNE PERSONNE (24/09/2026). Le palier « mes salariés d'abord »
 * n'existe plus : il n'y a plus d'équipe interne rattachée au compte. La
 * cascade part des intervenants que l'établissement connaît, puis du réseau.
 * `RESERVED` est le départ par défaut, comme côté API (qui ouvre directement
 * au public un compte sans aucun intervenant connu).
 *
 * Les libellés parlent de gens, pas de paliers : personne dans une MECS ne
 * dit « je publie en visibilité RESERVED ».
 */
const DEPARTS = [
  {
    value: "RESERVED",
    titre: "Les intervenants que je connais d’abord",
    aide: "L'offre part aux intervenants déjà venus chez vous et à votre vivier, puis s'ouvre au réseau si elle reste sans réponse.",
  },
  {
    value: "PUBLIC",
    titre: "Directement tout le réseau",
    aide: "Votre vivier n'est pas sollicité en priorité : l'offre est visible immédiatement par tous les intervenants du réseau. Le plus rapide.",
  },
] as const;

/**
 * QUI reçoit l'offre. C'est le geste qui manquait le plus : qui a besoin de
 * quelqu'un demain matin n'a pas envie de publier au monde entier, il veut
 * d'abord prévenir les trois personnes qui connaissent la maison. Tant que
 * l'outil ne sait pas faire ça, il est court-circuité par le téléphone.
 */
const CIBLES = [
  {
    value: "RESEAU",
    titre: "Tout le réseau, en cascade",
    aide: "Les intervenants que vous connaissez d'abord, puis la marketplace. La diffusion s'élargit toute seule tant que le besoin n'est pas couvert.",
  },
  {
    value: "CONNUS",
    titre: "Uniquement les personnes que je connais",
    aide: "Les intervenants déjà venus chez vous et ceux que vous avez retenus au vivier. L'offre ne sort pas de ce cercle et n'apparaît jamais sur la marketplace.",
  },
  {
    value: "SELECTION",
    titre: "Uniquement les intervenants que je choisis",
    aide: "Vous cochez nommément les intervenants destinataires. Personne d'autre ne reçoit ni ne voit l'offre.",
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
    aide: "L'intervenant s'engage, son profil vous est présenté, vous acceptez ou vous refusez. En cas de refus, le suivant vous est présenté aussitôt. Comme vous gardez la main, l'offre est proposée à beaucoup plus de monde : vos chances de couvrir le besoin augmentent nettement.",
  },
] as const;

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
  const [visibility, setVisibility] = useState("RESERVED");
  const [dbCats, setDbCats] = useState<{ id: string; title: string }[]>([]);
  const [cible, setCible] = useState<string>("RESEAU");
  const [mode, setMode] = useState<string>("AUTOMATIQUE");
  const [vivier, setVivier] = useState<IntervenantVivier[]>([]);
  const [intervenantsCoches, setIntervenantsCoches] = useState<string[]>([]);
  const usingDb = dbCats.length > 0;

  function basculer(liste: string[], poser: (v: string[]) => void, id: string) {
    poser(liste.includes(id) ? liste.filter((x) => x !== id) : [...liste, id]);
  }

  // La sélection nominative demande le vivier, que l'écran n'a pas besoin de
  // charger tant qu'on ne l'a pas choisie.
  useEffect(() => {
    if (!open || cible !== "SELECTION" || vivier.length > 0) return;
    apiRequest<{ items?: IntervenantVivier[] }>("/vivier", { accountId })
      .then((r) => setVivier(Array.isArray(r?.items) ? r.items : []))
      .catch(() => {});
  }, [open, cible, accountId, vivier.length]);

  useEffect(() => {
    if (!open) return;
    apiRequest<{ id: string; title: string }[]>("/categories?type=mission", { accountId })
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) {
          setDbCats(rows);
          // Le bouton s'appelle « RenforTeam » : la catégorie présélectionnée
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
      headcount: fd.get("headcount") ? Number(fd.get("headcount")) : 1,
      emergency: fd.get("emergency") === "on",
      attachmentUrl: String(fd.get("attachmentUrl") || "") || undefined,
      attachmentId: piece?.id,
      recurrence: fd.get("recurrence") === "on" ? "HEBDO" : undefined,
      modeAttribution: mode,
      cibleDiffusion: cible,
      ...(cible === "SELECTION" ? { destinatairesIntervenants: intervenantsCoches } : {}),
    };
    try {
      const created = await apiRequest<{ id: string }>("/missions", { method: "POST", body, accountId });
      // Diffusion immédiate. Si elle échoue, on le DIT : une mission en
      // brouillon silencieux est le pire piège pour un besoin urgent.
      let publiee = false;
      if (created?.id) {
        try {
          await apiRequest(`/missions/${created.id}/publish`, {
            method: "POST",
            accountId,
            // Le palier choisi ci-dessus doit être transmis : sans lui, l'API
            // retombe sur sa règle par défaut et le choix de l'établissement
            // se perd entre les deux appels.
            ...(cible === "RESEAU" ? { body: { visibility } } : {}),
          });
          publiee = true;
        } catch {
          publiee = false;
        }
      }
      if (publiee) {
      // CONFETTIS À LA MISE EN LIGNE.
      //
      // Publier une fiche est le geste qui fait vivre la plateforme, et il ne
      // recevait qu'un bandeau de notification identique à celui d'un
      // changement de mot de passe. On salue le GESTE, pas l'arrivée sur une
      // page — même règle que le parrainage.
      //
      // ⚠ Rien ne part si la personne a demandé moins d'animations
      // (`prefers-reduced-motion`), et rien ne part sur un échec ni sur une
      // mise en brouillon : des confettis sur une fiche qui n'est pas en ligne
      // feraient croire l'inverse de ce qui vient de se passer. Voir
      // lib/confetti.ts.
      lancerConfettis();
        toast({
          title: "Renfort publié",
          // Le message dit PAR OÙ ça part : c'est la seule chose qu'on ne
          // peut pas vérifier d'un coup d'œil après avoir fermé la fenêtre.
          description:
            cible !== "RESEAU"
              ? "Votre demande est partie aux seules personnes désignées. Elle n'apparaîtra pas sur la marketplace."
              : visibility === "RESERVED"
                ? "L'offre est partie aux intervenants que vous connaissez. Sans réponse, elle s'élargira toute seule au réseau."
                : "L'offre est visible immédiatement par tout le réseau.",
        });
      } else {
        toast({
          title: "Mission créée en brouillon",
          description:
            "La diffusion n'a pas pu se faire automatiquement. Ouvrez la mission dans RenforTeam et cliquez sur « Publier ».",
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
          <DialogTitle>Publier un RenforTeam</DialogTitle>
          <DialogDescription>
            Décrivez le besoin, puis choisissez qui le reçoit et comment la mission est
            attribuée.
          </DialogDescription>
        </DialogHeader>

        {/* CE QUE LA PUBLICATION DÉCLENCHE (26/08/2026).

            Le formulaire demandait beaucoup sans jamais dire ce qu’il produit.
            On le dit ici, en trois lignes, avant le premier champ : c’est le
            geste qui remplace la liste d’appels, autant qu’il se voie. */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm leading-relaxed text-muted-foreground">
          <span className="block font-semibold text-foreground">Ce que ce formulaire déclenche</span>
          <span className="mt-1.5 block">
            L’offre part <strong className="font-medium text-foreground">en cascade</strong> : les
            intervenants que vous connaissez d’abord, puis le réseau. Elle s’élargit toute seule tant que le besoin n’est pas couvert. En mission urgente, chaque
            profil qui correspond est prévenu{" "}
            <strong className="font-medium text-foreground">par e-mail dès la publication</strong>.
            Le premier qui accepte prend la mission et le contrat s’émet dans la foulée. Ou vous
            validez chaque profil, l’un après l’autre.
          </span>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <Field label="Intitulé" htmlFor="title" required>
            <Input id="title" name="title" required placeholder="Éducateur spé, internat" />
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
            {/* LE TAUX HORAIRE A QUITTÉ LE FORMULAIRE (26/08/2026).

                Annoncer un tarif dès la publication fige la négociation avant
                qu’elle commence, et expose publiquement ce qu’un établissement
                paie. La rémunération se convient au moment de l’engagement, pas
                sur une annonce. Le champ reste en base : les missions publiées
                avant aujourd’hui gardent le leur, et la proposition de contrat
                sait déjà travailler sans. */}
            <Field
              label="Postes"
              htmlFor="headcount"
              hint="Nombre de personnes recherchées pour ce même besoin."
            >
              <Input id="headcount" name="headcount" type="number" min={1} defaultValue={1} />
            </Field>
          </div>
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

            {/* Le palier de départ n'a de sens que pour la cascade : les deux
                autres cibles désignent déjà précisément les destinataires. */}
            {cible === "RESEAU" ? (
              <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
                <p className="text-sm font-semibold text-foreground">Par où commencer ?</p>
                {DEPARTS.map((d) => (
                  <label
                    key={d.value}
                    className={`flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition ${
                      visibility === d.value
                        ? "border-primary bg-primary-soft/40"
                        : "border-border hover:bg-muted/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={d.value}
                      checked={visibility === d.value}
                      onChange={() => setVisibility(d.value)}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <span>
                      <span className="font-medium text-foreground">{d.titre}</span>
                      <span className="block text-xs leading-relaxed text-muted-foreground">
                        {d.aide}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : null}

            {cible === "SELECTION" ? (
              <div className="space-y-3 pt-1">
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
                {intervenantsCoches.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Cochez au moins un intervenant : sinon la mission repart en diffusion normale.
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
                À la publication, tous les intervenants dont le profil correspond (métier, zone, disponibilité) sont notifiés par e-mail. Premier arrivé, premier servi.
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
