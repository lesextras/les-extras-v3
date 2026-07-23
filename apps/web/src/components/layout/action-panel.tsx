import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ActionPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  /** Actions rapides / boutons rendus en pied de panneau. */
  footer?: React.ReactNode;
}

/**
 * Panneau contextuel latéral (colonne de droite) : titre, contenu scrollable,
 * pied d'actions. Pensé pour les détails de mission, filtres, résumés.
 */
export function ActionPanel({
  title,
  description,
  footer,
  className,
  children,
  ...props
}: ActionPanelProps) {
  return (
    <div className={cn('flex h-full flex-col', className)} {...props}>
      {(title || description) && (
        <div className="border-b border-border p-5">
          {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
          {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
      {footer && <div className="border-t border-border p-5">{footer}</div>}
    </div>
  );
}
