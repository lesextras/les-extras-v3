'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getNavForRole } from '@/lib/nav';
import type { NavRole } from '@/lib/types';
import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';

export interface SidebarProps {
  role: NavRole;
  /** Ferme la sidebar (usage mobile en overlay). */
  onNavigate?: () => void;
  className?: string;
}

/**
 * Navigation latérale, contenu piloté par le rôle (FREELANCE / ESTABLISHMENT /
 * ADMIN). Surligne l'entrée active en fonction du pathname.
 */
export function Sidebar({ role, onNavigate, className }: SidebarProps) {
  const pathname = usePathname();
  const sections = getNavForRole(role);

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && href !== '/admin' && pathname.startsWith(`${href}/`));

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

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {sections.map((section, i) => (
          <div key={section.title ?? i} className="space-y-1">
            {section.title && (
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
            )}
            {section.items.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-primary-soft font-semibold text-accent-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.08)] before:absolute before:inset-y-1.5 before:left-0 before:w-1 before:rounded-full before:bg-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn(
                      'size-[18px] shrink-0 transition-colors',
                      active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground',
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-border p-4">
        <div className="rounded-xl bg-primary-soft/60 p-3">
          <p className="text-xs font-semibold text-accent-foreground">Besoin d’aide ?</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Notre équipe vous accompagne du lundi au vendredi.
          </p>
          <Link
            href="/dashboard/inbox"
            className="mt-2 inline-flex text-xs font-semibold text-primary hover:underline"
          >
            Contacter le support
          </Link>
        </div>
      </div>
    </aside>
  );
}
