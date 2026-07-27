"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";

/* ─── C.4 — Combobox ──────────────────────────────────────────────
   Search + select in a long list (cities, skills, diplomas).
   Variants: single, multi, creatable.
   Uses Radix Popover + custom filterable list.
   ─────────────────────────────────────────────────────────────── */

export interface ComboboxOption {
  value: string;
  label: string;
  group?: string;
  disabled?: boolean;
}

interface ComboboxBaseProps {
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}

interface ComboboxSingleProps extends ComboboxBaseProps {
  mode?: "single";
  value?: string;
  onValueChange?: (value: string | undefined) => void;
}

interface ComboboxMultiProps extends ComboboxBaseProps {
  mode: "multi";
  value?: string[];
  onValueChange?: (value: string[]) => void;
  maxVisible?: number;
}

export type ComboboxProps = ComboboxSingleProps | ComboboxMultiProps;

const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (props, ref) => {
    const {
      options,
      placeholder = "Sélectionner…",
      searchPlaceholder = "Rechercher…",
      emptyText = "Aucun résultat.",
      disabled = false,
      className,
      mode = "single",
    } = props;

    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);

    const filtered = React.useMemo(() => {
      if (search.length < 1) return options;
      const q = search.toLowerCase();
      return options.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          o.value.toLowerCase().includes(q)
      );
    }, [options, search]);

    // Group items
    const grouped = React.useMemo(() => {
      const groups = new Map<string, ComboboxOption[]>();
      for (const opt of filtered) {
        const g = opt.group ?? "";
        if (!groups.has(g)) groups.set(g, []);
        groups.get(g)!.push(opt);
      }
      return groups;
    }, [filtered]);

    const isSelected = (value: string) => {
      if (mode === "multi") {
        return ((props as ComboboxMultiProps).value ?? []).includes(value);
      }
      return (props as ComboboxSingleProps).value === value;
    };

    const handleSelect = (value: string) => {
      if (mode === "multi") {
        const mp = props as ComboboxMultiProps;
        const current = mp.value ?? [];
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        mp.onValueChange?.(next);
      } else {
        const sp = props as ComboboxSingleProps;
        sp.onValueChange?.(sp.value === value ? undefined : value);
        setOpen(false);
      }
      setSearch("");
    };

    const handleRemoveTag = (value: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (mode === "multi") {
        const mp = props as ComboboxMultiProps;
        mp.onValueChange?.((mp.value ?? []).filter((v) => v !== value));
      }
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (mode === "multi") {
        (props as ComboboxMultiProps).onValueChange?.([]);
      } else {
        (props as ComboboxSingleProps).onValueChange?.(undefined);
      }
    };

    // Display label
    const getDisplayContent = () => {
      if (mode === "multi") {
        const vals = (props as ComboboxMultiProps).value ?? [];
        const maxVisible = (props as ComboboxMultiProps).maxVisible ?? 5;
        if (vals.length === 0) return <span className="text-muted-foreground">{placeholder}</span>;
        const visible = vals.slice(0, maxVisible);
        const remaining = vals.length - maxVisible;
        return (
          <span className="flex flex-wrap gap-1">
            {visible.map((v) => {
              const opt = options.find((o) => o.value === v);
              return (
                <Badge key={v} variant="teal" className="text-xs gap-1 pr-1">
                  {opt?.label ?? v}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveTag(v, e)}
                    className="ml-0.5 rounded-full hover:bg-[hsl(var(--color-teal-200))] p-0.5"
                    aria-label={`Retirer ${opt?.label ?? v}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            {remaining > 0 && (
              <Badge variant="outline" className="text-xs">
                +{remaining}
              </Badge>
            )}
          </span>
        );
      }
      const val = (props as ComboboxSingleProps).value;
      if (!val) return <span className="text-muted-foreground">{placeholder}</span>;
      const opt = options.find((o) => o.value === val);
      return <span>{opt?.label ?? val}</span>;
    };

    const hasValue = mode === "multi"
      ? ((props as ComboboxMultiProps).value ?? []).length > 0
      : !!(props as ComboboxSingleProps).value;

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={ref}
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls="combobox-listbox"
            aria-label={placeholder}
            disabled={disabled}
            className={cn(
              "flex min-h-[40px] w-full items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--color-teal-500)/0.5)] focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className
            )}
          >
            <span className="flex-1 text-left truncate">
              {getDisplayContent()}
            </span>
            <span className="flex items-center gap-1 shrink-0">
              {hasValue && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={handleClear}
                  className="rounded-full p-0.5 hover:bg-muted"
                  aria-label="Effacer la sélection"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              )}
              <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
            </span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label={searchPlaceholder}
            />
          </div>

          {/* List */}
          <div className="max-h-[300px] overflow-y-auto p-1" role="listbox" id="combobox-listbox" aria-label={placeholder} aria-multiselectable={mode === "multi" || undefined}>
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              Array.from(grouped.entries()).map(([group, items]) => (
                <div key={group}>
                  {group && (
                    <p className="px-3 py-1.5 text-overline uppercase text-muted-foreground/70 tracking-widest">
                      {group}
                    </p>
                  )}
                  {items.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected(opt.value)}
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt.value)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                        "hover:bg-[hsl(var(--color-teal-50))] hover:text-[hsl(var(--color-teal-700))]",
                        isSelected(opt.value) && "bg-[hsl(var(--color-teal-50))] font-medium",
                        opt.disabled && "opacity-50 pointer-events-none"
                      )}
                    >
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0 text-[hsl(var(--color-teal-500))]",
                          !isSelected(opt.value) && "opacity-0"
                        )}
                      />
                      <span className="flex-1 text-left">{opt.label}</span>
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
Combobox.displayName = "Combobox";

export { Combobox };
