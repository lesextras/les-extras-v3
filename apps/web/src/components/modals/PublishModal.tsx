"use client";

import { useState, useTransition } from "react";
import { type FieldErrors, type Resolver, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { createServiceFromPublish } from "@/app/actions/marketplace";
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
import { useUIStore } from "@/lib/stores/useUIStore";
import {
  ATELIER_CATEGORIES,
  PUBLIC_CIBLE_OPTIONS,
  PRICING_TYPE_OPTIONS,
  DURATION_OPTIONS,
  MAX_SERVICE_SLOTS,
  getCategoryLabel,
  getPublicCibleLabels,
  formatDuration,
} from "@/lib/atelier-config";

// ─── Schema ──────────────────────────────────────────────────────────────────

const slotSchema = z
  .object({
    date: z.string(),
    heureDebut: z.string().min(1, "Heure de début requise"),
    heureFin: z.string().min(1, "Heure de fin requise"),
  })
  .refine((s) => !s.heureDebut || !s.heureFin || s.heureFin > s.heureDebut, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ["heureFin"],
  });

const optionalPriceSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    if (typeof value === "number" && Number.isNaN(value)) {
      return undefined;
    }

    return value;
  },
  z.number().min(0).optional(),
);

const publishSchema = z
  .object({
    type: z.enum(["WORKSHOP", "TRAINING"]),
    category: z.string().min(1, "Sélectionnez une catégorie"),
    title: z.string().min(3, "Titre trop court (min 3 caractères)"),
    description: z.string().min(20, "Description trop courte (min 20 caractères)"),
    imageUrl: z.string().optional(),
    objectives: z.string().optional(),
    methodology: z.string().optional(),
    evaluation: z.string().optional(),
    durationMinutes: z.number().min(30),
    capacity: z.number().int().min(1),
    publicCible: z.array(z.string()).min(1, "Sélectionnez au moins un public"),
    materials: z.string().optional(),
    pricingType: z.enum(["SESSION", "PER_PARTICIPANT", "QUOTE"]),
    price: optionalPriceSchema,
    pricePerParticipant: optionalPriceSchema,
    slots: z.array(slotSchema).max(MAX_SERVICE_SLOTS),
    scheduleInfo: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.pricingType === "SESSION" && (data.price ?? 0) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Veuillez saisir un tarif",
        path: ["price"],
      });
    }

    if (data.pricingType === "PER_PARTICIPANT" && (data.pricePerParticipant ?? 0) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Veuillez saisir un tarif par participant",
        path: ["pricePerParticipant"],
      });
    }

    const hasDatedSlot = data.slots.some((slot) => slot.date && slot.date.length > 0);
    const hasScheduleInfo = (data.scheduleInfo ?? "").trim().length > 0;
    if (!hasDatedSlot && !hasScheduleInfo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ajoutez au moins un créneau daté ou décrivez votre planning",
        path: ["scheduleInfo"],
      });
    }
  });

type PublishForm = z.infer<typeof publishSchema>;

const STEPS = ["Type", "Description", "Pédagogie", "Participants", "Tarif", "Créneaux"] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

const STEP_FIELDS: Record<StepIndex, (keyof PublishForm)[]> = {
  0: ["type", "category"],
  1: ["title", "description"],
  2: ["objectives", "methodology", "evaluation"],
  3: ["durationMinutes", "capacity", "publicCible", "materials"],
  4: ["pricingType", "price", "pricePerParticipant"],
  5: ["scheduleInfo", "slots"],
};

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
};

const DAYS_OF_WEEK = [
  { id: "lu", label: "Lu" },
  { id: "ma", label: "Ma" },
  { id: "me", label: "Me" },
  { id: "je", label: "Je" },
  { id: "ve", label: "Ve" },
  { id: "sa", label: "Sa" },
  { id: "di", label: "Di" },
];

const DAY_LABELS: Record<string, string> = {
  lu: "Lundi", ma: "Mardi", me: "Mercredi", je: "Jeudi",
  ve: "Vendredi", sa: "Samedi", di: "Dimanche",
};

function collectStepErrorMessages(step: StepIndex, errors: FieldErrors<PublishForm>): string[] {
  const messages: string[] = [];
  const pushMessage = (value: unknown) => {
    if (typeof value === "string" && value.trim().length > 0 && !messages.includes(value)) {
      messages.push(value);
    }
  };

  if (step === 0) {
    pushMessage(errors.type?.message);
    pushMessage(errors.category?.message);
  }

  if (step === 1) {
    pushMessage(errors.title?.message);
    pushMessage(errors.description?.message);
  }

  if (step === 3) {
    pushMessage(errors.capacity?.message);
    pushMessage(errors.publicCible?.message);
  }

  if (step === 4) {
    pushMessage(errors.price?.message);
    pushMessage(errors.pricePerParticipant?.message);
  }

  if (step === 5) {
    pushMessage(errors.scheduleInfo?.message);
    const slotErrors = Array.isArray(errors.slots) ? errors.slots : [];
    slotErrors.forEach((slotError) => {
      pushMessage(slotError?.date?.message);
      pushMessage(slotError?.heureDebut?.message);
      pushMessage(slotError?.heureFin?.message);
    });
  }

  return messages;
}

function focusPublishStepError(step: StepIndex, errors: FieldErrors<PublishForm>) {
  const selectors: string[] = [];

  if (step === 0) {
    if (errors.type) selectors.push('[data-field="type"] button');
    if (errors.category) selectors.push('[data-field="category"] button');
  }

  if (step === 1) {
    if (errors.title) selectors.push("#pub-title");
    if (errors.description) selectors.push("#pub-desc");
  }

  if (step === 3) {
    if (errors.capacity) selectors.push("#pub-cap");
    if (errors.publicCible) selectors.push('[data-field="publicCible"] button');
  }

  if (step === 4) {
    if (errors.price) selectors.push("#pub-price");
    if (errors.pricePerParticipant) selectors.push("#pub-ppp");
    if (errors.pricingType) selectors.push('[data-field="pricingType"] button');
  }

  if (step === 5) {
    const slotErrors = Array.isArray(errors.slots) ? errors.slots : [];
    const firstSlotIndex = slotErrors.findIndex((slotError) =>
      Boolean(slotError?.date || slotError?.heureDebut || slotError?.heureFin),
    );

    if (firstSlotIndex >= 0) {
      const slotError = slotErrors[firstSlotIndex];
      if (slotError?.date) selectors.push(`input[name="slots.${firstSlotIndex}.date"]`);
      if (slotError?.heureDebut) selectors.push(`input[name="slots.${firstSlotIndex}.heureDebut"]`);
      if (slotError?.heureFin) selectors.push(`input[name="slots.${firstSlotIndex}.heureFin"]`);
    }

    if (errors.scheduleInfo) {
      selectors.push('[data-field="scheduleMode"] button');
      selectors.push("#pub-schedule");
      selectors.push('input[name="slots.0.date"]');
    }
  }

  const target = selectors
    .map((selector) => document.querySelector<HTMLElement>(selector))
    .find(Boolean);

  if (target) {
    requestAnimationFrame(() => target.focus());
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PublishModal() {
  const router = useRouter();
  const isOpen = useUIStore((s) => s.isPublishModalOpen);
  const openPublishModal = useUIStore((s) => s.openPublishModal);
  const closePublishModal = useUIStore((s) => s.closePublishModal);
  const [isPending, startTransition] = useTransition();
  const [stepErrors, setStepErrors] = useState<string[]>([]);
  const [scheduleMode, setScheduleMode] = useState<"specific" | "weekly" | "free">("specific");
  const [weeklyDays, setWeeklyDays] = useState<string[]>([]);
  const [weeklyStart, setWeeklyStart] = useState("09:00");
  const [weeklyEnd, setWeeklyEnd] = useState("11:00");

  const form = useForm<PublishForm>({
    resolver: zodResolver(publishSchema) as Resolver<PublishForm>,
    defaultValues: {
      type: "WORKSHOP",
      category: "",
      title: "",
      description: "",
      objectives: "",
      methodology: "",
      evaluation: "",
      durationMinutes: 120,
      capacity: 15,
      publicCible: [],
      materials: "",
      pricingType: "SESSION",
      price: undefined,
      pricePerParticipant: undefined,
      slots: [{ date: "", heureDebut: "09:00", heureFin: "11:00" }],
      imageUrl: "",
      scheduleInfo: "",
    },
  });

  const { fields: slotFields, append: appendSlot, remove: removeSlot } = useFieldArray({
    control: form.control,
    name: "slots",
  });

  function updateWeeklySchedule(days: string[], start: string, end: string) {
    if (days.length > 0) {
      const dayNames = days.map((d) => DAY_LABELS[d] ?? d).join(", ");
      form.setValue("scheduleInfo", `${dayNames} de ${start} à ${end}`, { shouldValidate: true });
    } else {
      form.setValue("scheduleInfo", "", { shouldValidate: true });
    }
  }

  const [step, setStep] = useFormStep();
  const [dir, setDir] = useDir();

  const goNext = async () => {
    const fields = STEP_FIELDS[step];
    const valid = await form.trigger(fields);
    if (!valid) {
      const messages = collectStepErrorMessages(step, form.formState.errors);
      setStepErrors(
        messages.length > 0 ? messages : ["Complétez les champs requis avant de continuer."],
      );
      focusPublishStepError(step, form.formState.errors);
      return;
    }

    setStepErrors([]);
    setDir(1);
    setStep((s) => (Math.min(s + 1, STEPS.length - 1) as StepIndex));
  };

  const goPrev = () => {
    setStepErrors([]);
    setDir(-1);
    setStep((s) => (Math.max(s - 1, 0) as StepIndex));
  };

  const handleClose = () => {
    closePublishModal();
    setTimeout(() => {
      form.reset();
      setStep(0);
      setScheduleMode("specific");
      setWeeklyDays([]);
      setWeeklyStart("09:00");
      setWeeklyEnd("11:00");
      setStepErrors([]);
    }, 300);
  };

  function handleSaveAs(targetStatus: "ACTIVE" | "DRAFT") {
    form.handleSubmit(
      (data) => {
        setStepErrors([]);
        startTransition(async () => {
          try {
            await createServiceFromPublish({
              type: data.type,
              title: data.title,
              description: data.description,
              price: data.pricingType === "SESSION" ? (data.price ?? 0) : 0,
              capacity: data.capacity,
              pricingType: data.pricingType,
              pricePerParticipant: data.pricePerParticipant,
              durationMinutes: data.durationMinutes,
              category: data.category,
              publicCible: data.publicCible,
              materials: data.materials || undefined,
              objectives: data.objectives || undefined,
              methodology: data.methodology || undefined,
              evaluation: data.evaluation || undefined,
              imageUrl: data.imageUrl || undefined,
              scheduleInfo: data.scheduleInfo || undefined,
              slots: data.slots.filter(
                (slot: PublishForm["slots"][number]) => slot.date && slot.date.length > 0,
              ),
              status: targetStatus,
            });
            const label = data.type === "WORKSHOP" ? "Atelier" : "Formation";
            const suffix = data.type === "TRAINING" ? "e" : "";
            toast.success(
              targetStatus === "DRAFT"
                ? `${label} enregistré${suffix} en brouillon.`
                : `${label} publié${suffix} avec succès !`,
            );
            handleClose();
            router.push(targetStatus === "DRAFT" ? "/dashboard/ateliers" : "/marketplace");
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Impossible de soumettre l'offre.");
          }
        });
      },
      () => {
        const messages = collectStepErrorMessages(step, form.formState.errors);
        setStepErrors(
          messages.length > 0 ? messages : ["Corrigez les champs signalés avant de continuer."],
        );
        focusPublishStepError(step, form.formState.errors);
      },
    )();
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSaveAs("ACTIVE");
  };

  const values = form.watch();
  const isLastStep = step === STEPS.length - 1;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) { openPublishModal(); return; }
        handleClose();
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Publier {values.type === "WORKSHOP" ? "un atelier" : "une formation"}
          </DialogTitle>
          <DialogDescription>
            Étape {step + 1} sur {STEPS.length} — {STEPS[step]}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-1 mb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors shrink-0 ${
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                    ? "bg-[hsl(var(--color-teal-100))] text-[hsl(var(--color-teal-700))] border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 ${i < step ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="relative overflow-hidden">
          {stepErrors.length > 0 && (
            <div
              className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {stepErrors.map((message) => (
                <p key={message}>{message}</p>
              ))}
            </div>
          )}

          <AnimatePresence custom={dir} mode="wait">
            <motion.div
              key={step}
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="space-y-4 py-2"
            >
              {/* ── Étape 0: Type + Catégorie ── */}
              {step === 0 && (
                <>
                  <div className="space-y-2">
                    <Label>Type d&apos;offre</Label>
                    <div className="grid grid-cols-2 gap-3" data-field="type">
                      {(["WORKSHOP", "TRAINING"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => form.setValue("type", t, { shouldValidate: true })}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                            values.type === t
                              ? "border-primary bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))]"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          {t === "WORKSHOP" ? "🎨 Atelier" : "📚 Formation"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <div className="grid grid-cols-2 gap-2" data-field="category">
                      {ATELIER_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => form.setValue("category", cat.id, { shouldValidate: true })}
                            className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm transition-colors text-left ${
                              values.category === cat.id
                                ? "border-primary bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))]"
                                : "border-border hover:border-muted-foreground/30"
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="leading-tight">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {form.formState.errors.category && (
                      <p className="text-xs text-red-500">{form.formState.errors.category.message}</p>
                    )}
                  </div>
                </>
              )}

              {/* ── Étape 1: Titre + Description + Image ── */}
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pub-title">
                      Titre de {values.type === "TRAINING" ? "la formation" : "l'atelier"}
                    </Label>
                    <Input
                      id="pub-title"
                      {...form.register("title")}
                      placeholder={
                        values.type === "TRAINING"
                          ? "Ex : Formation gestion des émotions pour professionnels"
                          : "Ex : Atelier gestion des émotions pour adolescents"
                      }
                    />
                    {form.formState.errors.title && (
                      <p className="text-xs text-red-500">{form.formState.errors.title.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pub-desc">Description générale</Label>
                    <Textarea
                      id="pub-desc"
                      {...form.register("description")}
                      placeholder={`Présentez votre ${values.type === "TRAINING" ? "formation" : "atelier"} en quelques phrases...`}
                      rows={4}
                    />
                    {form.formState.errors.description && (
                      <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pub-img">
                      Image de couverture{" "}
                      <span className="text-muted-foreground font-normal">(URL, optionnel)</span>
                    </Label>
                    <Input
                      id="pub-img"
                      type="url"
                      {...form.register("imageUrl")}
                      placeholder="https://..."
                    />
                  </div>
                </>
              )}

              {/* ── Étape 2: Sections pédagogiques ── */}
              {step === 2 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Ces sections sont optionnelles mais rassurent les établissements.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="pub-obj">Objectifs</Label>
                    <Textarea
                      id="pub-obj"
                      {...form.register("objectives")}
                      placeholder="Quels sont les objectifs pédagogiques ?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pub-method">Méthodologie</Label>
                    <Textarea
                      id="pub-method"
                      {...form.register("methodology")}
                      placeholder="Comment se déroule l'atelier ?"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pub-eval">Évaluation</Label>
                    <Textarea
                      id="pub-eval"
                      {...form.register("evaluation")}
                      placeholder="Comment évaluez-vous les résultats ?"
                      rows={3}
                    />
                  </div>
                </>
              )}

              {/* ── Étape 3: Participants & public ── */}
              {step === 3 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pub-dur">Durée</Label>
                      <select
                        id="pub-dur"
                        title="Durée de l'atelier"
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={values.durationMinutes}
                        onChange={(e) => form.setValue("durationMinutes", Number(e.target.value))}
                      >
                        {DURATION_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pub-cap">Capacité max</Label>
                      <Input
                        id="pub-cap"
                        type="number"
                        min={1}
                        {...form.register("capacity", { valueAsNumber: true })}
                      />
                      {form.formState.errors.capacity && (
                        <p className="text-xs text-red-500">{form.formState.errors.capacity.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Public cible</Label>
                    <div className="flex flex-wrap gap-2" data-field="publicCible">
                      {PUBLIC_CIBLE_OPTIONS.map((p) => {
                        const selected = values.publicCible?.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              const current = values.publicCible ?? [];
                              form.setValue(
                                "publicCible",
                                selected ? current.filter((x) => x !== p.id) : [...current, p.id],
                                { shouldValidate: true },
                              );
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              selected
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:border-muted-foreground/50"
                            }`}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                    {form.formState.errors.publicCible && (
                      <p className="text-xs text-red-500">{form.formState.errors.publicCible.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pub-mat">Matériel fourni (optionnel)</Label>
                    <Input
                      id="pub-mat"
                      {...form.register("materials")}
                      placeholder="Ex : Feutres, papier, support pédagogique…"
                    />
                  </div>
                </>
              )}

              {/* ── Étape 4: Tarification ── */}
              {step === 4 && (
                <>
                  <div className="space-y-3" data-field="pricingType">
                    {PRICING_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => form.setValue("pricingType", opt.id, { shouldValidate: true })}
                        className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                          values.pricingType === opt.id
                            ? "border-primary bg-[hsl(var(--color-teal-50))]"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                            values.pricingType === opt.id ? "border-primary" : "border-border"
                          }`}
                        >
                          {values.pricingType === opt.id && (
                            <div className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {values.pricingType === "SESSION" && (
                    <div className="space-y-2">
                      <Label htmlFor="pub-price">Tarif forfaitaire (€)</Label>
                      <Input
                        id="pub-price"
                        type="number"
                        min={0}
                        step={10}
                        {...form.register("price", { valueAsNumber: true })}
                        placeholder="Ex : 350"
                      />
                      {form.formState.errors.price && (
                        <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>
                      )}
                    </div>
                  )}

                  {values.pricingType === "PER_PARTICIPANT" && (
                    <div className="space-y-2">
                      <Label htmlFor="pub-ppp">Tarif par participant (€)</Label>
                      <Input
                        id="pub-ppp"
                        type="number"
                        min={0}
                        step={5}
                        {...form.register("pricePerParticipant", { valueAsNumber: true })}
                        placeholder="Ex : 25"
                      />
                      {form.formState.errors.pricePerParticipant && (
                        <p className="text-xs text-red-500">{form.formState.errors.pricePerParticipant.message}</p>
                      )}
                    </div>
                  )}

                  {values.pricingType === "QUOTE" && (
                    <div className="rounded-lg bg-[hsl(var(--color-amber-50))] border border-[hsl(var(--color-amber-200)/0.4)] p-4 text-sm text-[hsl(var(--color-amber-700))]">
                      Le tarif sera défini après échange avec l&apos;établissement. Vous recevrez une demande et pourrez rédiger votre devis directement dans l&apos;application.
                    </div>
                  )}
                </>
              )}

              {/* ── Étape 5: Créneaux + Récap ── */}
              {step === 5 && (
                <>
                  {/* Mode selector */}
                  <div className="space-y-2">
                    <Label>Mode de planification</Label>
                    <div className="grid grid-cols-3 gap-2" data-field="scheduleMode">
                      {(["specific", "weekly", "free"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setScheduleMode(mode);
                            form.setValue("scheduleInfo", "", { shouldValidate: true });
                            if (mode === "weekly") setWeeklyDays([]);
                          }}
                          className={`p-2.5 rounded-xl border-2 text-xs font-medium transition-colors ${
                            scheduleMode === mode
                              ? "border-primary bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))]"
                              : "border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          {mode === "specific" ? "📅 Dates précises" : mode === "weekly" ? "🔁 Planning hebdo" : "✏️ Description libre"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Specific mode */}
                  {scheduleMode === "specific" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Créneaux disponibles</span>
                        <span className="text-xs text-muted-foreground">{slotFields.length}/{MAX_SERVICE_SLOTS}</span>
                      </div>
                      {slotFields.map((field, i) => (
                        <div key={field.id} className="space-y-2">
                          <div className="grid grid-cols-[1fr_auto_auto_auto] items-start gap-2">
                            <Input
                              type="date"
                              {...form.register(`slots.${i}.date`)}
                              min={new Date().toISOString().split("T")[0]}
                            />
                            <Input type="time" className="w-24" {...form.register(`slots.${i}.heureDebut`)} />
                            <Input type="time" className="w-24" {...form.register(`slots.${i}.heureFin`)} />
                            {slotFields.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeSlot(i)}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          {(form.formState.errors.slots?.[i]?.date ||
                            form.formState.errors.slots?.[i]?.heureDebut ||
                            form.formState.errors.slots?.[i]?.heureFin) && (
                            <div className="space-y-1">
                              {form.formState.errors.slots?.[i]?.date && (
                                <p className="text-xs text-red-500">{form.formState.errors.slots[i]?.date?.message}</p>
                              )}
                              {form.formState.errors.slots?.[i]?.heureDebut && (
                                <p className="text-xs text-red-500">{form.formState.errors.slots[i]?.heureDebut?.message}</p>
                              )}
                              {form.formState.errors.slots?.[i]?.heureFin && (
                                <p className="text-xs text-red-500">{form.formState.errors.slots[i]?.heureFin?.message}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                      {slotFields.length < MAX_SERVICE_SLOTS && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendSlot({ date: "", heureDebut: "09:00", heureFin: "11:00" })}
                          className="gap-2"
                        >
                          <Plus className="w-4 h-4" /> Ajouter un créneau
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Weekly mode */}
                  {scheduleMode === "weekly" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm">Jours de la semaine</Label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((d) => {
                            const active = weeklyDays.includes(d.id);
                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  const next = active
                                    ? weeklyDays.filter((x) => x !== d.id)
                                    : [...weeklyDays, d.id];
                                  setWeeklyDays(next);
                                  updateWeeklySchedule(next, weeklyStart, weeklyEnd);
                                }}
                                className={`h-9 w-9 rounded-lg border text-xs font-semibold transition-colors ${
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border hover:border-primary/50"
                                }`}
                              >
                                {d.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Heure de début</Label>
                          <Input
                            type="time"
                            value={weeklyStart}
                            onChange={(e) => {
                              setWeeklyStart(e.target.value);
                              updateWeeklySchedule(weeklyDays, e.target.value, weeklyEnd);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Heure de fin</Label>
                          <Input
                            type="time"
                            value={weeklyEnd}
                            onChange={(e) => {
                              setWeeklyEnd(e.target.value);
                              updateWeeklySchedule(weeklyDays, weeklyStart, e.target.value);
                            }}
                          />
                        </div>
                      </div>
                      {values.scheduleInfo && (
                        <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-2 text-sm text-primary">
                          📅 {values.scheduleInfo}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Free mode */}
                  {scheduleMode === "free" && (
                    <div className="space-y-2">
                      <Label htmlFor="pub-schedule">Décrivez vos disponibilités</Label>
                      <Textarea
                        id="pub-schedule"
                        value={values.scheduleInfo ?? ""}
                        onChange={(e) => form.setValue("scheduleInfo", e.target.value, { shouldValidate: true })}
                        placeholder="Ex : Disponible toutes les vacances scolaires, sur rendez-vous…"
                        rows={3}
                      />
                    </div>
                  )}

                  {form.formState.errors.scheduleInfo && (
                    <p className="text-xs text-red-500">{form.formState.errors.scheduleInfo.message}</p>
                  )}

                  {/* Mini récap */}
                  <div className="rounded-xl bg-[hsl(var(--surface-2))] border p-4 space-y-2 text-sm">
                    <p className="font-semibold text-foreground">Récap</p>
                    <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                      <span className="text-muted-foreground/70">Type</span>
                      <span>{values.type === "WORKSHOP" ? "Atelier" : "Formation"}</span>
                      <span className="text-muted-foreground/70">Catégorie</span>
                      <span>{getCategoryLabel(values.category)}</span>
                      <span className="text-muted-foreground/70">Durée</span>
                      <span>{formatDuration(values.durationMinutes)}</span>
                      <span className="text-muted-foreground/70">Capacité</span>
                      <span>{values.capacity} pers.</span>
                      <span className="text-muted-foreground/70">Public</span>
                      <span className="truncate">{getPublicCibleLabels(values.publicCible ?? []).join(", ") || "—"}</span>
                      <span className="text-muted-foreground/70">Tarif</span>
                      <span>
                        {values.pricingType === "QUOTE"
                          ? "Sur devis"
                          : values.pricingType === "PER_PARTICIPANT"
                          ? `${values.pricePerParticipant ?? 0} €/pers.`
                          : `${values.price ?? 0} €`}
                      </span>
                      <span className="text-muted-foreground/70">Planning</span>
                      <span className="truncate">
                        {values.scheduleInfo
                          ? values.scheduleInfo
                          : `${values.slots.filter((s) => s.date).length} créneau(x)`}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={goPrev}
              disabled={step === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </Button>

            {isLastStep ? (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => handleSaveAs("DRAFT")}
                >
                  {isPending ? "En cours..." : "Enregistrer en brouillon"}
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="gap-2"
                >
                  {isPending ? "Publication..." : `Publier ${values.type === "WORKSHOP" ? "l'atelier" : "la formation"}`}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={goNext}
                className="gap-1"
              >
                Suivant <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Hook helpers ─────────────────────────────────────────────────────────────

function useFormStep() {
  const [step, setStep] = useState<StepIndex>(0);
  return [step, setStep] as const;
}

function useDir() {
  const [dir, setDir] = useState(1);
  return [dir, setDir] as const;
}
