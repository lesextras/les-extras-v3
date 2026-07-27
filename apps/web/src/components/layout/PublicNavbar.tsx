"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

const NAV_LINKS = [
  { label: "Renfort", href: "#renfort" },
  { label: "Ateliers & Formations", href: "#ateliers" },
  { label: "Établissements", href: "#etablissements" },
  { label: "Freelances", href: "#freelances" },
  { label: "Tarifs", href: "#tarifs" },
];

/**
 * Public sticky navbar for non-authenticated visitors.
 * Supports scroll shadow, mobile hamburger, and conversion CTAs.
 */
export function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = () => { if (mq.matches) setMobileOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="fixed top-0 z-50 w-full transition-shadow duration-300"
    >
      <nav className={`glass-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Image
              src="/logo-adepa.png"
              alt="ADEPA Les Extras"
              width={110}
              height={36}
              className="h-8 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((n) => (
              <Link
                key={n.label}
                href={n.href}
                className="text-sm font-medium text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--foreground))] transition-colors relative group"
              >
                {n.label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-[1.5px] rounded-full bg-[hsl(var(--teal))] group-hover:w-full transition-all duration-300" />
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />

            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-sm font-semibold hidden sm:inline-flex text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--foreground))]"
            >
              <Link href="/login">Connexion</Link>
            </Button>

            <Button asChild size="sm" variant="coral" className="hidden sm:inline-flex">
              <Link href="/register">
                Commencer <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 rounded-xl"
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden glass-nav border-t border-[hsl(var(--border)/0.3)]"
          >
            <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((n) => (
                <Link
                  key={n.label}
                  href={n.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-[hsl(var(--text-secondary))] hover:bg-[hsl(var(--teal)/0.08)] hover:text-[hsl(var(--foreground))] transition-colors"
                >
                  {n.label}
                </Link>
              ))}
              <div className="mt-3 border-t border-[hsl(var(--border)/0.3)] pt-3 flex flex-col gap-2">
                <Button asChild variant="ghost" size="sm" className="justify-start text-sm font-semibold">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>Connexion</Link>
                </Button>
                <Button asChild size="sm" variant="coral">
                  <Link href="/register" onClick={() => setMobileOpen(false)}>
                    Commencer <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
