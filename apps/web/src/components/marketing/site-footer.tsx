import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Produit',
    links: [
      // L'ancre `#renfort` n'existe sur aucune page : ces quatre liens ne
      // bougeaient pas d'un pixel, sur toutes les pages du site. RenforTeam a
      // sa propre route depuis le changement de nom.
      { label: 'RenforTeam', href: '/renforteam' },
      // L'ancre `/#ateliers` n'existe pas sur l'accueil : le lien ne bougeait
      // pas la page. Le catalogue d'ateliers a sa propre route.
      { label: 'Ateliers', href: '/ateliers' },
      { label: 'Tarifs', href: '/#tarifs' },
      { label: 'Créer un compte', href: '/register' },
    ],
  },
  {
    title: 'Secteur',
    links: [
      { label: 'MECS & foyers', href: '/renforteam' },
      { label: 'IME · ITEP · SESSAD', href: '/renforteam' },
      { label: 'EHPAD', href: '/renforteam' },
      { label: 'Renfort par métier', href: '/renfort' },
      { label: 'Intervenant indépendant', href: '/intervenant-independant' },
    ],
  },
  {
    title: 'Ressources',
    links: [
      { label: 'Comment ça marche', href: '/#comment' },
      { label: 'Le GAP', href: '/gap' },
      { label: 'L’Édublog', href: '/edublog' },
      { label: 'Notre histoire', href: '/notre-histoire' },
      { label: 'Centre d’aide', href: '/aide' },
      { label: 'Frais de service', href: '/frais-de-service' },
      { label: 'Cadre de confiance LEX', href: '/confiance-lex' },
      { label: "Simulateur d'économies", href: '/simulateur' },
      { label: 'Recevoir le catalogue', href: '/catalogue' },
      { label: 'Demander une démo', href: '/demo' },
      { label: 'Nous contacter', href: '/contact' },
    ],
  },
  {
    title: 'Légal',
    links: [
      // Les ancres suivent les rubriques réelles de /legal. « Remboursements »,
      // « Confidentialité » et « RGPD » renvoyaient à des ancres qui n'existent
      // plus depuis la réécriture : un lien mort dans un pied de page légal se
      // remarque, et se retient.
      { label: 'Mentions légales', href: '/legal#mentions' },
      { label: 'CGU', href: '/legal#cgu' },
      { label: 'CGV', href: '/legal#cgv' },
      { label: 'Paiements et annulations', href: '/legal#paiements' },
      { label: 'Cookies', href: '/legal/cookies' },
      { label: 'Données personnelles', href: '/legal#donnees' },
      { label: 'Médiation', href: '/legal#mediation' },
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
