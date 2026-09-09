import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * UN TABLEAU QUI DIT QU'IL DEFILE.
 *
 * Le defilement horizontal existait deja, mais RIEN ne le signalait : sur un
 * ecran etroit, la derniere colonne — celle des actions — sortait du cadre et
 * on la croyait absente. Un tableau dont on ignore qu'il defile est un tableau
 * ampute.
 *
 * Deux ajouts, et deux seulement. Une barre de defilement toujours visible
 * (`scrollbar-visible`, definie dans la feuille globale) : c'est le signal le
 * plus universel, il n'a besoin d'aucune explication. Et un degrade sur le
 * bord droit, ancre au conteneur, qui suggere la matiere qui continue.
 *
 * Le degrade est purement decoratif et ne capte pas le pointeur, sinon il
 * volerait les clics de la derniere colonne — exactement celle qu'on cherche
 * a rendre accessible.
 */
const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full rounded-lg border border-border">
      <div className="scrollbar-visible w-full overflow-x-auto rounded-lg">
        <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-lg bg-gradient-to-l from-background to-transparent sm:hidden"
      />
    </div>
  ),
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('bg-muted/50 [&_tr]:border-b [&_tr]:border-border', className)} {...props} />
  ),
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
  ),
);
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn('border-b border-border transition-colors hover:bg-accent/40 data-[state=selected]:bg-accent', className)}
      {...props}
    />
  ),
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground',
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td ref={ref} className={cn('px-4 py-3 align-middle text-foreground', className)} {...props} />
  ),
);
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption ref={ref} className={cn('mt-3 text-sm text-muted-foreground', className)} {...props} />
  ),
);
TableCaption.displayName = 'TableCaption';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption };
