'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { assignRef } from '@/lib/merge-refs';

/**
 * Dialog / Modal contrôlé, léger (portail + Escape + clic overlay).
 * Supporte le pattern shadcn : <Dialog open onOpenChange><DialogTrigger/>
 * <DialogContent/></Dialog>. Alias `Modal*` exportés pour compat.
 */

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
const DialogContext = React.createContext<DialogContextValue | null>(null);

function useDialog() {
  const ctx = React.useContext(DialogContext);
  if (!ctx) throw new Error('Les composants Dialog doivent être dans <Dialog>.');
  return ctx;
}

/**
 * Contexte interne à DialogContent : fournit les id de titre/description pour
 * relier aria-labelledby / aria-describedby automatiquement quand
 * <DialogTitle> / <DialogDescription> sont présents.
 */
interface DialogA11yContextValue {
  titleId: string;
  descriptionId: string;
}
const DialogA11yContext = React.createContext<DialogA11yContextValue | null>(null);

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

function Dialog({ open, defaultOpen, onOpenChange, children }: DialogProps) {
  const [internal, setInternal] = React.useState(defaultOpen ?? false);
  const isOpen = open ?? internal;
  const setOpen = React.useCallback(
    (v: boolean) => {
      if (open === undefined) setInternal(v);
      onOpenChange?.(v);
    },
    [open, onOpenChange],
  );

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: setOpen }}>
      {children}
    </DialogContext.Provider>
  );
}

export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
  ({ asChild, children, onClick, ...props }, ref) => {
    const { onOpenChange } = useDialog();
    if (asChild && React.isValidElement(children)) {
      const child = children as React.ReactElement;
      return React.cloneElement(child, {
        onClick: (e: React.MouseEvent) => {
          child.props.onClick?.(e);
          onOpenChange(true);
        },
      });
    }
    return (
      <button
        ref={ref}
        type="button"
        onClick={(e) => {
          onClick?.(e);
          onOpenChange(true);
        }}
        {...props}
      >
        {children}
      </button>
    );
  },
);
DialogTrigger.displayName = 'DialogTrigger';

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  hideClose?: boolean;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, hideClose, ...props }, ref) => {
    const { open, onOpenChange } = useDialog();
    const [mounted, setMounted] = React.useState(false);
    const panelRef = React.useRef<HTMLDivElement | null>(null);
    const previouslyFocused = React.useRef<HTMLElement | null>(null);
    const reactId = React.useId();
    const titleId = `dialog-title-${reactId}`;
    const descriptionId = `dialog-desc-${reactId}`;

    React.useEffect(() => setMounted(true), []);

    // Fusionne le ref transféré avec le ref interne du panneau.
    const setPanelRef = React.useCallback(
      (node: HTMLDivElement | null) => {
        panelRef.current = node;
        assignRef(ref, node);
      },
      [ref],
    );

    React.useEffect(() => {
      if (!open) return;

      // Mémorise le déclencheur pour restaurer le focus à la fermeture.
      previouslyFocused.current = document.activeElement as HTMLElement | null;

      // Place le focus dans la modale au montage.
      const panel = panelRef.current;
      const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusables && focusables.length ? focusables[0] : panel;
      // rAF pour attendre la peinture initiale du portail.
      const raf = requestAnimationFrame(() => first?.focus());

      function onKey(e: KeyboardEvent) {
        if (e.key === 'Escape') {
          onOpenChange(false);
          return;
        }
        if (e.key !== 'Tab') return;
        const el = panelRef.current;
        if (!el) return;
        const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
          (n) => n.offsetParent !== null || n === document.activeElement,
        );
        if (items.length === 0) {
          e.preventDefault();
          el.focus();
          return;
        }
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey) {
          if (active === firstEl || !el.contains(active)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else if (active === lastEl || !el.contains(active)) {
          e.preventDefault();
          firstEl.focus();
        }
      }

      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
      return () => {
        cancelAnimationFrame(raf);
        document.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
        // Restaure le focus sur le déclencheur.
        previouslyFocused.current?.focus?.();
      };
    }, [open, onOpenChange]);

    if (!mounted || !open) return null;

    return createPortal(
      <DialogA11yContext.Provider value={{ titleId, descriptionId }}>
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-fade-in"
            onClick={() => onOpenChange(false)}
            aria-hidden
          />
          <div
            ref={setPanelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
            tabIndex={-1}
            className={cn(
              'relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-card animate-scale-in focus:outline-none',
              className,
            )}
            {...props}
          >
            {!hideClose && (
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="size-4" />
              </button>
            )}
            {children}
          </div>
        </div>
      </DialogA11yContext.Provider>,
      document.body,
    );
  },
);
DialogContent.displayName = 'DialogContent';

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1.5 pr-8', className)} {...props} />;
}
function DialogTitle({ className, id, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  const a11y = React.useContext(DialogA11yContext);
  return (
    <h2
      id={id ?? a11y?.titleId}
      className={cn('text-lg font-semibold tracking-tight', className)}
      {...props}
    />
  );
}
function DialogDescription({ className, id, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const a11y = React.useContext(DialogA11yContext);
  return (
    <p
      id={id ?? a11y?.descriptionId}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}
function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)} {...props} />;
}

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  // Alias Modal*
  Dialog as Modal,
  DialogTrigger as ModalTrigger,
  DialogContent as ModalContent,
  DialogHeader as ModalHeader,
  DialogTitle as ModalTitle,
  DialogDescription as ModalDescription,
  DialogFooter as ModalFooter,
};
