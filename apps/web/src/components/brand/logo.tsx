import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface LogoProps {
  href?: string;
  className?: string;
  /** Cache le mot-symbole, ne garde que la pastille. */
  compact?: boolean;
}

/**
 * Logo « LES EXTRAS » — pastille bleu nuit « LEX » + mot-symbole.
 *
 * Le mot-symbole porte seul l'identité : la baseline sous le nom brouillait la
 * lecture à petite taille et doublonnait avec l'accroche de la page d'accueil.
 */
export function Logo({ href = '/', className, compact }: LogoProps) {
  const inner = (
    <span className={cn('inline-flex items-center gap-3', className)}>
      <span className="relative grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <span className="text-[15px] font-bold leading-none tracking-[0.02em]">LEX</span>
        <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-background bg-secondary" />
      </span>
      {!compact && (
        <span className="text-xl font-bold leading-none tracking-tight text-foreground">
          LES EXTRAS
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {inner}
      </Link>
    );
  }
  return inner;
}
