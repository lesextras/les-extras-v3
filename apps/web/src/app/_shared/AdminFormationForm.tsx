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
  const isInterne = v.type === "INTERNE";

  function set<K extends keyof FormationFormValues>(k: K, val: FormationFormValues[K]) {
    setV((prev) => ({ ...prev, [k]: val }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
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
        hint="Laissez vide pour ne rien vendre : le bouton d’achat n’apparaît alors pas sur la fiche publique. Un montant ouvre la vente pour ce parcours uniquement. Ce qui est délivré est une attestation de suivi — ni diplôme, ni certification professionnelle."
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
