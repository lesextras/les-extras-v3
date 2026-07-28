'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'group/btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] active:translate-y-0 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform',
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 hover:shadow-card hover:-translate-y-px',
        secondary:
          'bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/90 hover:shadow-card hover:-translate-y-px',
        // Troisième couleur d'action. Le couple success / success-foreground
        // s'inverse selon le thème (vert foncé + texte clair en thème clair,
        // vert clair + texte sombre en thème sombre) : le contraste reste
        // correct des deux côtés, ce qu'un vert codé en dur ne garantirait pas.
        success:
          'bg-success text-success-foreground shadow-soft hover:bg-success/90 hover:shadow-card hover:-translate-y-px',
        // Deux teintes profondes, volontairement fixes : elles doivent rester
        // les mêmes quel que soit le thème, c'est ce qui en fait des repères.
        // Le texte est blanc dans les deux cas (contraste ≈ 10:1 et 7,7:1).
        // Le liseré clair est indispensable : sur le fond charbon du tableau
        // de bord, deux aplats sombres sans contour se fondraient dans la page.
        nuit:
          'bg-[hsl(222,62%,32%)] text-white shadow-soft ring-1 ring-white/15 hover:bg-[hsl(222,62%,38%)] hover:shadow-card hover:-translate-y-px',
        foret:
          'bg-[hsl(152,55%,24%)] text-white shadow-soft ring-1 ring-white/15 hover:bg-[hsl(152,55%,29%)] hover:shadow-card hover:-translate-y-px',
        outline:
          'border border-input bg-card text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-primary/40',
        ghost: 'text-foreground hover:bg-accent hover:text-accent-foreground',
        soft: 'bg-primary-soft text-accent-foreground hover:bg-primary/15',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive:
          'bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90 hover:-translate-y-px',
      },
      size: {
        sm: 'h-10 px-3.5 text-[13px]',
        md: 'h-11 px-5',
        lg: 'h-12 px-7 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Rend le bouton en état de chargement (spinner + désactivé). */
  loading?: boolean;
  /** Rend l'enfant unique en tant que composant racine (ex: <Link/>). */
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, asChild, children, disabled, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size }), className);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement, {
        className: cn(classes, (children as React.ReactElement).props.className),
      });
    }

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading && <Loader2 className="animate-spin" aria-hidden />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
