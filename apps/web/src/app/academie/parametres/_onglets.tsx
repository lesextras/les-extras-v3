import Link from 'next/link';

/** Les sous-pages des paramètres, comme les onglets de Teachizy. */
const ONGLETS = [
  { href: '/academie/parametres', libelle: 'Général' },
  { href: '/academie/parametres/domaine', libelle: 'Domaine' },
  { href: '/academie/parametres/referencement', libelle: 'Référencement' },
  { href: '/academie/parametres/legal', libelle: 'Liens légaux et RGPD' },
  { href: '/academie/parametres/api', libelle: 'API développeur' },
];

export function OngletsParametres({ actif }: { actif: string }) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2" aria-label="Paramètres">
      {ONGLETS.map((o) => (
        <Link
          key={o.href}
          href={o.href}
          aria-current={o.href === actif ? 'page' : undefined}
          className={`rounded-xl px-4 py-2 text-sm font-bold no-underline ${o.href === actif ? 'bg-[#1E9E6A] text-white' : 'border border-[#CFE4D9] bg-white text-[#12312A] hover:border-[#1E9E6A]'}`}
        >
          {o.libelle}
        </Link>
      ))}
    </nav>
  );
}
