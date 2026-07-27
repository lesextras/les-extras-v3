import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface WidgetErrorBadgeProps {
  message: string;
  className?: string;
}

/**
 * Small inline badge rendered in a widget header when its data fetch failed.
 * Keeps the UI partial-failure-tolerant: the widget still mounts with its
 * fallback (empty) data, but the user knows the data is stale/unavailable.
 */
export function WidgetErrorBadge({ message, className }: WidgetErrorBadgeProps) {
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5",
        "text-xs font-medium text-destructive",
        className,
      )}
    >
      <WifiOff className="h-3 w-3 shrink-0" aria-hidden="true" />
      {message}
    </span>
  );
}
