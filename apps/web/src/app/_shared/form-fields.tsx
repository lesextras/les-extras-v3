"use client";

// Champs de formulaire légers réutilisés par les modales (label + textarea).
import * as React from "react";
import { InfoHint } from "@/components/ui/info-hint";
// Réexporte la primitive unifiée du design system (une seule source de vérité
// pour le style des textarea — plus de divergence bg-card/bg-background).
export { Textarea } from "@/components/ui/textarea";

export function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-sm font-medium leading-none text-foreground"
      >
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        {/* Le « i » ouvre au clic la même explication que la légende ci-dessous
            (voir InfoHint) : ça donne un repère visuel constant sur tous les
            champs du site, sans dupliquer le texte ni cacher la légende
            existante pour qui la lisait déjà. */}
        {hint ? <InfoHint>{hint}</InfoHint> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
