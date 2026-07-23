'use client';

import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Select accessible et léger (bouton + panneau custom). API compatible avec un
 * usage React Hook Form via `value` / `onValueChange`.
 */

interface SelectContextValue {
  value: string | undefined;
  onValueChange: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  invalid?: boolean;
  listboxId: string;
  triggerRef: React.RefObject<HTMLButtonElement>;
}
const SelectContext = React.createContext<SelectContextValue | null>(null);
function useSelect() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error('Les composants Select doivent être dans <Select>.');
  return ctx;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  invalid?: boolean;
  children: React.ReactNode;
}

function Select({ value, defaultValue, onValueChange, invalid, children }: SelectProps) {
  const [internal, setInternal] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const listboxId = React.useId();
  const current = value ?? internal;

  const handleChange = React.useCallback(
    (v: string) => {
      if (value === undefined) setInternal(v);
      onValueChange?.(v);
      setOpen(false);
      // Rend le focus au déclencheur après sélection.
      triggerRef.current?.focus();
    },
    [value, onValueChange],
  );

  React.useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <SelectContext.Provider
      value={{ value: current, onValueChange: handleChange, open, setOpen, invalid, listboxId, triggerRef }}
    >
      <div ref={rootRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, onKeyDown, ...props }, ref) => {
    const { open, setOpen, invalid, listboxId, triggerRef } = useSelect();
    // Fusionne le ref transféré avec le ref interne utilisé pour le retour de focus.
    const setRef = React.useCallback(
      (node: HTMLButtonElement | null) => {
        (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
      },
      [ref, triggerRef],
    );
    return (
      <button
        ref={setRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cn(
          'flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3.5 text-sm text-foreground shadow-sm transition-colors',
          'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/40',
          'disabled:cursor-not-allowed disabled:opacity-50',
          invalid && 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/30',
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
    );
  },
);
SelectTrigger.displayName = 'SelectTrigger';

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useSelect();
  const [label, setLabel] = React.useState<string | undefined>();

  // Le label affiché est résolu par les <SelectItem> enregistrés dans le registre.
  React.useEffect(() => {
    setLabel(itemLabels.get(value ?? ''));
  });

  return (
    <span className={cn('truncate', !value && 'text-muted-foreground')}>
      {label ?? value ?? placeholder}
    </span>
  );
}

// Registre simple label<->value pour l'affichage de la valeur sélectionnée.
const itemLabels = new Map<string, string>();

function SelectContent({ className, children }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen, listboxId, triggerRef } = useSelect();
  const ref = React.useRef<HTMLDivElement>(null);

  // Focus l'option sélectionnée (ou la première) à l'ouverture.
  React.useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;
    const options = Array.from(el.querySelectorAll<HTMLElement>('[role="option"]'));
    const selected = options.find((o) => o.getAttribute('aria-selected') === 'true');
    requestAnimationFrame(() => (selected ?? options[0])?.focus());
  }, [open]);

  // Fermé : on monte quand même les items (cachés) pour que leurs libellés
  // s'enregistrent dans le registre — sinon le déclencheur affiche la valeur brute.
  if (!open) return <div className="hidden" aria-hidden>{children}</div>;

  function moveFocus(dir: 1 | -1 | 'first' | 'last') {
    const el = ref.current;
    if (!el) return;
    const options = Array.from(el.querySelectorAll<HTMLElement>('[role="option"]'));
    if (options.length === 0) return;
    const idx = options.indexOf(document.activeElement as HTMLElement);
    let next: number;
    if (dir === 'first') next = 0;
    else if (dir === 'last') next = options.length - 1;
    else next = (idx + dir + options.length) % options.length;
    options[next]?.focus();
  }

  return (
    <div
      ref={ref}
      id={listboxId}
      role="listbox"
      onKeyDown={(e) => {
        switch (e.key) {
          case 'ArrowDown':
            e.preventDefault();
            moveFocus(1);
            break;
          case 'ArrowUp':
            e.preventDefault();
            moveFocus(-1);
            break;
          case 'Home':
            e.preventDefault();
            moveFocus('first');
            break;
          case 'End':
            e.preventDefault();
            moveFocus('last');
            break;
          case 'Escape':
            e.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
            break;
          case 'Tab':
            setOpen(false);
            break;
        }
      }}
      className={cn(
        'absolute z-50 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover p-1.5 shadow-card animate-scale-in',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: current, onValueChange } = useSelect();
    const active = current === value;
    React.useEffect(() => {
      if (typeof children === 'string') itemLabels.set(value, children);
    }, [value, children]);
    return (
      <div
        ref={ref}
        role="option"
        aria-selected={active}
        tabIndex={active ? 0 : -1}
        onClick={() => onValueChange(value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onValueChange(value);
          }
        }}
        className={cn(
          'flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors',
          'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent',
          active && 'bg-accent font-medium text-accent-foreground',
          className,
        )}
        {...props}
      >
        <span>{children}</span>
        {active && <Check className="size-4 text-primary" />}
      </div>
    );
  },
);
SelectItem.displayName = 'SelectItem';

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
