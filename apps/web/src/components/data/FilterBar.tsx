"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

export interface FilterOption {
    label: string;
    value: string;
}

export interface FilterDefinition {
    key: string;
    label: string;
    options: FilterOption[];
}

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
    filters?: FilterDefinition[];
    activeFilters?: Record<string, string>;
    onFilterChange?: (key: string, value: string) => void;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    onReset?: () => void;
}

export function FilterBar({
    filters = [],
    activeFilters = {},
    onFilterChange,
    searchValue,
    onSearchChange,
    searchPlaceholder = "Rechercher…",
    onReset,
    className,
    ...props
}: FilterBarProps) {
    const hasActiveFilters = Object.values(activeFilters).some(
        (v) => v && v !== "ALL"
    );
    const hasSearch = searchValue !== undefined && searchValue.length > 0;
    const showReset = hasActiveFilters || hasSearch;

    return (
        <div
            className={cn(
                "flex flex-wrap items-center gap-2",
                className
            )}
            {...props}
        >
            {/* Search */}
            {onSearchChange && (
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <Input
                        value={searchValue ?? ""}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="pl-9 h-9"
                    />
                </div>
            )}

            {/* Selects */}
            {filters.map((filter) => (
                <Select
                    key={filter.key}
                    value={activeFilters[filter.key] ?? "ALL"}
                    onValueChange={(value) => onFilterChange?.(filter.key, value)}
                >
                    <SelectTrigger className="w-[160px] h-9">
                        <SelectValue placeholder={filter.label} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">
                            {filter.label}
                        </SelectItem>
                        {filter.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ))}

            {/* Active filter chips */}
            {hasActiveFilters &&
                Object.entries(activeFilters)
                    .filter(([, v]) => v && v !== "ALL")
                    .map(([key, value]) => {
                        const filter = filters.find((f) => f.key === key);
                        const option = filter?.options.find((o) => o.value === value);
                        return (
                            <Badge
                                key={key}
                                variant="quiet"
                                className="gap-1 cursor-pointer"
                                onClick={() => onFilterChange?.(key, "ALL")}
                            >
                                {option?.label ?? value}
                                <X className="h-3 w-3" aria-hidden="true" />
                            </Badge>
                        );
                    })}

            {/* Reset */}
            {showReset && onReset && (
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={onReset}>
                    Réinitialiser
                </Button>
            )}
        </div>
    );
}
