"use client";

import * as React from "react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
    active: { variant: "success" as const, label: "Actif", dot: "bg-emerald-500" },
    pending: { variant: "warning" as const, label: "En attente", dot: "bg-amber-500" },
    completed: { variant: "info" as const, label: "Terminé", dot: "bg-secondary" },
    confirmed: { variant: "success" as const, label: "Confirmé", dot: "bg-emerald-500" },
    cancelled: { variant: "error" as const, label: "Annulé", dot: "bg-destructive" },
    error: { variant: "error" as const, label: "Erreur", dot: "bg-destructive" },
    draft: { variant: "quiet" as const, label: "Brouillon", dot: "bg-muted-foreground" },
    published: { variant: "info" as const, label: "Publié", dot: "bg-secondary" },
    paid: { variant: "success" as const, label: "Payé", dot: "bg-emerald-500" },
    refused: { variant: "error" as const, label: "Refusé", dot: "bg-destructive" },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

export interface StatusPillProps extends Omit<BadgeProps, "variant"> {
    status: StatusKey;
    showDot?: boolean;
    label?: string;
}

export function StatusPill({
    status,
    showDot = true,
    label,
    className,
    ...props
}: StatusPillProps) {
    const config = STATUS_CONFIG[status];

    return (
        <Badge
            variant={config.variant}
            className={cn("gap-1.5 font-medium", className)}
            {...props}
        >
            {showDot && (
                <span
                    className={cn("h-1.5 w-1.5 rounded-full", config.dot)}
                    aria-hidden="true"
                />
            )}
            {label ?? config.label}
        </Badge>
    );
}
