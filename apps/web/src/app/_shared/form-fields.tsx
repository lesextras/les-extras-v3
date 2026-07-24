"use client";

// Champs de formulaire légers réutilisés par les modales (label + textarea).
import * as React from "react";
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
        className="text-sm font-medium leading-none text-foreground"
      >
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
