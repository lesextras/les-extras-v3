"use client";

import { Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/useUIStore";

interface PublishRenfortButtonProps {
    size?: "sm" | "default" | "lg";
    className?: string;
    label?: string;
}

export function PublishRenfortButton({ size = "default", className, label = "Publier un renfort" }: PublishRenfortButtonProps) {
    const openRenfortModal = useUIStore((state) => state.openRenfortModal);

    return (
        <Button
            variant="coral"
            size={size}
            onClick={openRenfortModal}
            className={className}
        >
            <Siren className="h-4 w-4" aria-hidden="true" />
            {label}
        </Button>
    );
}
