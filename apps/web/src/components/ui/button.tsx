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
