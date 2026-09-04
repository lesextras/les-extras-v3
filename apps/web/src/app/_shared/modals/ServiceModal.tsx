"use client";

// Modale « Créer / publier un atelier » (FREELANCE).
//   POST /services { ... , publish }
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { lancerConfettis } from "@/lib/confetti";
import { Field, Textarea } from "../form-fields";
import { FileUpload, type FichierDepose } from "../FileUpload";
import { DEPARTEMENTS, REGIONS, resumeTerritoire } from "@/lib/territoires";

const CATEGORIES = [
  { value: "ATELIER", label: "Atelier" },
  { value: "FORMATION", label: "Formation" },
  { value: "MEDIATION", label: "Médiation" },
  { value: "ART_THERAPIE", label: "Art-thérapie" },
  { value: "PREVENTION", label: "Prévention" },
];

/**
 * Publics visés, en cases à cocher plutôt qu'en texte libre. C'est ce qui rend
 * le filtre du catalogue utilisable : un chef de service qui cherche « handicap
 * adulte » ne trouve rien si chacun a écrit sa propre formulation.
 */
const PUBLICS = [
  "Enfants",
  "Adolescents",
  "Adultes",
  "Séniors",
  "Handicap",
  "Protection de l'enfance",
  "Insertion",
  "Professionnels",
];

/** Fiche existante, quand la modale sert à modifier. */
export interface FicheExistante {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  categoryId?: string | null;
  duration?: string | null;
  maxParticipants?: number | null;
  publicTarget?: string | null;
  price?: string | number | null;
  city?: string | null;
  departements?: string[] | null;
  status?: string | null;
  objectives?: string | null;
  methodology?: string | null;
  evaluation?: string | null;
  prerequisites?: string | null;
  material?: string | null;
  publicTargets?: string[] | null;
  timeSlots?: string[] | null;
  images?: string[] | null;
}

export function ServiceModal({
  accountId,
  trigger,
  categorieInitiale = "ATELIER",
  fiche,
  admin = false,
}: {
  /**
   * Compte propriétaire de la fiche. Inutile en mode administration : l'admin
   * n'est membre d'aucun des comptes dont il corrige les fiches, et envoyer
   * son propre `accountId` ferait refuser la requête par l'`AccountGuard`.
   */
  accountId?: string;
  trigger?: React.ReactNode;
  /** Pré-sélectionne le type de fiche. Le champ reste modifiable : on ouvre
   *  la bonne porte, on n'enferme pas. */
  categorieInitiale?: "ATELIER" | "FORMATION" | "MEDIATION" | "ART_THERAPIE" | "PREVENTION";
  /**
   * Fiche à modifier. Sans elle, la modale crée. Une fiche publiée n'était
   * jusqu'ici plus modifiable nulle part dans l'interface — l'API l'a
   * toujours permis, c'est le bouton qui manquait.
   */
  fiche?: FicheExistante;
  /**
   * MODE ADMINISTRATION — la même fiche, écrite par `PATCH /admin/services/:id`
   * au lieu de `PATCH /services/:id`.
   *
   * Dix des treize ateliers du catalogue viennent de l'import WordPress et
   * n'ont ni durée, ni participants, ni matériel, ni prérequis, ni créneaux :
   * ces champs n'existaient pas là-bas. Ils appartiennent à quatre
   * intervenants différents, dont trois extérieurs à l'association. Sans ce
   * mode, la seule façon de compléter une de ces fiches était de se connecter
   * au compte de son auteur — ce qu'on ne fait pas.
   *
   * Le formulaire est le MÊME des deux côtés, à dessein : une fiche corrigée
   * par l'administration doit avoir exactement la forme d'une fiche écrite par
   * son auteur, sinon les deux divergent au premier champ ajouté.
   */
  admin?: boolean;
}) {
  const edition = Boolean(fiche);
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(
    fiche?.categoryId ?? fiche?.category ?? categorieInitiale,
  );
  const [dbCats, setDbCats] = useState<{ id: string; title: string }[]>([]);
  const [brief, setBrief] = useState("");
  const [statut, setStatut] = useState<string>(fiche?.status ?? "PUBLISHED");
  const [publics, setPublics] = useState<string[]>(fiche?.publicTargets ?? []);
  /**
   * LES DÉPARTEMENTS OÙ L'ON SE DÉPLACE — la question que pose vraiment un
   * directeur. L'atelier se tient CHEZ lui : il ne cherche pas où se trouve la
   * prestation, il cherche si elle vient jusqu'à lui. Le champ « Ville » ne
   * répondait pas à ça, et seize fiches sur dix-sept y avaient d'ailleurs écrit
   * une région faute de mieux.
   */
  const [territoires, setTerritoires] = useState<string[]>(fiche?.departements ?? []);
  /**
   * PHOTOS DE LA FICHE — au moins une est exigée à la CRÉATION.
   *
   * Le formulaire n'en proposait aucune : les seules images du catalogue
   * venaient de l'import WordPress, et toute fiche créée à la main partait donc
   * sans photo, avec le dégradé de remplacement de la carte. Le champ manquait,
   * pas la volonté.
   *
   * L'API refuse désormais une création sans image (`CreateServiceDto`). Sans ce
   * champ, cette règle aurait rendu la création IMPOSSIBLE depuis l'interface —
   * le « bouton qui mène à un refus » que le reste du produit s'interdit.
   *
   * ⚠ En MODIFICATION, rien n'est exigé : trois fiches déjà publiées n'ont pas
   * de photo, et il ne faut pas empêcher leur auteur d'en corriger le texte.
   */
  const [images, setImages] = useState<string[]>(fiche?.images ?? []);
  // Le bloc pédagogique est replié à la création pour ne pas décourager, mais il
  // s'ouvre dès que l'IA y écrit quelque chose : un champ rempli qu'on ne voit
  // pas est pire qu'un champ vide.
  const [detailOuvert, setDetailOuvert] = useState(Boolean(fiche));
  const intitule = edition
    ? "Modifier la fiche"
    : categorieInitiale === "FORMATION"
      ? "Créer une formation"
      : "Créer un atelier";
  const [iaLoading, setIaLoading] = useState(false);

  /** Pré-remplit le formulaire depuis un brief, via l'assistant. Les champs
   *  restent modifiables : l'IA propose, l'intervenant décide. */
  async function remplirAvecIA() {
    if (brief.trim().length < 15 || iaLoading) return;
    setIaLoading(true);
    try {
      const r = await apiRequest<{ fiche?: Record<string, unknown>; brut?: string }>("/assistant/fiche", {
        method: "POST",
        accountId,
        body: { type: "ATELIER", brief: brief.trim() },
      });
      const f = r.fiche as { title?: string; description?: string; publicTarget?: string; duration?: string; objectifs?: string[] } | undefined;
      if (!f) throw new Error("Réponse inexploitable : réessayez en précisant le brief.");
      const set = (id: string, v?: string) => {
        const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
        if (el && v) el.value = v;
      };
      set("title", f.title);
      set("description", f.description);
      // Les objectifs ont désormais leur champ : les recopier dans la
      // description les rendait invisibles au filtre comme à l'audit.
      if (f.objectifs?.length) {
        set("objectives", f.objectifs.join("\n"));
        setDetailOuvert(true);
      }
      set("publicTarget", f.publicTarget);
      set("duration", f.duration);
      toast({ title: "Fiche pré-remplie", description: "Relisez et ajustez chaque champ avant de publier." });
    } catch (err) {
      toast({ title: "Aide IA indisponible", description: err instanceof Error ? err.message : "Réessayez.", variant: "error" });
    } finally {
      setIaLoading(false);
    }
  }
  const usingDb = dbCats.length > 0;

  useEffect(() => {
    if (!open) return;
    apiRequest<{ id: string; title: string }[]>("/categories?type=service", admin ? {} : { accountId })
      .then((rows) => {
        if (Array.isArray(rows) && rows.length) {
          setDbCats(rows);
          // En edition, la categorie de la fiche est deja posee : la forcer a
          // la premiere de la liste reaffectait silencieusement chaque fiche
          // modifiee. On ne preselectionne qu'a la creation.
          if (!fiche) setCategory((c) => (rows.some((r) => r.id === c) ? c : rows[0].id));
        }
      })
      .catch(() => {});
  }, [open, accountId, admin]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // AU MOINS UNE PHOTO À LA CRÉATION. Le refus est prononcé ICI, avant
    // l'envoi, et pas récupéré du 400 de l'API : un formulaire long qui part et
    // revient en erreur fait perdre la saisie de vue, alors que le champ fautif
    // est à l'écran. L'API garde la même règle — c'est elle qui fait foi.
    if (!edition && images.length === 0) {
      setError("Ajoutez au moins une photo : une fiche sans image se fait deux fois moins ouvrir.");
      return;
    }
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const texte = (nom: string) => String(fd.get(nom) || "").trim() || undefined;
    // Les créneaux se saisissent en une ligne — « 9h-12h, 14h-17h » — et se
    // rangent en tableau. Demander un formulaire répétable pour deux valeurs
    // aurait été plus lourd à remplir qu'à lire.
    const creneaux = String(fd.get("timeSlots") || "")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const corps = {
      title: String(fd.get("title") || ""),
      description: String(fd.get("description") || ""),
      ...(usingDb ? { categoryId: category } : { category }),
      duration: texte("duration"),
      maxParticipants: fd.get("maxParticipants") ? Number(fd.get("maxParticipants")) : undefined,
      publicTarget: texte("publicTarget"),
      price: fd.get("price") ? Number(fd.get("price")) : undefined,
      city: texte("city"),
      departements: territoires,
      // Le contenu pédagogique : ces champs existaient en base et dans l'API
      // depuis le début, mais seul l'import de catalogue les remplissait. Une
      // fiche créée à la main sortait donc systématiquement plus pauvre qu'une
      // fiche importée — et c'est précisément ce détail qui décide un chef de
      // service à réserver ou à passer son chemin.
      objectives: texte("objectives"),
      methodology: texte("methodology"),
      evaluation: texte("evaluation"),
      prerequisites: texte("prerequisites"),
      material: texte("material"),
      publicTargets: publics.length ? publics : undefined,
      timeSlots: creneaux.length ? creneaux : undefined,
      images: images.length ? images : undefined,
    };
    try {
      // MODE ADMINISTRATION — deux appels, et c'est délibéré.
      //
      // Le contenu part sur `PATCH /admin/services/:id`, le statut sur
      // `PATCH /admin/services/:id/moderate`. Les fondre en un seul appel
      // aurait fait disparaître la trace de modération (`atelier.modere`), qui
      // est la seule à dire QUI a retiré une fiche du catalogue et quand. Le
      // second appel n'est envoyé que si le statut change vraiment.
      if (admin && fiche) {
        await apiRequest(`/admin/services/${fiche.id}`, { method: "PATCH", body: corps });
        if (statut && statut !== fiche.status) {
          await apiRequest(`/admin/services/${fiche.id}/moderate`, {
            method: "PATCH",
            body: { status: statut },
          });
        }
        toast({
          title: "Fiche corrigée",
          description: "La correction est journalisée et visible tout de suite dans le catalogue.",
        });
        setOpen(false);
        router.refresh();
        return;
      }
      if (edition && fiche) {
        await apiRequest(`/services/${fiche.id}`, {
          method: "PATCH",
          body: { ...corps, status: statut },
          accountId,
        });
        // Une fiche remise en ligne après un passage en brouillon est une
        // publication, elle aussi.
        if (statut === "PUBLISHED" && fiche.status !== "PUBLISHED") lancerConfettis();
        toast({
          title: statut === "PUBLISHED" ? "Fiche mise à jour" : "Fiche mise en brouillon",
          description:
            statut === "PUBLISHED"
              ? "Les modifications sont visibles dans le catalogue."
              : "Elle n'apparaît plus dans le catalogue public. Vous pourrez la republier quand vous voudrez.",
        });
        setOpen(false);
        router.refresh();
        return;
      }
      const created = await apiRequest<{ id: string }>("/services", {
        method: "POST",
        body: corps,
        accountId,
      });
      // LA FICHE EST CRÉÉE EN BROUILLON, PUIS PUBLIÉE PAR UN SECOND APPEL.
      //
      // Ce second appel traverse `EmailVerifieSiPublicationGuard` : tant que
      // l'adresse n'est pas confirmée, il répond 403. Un `.catch(() => {})`
      // avalait ce refus et le message annonçait quand même « Atelier publié ».
      //
      // C'était le pire défaut du produit, et il tombait sur le compte le plus
      // fragile : celui qui vient de s'inscrire et n'a pas encore cliqué son
      // lien de confirmation est exactement celui qui crée son premier atelier.
      // Il repartait convaincu d'être au catalogue, et attendait des
      // réservations sur une fiche que personne ne pouvait voir.
      //
      // On dit maintenant la vérité : la fiche est enregistrée — elle l'est
      // réellement, en brouillon — et on explique le geste qui la publie.
      let publiee = statut !== "PUBLISHED";
      let motifNonPubliee: string | null = null;
      if ((created as { id?: string })?.id) {
        try {
          await apiRequest(`/services/${(created as { id: string }).id}`, {
            method: "PATCH",
            body: { status: statut },
            accountId,
          });
          publiee = true;
        } catch (e) {
          motifNonPubliee =
            e instanceof Error && e.message
              ? e.message
              : "La mise en ligne a été refusée.";
        }
      }

      if (statut === "PUBLISHED" && !publiee) {
        toast({
          variant: "warning",
          title: "Fiche enregistrée, mais pas encore publiée",
          description: `${motifNonPubliee} Votre fiche est en brouillon dans « Mes ateliers » : elle partira au catalogue dès que ce point sera réglé.`,
        });
      } else {
        if (statut === "PUBLISHED") {
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
        }
        toast({
          title: statut === "PUBLISHED" ? "Atelier publié" : "Brouillon enregistré",
          description:
            statut === "PUBLISHED"
              ? "Il apparaît désormais dans le catalogue."
              : "Vous le publierez quand il sera prêt.",
        });
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button>{intitule}</Button>}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{intitule}</DialogTitle>
          <DialogDescription>
            Décrivez votre intervention pour la rendre réservable par les établissements.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {/* L'aide à la rédaction n'a de sens qu'à la création : en
              modification, la fiche est déjà écrite et l'écraser serait
              un piège. */}
          <div className={edition ? "hidden" : "rounded-xl border border-primary/20 bg-primary-soft/40 p-3"}>
            <p className="text-xs font-semibold text-foreground">✨ Remplir avec l'IA</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Décrivez votre atelier en 2-3 phrases : titre, description, public et durée seront proposés. Vous restez libre de tout modifier.
            </p>
            <Textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              rows={2}
              placeholder="Ex : atelier boxe éducative pour ados en foyer, canaliser l'agressivité, 2 h en gymnase…"
              className="mt-2"
            />
            <Button type="button" size="sm" variant="outline" className="mt-2" disabled={iaLoading || brief.trim().length < 15} onClick={remplirAvecIA}>
              {iaLoading ? "Rédaction en cours…" : "Proposer un contenu"}
            </Button>
          </div>
          <Field label="Titre" htmlFor="title" required>
            <Input id="title" name="title" required defaultValue={fiche?.title ?? ""} placeholder="Atelier médiation animale" />
          </Field>
          <Field label="Description" htmlFor="description" required>
            <Textarea id="description" name="description" required rows={4} defaultValue={fiche?.description ?? ""} />
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
            <Field label="Durée" htmlFor="duration" hint="Format libre, ex. 2H, une demi-journée.">
              <Input id="duration" name="duration" defaultValue={fiche?.duration ?? ""} placeholder="2H" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Participants max" htmlFor="maxParticipants">
              <Input id="maxParticipants" name="maxParticipants" type="number" min={1} defaultValue={fiche?.maxParticipants ?? ""} placeholder="10" />
            </Field>
            {/*
              L'ancien libellé annonçait des « frais de gestion » ajoutés au
              tarif pour l'établissement. Ces frais n'existent pas :
              COMMISSION_DEFAUT vaut 0 (src/lib/commission.ts, miroir de
              apps/api/src/billing/commission.ts), et le devis reprend le tarif
              brut. La phrase incitait donc l'intervenant à baisser son prix
              pour compenser un prélèvement imaginaire, et laissait croire à
              l'établissement qu'il paierait davantage que le montant affiché.
            */}
            <Field
              label="Prix (€)"
              htmlFor="price"
              hint="L'établissement paie exactement ce montant : rien n'est prélevé dessus."
            >
              <Input id="price" name="price" type="number" step="0.5" defaultValue={fiche?.price != null ? String(fiche.price) : ""} placeholder="250" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Public visé"
              htmlFor="publicTarget"
              hint="Description libre, en complément des cases à cocher ci-dessous."
            >
              <Input id="publicTarget" name="publicTarget" defaultValue={fiche?.publicTarget ?? ""} placeholder="Adultes en situation de handicap" />
            </Field>
            <Field
              label="Votre ville de base"
              htmlFor="city"
              hint="D'où vous partez. Le territoire couvert se coche juste en dessous."
            >
              <Input id="city" name="city" defaultValue={fiche?.city ?? ""} placeholder="Melun" />
            </Field>
          </div>

          <Field
            label="Départements où vous intervenez"
            hint="C'est le filtre du catalogue. Un établissement cherche d'abord qui se déplace jusqu'à lui : sans au moins un département coché, votre fiche n'apparaît dans aucune recherche par territoire."
          >
            {/* CENT UN DÉPARTEMENTS NE SE COCHENT PAS UN PAR UN.
                La première version affichait une pastille par département : très
                bien pour huit, illisible pour cent un, et impossible sur un
                téléphone. On ajoute par région ou à l'unité, et seuls les
                territoires retenus restent à l'écran. */}
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

                <button
                  type="button"
                  onClick={() => setTerritoires(DEPARTEMENTS.map((d) => d.code))}
                  className="rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
                >
                  Toute la France
                </button>
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

              {territoires.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Aucun territoire pour l&apos;instant. Votre fiche restera visible dans le
                  catalogue, mais pas dans les recherches par département.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <span className="self-center text-xs font-medium text-foreground">
                    {resumeTerritoire(territoires)}
                  </span>
                  {DEPARTEMENTS.filter((d) => territoires.includes(d.code)).map((d) => (
                    <button
                      key={d.code}
                      type="button"
                      onClick={() =>
                        setTerritoires((liste) => liste.filter((x) => x !== d.code))
                      }
                      aria-label={`Retirer ${d.nom}`}
                      className="rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                    >
                      {d.nom} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          <Field
            label="Publics concernés"
            hint="Sert au filtre du catalogue : cochez tout ce qui s'applique."
          >
            <div className="flex flex-wrap gap-2">
              {PUBLICS.map((p) => {
                const actif = publics.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={actif}
                    onClick={() =>
                      setPublics((liste) =>
                        actif ? liste.filter((x) => x !== p) : [...liste, p],
                      )
                    }
                    className={
                      actif
                        ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                        : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field
            label={edition ? "Photos" : "Photos (au moins une)"}
            hint={
              edition
                ? "Remplacez ou complétez la galerie de la fiche."
                : "La première photo devient la vignette du catalogue. JPG, PNG ou WebP, 5 Mo maximum."
            }
          >
            <div className="space-y-2">
              {images.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {images.map((url, i) => (
                    <div
                      key={url}
                      className="relative size-20 overflow-hidden rounded-lg border border-border bg-muted"
                    >
                      {/* Vignette locale : `next/image` refuserait une URL
                          relative servie par le proxy, et on n'a pas besoin
                          d'optimisation pour un aperçu de 80 px. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="size-full object-cover" />
                      <button
                        type="button"
                        aria-label={`Retirer la photo ${i + 1}`}
                        onClick={() => setImages((l) => l.filter((x) => x !== url))}
                        className="absolute right-0.5 top-0.5 rounded-full bg-black/70 px-1.5 text-xs text-white"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              <FileUpload
                famille="service"
                accountId={accountId}
                label="Ajouter une photo"
                aide="ou glissez l'image ici · 5 Mo maximum"
                onChange={(f: FichierDepose | null) => {
                  if (!f) return;
                  // On stocke l'adresse PUBLIQUE : le catalogue est vu par des
                  // visiteurs non connectés, `/files/:id` leur répondrait 401.
                  setImages((l) => [...l, `/api/proxy/public/images/${f.id}`]);
                  setError(null);
                }}
              />
            </div>
          </Field>

          {/* LE CONTENU PÉDAGOGIQUE.
              Replié par défaut : ces champs ne sont pas obligatoires pour
              publier, mais ce sont eux qui font la différence entre une fiche
              qu'on parcourt et une fiche qu'on réserve. Les laisser hors du
              formulaire, comme c'était le cas, revenait à condamner toute fiche
              saisie à la main à rester plus pauvre qu'une fiche importée. */}
          <details
            className="rounded-xl border border-border p-3"
            open={detailOuvert}
            onToggle={(e) => setDetailOuvert((e.currentTarget as HTMLDetailsElement).open)}
          >
            <summary className="cursor-pointer text-sm font-semibold text-foreground">
              Contenu pédagogique
              <span className="ml-2 font-normal text-muted-foreground">
objectifs, méthode, évaluation
              </span>
            </summary>
            <div className="mt-3 space-y-4">
              <Field
                label="Objectifs"
                htmlFor="objectives"
                hint="Ce que les participants savent faire à la fin. Un objectif par ligne."
              >
                <Textarea
                  id="objectives"
                  name="objectives"
                  rows={3}
                  defaultValue={fiche?.objectives ?? ""}
                  placeholder={"Exprimer une émotion sans passer par la violence\nCoopérer sur une tâche commune"}
                />
              </Field>
              <Field
                label="Déroulé et méthode"
                htmlFor="methodology"
                hint="Comment la séance se passe concrètement."
              >
                <Textarea
                  id="methodology"
                  name="methodology"
                  rows={3}
                  defaultValue={fiche?.methodology ?? ""}
                  placeholder="Accueil et cadre (15 min), mise en situation (1 h), reprise collective (30 min)…"
                />
              </Field>
              <Field
                label="Évaluation"
                htmlFor="evaluation"
                hint="Comment vous mesurez ce qui a été atteint. Attendu en audit Qualiopi."
              >
                <Textarea
                  id="evaluation"
                  name="evaluation"
                  rows={2}
                  defaultValue={fiche?.evaluation ?? ""}
                  placeholder="Grille d'observation remplie avec l'équipe éducative, bilan oral en fin de cycle…"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Prérequis" htmlFor="prerequisites">
                  <Textarea
                    id="prerequisites"
                    name="prerequisites"
                    rows={2}
                    defaultValue={fiche?.prerequisites ?? ""}
                    placeholder="Aucun. Tenue souple conseillée."
                  />
                </Field>
                <Field label="Matériel et lieu" htmlFor="material">
                  <Textarea
                    id="material"
                    name="material"
                    rows={2}
                    defaultValue={fiche?.material ?? ""}
                    placeholder="Salle de 40 m² au sol souple. Matériel fourni par l'intervenant."
                  />
                </Field>
              </div>
              <Field
                label="Créneaux proposés"
                htmlFor="timeSlots"
                hint="Séparés par des virgules. Laissez vide si tout se convient au cas par cas."
              >
                <Input
                  id="timeSlots"
                  name="timeSlots"
                  defaultValue={(fiche?.timeSlots ?? []).join(", ")}
                  placeholder="9h-12h, 14h-17h"
                />
              </Field>
            </div>
          </details>

          <Field label="Visibilité">
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PUBLISHED">Publiée : visible dans le catalogue</SelectItem>
                <SelectItem value="DRAFT">Brouillon : retirée du catalogue</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Mettre en brouillon suspend la fiche sans la supprimer : les réservations déjà
              acceptées ne sont pas touchées, et vous pouvez la republier quand vous voulez.
            </p>
          </Field>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Enregistrement…"
                : edition
                  ? "Enregistrer"
                  : statut === "PUBLISHED"
                    ? "Publier l'atelier"
                    : "Enregistrer en brouillon"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
