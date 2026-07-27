"use client";

import { useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { adminLogout } from "@/app/actions/admin-auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      {/* Subtle background halos */}
      <div className="pointer-events-none fixed inset-0 z-0 halo-primary" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 z-0 halo-secondary" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen">
        <AdminSidebar
          isMobileOpen={isMobileSidebarOpen}
          onMobileOpenChange={setIsMobileSidebarOpen}
        />

        <div className="flex min-h-screen flex-1 flex-col">
          {/* Glass topbar */}
          <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-[12px] border-b border-border/40 shadow-sm px-4 py-3 md:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden min-h-[44px] min-w-[44px]"
                  aria-label="Ouvrir la navigation admin"
                  onClick={() => setIsMobileSidebarOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Back Office
                  </p>
                  <h1 className="text-lg font-semibold text-foreground">Le Desk</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <ThemeSwitcher />
                <form action={adminLogout}>
                  <Button type="submit" variant="ghost" size="sm" className="gap-1.5">
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                </form>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-5 md:px-6 md:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
