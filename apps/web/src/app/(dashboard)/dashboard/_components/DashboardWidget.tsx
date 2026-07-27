import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
    GlassCard,
    GlassCardHeader,
    GlassCardContent,
} from "@/components/ui/glass-card";

type IconColor = "coral" | "emerald" | "amber" | "teal" | "gray";

interface DashboardWidgetProps {
    icon: LucideIcon;
    iconColor: IconColor;
    title: string;
    subtitle?: string;
    viewAllHref?: string;
    viewAllLabel?: string;
    wide?: boolean;
    children: React.ReactNode;
}

const iconColorMap: Record<IconColor, string> = {
    coral: "icon-coral",
    emerald: "icon-emerald",
    amber: "icon-amber",
    teal: "icon-teal",
    gray: "icon-gray",
};

export function DashboardWidget({
    icon: Icon,
    iconColor,
    title,
    subtitle,
    viewAllHref,
    viewAllLabel,
    wide,
    children,
}: DashboardWidgetProps) {
    return (
        <GlassCard className={wide ? "md:col-span-2" : undefined}>
            <GlassCardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div
                            className={`h-9 w-9 rounded-xl flex items-center justify-center ${iconColorMap[iconColor]}`}
                        >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="text-heading-sm">{title}</h2>
                            {subtitle && (
                                <p className="text-caption text-muted-foreground">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                    {viewAllHref && (
                        <Link
                            href={viewAllHref}
                            aria-label={viewAllLabel ?? `Voir tout : ${title}`}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Voir tout →
                        </Link>
                    )}
                </div>
            </GlassCardHeader>
            <GlassCardContent>{children}</GlassCardContent>
        </GlassCard>
    );
}
