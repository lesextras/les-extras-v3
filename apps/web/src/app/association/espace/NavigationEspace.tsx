'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { deconnecter } from '../_client';

const ENTREES = [
  { href: '/espace', libelle: 'Ce lundi', exact: true },
  { href: '/espace/classeur', libelle: 'Le classeur' },
  { href: '/espace/dossiers', libelle: 'Les dossiers' },
  { href: '/espace/chemin', libelle: 'Le chemin' },
  { href: '/espace/association', libelle: 'Mon association' },
];

export function NavigationEspace({ nomCompte }: { nomCompte: string }) {
  const chemin = usePathname() ?? '';
  return (
    <aside className="lg:sticky lg:top-6 lg:self-start">
      <p className="mb-3 truncate text-xs uppercase tracking-[0.14em] text-[#5C6B63]" title={nomCompte}>
        {nomCompte}
      </p>
      <nav aria-label="Mon espace" className="flex flex-row flex-wrap gap-1 lg:flex-col">
        {ENTREES.map((e) => {
          const actif = e.exact ? chemin === e.href : chemin.startsWith(e.href);
          return (
            <Link
              key={e.href}
              href={e.href}
              aria-current={actif ? 'page' : undefined}
              className={`rounded-md px-3 py-2 text-sm no-underline ${
                actif ? 'bg-[#1F6A4E] font-medium text-white' : 'text-[#1E2A25] hover:bg-[#E4EFE8]'
              }`}
            >
              {e.libelle}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={async () => {
            await deconnecter();
            window.location.href = '/';
          }}
          className="mt-2 rounded-md px-3 py-2 text-left text-sm text-[#5C6B63] hover:bg-[#E6E2D8]"
        >
          Se déconnecter
        </button>
      </nav>
    </aside>
  );
}
