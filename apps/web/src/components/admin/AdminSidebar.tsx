"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  FileText,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  ShieldAlert,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SPRING_STIFF, containerVariants, itemSlideLeft } from "@/lib/motion";

const links = [
  {
    href: "/admin",
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/users",
    label: "Utilisateurs",
    icon: Users,
  },
  {
    href: "/admin/kyc",
    label: "KYC Freelances",
    icon: FileText,
  },
  {
    href: "/admin/missions",
    label: "Missions Renforts",
    icon: TriangleAlert,
  },
  {
    href: "/admin/services",
    label: "Ateliers",
    icon: GraduationCap,
  },
  {
    href: "/admin/finance",
    label: "Finance",
    icon: Wallet,
  },
  {
    href: "/admin/incidents",
    label: "Incidents Finance",
    icon: AlertCircle,
  },
  {
    href: "/admin/demandes",
    label: "Inbox Desk",
    icon: Inbox,
  },
  {
    href: "/admin/contournements",
    label: "Contournements",
    icon: ShieldAlert,
  },
];

type AdminSidebarProps = {
  isMobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

type AdminNavProps = {
  onNavigate?: () => void;
};

function AdminNav({ onNavigate }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <motion.nav
      className="space-y-1"
      aria-label="Administration"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {links.map((link) => {
        const Icon = link.icon;
        const isActive =
          pathname === link.href ||
          (link.href !== "/admin" && pathname.startsWith(link.href));

        return (
          <motion.div key={link.href} variants={itemSlideLeft}>
            <Link
              href={link.href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium",
                "transition-all duration-200",
                "text-muted-foreground hover:bg-accent hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "min-h-[44px]",
                isActive &&
                "bg-primary/10 text-primary"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.span
                  layoutId="admin-sidebar-active"
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary shadow-[0_0_8px_hsl(var(--teal)/0.3)]"
                  transition={SPRING_STIFF}
                />
              )}
              <span className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-200",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}>
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>{link.label}</span>
            </Link>
          </motion.div>
        );
      })}
    </motion.nav>
  );
}

export function AdminSidebar({ isMobileOpen, onMobileOpenChange }: AdminSidebarProps) {
  return (
    <>
      {/* Desktop sidebar — glass surface */}
      <aside className="hidden w-60 shrink-0 md:block">
        <div className="sticky top-0 h-screen overflow-y-auto glass-panel-dense rounded-none border-r border-white/20">
          <div className="px-5 py-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Super Admin
            </p>
            <p className="mt-1 text-xl font-semibold text-foreground">Le Desk</p>
          </div>
          <div className="px-3 pb-4">
            <AdminNav />
          </div>
        </div>
      </aside>

      {/* Mobile sidebar — Sheet */}
      <Sheet open={isMobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-[280px] glass-surface">
          <SheetHeader>
            <SheetTitle>Le Desk</SheetTitle>
            <SheetDescription>
              Navigation administration.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <AdminNav onNavigate={() => onMobileOpenChange(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
