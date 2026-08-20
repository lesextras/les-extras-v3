// Petits composants de présentation réutilisés par les écrans (Server Components
// compatibles). S'appuient sur les primitives Web-Core (@/components/ui/*).
import type { ReactNode } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {/* `shrink-0` sans repli de ligne faisait déborder la page sur un
          téléphone dès qu'il y avait deux boutons (RenforTeam : « Exporter
          les heures validées » + « Publier un renfort ») : l'écran se mettait
          à défiler latéralement. On autorise le retour à la ligne. */}
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
        {icon ? (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            {icon}
          </div>
        ) : null}
        <div className="space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          {description ? (
            <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  title = "Un problème est survenu",
  description = "Impossible de charger ces données pour le moment. Réessayez dans un instant.",
  retryHref,
}: {
  title?: string;
  description?: string;
  retryHref?: string;
}) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
        <p className="font-medium text-destructive">{title}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
        {retryHref ? (
          <Button asChild variant="outline" size="sm">
            <Link href={retryHref}>Réessayer</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: "teal" | "terracotta" | "warning" | "neutral";
}) {
  const ring =
    accent === "teal"
      ? "before:bg-primary"
      : accent === "terracotta"
        ? "before:bg-secondary"
        : accent === "warning"
          ? "before:bg-warning"
          : "before:bg-border";
  const iconTint =
    accent === "teal"
      ? "bg-primary-soft text-primary"
      : accent === "terracotta"
        ? "bg-secondary-soft text-secondary"
        : accent === "warning"
          ? "bg-warning/15 text-warning-foreground"
          : "bg-muted text-muted-foreground";
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card",
        "before:absolute before:inset-y-2 before:left-0 before:w-1 before:rounded-full",
        ring,
      )}
    >
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="space-y-1">
          <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
          <p className="text-[26px] font-bold leading-none tracking-tight text-foreground [font-variant-numeric:tabular-nums]">
            {value}
          </p>
          {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <div
            className={cn(
              "grid size-9 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105 [&_svg]:size-[18px]",
              iconTint,
            )}
          >
            {icon}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function SectionTitle({
  title,
  children,
  action,
}: {
  /** Titre court ; `children` est accepté pour la forme `<SectionTitle>Titre</SectionTitle>`. */
  title?: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-foreground">{children ?? title}</h2>
      {action}
    </div>
  );
}

// Skeleton simple pour les états loading (utilisé dans loading.tsx).
export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card p-5">
      <div className="mb-3 h-4 w-1/3 rounded bg-muted" />
      <div className="mb-2 h-3 w-full rounded bg-muted" />
      <div className="h-3 w-2/3 rounded bg-muted" />
    </div>
  );
}

export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
