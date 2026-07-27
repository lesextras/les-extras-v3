"use client";

import { Menu, Siren, Bell, ChevronDown, ChevronRight } from "lucide-react";
import { motion, type MotionValue, type MotionStyle } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUIStore } from "@/lib/stores/useUIStore";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { cn } from "@/lib/utils";

/** Human-readable labels for breadcrumbs */
const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Tableau de bord",
  marketplace: "Marketplace",
  bookings: "Agenda",
  account: "Compte",
  settings: "Paramètres",
  inbox: "Messagerie",
  packs: "Crédits",
  renforts: "Mes Renforts",
  ateliers: "Ateliers",
  finance: "Finance",
  reservations: "Réservations",
  establishment: "Mon Établissement",
  missions: "Missions",
  services: "Services",
  demandes: "Demandes",
};

function Breadcrumbs() {
  const pathname: string = usePathname();
  const userRole = useUIStore((state) => state.userRole);
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    const label =
      userRole === "FREELANCE" && seg === "account"
        ? "Mon Profil"
        : BREADCRUMB_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
    const isLast = i === segments.length - 1;
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Fil d'Ariane" className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" aria-hidden="true" />}
          {crumb.isLast ? (
            <span className="font-medium text-foreground">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

type HeaderProps = {
  onOpenMobileSidebar: () => void;
  /** Dynamic header opacity from scroll progress (0.5 → 0.92) */
  headerOpacity?: MotionValue<number>;
  /** Dynamic border opacity from scroll progress (0 → 1) */
  borderOpacity?: MotionValue<number>;
};

function useHeaderStyle(
  headerOpacity?: MotionValue<number>,
  borderOpacity?: MotionValue<number>
): MotionStyle | undefined {
  if (!headerOpacity) return undefined;
  // Pass scroll-linked alpha as CSS custom props consumed by .glass-nav in globals.css
  return {
    '--nav-alpha': headerOpacity,
    '--nav-border-alpha': borderOpacity,
  } as unknown as MotionStyle;
}

export function Header({ onOpenMobileSidebar, headerOpacity, borderOpacity }: HeaderProps) {
  const userRole = useUIStore((state) => state.userRole);
  const openRenfortModal = useUIStore((state) => state.openRenfortModal);
  const openPublishModal = useUIStore((state) => state.openPublishModal);

  const dynamicStyle = useHeaderStyle(headerOpacity, borderOpacity);

  return (
    <motion.header
      className={cn(
        "sticky top-0 z-40 border-b glass-nav",
        !dynamicStyle && "glass-nav"
      )}
      style={dynamicStyle}
    >
      <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6">

        {/* Left — mobile menu */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden h-9 w-9 rounded-xl hover:bg-muted"
            aria-label="Ouvrir le menu"
            onClick={onOpenMobileSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>
          {/* Mobile logo mark */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="relative h-7 w-7 shrink-0">
              <div className="absolute top-0 right-0 h-3 w-3 rounded-[2px] bg-[hsl(var(--logo-gray))]" />
              <div className="absolute bottom-0 left-0 h-3 w-3 rounded-[2px] bg-[hsl(var(--coral))]" />
              <div className="absolute top-0 left-0 h-3 w-3 rounded-[2px] bg-[hsl(var(--logo-gray)/0.5)]" />
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-[2px] bg-[hsl(var(--coral)/0.5)]" />
            </div>
            <span className="text-sm font-bold font-[family-name:var(--font-display)]">Les Extras</span>
          </div>

          {/* Desktop breadcrumbs */}
          <Breadcrumbs />
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">

          {/* Theme toggle */}
          <ThemeSwitcher />

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9 rounded-xl hover:bg-muted"
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[hsl(var(--coral))] ring-2 ring-[hsl(var(--background))]"
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl border border-border p-0 shadow-card-md">
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notifications</p>
              </div>
              <div className="px-4 py-4">
                <p className="text-xs text-muted-foreground">
                  Les notifications réelles sont disponibles dans votre messagerie.
                </p>
              </div>
              <div className="border-t border-border/60 p-2">
                <DropdownMenuItem asChild className="justify-center text-xs text-[hsl(var(--teal))] font-medium rounded-xl py-2">
                  <Link href="/dashboard/inbox">
                  Voir toutes les notifications
                  </Link>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Role badge */}
          <Badge
            variant="outline"
            className="hidden sm:inline-flex text-[11px] rounded-full border-border px-2.5"
          >
            {userRole === "ESTABLISHMENT" ? "🏥 Établissement" : "👤 Freelance"}
          </Badge>

          {/* Primary CTA */}
          {userRole === "ESTABLISHMENT" ? (
            <Button
              onClick={openRenfortModal}
              variant="coral"
              size="sm"
              className="min-h-[36px] gap-2 rounded-lg font-semibold text-[13px]"
            >
              <Siren className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">RENFORT</span>
            </Button>
          ) : (
            <Button
              variant="teal-soft"
              onClick={openPublishModal}
              size="sm"
              className="min-h-[36px] rounded-lg font-semibold text-[13px]"
            >
              <span className="hidden sm:inline">➕ PUBLIER</span>
            </Button>
          )}
        </div>
      </div>
    </motion.header>
  );
}

