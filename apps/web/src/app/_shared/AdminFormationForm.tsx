"use client";

// Formulaire de création / édition d'un programme de formation (back-office ADMIN).
// Réutilisé dans les deux modales (créer / éditer) de AdminFormationsManager.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Field, Textarea } from "./form-fields";
import { FileUpload, type FichierDepose } from "./FileUpload";
import { PUBLICS_FORMATION } from "@/lib/publics-formation";

export type FormationType = "CERTIFIANTE" | "INTERNE";

export interface FormationFormValues {
  title: string;
  type: FormationType;
  summary: string;
  objectives: string;
  program: string;
  prerequisites: string;
  targetAudience: string;
  durationHours: string;
  categoryId: string;
  cpfEligible: boolean;
  certifying: boolean;
  certificationName: string;
  /**
   * ⚠⚠ LE PRIX DE L'ATTESTATION DE SUIVI, EN EUROS — c'est l'interrupteur de
   * la vente pour cette fiche, et pour elle seule.
   *
   * Vide ou zéro : la vente est FERMÉE. Le bouton d'achat n'apparaît pas sur
   * la page publique et la route refuse. Un montant : elle s'ouvre.
   *
   * ⚠ ON SAISIT DES EUROS, LA BASE STOCKE DES CENTIMES. La conversion est dans
   * `toFormationPayload`. Sans elle, « 20 » tapé ici ouvrirait la vente à
   * 0,20 € — et personne ne relit un montant qu'il vient d'écrire.
   */
  attestationPrixEuros: string;

  /*
    ⚠⚠ LA VITRINE — AJOUTÉE LE 16/09/2026, ET C'EST UNE RÉPARATION.

    Ces sept champs existaient en base et étaient absents du formulaire ET des
    DTO de l'administration. Une formation créée ici arrivait donc au catalogue
    sans photo, sans ville, sans public filtrable et sans durée en minutes — à
    côté d'une carte d'atelier qui porte les quatre. On avait corrigé la CARTE
    le 3/09 ; on n'avait jamais donné le moyen de la remplir autrement que par
    un script de seed, c'est-à-dire par un commit.
  */
  images: string[];
  city: string;
  publicTargets: string[];
  /**
   * ⚠ MINUTES, et pas seulement heures. `durationHours` est un entier : 45
   * minutes y valent 0 (durée effacée sur la fiche) ou 1 (durée fausse sur un
   * document que des financeurs lisent). Les douze parcours gratuits sont
   * tous sous l'heure.
   */
  durationMinutes: string;
  methodology: string;
  evaluation: string;
  faq: { question: string; answer: string }[];

  /**
   * MINI-FORMATION GRATUITE EN LIGNE.
   *
   * ⚠ Les deux champs vont ENSEMBLE : une fiche gratuite sans adresse affiche
   * un bouton unique qui ne mène nulle part, et l'API refuse la combinaison
   * (`assertModeGratuitCoherent`). Le formulaire refuse donc avant l'envoi —
   * un formulaire long qui part et revient en erreur fait perdre de vue le
   * champ fautif, qui est pourtant à l'écran.
   */
  freeOnline: boolean;
  enrollUrl: string;
}

export const EMPTY_FORMATION: FormationFormValues = {
  title: "",
  type: "CERTIFIANTE",
  summary: "",
  objectives: "",
  program: "",
  prerequisites: "",
  targetAudience: "",
  durationHours: "",
  categoryId: "",
  cpfEligible: false,
  certifying: false,
  certificationName: "",
  attestationPrixEuros: "",
  images: [],
  city: "",
  publicTargets: [],
  durationMinutes: "",
  methodology: "",
  evaluation: "",
  faq: [],
  freeOnline: false,
  enrollUrl: "",
};

/** Transforme les valeurs du formulaire en payload API (types nettoyés). */
export function toFormationPayload(v: FormationFormValues) {
  const isInterne = v.type === "INTERNE";
  return {
    title: v.title.trim(),
    type: v.type,
    summary: v.summary.trim() || undefined,
    objectives: v.objectives.trim() || undefined,
    program: v.program.trim() || undefined,
    prerequisites: v.prerequisites.trim() || undefined,
    targetAudience: v.targetAudience.trim() || undefined,
    durationHours: v.durationHours ? Number(v.durationHours) : undefined,
    categoryId: v.categoryId || undefined,
    cpfEligible: isInterne ? false : v.cpfEligible,
    certifying: isInterne ? false : v.certifying,
    certificationName:
      isInterne || !v.certifying ? undefined : v.certificationName.trim() || undefined,
    /**
     * ⚠ EUROS → CENTIMES, et `null` quand le champ est vide ou à zéro : c'est
     * la seule façon d'écrire « vente fermée » en base. `undefined` ne
     * conviendrait pas — le service ne toucherait alors pas au champ, et on ne
     * pourrait jamais REFERMER une vente qu'on a ouverte.
     */
    attestationPrixCents: v.attestationPrixEuros.trim()
      ? Math.round(Number(v.attestationPrixEuros.replace(",", ".")) * 100) || null
      : null,

    // LA VITRINE. `undefined` quand c'est vide : le service ne touche alors
    // pas au champ. Les tableaux, eux, sont toujours envoyés — sinon on ne
    // pourrait jamais RETIRER une photo ou décocher un public.
    images: v.images,
    city: v.city.trim() || undefined,
    publicTargets: v.publicTargets,
    durationMinutes: v.durationMinutes ? Number(v.durationMinutes) : undefined,
    methodology: v.methodology.trim() || undefined,
    evaluation: v.evaluation.trim() || undefined,
    // Les paires incomplètes sont écartées ici : une question sans réponse
    // s'afficherait en accordéon vide sur la fiche publique.
    faq: v.faq.filter((f) => f.question.trim() && f.answer.trim()),
    freeOnline: v.freeOnline,
    enrollUrl: v.freeOnline ? v.enrollUrl.trim() || undefined : undefined,
  };
}

interface CategoryOption {
  id: string;
  title: string;
}

export function AdminFormationForm({
  initial,
  categories,
  submitting,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<FormationFormValues>;
  categories: CategoryOption[];
  submitting?: boolean;
  submitLabel: string;
  onSubmit: (values: FormationFormValues) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<FormationFormValues>({ ...EMPTY_FORMATION, ...initial });
  const [erreur, setErreur] = useState<string | null>(null);
  const isInterne = v.type === "INTERNE";

  function set<K extends keyof FormationFormValues>(k: K, val: FormationFormValues[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        /*
          ⚠ LE REFUS EST PRONONCÉ ICI, AVANT L'ENVOI, et pas récupéré du 400 de
          l'API. Un formulaire long qui part et revient en erreur fait perdre
          de vue le champ fautif, qui est pourtant à l'écran. L'API garde la
          même règle — c'est elle qui fait foi, le client n'est qu'une
          politesse.
        */
        if (v.freeOnline && !v.enrollUrl.trim()) {
          setErreur(
            "Une formation gratuite en ligne doit indiquer l’adresse où elle se suit.",
          );
          return;
        }
        setErreur(null);
        onSubmit(v);
      }}
      className="space-y-4"
    >
      <Field label="Intitulé du programme" htmlFor="f-title" required>
        <Input
          id="f-title"
          value={v.title}
          onChange={(e) => set("title", e.target.value)}
          required
          placeholder="Community Manager augmenté par l'IA"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type">
          <Select value={v.type} onValueChange={(val) => set("type", val as FormationType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CERTIFIANTE">Certifiante (Qualiopi)</SelectItem>
              <SelectItem value="INTERNE">Interne</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Durée (heures)" htmlFor="f-duration">
          <Input
            id="f-duration"
            type="number"
            min={1}
            value={v.durationHours}
            onChange={(e) => set("durationHours", e.target.value)}
            placeholder="21"
          />
        </Field>
      </div>

      <Field
        label="Résumé"
        htmlFor="f-summary"
        hint="Affiché en « Présentation » sur la page publique de la formation."
      >
        <Textarea
          id="f-summary"
          rows={2}
          value={v.summary}
          onChange={(e) => set("summary", e.target.value)}
          placeholder="En une phrase, à quoi sert ce programme."
        />
      </Field>

      <Field label="Objectifs pédagogiques" htmlFor="f-objectives">
        <Textarea
          id="f-objectives"
          rows={3}
          value={v.objectives}
          onChange={(e) => set("objectives", e.target.value)}
          placeholder="Ce que l'apprenant saura faire à l'issue de la formation."
        />
      </Field>

      <Field label="Programme / contenu" htmlFor="f-program">
        <Textarea
          id="f-program"
          rows={3}
          value={v.program}
          onChange={(e) => set("program", e.target.value)}
          placeholder="Déroulé des modules, séquences, ateliers…"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prérequis" htmlFor="f-prerequisites">
          <Textarea
            id="f-prerequisites"
            rows={2}
            value={v.prerequisites}
            onChange={(e) => set("prerequisites", e.target.value)}
            placeholder="Aucun / niveau attendu."
          />
        </Field>
        <Field label="Public visé" htmlFor="f-audience">
          <Textarea
            id="f-audience"
            rows={2}
            value={v.targetAudience}
            onChange={(e) => set("targetAudience", e.target.value)}
            placeholder="Demandeurs d'emploi, salariés en reconversion…"
          />
        </Field>
      </div>

      {/*
        ⚠⚠ C'EST ICI QUE LA VENTE DE L'ATTESTATION S'OUVRE ET SE FERME.

        Un champ vide = fermé, et c'est le défaut sur toutes les fiches. Ce
        n'est pas une précaution de développement : vendre à un particulier
        oblige à nommer dans les CGV un médiateur de la consommation référencé
        par la CECMC (art. L612-1 c. conso), et aucun ne l'est à ce jour. Le
        tunnel est construit et attend une décision qui n'est pas technique.

        ⚠ L'AIDE SOUS LE CHAMP N'EST PAS DÉCORATIVE : sans elle, personne ne
        peut deviner qu'un champ de prix vide est ce qui ferme une vente.
      */}
      <Field
        label="Prix de l’attestation de suivi (€)"
        htmlFor="f-attestation"
        hint="Laissez vide pour ne rien vendre : le bouton d’achat n’apparaît alors pas sur la fiche publique. Un montant ouvre la vente pour ce parcours uniquement. Ce qui est délivré est une attestation de suivi, ni diplôme ni certification professionnelle."
      >
        <Input
          id="f-attestation"
          type="number"
          min={0}
          max={200}
          step="0.01"
          inputMode="decimal"
          value={v.attestationPrixEuros}
          onChange={(e) => set("attestationPrixEuros", e.target.value)}
          placeholder="Vide = pas en vente"
        />
      </Field>

      {/* ═══════════════ LA VITRINE PUBLIQUE ═══════════════
          Replié par défaut : rien ici n'est obligatoire pour enregistrer un
          programme, et ce sont pourtant ces champs qui font la différence
          entre une carte de catalogue qu'on survole et une fiche qu'on ouvre.
          Les laisser hors du formulaire — ce qui était le cas jusqu'au
          16/09/2026 — condamnait toute formation saisie à la main à rester
          plus pauvre qu'un atelier. */}
      <details className="rounded-xl border border-border p-3">
        <summary className="cursor-pointer text-sm font-semibold text-foreground">
          La vitrine publique (photo, ville, publics, méthode)
        </summary>
        <div className="mt-4 space-y-4">
          <Field
            label="Photo de la fiche"
            hint="Une seule suffit. Elle s’affiche sur la carte du catalogue et en tête de la fiche."
          >
            {v.images.length ? (
              <div className="mb-2 flex flex-wrap gap-2">
                {v.images.map((url, i) => (
                  <div
                    key={url}
                    className="relative size-20 overflow-hidden rounded-lg border border-border"
                  >
                    {/* Vignette locale : `next/image` refuserait une adresse
                        relative servie par le proxy, et 80 px n'ont pas besoin
                        d'être optimisés. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="size-full object-cover" />
                    <button
                      type="button"
                      aria-label={`Retirer la photo ${i + 1}`}
                      onClick={() =>
                        set(
                          "images",
                          v.images.filter((x) => x !== url),
                        )
                      }
                      className="absolute right-0.5 top-0.5 rounded-full bg-black/70 px-1.5 text-xs text-white"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {/*
              ⚠ FAMILLE « service », ET C'EST VOLONTAIRE. C'est la seule
              famille d'image de fiche qui soit PUBLIQUE
              (`FAMILLES_PUBLIQUES` dans `storage/files.service.ts`) : une
              photo déposée dans une autre famille répondrait 401 au visiteur
              non connecté du catalogue. Le nom de la famille dit le RÔLE —
              illustration publique d'une fiche —, pas la table.
            */}
            <FileUpload
              famille="service"
              label="Ajouter une photo"
              aide="ou glissez l’image ici · 5 Mo maximum"
              onChange={(f: FichierDepose | null) => {
                if (!f) return;
                set("images", [...v.images, `/api/proxy/public/images/${f.id}`]);
              }}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Ville"
              htmlFor="f-city"
              hint="Où la formation se déroule. Laissez vide si elle est en ligne."
            >
              <Input
                id="f-city"
                value={v.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Melun"
              />
            </Field>
            <Field
              label="Durée (minutes)"
              htmlFor="f-minutes"
              hint="Pour ce qui dure moins d’une heure. N’en remplissez qu’une des deux : heures ou minutes."
            >
              <Input
                id="f-minutes"
                type="number"
                min={1}
                value={v.durationMinutes}
                onChange={(e) => set("durationMinutes", e.target.value)}
                placeholder="45"
              />
            </Field>
          </div>

          <Field
            label="Publics concernés"
            hint="Sert au filtre du catalogue : cochez tout ce qui s’applique. Ce sont ceux qui SUIVENT la formation."
          >
            <div className="flex flex-wrap gap-2">
              {PUBLICS_FORMATION.map((pub) => {
                const actif = v.publicTargets.includes(pub);
                return (
                  <button
                    key={pub}
                    type="button"
                    aria-pressed={actif}
                    onClick={() =>
                      set(
                        "publicTargets",
                        actif
                          ? v.publicTargets.filter((x) => x !== pub)
                          : [...v.publicTargets, pub],
                      )
                    }
                    className={
                      actif
                        ? "rounded-full border border-primary bg-primary px-3 py-1 text-xs font-medium text-primary-foreground"
                        : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    }
                  >
                    {pub}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Méthodes mobilisées" htmlFor="f-methodology">
            <Textarea
              id="f-methodology"
              rows={2}
              value={v.methodology}
              onChange={(e) => set("methodology", e.target.value)}
              placeholder="Apports théoriques, études de cas, mises en situation…"
            />
          </Field>

          <Field
            label="Modalités d’évaluation"
            htmlFor="f-evaluation"
            hint="Attendu Qualiopi : comment on vérifie que l’objectif est atteint."
          >
            <Textarea
              id="f-evaluation"
              rows={2}
              value={v.evaluation}
              onChange={(e) => set("evaluation", e.target.value)}
              placeholder="Quiz d’autocorrection en fin de module, mise en situation commentée…"
            />
          </Field>

          <Field
            label="Questions fréquentes"
            hint="Chaque paire s’affiche en accordéon sur la fiche. Une paire incomplète est ignorée."
          >
            <div className="space-y-2">
              {v.faq.map((item, i) => (
                <div key={i} className="rounded-lg border border-border p-2">
                  <Input
                    aria-label={`Question ${i + 1}`}
                    value={item.question}
                    onChange={(e) =>
                      set(
                        "faq",
                        v.faq.map((f, j) =>
                          j === i ? { ...f, question: e.target.value } : f,
                        ),
                      )
                    }
                    placeholder="La formation est-elle vraiment gratuite ?"
                  />
                  <Textarea
                    aria-label={`Réponse ${i + 1}`}
                    rows={2}
                    className="mt-2"
                    value={item.answer}
                    onChange={(e) =>
                      set(
                        "faq",
                        v.faq.map((f, j) => (j === i ? { ...f, answer: e.target.value } : f)),
                      )
                    }
                    placeholder="Oui, du premier au dernier module."
                  />
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => set("faq", v.faq.filter((_, j) => j !== i))}
                    >
                      Retirer
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => set("faq", [...v.faq, { question: "", answer: "" }])}
              >
                Ajouter une question
              </Button>
            </div>
          </Field>

          {/*
            ⚠ LE MODE GRATUIT EN LIGNE BASCULE TOUTE LA FICHE : prix affiché
            « Gratuit », bouton unique vers l’adresse ci-dessous, ni session ni
            formulaire de devis. Cocher sans adresse donne un bouton qui ne
            mène nulle part — l’API le refuse, et le formulaire aussi.
          */}
          <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="size-4 rounded border-input accent-primary"
                checked={v.freeOnline}
                onChange={(e) => set("freeOnline", e.target.checked)}
              />
              Mini-formation gratuite, suivie en ligne
            </label>
            {v.freeOnline ? (
              <Field
                label="Adresse où la formation se suit"
                htmlFor="f-enroll"
                required
                hint="Sans elle, le seul bouton de la fiche publique ne mène nulle part."
              >
                <Input
                  id="f-enroll"
                  type="url"
                  value={v.enrollUrl}
                  onChange={(e) => set("enrollUrl", e.target.value)}
                  placeholder="https://toulali.teachizy.fr/formations/..."
                />
              </Field>
            ) : null}
          </div>
        </div>
      </details>

      <Field label="Catégorie">
        <Select
          value={v.categoryId || "__none"}
          onValueChange={(val) => set("categoryId", val === "__none" ? "" : val)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sans catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Sans catégorie</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {isInterne ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Une formation interne n'est ni éligible CPF ni certifiante.
        </p>
      ) : (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-input accent-primary"
              checked={v.cpfEligible}
              onChange={(e) => set("cpfEligible", e.target.checked)}
            />
            Éligible au CPF
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              className="size-4 rounded border-input accent-primary"
              checked={v.certifying}
              onChange={(e) => set("certifying", e.target.checked)}
            />
            Formation certifiante
          </label>
          {v.certifying ? (
            <Field
              label="Nom de la certification"
              htmlFor="f-certname"
              hint="Le code et l'intitulé officiels de la certification, ex. RS1234."
            >
              <Input
                id="f-certname"
                value={v.certificationName}
                onChange={(e) => set("certificationName", e.target.value)}
                placeholder="RS1234, Titre professionnel…"
              />
            </Field>
          ) : null}
        </div>
      )}

      {erreur ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {erreur}
        </p>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "…" : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
