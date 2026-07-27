"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";

export interface ActionPanelProps {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    position?: "right" | "left";
    /** On mobile, use Sheet mode. On desktop, render inline. */
    mobileOpen?: boolean;
    onMobileOpenChange?: (open: boolean) => void;
}

export function ActionPanel({
    title,
    description,
    actions,
    children,
    className,
    position = "right",
    mobileOpen = false,
    onMobileOpenChange,
}: ActionPanelProps) {
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Desktop: inline sticky panel
    if (isDesktop) {
        return (
            <aside
                className={cn(
                    "sticky top-[73px] h-fit w-[320px] shrink-0",
                    "glass-surface rounded-lg p-5 space-y-4",
                    position === "left" && "order-first",
                    className
                )}
            >
                <div>
                    <h3 className="text-base font-semibold text-foreground">{title}</h3>
                    {description && (
                        <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                    )}
                </div>

                <div className="space-y-3">{children}</div>

                {actions && (
                    <div className="flex flex-col gap-2 pt-2 border-t border-border/40">
                        {actions}
                    </div>
                )}
            </aside>
        );
    }

    // Mobile: Sheet
    return (
        <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
            <SheetContent
                side={position}
                className="w-full sm:max-w-md glass-surface"
            >
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    {description && <SheetDescription>{description}</SheetDescription>}
                </SheetHeader>

                <div className="mt-6 space-y-3">{children}</div>

                {actions && (
                    <div className="mt-4 flex flex-col gap-2 pt-3 border-t border-border/40">
                        {actions}
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
