import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Produit',
    links: [
      { label: 'SOS Renfort', href: '/#renfort' },
      { label: 'Ateliers', href: '/#ateliers' },
      { label: 'Tarifs', href: '/#tarifs' },
      { label: 'Créer un compte', href: '/register' },
    ],
  },
  {
    title: 'Secteur',
    links: [
      { label: 'MECS & foyers', href: '/#renfort' },
      { label: 'IME · ITEP · SESSAD', href: '/#renfort' },
      { label: 'EHPAD', href: '/#renfort' },
      { label: 'Freelances', href: '/register' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Comment ça marche', href: '/#comment' },
      { label: 'Nous contacter', href: '/contact' },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Mentions légales', href: '/legal#mentions' },
      { label: 'CGU', href: '/legal#cgu' },
      { label: 'Confidentialité', href: '/legal#confidentialite' },
      { label: 'RGPD', href: '/legal#rgpd' },
    ],
  },
];

/** Pied de page marketing. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              La marketplace qui relie les établissements médico-sociaux aux professionnels
              indépendants. Sereinement.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold text-foreground">{col.title}</p>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} LES EXTRAS — ADéPA. Tous droits réservés.</p>
          <p>Fait avec soin pour le secteur médico-social.</p>
        </div>
      </div>
    </footer>
  );
}
