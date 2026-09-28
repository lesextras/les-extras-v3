import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface LogoProps {
  href?: string;
  className?: string;
  /** Cache le mot-symbole, ne garde que la pastille. */
  compact?: boolean;
}

/**
 * Logo « LES EXTRAS » — pastille bleu nuit « Les Extras » + mot-symbole.
 *
 * Le mot-symbole porte seul l'identité : la baseline sous le nom brouillait la
 * lecture à petite taille et doublonnait avec l'accroche de la page d'accueil.
 *
 * ⚠ LA PASTILLE NE DIT PLUS « LEX » (audit du 28/09/2026). Le logo, le bot
 * d'aide et le produit payant d'aide à l'écriture s'appelaient tous « LEX » :
 * on ne savait plus ce qui était le site, ce qui était gratuit, ce qui se
 * payait. LEX reste le nom du produit payant, et de lui seul. La pastille porte
 * le nom du site, comme l'icône de l'onglet et de l'application
 * (`public/icons/`, `app/icon.svg`) : mêmes couleurs, même forme.
 */
export function Logo({ href = '/', className, compact }: LogoProps) {
  const inner = (
    // Sans nom accessible, le logo se lisait « LEXLES EXTRAS » : la pastille
    // et le mot-symbole sont deux span colles. role=img + aria-label donnent
    // au bloc un seul nom, et le detail visuel n'est plus annonce.
    <span className={cn('inline-flex items-center gap-3', className)} role="img" aria-label="LES EXTRAS">
      <span className="relative grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft" aria-hidden="true">
        <span className="flex flex-col items-center text-[9.5px] font-bold leading-[1.1]">
          <span>Les</span>
          <span>Extras</span>
        </span>
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
