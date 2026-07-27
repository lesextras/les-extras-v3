"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  UserRound,
  WalletCards,
  LayoutDashboard,
  ShoppingBag,
  Briefcase,
  Settings,
  CalendarDays,
  Mail,
  Inbox,
  Building2,
  LogOut,
  BookOpen,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUIStore } from "@/lib/stores/useUIStore";
import { cn } from "@/lib/utils";
import { EASE_SNAPPY, SPRING_STIFF, itemSlideLeft, containerVariants } from "@/lib/motion";
import { logout } from "@/app/actions/logout";

const ESTABLISHMENT_LINKS = [
  { href: "/dashboard",          label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/marketplace",        label: "Marketplace",     icon: ShoppingBag },
  { href: "/dashboard/packs",    label: "Crédits",         icon: WalletCards },
  { href: "/dashboard/renforts", label: "Mes Renforts",    icon: Briefcase },
  { href: "/orders",             label: "Mes Commandes",   icon: Package },
  { href: "/dashboard/inbox",    label: "Messagerie",      icon: Mail },
];

const FREELANCE_LINKS = [
  { href: "/dashboard",          label: "Tableau de bord",   icon: LayoutDashboard },
  { href: "/marketplace",        label: "Marketplace",          icon: ShoppingBag },
  { href: "/bookings",           label: "Mon Agenda",         icon: CalendarDays },
  { href: "/dashboard/ateliers", label: "Mes ateliers et formations", icon: BookOpen },
  { href: "/orders",             label: "Mes Commandes",      icon: Package },
  { href: "/dashboard/inbox",    label: "Messagerie",         icon: Mail },
];

const DEMANDES_LINK = { href: "/dashboard/demandes", label: "Mes demandes", icon: Inbox };

const BOTTOM_LINKS = [
  { href: "/account",  label: "Mon Profil",   icon: UserRound },
  { href: "/settings", label: "Paramètres",   icon: Settings },
];

const ESTABLISHMENT_BOTTOM_LINKS = [
  { href: "/account/establishment",  label: "Mon Établissement",   icon: Building2 },
  { href: "/settings",               label: "Paramètres",          icon: Settings },
];

const ACCOUNT_LINKS = [DEMANDES_LINK, ...BOTTOM_LINKS];
const ESTABLISHMENT_ACCOUNT_LINKS = [DEMANDES_LINK, ...ESTABLISHMENT_BOTTOM_LINKS];

type SidebarProps = {
  isMobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  badge,
  onClick,
  index = 0,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  badge?: number;
  onClick?: () => void;
  index?: number;
}) {
  return (
    <motion.div
      variants={itemSlideLeft}
    >
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
          "transition-all duration-200 group min-h-[44px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--teal)/0.5)]",
          isActive
            ? "bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal))] font-semibold shadow-[0_0_12px_hsl(var(--teal)/0.15)]"
            : "text-muted-foreground hover:bg-[hsl(var(--teal)/0.08)] hover:text-foreground"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {/* Active indicator bar with glow */}
        {isActive && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-[hsl(var(--teal))] shadow-[0_0_8px_hsl(var(--teal)/0.4)]"
            transition={SPRING_STIFF}
          />
        )}

        {/* Icon container */}
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
            isActive
              ? "bg-[hsl(var(--teal)/0.15)] text-[hsl(var(--teal))]"
              : "bg-[hsl(var(--teal)/0.06)] text-muted-foreground group-hover:bg-[hsl(var(--teal)/0.12)] group-hover:text-[hsl(var(--teal))]"
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>

        <span className="flex-1 text-[13px]">{label}</span>

        {badge !== undefined && badge > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--coral))] px-1 text-[10px] font-bold text-white"
            aria-label={`${badge} non lus`}
          >
            {badge}
          </motion.span>
        )}
      </Link>
    </motion.div>
  );
}

function SidebarContent({
  links,
  pathname,
  onNavigate,
  userRole,
}: {
  links: typeof ESTABLISHMENT_LINKS;
  pathname: string;
  onNavigate?: () => void;
  userRole?: "ESTABLISHMENT" | "FREELANCE" | null;
}) {
  const bottomLinks = userRole === "ESTABLISHMENT" ? ESTABLISHMENT_ACCOUNT_LINKS : ACCOUNT_LINKS;
  const allHrefs = [...links, ...bottomLinks].map((link) => link.href);

  const matchesHref = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const activeHref = allHrefs
    .filter(matchesHref)
    .sort((a, b) => b.length - a.length)[0];

  return (
    <div className="flex h-full flex-col glass-nav border-r border-[rgba(255,255,255,0.06)]">
      {/* Logo zone */}
      <div className="px-4 py-5 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex items-center gap-2.5">
          {/* Logo blocs inspiré du logo ADEPA */}
          <div className="relative h-8 w-8 shrink-0">
            <div className="absolute top-0 right-0 h-3.5 w-3.5 rounded-[3px] bg-[hsl(var(--logo-gray))]" />
            <div className="absolute bottom-0 left-0 h-3.5 w-3.5 rounded-[3px] bg-[hsl(var(--coral))]" />
            <div className="absolute top-0 left-0 h-3.5 w-3.5 rounded-[3px] bg-[hsl(var(--logo-gray)/0.55)]" />
            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-[3px] bg-[hsl(var(--coral)/0.50)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-none font-[family-name:var(--font-display)]">
              Les Extras
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 tracking-wide uppercase">
              Plateforme
            </p>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <motion.nav
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
        aria-label="Navigation principale"
      >
        {/* Section label — C.18 overline style */}
        <p className="px-3 pb-2 text-overline uppercase text-muted-foreground/70 tracking-widest">
          Principal
        </p>
        {links.map((link, i) => (
          <NavLink
            key={link.href}
            {...link}
            isActive={activeHref === link.href}
            index={i}
            onClick={onNavigate}
          />
        ))}
      </motion.nav>

      {/* Divider */}
      <div className="mx-3 border-t border-border/60" />

      {/* Liens du bas */}
      <div className="px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-overline uppercase text-muted-foreground/70 tracking-widest">
          Compte
        </p>
        {bottomLinks.map((link, i) => (
          <NavLink
            key={link.href}
            {...link}
            isActive={activeHref === link.href}
            index={i}
            onClick={onNavigate}
          />
        ))}
      </div>

      {/* Déconnexion */}
      <div className="px-3 pb-2">
        <form action={logout}>
          <button
            type="submit"
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
              "transition-all duration-200 group min-h-[44px]",
              "text-muted-foreground hover:bg-[hsl(var(--coral)/0.08)] hover:text-[hsl(var(--coral))]"
            )}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--coral)/0.06)] text-muted-foreground group-hover:bg-[hsl(var(--coral)/0.12)] group-hover:text-[hsl(var(--coral))] transition-colors duration-200">
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <span className="text-[13px]">Déconnexion</span>
          </button>
        </form>
      </div>

      {/* Version tag */}
      <div className="px-5 pb-4">
        <p className="text-[10px] text-muted-foreground/60 font-mono">v2026.3</p>
      </div>
    </div>
  );
}

export function Sidebar({ isMobileOpen, onMobileOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const userRole = useUIStore((state) => state.userRole);
  const links = userRole === "ESTABLISHMENT" ? ESTABLISHMENT_LINKS : FREELANCE_LINKS;

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:shrink-0 z-20">
        <SidebarContent links={links} pathname={pathname} userRole={userRole} />
      </aside>

      {/* Mobile sheet */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-64 p-0 border-r border-border">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
            <SheetDescription>Menu de navigation principal</SheetDescription>
          </SheetHeader>
          <SidebarContent
            links={links}
            pathname={pathname}
            userRole={userRole}
            onNavigate={() => onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
