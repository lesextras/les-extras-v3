'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { assignRef } from '@/lib/merge-refs';

/**
 * DropdownMenu léger (sans dépendance Radix) : gère clic extérieur, Escape,
 * et positionnement simple. API inspirée de shadcn/ui.
 */

interface DropdownContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  align: 'start' | 'end';
  menuId: string;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error('Les composants DropdownMenu doivent être dans <DropdownMenu>.');
  return ctx;
}

export interface DropdownMenuProps {
  children: React.ReactNode;
  align?: 'start' | 'end';
}

function DropdownMenu({ children, align = 'end' }: DropdownMenuProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const menuId = React.useId();

  React.useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef, align, menuId }}>
      <div ref={rootRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

const DropdownMenuTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, onClick, onKeyDown, children, asChild, ...props }, _ref) => {
  const { open, setOpen, triggerRef, menuId } = useDropdown();
  return (
    <button
      ref={triggerRef}
      type="button"
      aria-haspopup="menu"
      aria-expanded={open}
      aria-controls={open ? menuId : undefined}
      className={cn('inline-flex items-center outline-none', className)}
      onClick={(e) => {
        onClick?.(e);
        setOpen(!open);
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          setOpen(true);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

const DropdownMenuContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, onKeyDown, ...props }, ref) => {
    const { open, align, menuId, setOpen, triggerRef } = useDropdown();
    const innerRef = React.useRef<HTMLDivElement | null>(null);

    const setRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        innerRef.current = node;
        assignRef(ref, node);
      },
      [ref],
    );

    // Focus le premier élément de menu à l'ouverture.
    React.useEffect(() => {
      if (!open) return;
      const el = innerRef.current;
      if (!el) return;
      const items = el.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])');
      requestAnimationFrame(() => items[0]?.focus());
    }, [open]);

    if (!open) return null;

    function move(dir: 1 | -1 | 'first' | 'last') {
      const el = innerRef.current;
      if (!el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])'));
      if (items.length === 0) return;
      const idx = items.indexOf(document.activeElement as HTMLElement);
      let next: number;
      if (dir === 'first') next = 0;
      else if (dir === 'last') next = items.length - 1;
      else next = (idx + dir + items.length) % items.length;
      items[next]?.focus();
    }

    return (
      <div
        ref={setRef}
        id={menuId}
        role="menu"
        onKeyDown={(e) => {
          onKeyDown?.(e);
          if (e.defaultPrevented) return;
          switch (e.key) {
            case 'ArrowDown':
              e.preventDefault();
              move(1);
              break;
            case 'ArrowUp':
              e.preventDefault();
              move(-1);
              break;
            case 'Home':
              e.preventDefault();
              move('first');
              break;
            case 'End':
              e.preventDefault();
              move('last');
              break;
            case 'Escape':
              e.preventDefault();
              setOpen(false);
              triggerRef.current?.focus();
              break;
          }
        }}
        className={cn(
          'absolute z-50 mt-2 min-w-[12rem] origin-top rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-card animate-scale-in',
          align === 'end' ? 'right-0' : 'left-0',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
DropdownMenuContent.displayName = 'DropdownMenuContent';

export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLButtonElement> {
  inset?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}

const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, inset, destructive, onClick, disabled, ...props }, ref) => {
    const { setOpen } = useDropdown();
    return (
      <button
        ref={ref}
        role="menuitem"
        type="button"
        tabIndex={-1}
        disabled={disabled}
        className={cn(
          'flex w-full cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors',
          'hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent',
          'disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:text-muted-foreground',
          inset && 'pl-8',
          destructive && 'text-destructive hover:bg-destructive/10 [&_svg]:text-destructive',
          className,
        )}
        onClick={(e) => {
          onClick?.(e);
          setOpen(false);
        }}
        {...props}
      />
    );
  },
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

function DropdownMenuLabel({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground', className)} {...props} />;
}

function DropdownMenuSeparator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div role="separator" className={cn('-mx-1.5 my-1.5 h-px bg-border', className)} {...props} />;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
