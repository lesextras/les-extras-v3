import Link from "next/link";
import Image from "next/image";

const MONO = "font-[family-name:var(--font-mono)]";

const FOOTER_LINKS = [
  { label: "CGU", href: "/terms" },
  { label: "Confidentialité", href: "/privacy" },
  { label: "Mentions légales", href: "/terms" },
  { label: "Contact", href: "mailto:contact@lesextras.fr" },
];

const FOOTER_COLUMNS = [
  {
    title: "Plateforme",
    links: [
      { label: "Accueil", href: "/" },
      { label: "Ateliers & Formations", href: "/ateliers" },
      { label: "Établissements", href: "/etablissements" },
      { label: "Freelances", href: "/freelances" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Tarifs", href: "/#tarifs" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Légal",
    links: FOOTER_LINKS,
  },
];

/**
 * Public footer for non-authenticated pages.
 * Multi-column layout with brand, navigation links, and legal info.
 */
export function PublicFooter() {
  return (
    <footer className="border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Top section — columns */}
        <div className="grid grid-cols-2 gap-8 py-12 sm:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="inline-block">
              <Image
                src="/logo-adepa.png"
                alt="ADEPA Les Extras"
                width={100}
                height={32}
                className="h-7 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity"
              />
            </Link>
            <p className="mt-3 text-xs text-[hsl(var(--text-tertiary))] leading-relaxed max-w-[200px]">
              Plateforme de mise en relation pour le secteur social &amp; médico-social.
            </p>
          </div>

          {/* Navigation columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--text-secondary))] mb-3">
                {col.title}
              </p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[hsl(var(--border)/0.5)] py-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className={`${MONO} text-[11px] text-[hsl(var(--text-tertiary))]`}>
            © {new Date().getFullYear()} ADEPA Les Extras · Tous droits réservés
          </p>
          <div className="flex items-center gap-6">
            {FOOTER_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--foreground))] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
