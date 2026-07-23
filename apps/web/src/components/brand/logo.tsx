import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface LogoProps {
  href?: string;
  className?: string;
  /** Cache le mot-symbole, ne garde que la pastille. */
  compact?: boolean;
}

/**
 * Logo "LES EXTRAS" — pastille teal + mot-symbole. Identité Quietly Bold.
 */
export function Logo({ href = '/', className, compact }: LogoProps) {
  const inner = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
        <span className="text-base font-bold leading-none">Le</span>
        <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-background bg-secondary" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-tight text-foreground">LES EXTRAS</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Renfort médico-social
          </span>
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {inner}
      </Link>
    );
  }
  return inner;
}
