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
        className="flex items-center gap-1 text-sm font-medium leading-none text-foreground"
      >
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        {/* PAS DE « i » ICI, ET C'EST VOLONTAIRE.
            L'explication est déjà écrite en clair sous le champ, deux lignes
            plus bas. La bulle ne révélait donc rien : elle posait une
            trentaine de petits ronds gris sur les formulaires du site, à côté
            de textes parfaitement lisibles. Un repère qui ne désigne rien de
            caché n'est pas un repère, c'est du bruit — et le bruit se retire.
            Elle reste utile là où elle explique quelque chose d'invisible
            (voir InfoHint, encore employé dans le menu et à l'inscription). */}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
