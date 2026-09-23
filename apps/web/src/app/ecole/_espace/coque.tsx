import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * LA COQUE DE L'ESPACE APPRENANT.
 *
 * Comme sur Teachizy, l'espace apprenant est à la couleur de l'école : son
 * nom, son logo, sa couleur. Quatre entrées au plus (Mes formations,
 * Calendrier, Communauté, Mon profil), et seulement celles que l'école a
 * ouvertes.
 */
export interface EcoleAffichee {
  nom: string;
  slug: string;
  couleur: string;
  logoUrl: string | null;
  communauteActive?: boolean;
  calendrierVisible?: boolean;
}

export type Onglet = 'formations' | 'calendrier' | 'communaute' | 'profil' | 'catalogue' | 'connexion';

export function CoqueEcole({
  ecole,
  actif,
  connecte,
  children,
}: {
  ecole: EcoleAffichee;
  actif: Onglet;
  connecte: boolean;
  children: ReactNode;
}) {
  const couleur = ecole.couleur || '#0F5F3E';
  const base = `/ecole/${ecole.slug}`;
  const entrees: { cle: Onglet; libelle: string; href: string }[] = connecte
    ? [
        { cle: 'formations', libelle: 'Mes formations', href: `${base}/espace` },
        ...(ecole.calendrierVisible !== false ? [{ cle: 'calendrier' as const, libelle: 'Calendrier', href: `${base}/calendrier` }] : []),
        ...(ecole.communauteActive ? [{ cle: 'communaute' as const, libelle: 'Communauté', href: `${base}/communaute` }] : []),
        { cle: 'profil', libelle: 'Mon profil', href: `${base}/espace?onglet=profil` },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#334A42]" style={{ fontFamily: 'var(--font-pilote), system-ui, sans-serif' }}>
      <header style={{ backgroundColor: couleur }} className="text-white">
        <div className="mx-auto flex w-full max-w-[1100px] flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link href={base} className="flex items-center gap-3 text-white no-underline">
            {ecole.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ecole.logoUrl} alt="" className="h-10 w-10 rounded-xl bg-white/10 object-contain p-1" />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-extrabold">
                {(ecole.nom.trim()[0] ?? '?').toUpperCase()}
              </span>
            )}
            <span className="text-lg font-extrabold tracking-tight">{ecole.nom}</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <Link
              href={base}
              className={`rounded-lg px-3 py-2 text-sm font-bold no-underline ${actif === 'catalogue' ? 'bg-white/20 text-white' : 'text-white/85 hover:bg-white/10'}`}
            >
              Catalogue
            </Link>
            {entrees.map((e) => (
              <Link
                key={e.cle}
                href={e.href}
                aria-current={actif === e.cle ? 'page' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-bold no-underline ${actif === e.cle ? 'bg-white/20 text-white' : 'text-white/85 hover:bg-white/10'}`}
              >
                {e.libelle}
              </Link>
            ))}
            {!connecte ? (
              <Link href={`${base}/connexion`} className="ml-1 rounded-lg bg-white px-3 py-2 text-sm font-extrabold no-underline" style={{ color: couleur }}>
                Espace apprenant
              </Link>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1100px] px-4 py-8 sm:py-12">{children}</main>
      <footer className="mx-auto w-full max-w-[1100px] border-t border-[#DDEBE4] px-4 py-6 text-sm text-[#5E7A6E]">
        <p className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href={`${base}/legal`} className="underline underline-offset-4">
            Conditions et confidentialité
          </Link>
          <span>
            École en ligne propulsée par{' '}
            <a href="https://pilote.toulali.fr" className="underline underline-offset-4">
              Piloter
            </a>
          </span>
        </p>
      </footer>
    </div>
  );
}

export function formaterDateHeure(iso: string | Date | null | undefined) {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
}

export function formaterDate(iso: string | Date | null | undefined) {
  if (!iso) return '';
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Paris' });
}

/** Un appel au relais de l'espace apprenant, depuis le navigateur. */
export async function appelApprenant<T>(chemin: string, init?: { methode?: 'GET' | 'POST' | 'PATCH' | 'DELETE'; corps?: unknown; form?: FormData }): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (init?.form) body = init.form;
  else if (init?.corps !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.corps);
  }
  const r = await fetch(`/api/apprenant${chemin}`, { method: init?.methode ?? 'GET', headers, body, credentials: 'include' });
  const texte = await r.text();
  let data: unknown = null;
  try {
    data = texte ? JSON.parse(texte) : null;
  } catch {
    data = null;
  }
  if (!r.ok) {
    const m = data && typeof data === 'object' && 'message' in data ? (data as { message: unknown }).message : null;
    throw new Error(typeof m === 'string' ? m : Array.isArray(m) ? String(m[0]) : "L'opération n'a pas abouti.");
  }
  return data as T;
}
