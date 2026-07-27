"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Stepper } from "@/components/ui/stepper";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertBlock } from "@/components/ui/alert-block";
import { RenfortCard } from "@/components/ui/renfort-card";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
} from "lucide-react";

/* ─── D.1 — Publication de Renfort ────────────────────────────────
   4-step stepper flow for establishments posting renfort missions.
   Steps: Type & Urgence → Détails → Exigences → Récapitulatif.
   Desktop: split form (left) + live preview (right).
   Mobile: vertical stepper + single card form.
   ─────────────────────────────────────────────────────────────── */

const STEPS = [
  { label: "Type & Urgence" },
  { label: "Détails mission" },
  { label: "Exigences" },
  { label: "Récapitulatif" },
];

export interface RenfortFormData {
  isUrgent?: boolean;
  jobTitle?: string;
  establishment?: string;
  city?: string;
  dateRange?: string;
  hours?: string;
  rate?: string;
  description?: string;
  diplomas?: string[];
  experience?: string;
  competences?: string[];
}

export interface PublishRenfortFlowProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Current step index (0-3) */
  currentStep: number;
  /** Called when step changes */
  onStepChange: (step: number) => void;
  /** Current form data for preview */
  formData: RenfortFormData;
  /** Called on publish */
  onPublish?: () => void;
  /** Called on save draft */
  onSaveDraft?: () => void;
  /** Whether publish is loading */
  isPublishing?: boolean;
  /** Slot for step content (form fields) */
  children: React.ReactNode;
}

export function PublishRenfortFlow({
  className,
  currentStep,
  onStepChange,
  formData,
  onPublish,
  onSaveDraft,
  isPublishing,
  children,
  ...props
}: PublishRenfortFlowProps) {
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className={cn("space-y-6", className)} {...props}>
      {/* Stepper */}
      <Stepper steps={STEPS} currentStep={currentStep} />

      {/* Urgency banner */}
      {formData.isUrgent && (
        <AlertBlock
          variant="renfort"
          title="Mission urgente (< 48h)"
          description="Cette mission sera mise en avant dans le feed des freelances."
          size="compact"
        />
      )}

      {/* Content: form + preview (desktop split) */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Form area */}
        <Card className="flex-1 p-6 max-w-2xl">
          {children}
        </Card>

        {/* Live preview (desktop only, last step or always) */}
        {isLastStep && (
          <div className="hidden lg:block w-80 shrink-0 space-y-3">
            <p className="text-overline text-[hsl(var(--text-tertiary))] uppercase tracking-widest">
              Aperçu
            </p>
            <RenfortCard
              variant={formData.isUrgent ? "urgent" : "normal"}
              title={formData.jobTitle || "Poste à définir"}
              establishment={formData.establishment || "Votre établissement"}
              city={formData.city || "Ville"}
              dates={formData.dateRange}
              hours={formData.hours}
              rate={formData.rate}
              badges={[
                ...(formData.diplomas ?? []),
                ...(formData.competences ?? []),
              ].slice(0, 4)}
            />
            {formData.diplomas && formData.diplomas.length > 0 && (
              <p className="text-caption text-[hsl(var(--text-tertiary))]">
                ~12 freelances correspondants dans votre zone
              </p>
            )}
          </div>
        )}
      </div>

      {/* Navigation actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {!isFirstStep && (
            <Button
              variant="ghost"
              onClick={() => onStepChange(currentStep - 1)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
              Précédent
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onSaveDraft && (
            <Button variant="ghost" onClick={onSaveDraft}>
              <Save className="h-4 w-4 mr-1" aria-hidden="true" />
              Brouillon
            </Button>
          )}

          {isLastStep ? (
            <Button
              variant="coral"
              size="lg"
              onClick={onPublish}
              disabled={isPublishing}
              className={cn(
                formData.isUrgent && "animate-[pulse-ring-coral_2s_ease-in-out_infinite]"
              )}
            >
              {isPublishing ? (
                "Publication…"
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" aria-hidden="true" />
                  Publier la mission
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="teal"
              onClick={() => onStepChange(currentStep + 1)}
            >
              Suivant
              <ArrowRight className="h-4 w-4 ml-1" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
