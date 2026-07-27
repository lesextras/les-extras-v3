"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateAvailabilityAction } from "@/app/actions/user";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type FreelanceAvailabilityToggleProps = {
    initialIsAvailable: boolean;
};

export function FreelanceAvailabilityToggle({
    initialIsAvailable,
}: FreelanceAvailabilityToggleProps) {
    const [isAvailable, setIsAvailable] = useState(initialIsAvailable);
    const [isPending, startTransition] = useTransition();

    const handleChange = (nextIsAvailable: boolean) => {
        const previousIsAvailable = isAvailable;
        setIsAvailable(nextIsAvailable);

        startTransition(async () => {
            const result = await updateAvailabilityAction(nextIsAvailable);

            if (!result.ok) {
                setIsAvailable(previousIsAvailable);
                toast.error(result.error ?? "Impossible de mettre à jour votre disponibilité.");
                return;
            }

            toast.success(
                nextIsAvailable
                    ? "Vous êtes visible pour les nouvelles missions."
                    : "Votre disponibilité a été mise à jour.",
            );
        });
    };

    return (
        <div
            className={cn(
                "flex flex-col gap-3 rounded-xl border px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between",
                isAvailable
                    ? "border-[hsl(var(--teal)/0.22)] bg-[hsl(var(--teal-light))]"
                    : "border-[hsl(var(--coral)/0.18)] bg-[hsl(var(--coral-light))]",
            )}
        >
            <div className="flex min-w-0 items-start gap-3">
                <span
                    className={cn(
                        "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
                        isAvailable ? "bg-[hsl(var(--teal))]" : "bg-[hsl(var(--coral))]",
                    )}
                    aria-hidden="true"
                />
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-body-sm font-semibold text-foreground">
                            {isAvailable ? "Disponible" : "Indisponible"}
                        </p>
                        <Badge variant={isAvailable ? "teal" : "coral"}>
                            {isAvailable ? "Visible" : "Moins visible"}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {isAvailable
                            ? "Vous êtes visible pour les nouvelles missions."
                            : "Votre profil apparaîtra moins dans les propositions."}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
                {isPending && (
                    <Loader2
                        className="h-4 w-4 animate-spin text-muted-foreground"
                        aria-hidden="true"
                    />
                )}
                <Switch
                    checked={isAvailable}
                    disabled={isPending}
                    onCheckedChange={handleChange}
                    aria-label="Modifier ma disponibilité"
                />
            </div>
        </div>
    );
}
