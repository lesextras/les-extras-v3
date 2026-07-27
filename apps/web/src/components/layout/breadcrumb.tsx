'use client';

// Fil d'Ariane admin/app : se déduit du pathname, se masque sur les racines.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

// Libellés lisibles pour les segments connus.
const LABELS: Record<string, string> = {
  admin: 'Administration',
  dashboard: 'Mon espace',
  marketplace: 'Marketplace',
  missions: 'Missions',
  ateliers: 'Ateliers',
  services: 'Ateliers',
  reservations: 'Réservations',
  educatheures: 'Educat’heures',
  formations: 'Formations',
  qualiopi: 'Conformité Qualiopi',
  registre: 'Registre & BPF',
  conformite: 'Coffre-fort conformité',
  etablissements: 'Comptes & sous-comptes',
  utilisateurs: 'Utilisateurs',
  invitations: 'Invitations',
  roles: 'Rôles & droits',
  articles: 'Articles',
  categories: 'Catégories',
  factures: 'Factures',
  statistiques: 'Statistiques',
  renforts: 'SOS Renfort',
  planning: 'Planning',
  inbox: 'Messagerie',
  opportunites: 'Opportunités',
  finance: 'Factures & revenus',
  credits: 'Abonnement & crédits',
  account: 'Mon compte',
  tutorat: 'Tutorat',
};

// Racines qui ne méritent pas de fil d'Ariane (déjà le sommet d'une section).
const ROOTS = new Set(['/admin', '/dashboard', '/marketplace', '/']);

function isId(seg: string) {
  // cuid/uuid ou identifiant long → segment de détail, pas un libellé.
  return seg.length > 14 || /^[0-9a-f]{8,}$/i.test(seg) || /^c[a-z0-9]{20,}$/i.test(seg);
}

export function Breadcrumb() {
  const pathname = usePathname() || '/';
  if (ROOTS.has(pathname)) return null;

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null;

  const home = segments[0] === 'admin' ? '/admin' : '/dashboard';
  const crumbs: { label: string; href: string; current: boolean }[] = [];
  let acc = '';
  segments.forEach((seg, i) => {
    acc += `/${seg}`;
    if (i === 0) return; // la racine est représentée par l'icône Accueil
    const label = isId(seg) ? 'Détail' : LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1);
    crumbs.push({ label, href: acc, current: i === segments.length - 1 });
  });

  return (
    <nav aria-label="Fil d'Ariane" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
      <Link href={home} className="flex items-center gap-1 rounded px-1 py-0.5 hover:text-foreground">
        <Home className="h-3.5 w-3.5" />
        <span className="sr-only">Accueil</span>
      </Link>
      {crumbs.map((c) => (
        <span key={c.href} className="flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          {c.current ? (
            <span aria-current="page" className="font-medium text-foreground">{c.label}</span>
          ) : (
            <Link href={c.href} className="rounded px-1 py-0.5 hover:text-foreground">{c.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
