'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SupportModal } from '@/app/_shared/modals/SupportModal';
import { ModaleAdherent } from '@/app/_shared/modals/ModaleAdherent';
import { ChevronDown, LayoutList, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNavForRole } from '@/lib/nav';
import type { NavRole, AccountRole } from '@/lib/types';
import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';

export interface SidebarProps {
  role: NavRole;
  /** Accès LEX (crédits > 0 ou illimité) ? Cadenas sur les entrées LEX sinon. */
  isMember?: boolean;
  /**
   * Rôle de la personne DANS le compte actif. Le titulaire (OWNER) est la
   * structure elle-même ; les autres sont ses sous-comptes, c'est-à-dire des
   * personnes physiques — seules concernées par certaines entrées.
   */
  roleCompte?: AccountRole;
  /** Ferme la sidebar (usage mobile en overlay). */
  onNavigate?: () => void;
  className?: string;
  /** Identité connectée, pour préremplir le formulaire de support. */
  utilisateur?: { name?: string | null; email?: string | null };
}

/** Clé de persistance des sections repliées (par rôle). */
const STORAGE_PREFIX = 'lx.sidebar.collapsed.';

/** Clé de persistance du mode d'affichage (essentiel / complet). */
const MODE_PREFIX = 'lx.sidebar.mode.';

/**
 * Navigation latérale, contenu piloté par le rôle (FREELANCE / ESTABLISHMENT /
 * ADMIN). Les sections titrées sont des accordéons dépliables : la section
 * contenant la page courante s'ouvre automatiquement, et l'état plié/déplié est
 * mémorisé d'une visite à l'autre.
 */
function isActiveHref(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(`${href}/`))
  );
}

export function Sidebar({ role, isMember, roleCompte, onNavigate, className, utilisateur }: SidebarProps) {
  const pathname = usePathname();
  // Entrée LEX cliquée sans crédits : on retient laquelle pour que la modale
  // parle de la fonctionnalité visée, pas d'une restriction abstraite.
  const [lexBloquee, setLexBloquee] = useState<string | null>(null);
  // Le titulaire du compte, c'est la structure elle-même. Les entrées qui
  // s'adressent à une personne physique — « Proposer mes services » — ne le
  // concernent pas : elles ne s'affichent que pour ses sous-comptes.
  const estTitulaire = roleCompte === 'OWNER';
  const toutesSections = getNavForRole(role, roleCompte)
    .map((s) => ({
      ...s,
      items: s.items.filter((it) => !(it.sousComptesSeulement && estTitulaire)),
    }))
    .filter((s) => s.items.length > 0);

  // Mode « essentiel » : ne montre que les entrées du quotidien. Il évite qu'un
  // directeur qui vient une fois par mois se noie dans quinze entrées. L'admin
  // travaille dans l'outil tous les jours : mode complet par défaut pour lui.
  const [modeEssentiel, setModeEssentiel] = useState(false);
  const [modeCharge, setModeCharge] = useState(false);

  useEffect(() => {
    let valeur = role !== 'ADMIN';
    try {
      const brut = window.localStorage.getItem(MODE_PREFIX + role);
      if (brut === 'complet') valeur = false;
      else if (brut === 'essentiel') valeur = true;
    } catch {
      /* stockage indisponible : on garde la valeur par défaut du rôle */
    }
    setModeEssentiel(valeur);
    setModeCharge(true);
  }, [role]);

  function basculerMode() {
    setModeEssentiel((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(MODE_PREFIX + role, next ? 'essentiel' : 'complet');
      } catch {
        /* stockage indisponible : le choix vaut pour la session */
      }
      return next;
    });
  }

  const total = toutesSections.reduce((n, s) => n + s.items.length, 0);

  // Le filtre ne s'applique qu'après lecture du stockage : rendu serveur et
  // premier rendu client restent identiques (pas de mismatch d'hydratation).
  const sections =
    modeCharge && modeEssentiel
      ? toutesSections
          .map((s) => ({
            ...s,
            items: s.items.filter((it) => it.essentiel || isActiveHref(pathname, it.href)),
          }))
          .filter((s) => s.items.length > 0)
      : toutesSections;

  const masquees = total - sections.reduce((n, s) => n + s.items.length, 0);

  const isActive = (href: string) => isActiveHref(pathname, href);

  /** Titre de la section qui contient la page courante (pour l'ouvrir d'office). */
  const activeSectionTitle = useMemo(() => {
    const match = sections.find((s) => s.title && s.items.some((it) => isActive(it.href)));
    return match?.title ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, role]);

  // Rendu serveur et premier rendu client identiques : tout est ouvert.
  // La restauration depuis localStorage se fait après montage (pas de mismatch).
  const [collapsed, setCollapsed] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_PREFIX + role);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setCollapsed(parsed.filter((t) => typeof t === 'string'));
      }
    } catch {
      /* stockage indisponible : on reste tout déplié */
    }
  }, [role]);

  // La section de la page courante ne doit jamais rester repliée.
  useEffect(() => {
    if (!activeSectionTitle) return;
    setCollapsed((prev) => (prev.includes(activeSectionTitle) ? prev.filter((t) => t !== activeSectionTitle) : prev));
  }, [activeSectionTitle]);

  function toggleSection(title: string) {
    setCollapsed((prev) => {
      const next = prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title];
      try {
        window.localStorage.setItem(STORAGE_PREFIX + role, JSON.stringify(next));
      } catch {
        /* stockage indisponible : l'état reste valable pour la session */
      }
      return next;
    });
  }

  return (
    <aside
      className={cn(
        'flex h-full w-64 shrink-0 flex-col border-r border-border bg-card',
        className,
      )}
    >
      <div className="flex h-16 items-center border-b border-border px-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-4">
        {sections.map((section, i) => {
          const open = !section.title || !collapsed.includes(section.title);
          const sectionId = `nav-section-${i}`;
          /** Une section repliée signale par une pastille qu'elle contient la page courante. */
          const hasActive = section.items.some((it) => isActive(it.href));

          return (
            <div key={section.title ?? i} className="space-y-1">
              {section.title && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.title!)}
                  aria-expanded={open}
                  aria-controls={sectionId}
                  className="group flex w-full items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <ChevronDown
                    aria-hidden="true"
                    className={cn(
                      'size-3.5 shrink-0 transition-transform duration-200',
                      open ? 'rotate-0' : '-rotate-90',
                    )}
                  />
                  <span className="truncate">{section.title}</span>
                  {!open && hasActive && (
                    <span aria-hidden="true" className="ml-auto size-1.5 shrink-0 rounded-full bg-primary" />
                  )}
                </button>
              )}

              <div
                id={sectionId}
                hidden={!open}
                className={cn('space-y-1', section.title && 'pl-1')}
              >
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  const verrouille = Boolean(item.premium) && !isMember;
                  const classes = cn(
                    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-primary-soft font-semibold text-accent-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.08)] before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  );
                  const contenu = (
                    <>
                      <Icon
                        className={cn(
                          'size-[18px] shrink-0 transition-colors',
                          active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                      {verrouille ? (
                        <Lock className="ml-auto size-3.5 shrink-0 text-muted-foreground/70" aria-hidden />
                      ) : null}
                      {item.badge && (
                        <Badge variant="secondary" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  );

                  // Sans crédits, l'entrée n'est plus un lien : la navigation
                  // n'a pas lieu du tout. Laisser la page s'ouvrir pour y
                  // afficher un refus, c'est faire perdre un aller-retour à
                  // quelqu'un à qui on va dire non de toute façon.
                  if (verrouille) {
                    return (
                      <button
                        key={item.href}
                        type="button"
                        onClick={() => setLexBloquee(item.label)}
                        title="Crédits LEX requis — activez l'essai gratuit ou rechargez"
                        aria-label={`${item.label} — crédits LEX requis`}
                        className={classes}
                      >
                        {contenu}
                      </button>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      title={item.hint ?? item.label}
                      aria-current={active ? 'page' : undefined}
                      className={classes}
                    >
                      {contenu}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-border px-4 pt-3">
        <button
          type="button"
          onClick={basculerMode}
          aria-pressed={modeEssentiel}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LayoutList aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate text-left">
            {modeEssentiel
              ? masquees > 0
                ? `Afficher tout le menu (+${masquees})`
                : 'Afficher tout le menu'
              : 'Vue essentielle'}
          </span>
        </button>
      </div>

      <div className="p-4 pt-2">
        <div className="rounded-xl bg-primary-soft/60 p-3">
          <p className="text-xs font-semibold text-accent-foreground">Besoin d’aide ?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Notre équipe vous accompagne du lundi au vendredi.
          </p>
          <SupportModal
            utilisateur={utilisateur}
            trigger={
              <button
                type="button"
                className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline"
              >
                Contacter le support
              </button>
            }
          />
        </div>
      </div>

      {/* Rendue hors de la liste : la modale doit survivre au repli d'une
          section comme à la fermeture du menu sur mobile. */}
      <ModaleAdherent
        open={lexBloquee !== null}
        onOpenChange={(v) => !v && setLexBloquee(null)}
        fonctionnalite={lexBloquee ?? undefined}
      />
    </aside>
  );
}
