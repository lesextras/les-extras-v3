"use client";

import { useCallback, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Trash2, Sun, Moon, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { createMissionFromRenfort } from "@/app/actions/marketplace";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUIStore } from "@/lib/stores/useUIStore";
import {
  METIERS_BY_CATEGORY,
  CATEGORY_LABELS,
  HOURLY_RATE_MIN,
  HOURLY_RATE_MAX,
  HOURLY_RATE_DEFAULT,
  MAX_SLOTS,
  TYPES_ETABLISSEMENTS,
  PUBLIC_CIBLE_OPTIONS,
  PERKS_OPTIONS,
  SKILLS_OPTIONS,
  TRANSMISSION_TIMES,
  getMetierLabel,
  type MetierCategory,
} from "@/lib/sos-config";
import {
  deriveMissionEnvelopeFromPlanning,
  getNormalizedMissionPlanning,
  sortMissionPlanning,
  validateMissionPlanning,
  type MissionPlanningLine,
  type RenfortPublicationMode,
} from "@/lib/mission-planning";
import { cn } from "@/lib/utils";

// ─── Schema ──────────────────────────────────────────────────────────────────

const CUSTOM_METIER_ID = "autre";
const OPERATING_FEE_RATE = 0.1;
const MIN_FREE_TEXT_LENGTH = 2;

function normalizeFreeText(value: string | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, " ");
}

function tagsMatch(left: string, right: string): boolean {
  return normalizeFreeText(left).toLocaleLowerCase("fr") === normalizeFreeText(right).toLocaleLowerCase("fr");
}

function appendUniqueTag(tags: string[], rawValue: string): string[] {
  const value = normalizeFreeText(rawValue);
  if (value.length < MIN_FREE_TEXT_LENGTH || tags.some((tag) => tagsMatch(tag, value))) return tags;
  return [...tags, value];
}

function uniqueTags(tags: string[]): string[] {
  return tags.reduce<string[]>((acc, tag) => appendUniqueTag(acc, tag), []);
}

function getResolvedMetierLabel(metier: string, customMetier?: string): string {
  const normalizedCustomMetier = normalizeFreeText(customMetier);
  if (metier === CUSTOM_METIER_ID && normalizedCustomMetier) {
    return normalizedCustomMetier;
  }

  return getMetierLabel(metier);
}

function getPlanningTotalHours(planning: MissionPlanningLine[]): number {
  const normalizedPlanning = getNormalizedMissionPlanning({ planning });
  const totalHours = normalizedPlanning.reduce(
    (sum, line) => sum + (line.end.getTime() - line.start.getTime()) / (1000 * 60 * 60),
    0,
  );

  return Math.round(totalHours * 100) / 100;
}

function getRenfortPricing(hourlyRate: number, planning: MissionPlanningLine[]) {
  const operatingFees = hourlyRate * OPERATING_FEE_RATE;
  const establishmentHourlyCost = hourlyRate + operatingFees;
  const totalHours = getPlanningTotalHours(planning);

  return {
    operatingFees,
    establishmentHourlyCost,
    totalEstimatedCost: establishmentHourlyCost * totalHours,
  };
}

function formatHourlyRate(value: number): string {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} € / h`;
}

function formatCurrency(value: number): string {
  return `${value.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

const planningLineSchema = z
  .object({
    dateStart: z.string().min(1, "Date de début requise"),
    heureDebut: z.string().min(1, "Heure de début requise"),
    dateEnd: z.string().min(1, "Date de fin requise"),
    heureFin: z.string().min(1, "Heure de fin requise"),
  });

const renfortSchema = z
  .object({
    // Step 0 — Profil
    metier: z.string().min(1, "Veuillez sélectionner un métier"),
    customMetier: z.string().optional(),
    diplomaRequired: z.boolean(),
    requiredSkills: z.array(z.string()),
    // Step 1 — Contexte
    establishmentType: z.string().min(1, "Type d'établissement requis"),
    targetPublic: z.array(z.string()).min(1, "Sélectionnez au moins un public"),
    unitSize: z.string().optional(),
    description: z.string().optional(),
    // Step 2 — Planification
    publicationMode: z.enum(["MULTI_MISSION_BATCH", "MULTI_DAY_SINGLE_BOOKING"]),
    planning: z.array(planningLineSchema).min(1, "Ajoutez au moins une plage").max(MAX_SLOTS),
    hasTransmissions: z.boolean(),
    transmissionTime: z.string().optional(),
    // Step 3 — Rémunération
    shift: z.enum(["JOUR", "NUIT"]),
    hourlyRate: z.number().min(HOURLY_RATE_MIN).max(HOURLY_RATE_MAX),
    perks: z.array(z.string()),
    // Step 4 — Localisation
    exactAddress: z.string().min(5, "Adresse complète requise"),
    zipCode: z.string().min(5, "Code postal requis"),
    city: z.string().min(2, "Ville requise"),
    accessInstructions: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.metier === CUSTOM_METIER_ID &&
      normalizeFreeText(data.customMetier).length < MIN_FREE_TEXT_LENGTH
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Précisez au moins 2 caractères pour le métier recherché",
        path: ["customMetier"],
      });
    }

    if (data.hasTransmissions && !data.transmissionTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le temps de relève est requis si les transmissions sont activées",
        path: ["transmissionTime"],
      });
    }

    const planningIssues = validateMissionPlanning(data.planning);
    for (const issue of planningIssues) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: issue.message,
        path: ["planning", issue.index, issue.field],
      });
    }
  });

type RenfortForm = z.infer<typeof renfortSchema>;

const STEPS = ["Profil", "Contexte", "Planification", "Rémunération", "Localisation", "Récap"] as const;

const STEP_FIELDS: Record<number, (keyof RenfortForm)[]> = {
  0: ["metier", "customMetier"],
  1: ["establishmentType", "targetPublic"],
  2: ["publicationMode", "planning", "hasTransmissions", "transmissionTime"],
  3: ["shift", "hourlyRate"],
  4: ["exactAddress", "zipCode", "city"],
  5: [],
};

// ─── Animations ───────────────────────────────────────────────────────────────

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// ─── Component ───────────────────────────────────────────────────────────────

export function RenfortModal() {
  const router = useRouter();
  const isOpen = useUIStore((state) => state.isRenfortModalOpen);
  const openRenfortModal = useUIStore((state) => state.openRenfortModal);
  const closeRenfortModal = useUIStore((state) => state.closeRenfortModal);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<RenfortForm>({
    resolver: zodResolver(renfortSchema),
    defaultValues: {
      metier: "",
      customMetier: "",
      diplomaRequired: true,
      requiredSkills: [],
      establishmentType: "",
      targetPublic: [],
      unitSize: "",
      description: "",
      publicationMode: "MULTI_MISSION_BATCH",
      planning: [{ dateStart: "", heureDebut: "", dateEnd: "", heureFin: "" }],
      hasTransmissions: false,
      transmissionTime: "",
      shift: "JOUR",
      hourlyRate: HOURLY_RATE_DEFAULT,
      perks: [],
      exactAddress: "",
      zipCode: "",
      city: "",
      accessInstructions: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "planning",
  });

  const step = useUIStore((state) => state.renfortStep) ?? 0;
  const setStep = useUIStore((state) => state.setRenfortStep);
  const dir = useUIStore((state) => state.renfortStepDir) ?? 1;
  const setDir = useUIStore((state) => state.setRenfortStepDir);

  const goNext = useCallback(async () => {
    const stepFields = STEP_FIELDS[step];
    const valid = await form.trigger(stepFields as (keyof RenfortForm)[]);
    if (!valid) return;
    setDir(1);
    setStep(step + 1);
  }, [form, step, setDir, setStep]);

  const goPrev = useCallback(() => {
    setDir(-1);
    setStep(step - 1);
  }, [step, setDir, setStep]);

  const handleClose = useCallback(() => {
    closeRenfortModal();
    setSubmitError(null);
    form.reset();
    setStep(0);
  }, [closeRenfortModal, form, setStep]);

  const onSubmit = form.handleSubmit(async (data) => {
    setSubmitError(null);
    try {
      const sortedPlanning = sortMissionPlanning(data.planning);
      const envelope = deriveMissionEnvelopeFromPlanning(sortedPlanning);
      if (!envelope) throw new Error("Au moins une plage valide est requise.");

      const metierLabel = getResolvedMetierLabel(data.metier, data.customMetier);
      const requiredSkills = uniqueTags(data.requiredSkills);
      const targetPublic = uniqueTags(data.targetPublic);

      const result = await createMissionFromRenfort({
        title: metierLabel,
        dateStart: envelope.dateStart,
        dateEnd: envelope.dateEnd,
        address: `${data.exactAddress}, ${data.zipCode} ${data.city}`,
        hourlyRate: data.hourlyRate,
        isRenfort: true,
        metier: data.metier,
        publicationMode: data.publicationMode,
        planning: sortedPlanning,
        shift: data.shift,
        city: data.city,
        zipCode: data.zipCode,
        description: data.description || undefined,
        establishmentType: data.establishmentType,
        targetPublic,
        unitSize: data.unitSize || undefined,
        requiredSkills,
        diplomaRequired: data.diplomaRequired,
        hasTransmissions: data.hasTransmissions,
        transmissionTime: data.transmissionTime || undefined,
        perks: data.perks,
        exactAddress: data.exactAddress,
        accessInstructions: data.accessInstructions || undefined,
      });

      if (!result.ok) {
        setSubmitError(result.error);
        toast.error(result.error);
        return;
      }

      toast.success("Renfort publié !", {
        description:
          data.publicationMode === "MULTI_MISSION_BATCH"
            ? `${metierLabel} · ${sortedPlanning.length} mission(s)`
            : `${metierLabel} · 1 mission sur ${sortedPlanning.length} plage(s)`,
      });

      handleClose();
      router.push("/dashboard/renforts");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de créer la demande.";
      setSubmitError(message);
      toast.error(message);
    }
  });

  const values = form.watch();

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) { openRenfortModal(); return; }
        handleClose();
      }}
    >
      <DialogContent className="sm:max-w-xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-lg font-bold">SOS Renfort</span>
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              Étape {step + 1} / {STEPS.length}
            </span>
          </DialogTitle>
          <DialogDescription>{STEPS[step]}</DialogDescription>
        </DialogHeader>

        {/* Barre de progression */}
        <div className="flex gap-1 mb-4">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                i <= step ? "bg-[hsl(var(--teal))]" : "bg-muted"
              )}
            />
          ))}
        </div>

        <form onSubmit={onSubmit}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="min-h-[300px] max-h-[60vh] overflow-y-auto pr-1"
            >
              {step === 0 && (
                <StepProfil
                  metier={values.metier}
                  customMetier={values.customMetier ?? ""}
                  onMetierChange={(id) => {
                    form.setValue("metier", id, { shouldValidate: true });
                    if (id !== CUSTOM_METIER_ID) {
                      form.setValue("customMetier", "");
                    }
                  }}
                  onCustomMetierChange={(value) =>
                    form.setValue("customMetier", value, { shouldValidate: values.metier === CUSTOM_METIER_ID })
                  }
                  diplomaRequired={values.diplomaRequired}
                  onDiplomaChange={(v) => form.setValue("diplomaRequired", v)}
                  requiredSkills={values.requiredSkills}
                  onSkillsChange={(v) => form.setValue("requiredSkills", v)}
                  errors={{
                    metier: form.formState.errors.metier?.message,
                    customMetier: form.formState.errors.customMetier?.message,
                  }}
                />
              )}

              {step === 1 && (
                <StepContext
                  establishmentType={values.establishmentType}
                  onTypeChange={(v) => form.setValue("establishmentType", v, { shouldValidate: true })}
                  targetPublic={values.targetPublic}
                  onPublicChange={(v) => form.setValue("targetPublic", v, { shouldValidate: true })}
                  unitSize={values.unitSize ?? ""}
                  onUnitSizeChange={(v) => form.setValue("unitSize", v)}
                  description={values.description ?? ""}
                  onDescriptionChange={(v) => form.setValue("description", v)}
                  errors={{
                    establishmentType: form.formState.errors.establishmentType?.message,
                    targetPublic: form.formState.errors.targetPublic?.message,
                  }}
                />
              )}

              {step === 2 && (
                <StepPlanification
                  publicationMode={values.publicationMode}
                  onPublicationModeChange={(v) =>
                    form.setValue("publicationMode", v, { shouldValidate: true })
                  }
                  fields={fields}
                  errors={form.formState.errors.planning}
                  transmissionError={form.formState.errors.transmissionTime?.message}
                  register={form.register}
                  onAdd={() => {
                    const currentPlanning = form.getValues("planning");
                    const lastLine = currentPlanning[currentPlanning.length - 1];
                    if (!lastLine) {
                      append({ dateStart: "", heureDebut: "", dateEnd: "", heureFin: "" });
                      return;
                    }

                    const nextStartDate = lastLine.dateStart
                      ? new Date(`${lastLine.dateStart}T12:00:00`)
                      : null;
                    const nextEndDate = lastLine.dateEnd
                      ? new Date(`${lastLine.dateEnd}T12:00:00`)
                      : null;

                    if (
                      nextStartDate &&
                      nextEndDate &&
                      !Number.isNaN(nextStartDate.getTime()) &&
                      !Number.isNaN(nextEndDate.getTime())
                    ) {
                      nextStartDate.setDate(nextStartDate.getDate() + 1);
                      nextEndDate.setDate(nextEndDate.getDate() + 1);
                      append({
                        dateStart: format(nextStartDate, "yyyy-MM-dd"),
                        heureDebut: lastLine.heureDebut,
                        dateEnd: format(nextEndDate, "yyyy-MM-dd"),
                        heureFin: lastLine.heureFin,
                      });
                      return;
                    }

                    append({
                      dateStart: "",
                      heureDebut: lastLine.heureDebut,
                      dateEnd: "",
                      heureFin: lastLine.heureFin,
                    });
                  }}
                  onRemove={remove}
                  hasTransmissions={values.hasTransmissions}
                  onTransmissionsChange={(v) => form.setValue("hasTransmissions", v)}
                  transmissionTime={values.transmissionTime ?? ""}
                  onTransmissionTimeChange={(v) => form.setValue("transmissionTime", v)}
                />
              )}

              {step === 3 && (
                <StepRemuneration
                  shift={values.shift}
                  onShiftChange={(v) => form.setValue("shift", v)}
                  hourlyRate={values.hourlyRate}
                  onRateChange={(v) => form.setValue("hourlyRate", v)}
                  planning={values.planning}
                  perks={values.perks}
                  onPerksChange={(v) => form.setValue("perks", v)}
                />
              )}

              {step === 4 && (
                <StepLocalisation
                  exactAddress={values.exactAddress}
                  zipCode={values.zipCode}
                  city={values.city}
                  accessInstructions={values.accessInstructions ?? ""}
                  onAddressChange={(v) => form.setValue("exactAddress", v, { shouldValidate: true })}
                  onZipChange={(v) => form.setValue("zipCode", v, { shouldValidate: true })}
                  onCityChange={(v) => form.setValue("city", v, { shouldValidate: true })}
                  onInstructionsChange={(v) => form.setValue("accessInstructions", v)}
                  errors={{
                    exactAddress: form.formState.errors.exactAddress?.message,
                    zipCode: form.formState.errors.zipCode?.message,
                    city: form.formState.errors.city?.message,
                  }}
                />
              )}

              {step === 5 && <StepRecap values={values} />}
            </motion.div>
          </AnimatePresence>

          {submitError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <p className="font-semibold">Publication impossible</p>
              <p className="mt-1">{submitError}</p>
            </div>
          )}

          {/* Footer navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={goPrev}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>

            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={goNext} className="gap-1">
                Suivant <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                variant="coral"
                disabled={form.formState.isSubmitting}
                className="gap-1"
              >
                {form.formState.isSubmitting ? (
                  "Publication..."
                ) : (
                  <>
                    <Check className="h-4 w-4" /> Publier le SOS
                  </>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Step 0 — Profil Recherché ────────────────────────────────────────────────

function StepProfil({
  metier, customMetier, onMetierChange, onCustomMetierChange,
  diplomaRequired, onDiplomaChange,
  requiredSkills, onSkillsChange,
  errors,
}: {
  metier: string;
  customMetier: string;
  onMetierChange: (id: string) => void;
  onCustomMetierChange: (value: string) => void;
  diplomaRequired: boolean;
  onDiplomaChange: (v: boolean) => void;
  requiredSkills: string[];
  onSkillsChange: (v: string[]) => void;
  errors: { metier?: string; customMetier?: string };
}) {
  const [customSkill, setCustomSkill] = useState("");

  const toggleSkill = (skill: string) => {
    const active = requiredSkills.some((selectedSkill) => tagsMatch(selectedSkill, skill));
    const next = active
      ? requiredSkills.filter((selectedSkill) => !tagsMatch(selectedSkill, skill))
      : appendUniqueTag(requiredSkills, skill);
    onSkillsChange(next);
  };

  const addCustomSkill = () => {
    const skill = normalizeFreeText(customSkill);
    if (skill.length < MIN_FREE_TEXT_LENGTH) return;
    onSkillsChange(appendUniqueTag(requiredSkills, skill));
    setCustomSkill("");
  };

  return (
    <div className="space-y-5">
      {/* Métier */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Métier recherché *</Label>
        {(Object.keys(METIERS_BY_CATEGORY) as MetierCategory[]).map((cat) => (
          <div key={cat}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {METIERS_BY_CATEGORY[cat].map((m) => {
                const Icon = m.icon;
                const selected = metier === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onMetierChange(m.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                      selected
                        ? "border-[hsl(var(--teal)/0.3)] bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal-text))] font-medium"
                        : "border-border hover:border-[hsl(var(--teal)/0.3)] hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="leading-tight">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {errors.metier && <p className="text-sm text-destructive">{errors.metier}</p>}
        {metier === CUSTOM_METIER_ID && (
          <div className="space-y-2">
            <Label htmlFor="customMetier" className="text-sm font-semibold">
              Précisez le métier recherché *
            </Label>
            <Input
              id="customMetier"
              value={customMetier}
              placeholder="Ex: Médiateur familial, ergothérapeute..."
              onChange={(event) => onCustomMetierChange(event.target.value)}
            />
            {errors.customMetier && (
              <p className="text-xs text-destructive">{errors.customMetier}</p>
            )}
          </div>
        )}
      </div>

      {/* Diplôme */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Diplôme exigé</Label>
        <div className="flex gap-2">
          {[
            { label: "Exigé", value: true },
            { label: "Non requis", value: false },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => onDiplomaChange(opt.value)}
              className={cn(
                "flex-1 rounded-lg border py-2 text-sm font-medium transition-colors",
                diplomaRequired === opt.value
                  ? "border-[hsl(var(--teal)/0.3)] bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal-text))]"
                  : "border-border hover:border-[hsl(var(--teal)/0.3)]"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compétences spécifiques */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Compétences spécifiques{" "}
          <span className="text-muted-foreground font-normal">(optionnel)</span>
        </Label>
        <div className="flex flex-wrap gap-2">
          {SKILLS_OPTIONS.map((skill) => {
            const active = requiredSkills.some((selectedSkill) => tagsMatch(selectedSkill, skill));
            return (
              <button
                key={skill}
                type="button"
                onClick={() => toggleSkill(skill)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-[hsl(var(--teal)/0.3)] bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal-text))]"
                    : "border-border hover:border-[hsl(var(--teal)/0.3)] hover:bg-muted"
                )}
              >
                {skill}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Input
            value={customSkill}
            placeholder="Ajouter une compétence"
            aria-label="Ajouter une compétence"
            onChange={(event) => setCustomSkill(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomSkill();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addCustomSkill}>
            Ajouter
          </Button>
        </div>
        {requiredSkills.length > 0 && (
          <SelectedTags
            tags={requiredSkills}
            onRemove={(tag) => onSkillsChange(requiredSkills.filter((skill) => skill !== tag))}
            ariaLabelPrefix="Retirer la compétence"
          />
        )}
      </div>
    </div>
  );
}

// ─── Step 1 — Contexte Mission ────────────────────────────────────────────────

function StepContext({
  establishmentType, onTypeChange,
  targetPublic, onPublicChange,
  unitSize, onUnitSizeChange,
  description, onDescriptionChange,
  errors,
}: {
  establishmentType: string;
  onTypeChange: (v: string) => void;
  targetPublic: string[];
  onPublicChange: (v: string[]) => void;
  unitSize: string;
  onUnitSizeChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  errors: { establishmentType?: string; targetPublic?: string };
}) {
  const [customPublic, setCustomPublic] = useState("");

  const togglePublic = (val: string) => {
    const active = targetPublic.some((selectedPublic) => tagsMatch(selectedPublic, val));
    const next = active
      ? targetPublic.filter((selectedPublic) => !tagsMatch(selectedPublic, val))
      : appendUniqueTag(targetPublic, val);
    onPublicChange(next);
  };

  const addCustomPublic = () => {
    const publicLabel = normalizeFreeText(customPublic);
    if (publicLabel.length < MIN_FREE_TEXT_LENGTH) return;
    onPublicChange(appendUniqueTag(targetPublic, publicLabel));
    setCustomPublic("");
  };

  return (
    <div className="space-y-5">
      {/* Type d'établissement */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Type d'établissement / Service *</Label>
        <Select value={establishmentType} onValueChange={onTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionnez un type..." />
          </SelectTrigger>
          <SelectContent>
            {TYPES_ETABLISSEMENTS.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.establishmentType && (
          <p className="text-xs text-destructive">{errors.establishmentType}</p>
        )}
      </div>

      {/* Public accompagné */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Public accompagné *</Label>
        <div className="flex flex-wrap gap-2">
          {PUBLIC_CIBLE_OPTIONS.map((pub) => {
            const active = targetPublic.some((selectedPublic) => tagsMatch(selectedPublic, pub));
            return (
              <button
                key={pub}
                type="button"
                onClick={() => togglePublic(pub)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-[hsl(var(--teal)/0.3)] bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal-text))]"
                    : "border-border hover:border-[hsl(var(--teal)/0.3)] hover:bg-muted"
                )}
              >
                {pub}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Input
            value={customPublic}
            placeholder="Ajouter un public"
            aria-label="Ajouter un public"
            onChange={(event) => setCustomPublic(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomPublic();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addCustomPublic}>
            Ajouter
          </Button>
        </div>
        {targetPublic.length > 0 && (
          <SelectedTags
            tags={targetPublic}
            onRemove={(tag) => onPublicChange(targetPublic.filter((publicItem) => publicItem !== tag))}
            ariaLabelPrefix="Retirer le public"
          />
        )}
        {errors.targetPublic && (
          <p className="text-xs text-destructive">{errors.targetPublic}</p>
        )}
      </div>

      {/* Taille unité */}
      <div className="space-y-2">
        <Label htmlFor="unitSize" className="text-sm font-semibold">
          Taille de l'unité{" "}
          <span className="text-muted-foreground font-normal">(optionnel)</span>
        </Label>
        <Input
          id="unitSize"
          value={unitSize}
          placeholder="Ex: Unité Alzheimer de 14 résidents"
          onChange={(e) => onUnitSizeChange(e.target.value)}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-semibold">
          Description / Tâches principales{" "}
          <span className="text-muted-foreground font-normal">(optionnel)</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          placeholder="Décrivez la journée type, le motif du remplacement..."
          rows={3}
          onChange={(e) => onDescriptionChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Step 2 — Planification ──────────────────────────────────────────────────

function StepPlanification({
  publicationMode,
  onPublicationModeChange,
  fields, errors, transmissionError, register, onAdd, onRemove,
  hasTransmissions, onTransmissionsChange,
  transmissionTime, onTransmissionTimeChange,
}: {
  publicationMode: RenfortPublicationMode;
  onPublicationModeChange: (value: RenfortPublicationMode) => void;
  fields: { id: string }[];
  errors: any;
  transmissionError?: string;
  register: any;
  onAdd: () => void;
  onRemove: (i: number) => void;
  hasTransmissions: boolean;
  onTransmissionsChange: (v: boolean) => void;
  transmissionTime: string;
  onTransmissionTimeChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Renseignez chaque plage avec un vrai début et une vraie fin. Une plage peut traverser minuit.
      </p>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Mode de publication</Label>
        <div className="grid grid-cols-1 gap-2">
          <button
            type="button"
            aria-pressed={publicationMode === "MULTI_MISSION_BATCH"}
            onClick={() => onPublicationModeChange("MULTI_MISSION_BATCH")}
            className={cn(
              "rounded-lg border px-3 py-3 text-left transition-colors",
              publicationMode === "MULTI_MISSION_BATCH"
                ? "border-[hsl(var(--teal)/0.3)] bg-[hsl(var(--teal)/0.15)]"
                : "border-border hover:border-[hsl(var(--teal)/0.3)] hover:bg-muted",
            )}
          >
            <p className="text-sm font-medium">Créer plusieurs missions indépendantes</p>
            <p className="text-xs text-muted-foreground">
              Chaque plage devient une mission séparée.
            </p>
          </button>
          <button
            type="button"
            aria-pressed={publicationMode === "MULTI_DAY_SINGLE_BOOKING"}
            onClick={() => onPublicationModeChange("MULTI_DAY_SINGLE_BOOKING")}
            className={cn(
              "rounded-lg border px-3 py-3 text-left transition-colors",
              publicationMode === "MULTI_DAY_SINGLE_BOOKING"
                ? "border-[hsl(var(--teal)/0.3)] bg-[hsl(var(--teal)/0.15)]"
                : "border-border hover:border-[hsl(var(--teal)/0.3)] hover:bg-muted",
            )}
          >
            <p className="text-sm font-medium">Créer une seule mission sur plusieurs plages</p>
            <p className="text-xs text-muted-foreground">
              Un seul intervenant couvre toutes les plages.
            </p>
          </button>
        </div>
      </div>

      {/* Créneaux */}
      <div className="space-y-3">
        {fields.map((field, i) => (
          <div key={field.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Plage {i + 1}</span>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label="Supprimer cette plage"
                  className="text-destructive hover:opacity-75 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2 rounded-lg border border-dashed p-3">
                <Label className="text-xs font-semibold">Début</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <Input type="date" {...register(`planning.${i}.dateStart`)} />
                    {errors?.[i]?.dateStart && (
                      <p className="text-xs text-destructive">{errors[i].dateStart.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Heure</Label>
                    <Input type="time" {...register(`planning.${i}.heureDebut`)} />
                    {errors?.[i]?.heureDebut && (
                      <p className="text-xs text-destructive">{errors[i].heureDebut.message}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-2 rounded-lg border border-dashed p-3">
                <Label className="text-xs font-semibold">Fin</Label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Date</Label>
                    <Input type="date" {...register(`planning.${i}.dateEnd`)} />
                    {errors?.[i]?.dateEnd && (
                      <p className="text-xs text-destructive">{errors[i].dateEnd.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Heure</Label>
                    <Input type="time" {...register(`planning.${i}.heureFin`)} />
                    {errors?.[i]?.heureFin && (
                      <p className="text-xs text-destructive">{errors[i].heureFin.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {errors?.[i]?.root?.message && (
              <p className="text-xs text-destructive">{errors[i].root.message}</p>
            )}
            {errors?.[i]?.message && (
              <p className="text-xs text-destructive">{errors[i].message}</p>
            )}
          </div>
        ))}

        {fields.length < MAX_SLOTS && (
          <Button type="button" variant="outline" size="sm" onClick={onAdd} className="w-full gap-2">
            <Plus className="h-4 w-4" /> Ajouter un jour
          </Button>
        )}
      </div>

      <div className="rounded-lg border p-3 bg-muted/20">
        <p className="text-sm font-medium">
          {publicationMode === "MULTI_MISSION_BATCH"
            ? `${fields.length} mission(s) séparée(s) seront créées.`
            : "Une seule mission sera créée pour toutes les plages."}
        </p>
        <p className="text-xs text-muted-foreground">
          {publicationMode === "MULTI_MISSION_BATCH"
            ? "Chaque plage pourra être attribuée séparément."
            : "Un seul intervenant couvrira toutes les plages ci-dessus."}
        </p>
      </div>

      {/* Transmissions */}
      <div className="rounded-lg border p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Temps de transmissions (relève)</p>
            <p className="text-xs text-muted-foreground">Inclure un temps de relève avant le début</p>
          </div>
          <Switch checked={hasTransmissions} onCheckedChange={onTransmissionsChange} />
        </div>

        {hasTransmissions && (
          <div className="space-y-1">
            <Label className="text-xs">Durée de la relève</Label>
            <Select value={transmissionTime} onValueChange={onTransmissionTimeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez..." />
              </SelectTrigger>
              <SelectContent>
                {TRANSMISSION_TIMES.map((t) => (
                  <SelectItem key={t} value={t}>{t} avant le shift</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {transmissionError && (
              <p className="text-xs text-destructive">{transmissionError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 3 — Rémunération & Avantages ───────────────────────────────────────

function StepRemuneration({
  shift, onShiftChange,
  hourlyRate, onRateChange,
  planning,
  perks, onPerksChange,
}: {
  shift: "JOUR" | "NUIT";
  onShiftChange: (v: "JOUR" | "NUIT") => void;
  hourlyRate: number;
  onRateChange: (v: number) => void;
  planning: MissionPlanningLine[];
  perks: string[];
  onPerksChange: (v: string[]) => void;
}) {
  const pricing = getRenfortPricing(hourlyRate, planning);

  const togglePerk = (id: string) => {
    const next = perks.includes(id) ? perks.filter((p) => p !== id) : [...perks, id];
    onPerksChange(next);
  };

  return (
    <div className="space-y-6">
      {/* Shift */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Type de poste</Label>
        <div className="flex gap-3">
          {(["JOUR", "NUIT"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onShiftChange(s)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-colors",
                shift === s
                  ? "border-[hsl(var(--teal)/0.3)] bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal-text))]"
                  : "border-border hover:border-[hsl(var(--teal)/0.3)]"
              )}
            >
              {s === "JOUR" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {s === "JOUR" ? "Jour" : "Nuit"}
            </button>
          ))}
        </div>
      </div>

      {/* Taux horaire */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <Label className="text-sm font-semibold">
            Tarif proposé au freelance — TTC / heure
          </Label>
          <span className="text-lg font-bold text-[hsl(var(--teal-text))]">
            {formatHourlyRate(hourlyRate)}
          </span>
        </div>
        <input
          type="range"
          min={HOURLY_RATE_MIN}
          max={HOURLY_RATE_MAX}
          step={1}
          value={hourlyRate}
          onChange={(e) => onRateChange(Number(e.target.value))}
          aria-label={`Tarif proposé au freelance TTC : ${formatHourlyRate(hourlyRate)}`}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{HOURLY_RATE_MIN} €</span>
          <span>{HOURLY_RATE_MAX} €</span>
        </div>
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Tarif freelance TTC / h</span>
            <span className="font-medium">{formatHourlyRate(hourlyRate)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Frais de fonctionnement 10 %</span>
            <span className="font-medium">{formatHourlyRate(pricing.operatingFees)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Coût établissement TTC / h</span>
            <span className="font-medium">{formatHourlyRate(pricing.establishmentHourlyCost)}</span>
          </div>
          <div className="flex justify-between gap-3 border-t pt-2">
            <span className="font-semibold">Montant total estimé TTC</span>
            <span className="font-bold text-[hsl(var(--teal-text))]">
              {formatCurrency(pricing.totalEstimatedCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Avantages pratiques */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">
          Avantages pratiques{" "}
          <span className="text-muted-foreground font-normal">(optionnel)</span>
        </Label>
        <div className="grid grid-cols-1 gap-2">
          {PERKS_OPTIONS.map((perk) => {
            const active = perks.includes(perk.id);
            return (
              <button
                key={perk.id}
                type="button"
                onClick={() => togglePerk(perk.id)}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                  active
                    ? "border-[hsl(var(--teal)/0.3)] bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal-text))] font-medium"
                    : "border-border hover:border-[hsl(var(--teal)/0.3)] hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "h-4 w-4 rounded-sm border shrink-0 flex items-center justify-center",
                    active ? "border-[hsl(var(--teal))] bg-[hsl(var(--teal))] text-white" : "border-border"
                  )}
                >
                  {active && <Check className="h-3 w-3" />}
                </span>
                {perk.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Step 4 — Localisation & Accès ───────────────────────────────────────────

function StepLocalisation({
  exactAddress, zipCode, city, accessInstructions,
  onAddressChange, onZipChange, onCityChange, onInstructionsChange,
  errors,
}: {
  exactAddress: string;
  zipCode: string;
  city: string;
  accessInstructions: string;
  onAddressChange: (v: string) => void;
  onZipChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onInstructionsChange: (v: string) => void;
  errors: { exactAddress?: string; zipCode?: string; city?: string };
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Indiquez l'adresse précise pour que le talent sache exactement où se rendre.
      </p>

      <div className="space-y-2">
        <Label htmlFor="exactAddress">Adresse complète *</Label>
        <Input
          id="exactAddress"
          value={exactAddress}
          placeholder="Ex: 12 rue des Lilas"
          onChange={(e) => onAddressChange(e.target.value)}
        />
        {errors.exactAddress && <p className="text-xs text-destructive">{errors.exactAddress}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="renfort-zip">Code postal *</Label>
          <Input
            id="renfort-zip"
            value={zipCode}
            placeholder="69003"
            maxLength={5}
            onChange={(e) => onZipChange(e.target.value)}
          />
          {errors.zipCode && <p className="text-xs text-destructive">{errors.zipCode}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="renfort-city">Ville *</Label>
          <Input
            id="renfort-city"
            value={city}
            placeholder="Lyon"
            onChange={(e) => onCityChange(e.target.value)}
          />
          {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="accessInstructions">
          Instructions d'accès{" "}
          <span className="text-muted-foreground font-normal">(optionnel)</span>
        </Label>
        <Textarea
          id="accessInstructions"
          value={accessInstructions}
          placeholder="Ex: Code portail 1234, sonner à l'interphone infirmier, se garer sur les places visiteurs"
          rows={3}
          onChange={(e) => onInstructionsChange(e.target.value)}
        />
      </div>
    </div>
  );
}

// ─── Step 5 — Récapitulatif ──────────────────────────────────────────────────

function StepRecap({ values }: { values: RenfortForm }) {
  const metierLabel = getResolvedMetierLabel(values.metier, values.customMetier);
  const perksMap = Object.fromEntries(PERKS_OPTIONS.map((p) => [p.id, p.label]));
  const sortedPlanning = getNormalizedMissionPlanning({ planning: values.planning });
  const pricing = getRenfortPricing(values.hourlyRate, values.planning);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Vérifiez les informations avant de publier.</p>
      <div className="rounded-lg border divide-y text-sm">
        {/* Profil */}
        <SectionHeader label="Profil" />
        <Row label="Métier recherché" value={metierLabel} />
        <Row label="Diplôme" value={values.diplomaRequired ? "Exigé" : "Non requis"} />
        {values.requiredSkills.length > 0 && (
          <RowTags label="Compétences" tags={values.requiredSkills} />
        )}

        {/* Contexte */}
        <SectionHeader label="Contexte" />
        <Row label="Établissement" value={values.establishmentType} />
        <RowTags label="Public" tags={values.targetPublic} />
        {values.unitSize && <Row label="Unité" value={values.unitSize} />}

        {/* Planification */}
        <SectionHeader label="Planification" />
        <Row
          label="Publication"
          value={
            values.publicationMode === "MULTI_MISSION_BATCH"
              ? `${values.planning.length} mission(s) séparée(s)`
              : "1 mission sur plusieurs plages"
          }
        />
        {sortedPlanning.map((line, i) => (
          <Row
            key={line.key}
            label={`Plage ${i + 1}`}
            value={`${format(line.start, "EEE d MMM yyyy", { locale: fr })} ${line.heureDebut} → ${format(line.end, "EEE d MMM yyyy", { locale: fr })} ${line.heureFin}`}
          />
        ))}
        {values.hasTransmissions && (
          <Row
            label="Relève"
            value={values.transmissionTime ? `${values.transmissionTime} avant` : "Oui"}
          />
        )}

        {/* Rémunération */}
        <SectionHeader label="Rémunération" />
        <Row label="Poste" value={values.shift === "JOUR" ? "Jour" : "Nuit"} />
        <Row label="Tarif freelance TTC / h" value={formatHourlyRate(values.hourlyRate)} />
        <Row label="Frais de fonctionnement 10 %" value={formatHourlyRate(pricing.operatingFees)} />
        <Row
          label="Coût établissement TTC / h"
          value={formatHourlyRate(pricing.establishmentHourlyCost)}
        />
        <Row label="Montant total estimé TTC" value={formatCurrency(pricing.totalEstimatedCost)} />
        {values.perks.length > 0 && (
          <RowTags label="Avantages" tags={values.perks.map((id) => perksMap[id] ?? id)} />
        )}

        {/* Localisation */}
        <SectionHeader label="Localisation" />
        <Row
          label="Adresse"
          value={`${values.exactAddress}, ${values.zipCode} ${values.city}`}
        />
        {values.accessInstructions && (
          <Row label="Accès" value={values.accessInstructions} />
        )}
      </div>
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-3 py-1.5 bg-muted/50">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-3 py-2 gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

function SelectedTags({
  tags,
  onRemove,
  ariaLabelPrefix,
}: {
  tags: string[];
  onRemove: (tag: string) => void;
  ariaLabelPrefix: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
          <span>{tag}</span>
          <button
            type="button"
            onClick={() => onRemove(tag)}
            aria-label={`${ariaLabelPrefix} ${tag}`}
            className="rounded-full px-1 text-muted-foreground hover:text-foreground"
          >
            x
          </button>
        </Badge>
      ))}
    </div>
  );
}

function RowTags({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div className="flex items-start justify-between px-3 py-2 gap-2">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1 justify-end">
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="text-xs">
            {t}
          </Badge>
        ))}
      </div>
    </div>
  );
}
