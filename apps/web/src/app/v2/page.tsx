"use client";

import Link from "next/link";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useInView,
  AnimatePresence,
} from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Clock,
  Star,
  Zap,
  TrendingUp,
  Users,
  BadgeCheck,
  ArrowUpRight,
  CalendarDays,
  FileText,
  Heart,
  Briefcase,
  BarChart3,
  Timer,
  Activity,
  Sparkles,
  Search,
  Send,
  UserCheck,
  Shield,
  Menu,
  X,
  ChevronRight,
  Quote,
  Building2,
  Palette,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── CONSTANTS ───────────────────────────────────────────────
const DISPLAY = "font-[family-name:var(--font-display)]";
const MONO = "font-[family-name:var(--font-mono)]";

// ─── ANIMATION VARIANTS ─────────────────────────────────────
const stagger = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const rise = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

// ─── HOOKS ───────────────────────────────────────────────────
function useCounter(target: number, dur = 1400) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true, margin: "-40px" });
  useEffect(() => {
    if (!seen) return;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / dur, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [seen, target, dur]);
  return { val, ref };
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

// ─── HELPER COMPONENTS ──────────────────────────────────────

function Tilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [4, -4]), { stiffness: 240, damping: 30 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-4, 4]), { stiffness: 240, damping: 30 });
  const prefersReduced = useReducedMotion();

  const move = useCallback(
    (e: React.MouseEvent) => {
      if (prefersReduced || !el.current) return;
      const r = el.current.getBoundingClientRect();
      mx.set((e.clientX - r.left) / r.width - 0.5);
      my.set((e.clientY - r.top) / r.height - 0.5);
    },
    [mx, my, prefersReduced]
  );
  const leave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  return (
    <motion.div
      ref={el}
      style={{
        rotateX: rx,
        rotateY: ry,
        transformPerspective: 1200,
        willChange: "transform",
      }}
      onMouseMove={move}
      onMouseLeave={leave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Floating satellite card — oscillates in orbit */
function SatelliteCard({
  children,
  className,
  delay = 0,
  offsetY = -6,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  offsetY?: number;
}) {
  return (
    <motion.div
      className={`glass-panel highlight-top dark-card-shadow relative ${className ?? ""}`}
      animate={{
        y: [0, offsetY, -offsetY * 0.6, 0],
        rotate: [0, 0.5, -0.3, 0],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}

/** Animated stat counter */
function Stat({
  target,
  suffix = "",
  prefix = "",
  label,
  duration = 1400,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  label: string;
  duration?: number;
}) {
  const { val, ref } = useCounter(target, duration);
  return (
    <div className="text-center">
      <span
        ref={ref}
        className={`block text-4xl md:text-5xl font-extrabold tracking-tight ${DISPLAY} text-gradient-dark`}
      >
        {prefix}
        {val}
        {suffix}
      </span>
      <span className="mt-2 block text-sm text-[hsl(var(--text-secondary))]">{label}</span>
    </div>
  );
}

/** Scroll progress bar */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2px] bg-[hsl(var(--primary))] origin-left z-[9999]"
      style={{ scaleX: scrollYProgress }}
    />
  );
}

/** Custom cursor follower */
function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { stiffness: 300, damping: 28 });
  const springY = useSpring(cursorY, { stiffness: 300, damping: 28 });
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    if (!mq.matches) return;

    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX - 10);
      cursorY.set(e.clientY - 10);
    };
    const onHoverIn = () => setHovered(true);
    const onHoverOut = () => setHovered(false);

    window.addEventListener("mousemove", moveCursor);
    const links = document.querySelectorAll("a, button, [role=button]");
    links.forEach((el) => {
      el.addEventListener("mouseenter", onHoverIn);
      el.addEventListener("mouseleave", onHoverOut);
    });

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      links.forEach((el) => {
        el.removeEventListener("mouseenter", onHoverIn);
        el.removeEventListener("mouseleave", onHoverOut);
      });
    };
  }, [cursorX, cursorY]);

  return (
    <motion.div
      className="fixed top-0 left-0 w-5 h-5 rounded-full border-2 border-[hsl(var(--primary))] pointer-events-none z-[10000] mix-blend-difference hidden md:block"
      style={{ x: springX, y: springY }}
      animate={{
        scale: hovered ? 2.2 : 1,
        opacity: hovered ? 0.8 : 0.5,
      }}
      transition={{ duration: 0.15 }}
    />
  );
}

/** Glass card hover with lift + glow */
function GlassHoverCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`glass-panel highlight-top relative overflow-hidden transition-shadow duration-300 
        hover:shadow-dark-glass-lg hover:-translate-y-1 ${className}`}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4 }}
      style={{ willChange: "transform" }}
    >
      {children}
    </motion.div>
  );
}

// ─── Testimonial data ────────────────────────────────────────
const testimonials = [
  {
    quote: "En 47 secondes, notre remplacement était confirmé. Ça a changé notre quotidien.",
    name: "Marie Lefort",
    role: "Directrice EHPAD Les Tilleuls",
    rating: 5,
  },
  {
    quote: "Les ateliers ont transformé l'accompagnement de nos résidents. L'équipe est montée en compétence.",
    name: "Thomas Duval",
    role: "Chef de service MECS",
    rating: 5,
  },
  {
    quote: "Fini les heures au téléphone. Je publie la mission et le matching fait le reste.",
    name: "Sophie Bernard",
    role: "RH Centre médico-social",
    rating: 5,
  },
  {
    quote: "En tant que freelance, je choisis mes missions et je suis payé en 48h. C'est un game changer.",
    name: "Karim Benzarti",
    role: "Éducateur spécialisé freelance",
    rating: 5,
  },
  {
    quote: "La vérification des diplômes automatique nous fait gagner un temps précieux.",
    name: "Claire Moulin",
    role: "Directrice IME",
    rating: 5,
  },
  {
    quote: "Interface intuitive, support réactif. On recommande à tout le secteur.",
    name: "Jean-Marc Petit",
    role: "Administrateur ITEP",
    rating: 4,
  },
];

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function LandingPageV2() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.96]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <ScrollProgress />
      <CustomCursor />

      {/* ════════════════════════════════════════════
          SECTION 1 — NAVBAR (sticky glass)
          ════════════════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className={`text-lg font-extrabold tracking-tight text-[hsl(var(--foreground))] ${DISPLAY}`}>
                Les Extras
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-8">
              {[
                { label: "Fonctionnement", href: "#process" },
                { label: "Renfort", href: "#pillars" },
                { label: "Ateliers", href: "#pillars" },
                { label: "Témoignages", href: "#testimonials" },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--foreground))] transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* CTA buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--foreground))] hover:bg-white/5"
              >
                <Link href="/login">Connexion</Link>
              </Button>
              <Button variant="teal" size="sm" asChild>
                <Link href="/register">
                  Commencer gratuitement
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden text-[hsl(var(--foreground))] p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden glass-panel-dense border-t border-white/5"
            >
              <div className="px-4 py-4 space-y-3">
                {["Fonctionnement", "Renfort", "Ateliers", "Témoignages"].map(
                  (label) => (
                    <a
                      key={label}
                      href={`#${label.toLowerCase()}`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm font-medium text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--foreground))]"
                    >
                      {label}
                    </a>
                  )
                )}
                <div className="pt-3 flex gap-3">
                  <Button variant="ghost" size="sm" asChild className="flex-1">
                    <Link href="/login">Connexion</Link>
                  </Button>
                  <Button variant="teal" size="sm" asChild className="flex-1">
                    <Link href="/register">S&apos;inscrire</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ════════════════════════════════════════════
          SECTION 2 — HERO SPLIT
          ════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative min-h-screen pt-24 pb-16 overflow-hidden dot-mesh"
      >
        {/* Ambient glows */}
        <div className="absolute inset-0 glow-ambient-teal pointer-events-none" />
        <div className="absolute inset-0 glow-ambient-coral pointer-events-none" />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
          className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-6rem)]"
        >
          {/* ── Left: Copy ── */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col justify-center"
          >
            {/* Badge */}
            <motion.div variants={rise} className="mb-6">
              <span className="inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs font-semibold text-[hsl(var(--text-secondary))]">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
                Plateforme #1 du médico-social
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={rise}
              className={`text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-[-0.04em] leading-[1.08] text-[hsl(var(--foreground))] ${DISPLAY}`}
            >
              Un soignant absent ?{" "}
              <span className="text-gradient-dark">
                Remplacé en 47&nbsp;secondes.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={rise}
              className="mt-6 max-w-lg text-lg leading-relaxed text-[hsl(var(--text-secondary))]"
            >
              Les Extras connecte établissements médico-sociaux et freelances
              vérifiés. Renforts urgents, ateliers spécialisés — tout est géré en
              quelques clics.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={rise} className="mt-8 flex flex-wrap gap-4">
              <Button variant="teal" size="xl" asChild>
                <Link href="/register">
                  Démarrer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="xl"
                asChild
                className="border border-white/10 text-[hsl(var(--foreground))] hover:bg-white/5"
              >
                <Link href="#process">
                  Voir comment ça marche
                  <ChevronRight className="ml-1 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              variants={rise}
              className="mt-10 flex flex-wrap items-center gap-6"
            >
              {[
                { icon: ShieldCheck, text: "Diplômes vérifiés" },
                { icon: Clock, text: "Matching < 1 min" },
                { icon: FileText, text: "Contrats auto-générés" },
              ].map(({ icon: Icon, text }) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-2 text-sm text-[hsl(var(--text-tertiary))]"
                >
                  <Icon className="h-4 w-4 text-[hsl(var(--primary))]" />
                  {text}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* ── Right: Product panel with floating cards ── */}
          <div className="relative flex items-center justify-center lg:justify-end">
            <Tilt className="relative w-full max-w-md">
              {/* Main product card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="glass-panel highlight-top dark-card-shadow rounded-2xl p-6 relative mirror-reflection"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className={`text-xs font-semibold tracking-wider uppercase text-[hsl(var(--primary))] ${MONO}`}>
                      Matching live
                    </span>
                  </div>
                  <span className="text-xs text-[hsl(var(--text-tertiary))]">
                    Il y a 12s
                  </span>
                </div>

                {/* Mission entries */}
                <div className="space-y-3">
                  {[
                    {
                      title: "IDE Nuit — EHPAD Bellevue",
                      tag: "Urgent",
                      tagColor: "bg-[hsl(var(--accent))]",
                      time: "Ce soir 21h",
                      status: "3 profils matchés",
                    },
                    {
                      title: "Éducateur — MECS Horizon",
                      tag: "Renfort",
                      tagColor: "bg-[hsl(var(--primary))]",
                      time: "Demain 8h",
                      status: "Confirmé",
                    },
                    {
                      title: "Atelier Art-thérapie",
                      tag: "Atelier",
                      tagColor: "bg-[hsl(var(--color-violet-500))]",
                      time: "Ven 14h",
                      status: "8 inscrits",
                    },
                  ].map((mission, i) => (
                    <motion.div
                      key={mission.title}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.6 + i * 0.15,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 hover:bg-white/[0.07] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                          {mission.title}
                        </p>
                        <p className="text-xs text-[hsl(var(--text-tertiary))] mt-0.5">
                          {mission.time}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-[hsl(var(--text-secondary))]">
                          {mission.status}
                        </span>
                        <span
                          className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${mission.tagColor}`}
                        >
                          {mission.tag}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Confirmation animation bar */}
                <motion.div
                  className="mt-4 h-1 rounded-full bg-white/5 overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <motion.div
                    className="h-full rounded-full bg-[hsl(var(--primary))]"
                    initial={{ width: "0%" }}
                    animate={{ width: "78%" }}
                    transition={{
                      duration: 2,
                      delay: 1.4,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                </motion.div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-[hsl(var(--text-tertiary))]">
                    Matching en cours...
                  </span>
                  <span className={`text-[10px] font-semibold text-[hsl(var(--primary))] ${MONO}`}>
                    78%
                  </span>
                </div>
              </motion.div>

              {/* ── Satellite cards ── */}
              <SatelliteCard
                className="absolute -top-6 -right-4 sm:-right-10 p-3 rounded-xl w-48 z-10"
                delay={0.5}
                offsetY={-8}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[hsl(var(--primary)/0.2)] flex items-center justify-center">
                    <Zap className="h-4 w-4 text-[hsl(var(--primary))]" />
                  </div>
                  <div>
                    <p className={`text-xs font-bold text-[hsl(var(--foreground))] ${MONO}`}>
                      47s
                    </p>
                    <p className="text-[10px] text-[hsl(var(--text-tertiary))]">
                      Temps moyen matching
                    </p>
                  </div>
                </div>
              </SatelliteCard>

              <SatelliteCard
                className="absolute -bottom-4 -left-4 sm:-left-10 p-3 rounded-xl w-52 z-10"
                delay={1}
                offsetY={6}
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-[hsl(var(--accent)/0.2)] flex items-center justify-center">
                    <BadgeCheck className="h-4 w-4 text-[hsl(var(--accent))]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[hsl(var(--foreground))]">
                      100% vérifiés
                    </p>
                    <p className="text-[10px] text-[hsl(var(--text-tertiary))]">
                      Diplômes & casiers contrôlés
                    </p>
                  </div>
                </div>
              </SatelliteCard>

              <SatelliteCard
                className="absolute top-1/2 -translate-y-1/2 -left-6 sm:-left-16 p-3 rounded-xl w-40 z-10"
                delay={1.5}
                offsetY={-5}
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full border-2 border-[hsl(var(--card))] bg-[hsl(var(--primary)/0.3)]"
                      />
                    ))}
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold text-[hsl(var(--foreground))] ${MONO}`}>
                      2,847
                    </p>
                    <p className="text-[10px] text-[hsl(var(--text-tertiary))]">
                      Freelances actifs
                    </p>
                  </div>
                </div>
              </SatelliteCard>
            </Tilt>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="h-8 w-5 rounded-full border-2 border-white/20 flex justify-center pt-1.5">
            <motion.div
              className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 3 — STATS BAND
          ════════════════════════════════════════════ */}
      <section className="relative py-20 border-y border-white/[0.06]">
        <div className="absolute inset-0 glow-ambient-teal opacity-40 pointer-events-none" />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12"
        >
          {[
            { target: 2847, suffix: "+", label: "Missions réalisées" },
            { target: 47, suffix: "s", label: "Matching moyen" },
            { target: 98, suffix: "%", label: "Taux de satisfaction" },
            { target: 96, suffix: "%", label: "Couverture territoire" },
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={rise}>
              <Stat
                target={stat.target}
                suffix={stat.suffix}
                label={stat.label}
                duration={1400 + i * 200}
              />
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 4 — PROCESS (4 steps)
          ════════════════════════════════════════════ */}
      <section id="process" className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 dot-mesh opacity-50 pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-16 lg:mb-20"
          >
            <motion.span
              variants={rise}
              className="inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs font-semibold text-[hsl(var(--primary))] mb-6"
            >
              <Activity className="h-3.5 w-3.5" />
              Comment ça marche
            </motion.span>
            <motion.h2
              variants={rise}
              className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[hsl(var(--foreground))] ${DISPLAY}`}
            >
              De la publication au{" "}
              <span className="text-gradient-dark">remplacement confirmé</span>
            </motion.h2>
            <motion.p
              variants={rise}
              className="mt-4 max-w-2xl mx-auto text-lg text-[hsl(var(--text-secondary))]"
            >
              Quatre étapes. Moins de deux minutes. Zéro paperasse.
            </motion.p>
          </motion.div>

          {/* Steps grid */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                step: "01",
                icon: Send,
                title: "Publiez votre besoin",
                desc: "Décrivez la mission (poste, date, urgence). L'IA pré-remplit les détails.",
                color: "primary" as const,
              },
              {
                step: "02",
                icon: Search,
                title: "Matching intelligent",
                desc: "Notre algorithme identifie les freelances qualifiés, disponibles et proches.",
                color: "primary" as const,
              },
              {
                step: "03",
                icon: UserCheck,
                title: "Confirmation express",
                desc: "Le freelance accepte en un tap. Contrat auto-généré en quelques secondes.",
                color: "primary" as const,
              },
              {
                step: "04",
                icon: Shield,
                title: "Mission sécurisée",
                desc: "Suivi en temps réel, paiement garanti, évaluation mutuelle post-mission.",
                color: "primary" as const,
              },
            ].map(({ step, icon: Icon, title, desc, color }, i) => (
              <GlassHoverCard key={step} delay={i * 0.1}>
                <div className="p-6">
                  {/* Step number */}
                  <span
                    className={`text-xs font-bold tracking-widest ${MONO} text-[hsl(var(--${color}))]`}
                  >
                    {step}
                  </span>
                  {/* Icon */}
                  <div className="mt-4 mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[hsl(var(--primary)/0.12)] border border-[hsl(var(--primary)/0.15)]">
                    <Icon className="h-6 w-6 text-[hsl(var(--primary))]" />
                  </div>
                  {/* Title */}
                  <h3
                    className={`text-lg font-bold text-[hsl(var(--foreground))] mb-2 ${DISPLAY}`}
                  >
                    {title}
                  </h3>
                  {/* Description */}
                  <p className="text-sm leading-relaxed text-[hsl(var(--text-secondary))]">
                    {desc}
                  </p>
                </div>
                {/* Connecting line (except last) */}
                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gradient-to-r from-white/10 to-transparent" />
                )}
              </GlassHoverCard>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 5 — PILLARS (Renfort + Ateliers)
          ════════════════════════════════════════════ */}
      <section id="pillars" className="relative py-24 lg:py-32">
        <div className="absolute inset-0 glow-ambient-coral opacity-30 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-16 lg:mb-20"
          >
            <motion.span
              variants={rise}
              className="inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs font-semibold text-[hsl(var(--primary))] mb-6"
            >
              <Briefcase className="h-3.5 w-3.5" />
              Nos deux piliers
            </motion.span>
            <motion.h2
              variants={rise}
              className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[hsl(var(--foreground))] ${DISPLAY}`}
            >
              Renfort{" "}
              <span className="text-[hsl(var(--accent))]">&</span>{" "}
              <span className="text-gradient-dark">Ateliers</span>
            </motion.h2>
          </motion.div>

          {/* Two pillars side by side */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* ── Pillar 1: Renfort ── */}
            <Tilt>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="relative glass-panel highlight-top shimmer-border rounded-2xl p-8 lg:p-10 h-full"
              >
                {/* Icon + label */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-[hsl(var(--accent)/0.15)] border border-[hsl(var(--accent)/0.2)] flex items-center justify-center">
                    <Heart className="h-6 w-6 text-[hsl(var(--accent))]" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-extrabold text-[hsl(var(--foreground))] ${DISPLAY}`}>
                      Renfort / Remplacement
                    </h3>
                    <p className="text-xs text-[hsl(var(--text-tertiary))]">
                      Combler l&apos;urgence en quelques minutes
                    </p>
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-4">
                  {[
                    "Matching IA en temps réel — profils vérifiés",
                    "Contrats auto-générés conformes au droit social",
                    "Paiement sécurisé sous 48h pour les freelances",
                    "Tableau de bord de suivi — couverture 24/7",
                    "Évaluation mutuelle & amélioration continue",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 shrink-0 text-[hsl(var(--accent))] mt-0.5" />
                      <span className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-8">
                  <Button variant="coral" size="lg" asChild>
                    <Link href="/register?role=etablissement">
                      Postuler maintenant
                      <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {/* Urgent badge */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--accent))] px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wide">
                    <Zap className="h-3 w-3" />
                    Urgent
                  </span>
                </div>
              </motion.div>
            </Tilt>

            {/* ── Pillar 2: Ateliers ── */}
            <Tilt>
              <motion.div
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.6,
                  delay: 0.15,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative glass-panel highlight-top shimmer-border rounded-2xl p-8 lg:p-10 h-full"
              >
                {/* Icon + label */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-12 w-12 rounded-xl bg-[hsl(var(--color-violet-500)/0.15)] border border-[hsl(var(--color-violet-500)/0.2)] flex items-center justify-center">
                    <Palette className="h-6 w-6 text-[hsl(var(--color-violet-500))]" />
                  </div>
                  <div>
                    <h3 className={`text-xl font-extrabold text-[hsl(var(--foreground))] ${DISPLAY}`}>
                      Ateliers Spécialisés
                    </h3>
                    <p className="text-xs text-[hsl(var(--text-tertiary))]">
                      Montée en compétence & accompagnement
                    </p>
                  </div>
                </div>

                {/* Features list */}
                <ul className="space-y-4">
                  {[
                    "Art-thérapie, musicothérapie, médiation animale…",
                    "Intervenants certifiés & spécialisés en médico-social",
                    "Planification intégrée — calendrier partagé en temps réel",
                    "Suivi des participations & feedbacks automatisés",
                    "Compatible avec les projets personnalisés (PPA/PIA)",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 shrink-0 text-[hsl(var(--color-violet-500))] mt-0.5" />
                      <span className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-8">
                  <Button variant="teal" size="lg" asChild>
                    <Link href="/register?role=etablissement">
                      Découvrir les ateliers
                      <GraduationCap className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>

                {/* Pillar badge */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--color-violet-500)/0.2)] border border-[hsl(var(--color-violet-500)/0.3)] px-2.5 py-1 text-[10px] font-bold text-[hsl(var(--color-violet-500))] uppercase tracking-wide">
                    <Sparkles className="h-3 w-3" />
                    Nouveau
                  </span>
                </div>
              </motion.div>
            </Tilt>
          </div>

          {/* Freelance sub-CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="mt-12 text-center"
          >
            <div className="glass-panel inline-flex items-center gap-4 px-6 py-4 rounded-2xl">
              <div className="flex -space-x-2">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-8 rounded-full border-2 border-[hsl(var(--card))] bg-gradient-to-br from-[hsl(var(--primary)/0.4)] to-[hsl(var(--primary)/0.2)]"
                  />
                ))}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                  Vous êtes freelance ?
                </p>
                <p className="text-xs text-[hsl(var(--text-tertiary))]">
                  Rejoignez 2,847+ pros vérifiés
                </p>
              </div>
              <Button variant="teal" size="sm" asChild>
                <Link href="/register?role=freelance">
                  Rejoindre
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 6 — TESTIMONIALS (3-col grid)
          ════════════════════════════════════════════ */}
      <section
        id="testimonials"
        className="relative py-24 lg:py-32 border-y border-white/[0.06]"
      >
        <div className="absolute inset-0 dot-mesh opacity-30 pointer-events-none" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="text-center mb-16"
          >
            <motion.span
              variants={rise}
              className="inline-flex items-center gap-2 rounded-full glass-panel px-4 py-1.5 text-xs font-semibold text-[hsl(var(--primary))] mb-6"
            >
              <Star className="h-3.5 w-3.5" />
              Témoignages
            </motion.span>
            <motion.h2
              variants={rise}
              className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.03em] text-[hsl(var(--foreground))] ${DISPLAY}`}
            >
              Ce que disent{" "}
              <span className="text-gradient-dark">nos utilisateurs</span>
            </motion.h2>
          </motion.div>

          {/* Testimonial grid */}
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <motion.div variants={rise} key={t.name}>
                <GlassHoverCard delay={i * 0.08}>
                  <div className="p-6 flex flex-col h-full">
                    {/* Stars */}
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, si) => (
                        <Star
                          key={si}
                          className={`h-4 w-4 ${
                            si < t.rating
                              ? "fill-[hsl(var(--accent))] text-[hsl(var(--accent))]"
                              : "text-white/10"
                          }`}
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <div className="relative flex-1 mb-4">
                      <Quote className="absolute -top-1 -left-1 h-6 w-6 text-[hsl(var(--primary)/0.15)]" />
                      <p className="text-sm leading-relaxed text-[hsl(var(--text-secondary))] pl-5">
                        {t.quote}
                      </p>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[hsl(var(--primary)/0.3)] to-[hsl(var(--primary)/0.1)] flex items-center justify-center">
                        <span className="text-xs font-bold text-[hsl(var(--primary))]">
                          {t.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                          {t.name}
                        </p>
                        <p className="text-xs text-[hsl(var(--text-tertiary))]">
                          {t.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassHoverCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 7 — FINAL CTA
          ════════════════════════════════════════════ */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 glow-ambient-teal pointer-events-none" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-[600px] w-[600px] rounded-full bg-[hsl(var(--primary)/0.06)] blur-[120px]" />
        </div>

        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.h2
              variants={rise}
              className={`text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-[-0.04em] leading-[1.1] text-[hsl(var(--foreground))] ${DISPLAY}`}
            >
              Prêt à transformer la gestion
              <br />
              de vos{" "}
              <span className="text-gradient-dark">renforts ?</span>
            </motion.h2>

            <motion.p
              variants={rise}
              className="mt-6 text-lg text-[hsl(var(--text-secondary))] max-w-xl mx-auto"
            >
              Rejoignez les centaines d&apos;établissements et de freelances qui
              font déjà confiance à Les Extras.
            </motion.p>

            <motion.div
              variants={rise}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button variant="teal" size="xl" asChild>
                <Link href="/register?role=etablissement">
                  <Building2 className="mr-2 h-5 w-5" />
                  Je suis un établissement
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="xl"
                asChild
                className="border border-white/10 text-[hsl(var(--foreground))] hover:bg-white/5"
              >
                <Link href="/register?role=freelance">
                  <Users className="mr-2 h-5 w-5" />
                  Je suis freelance
                </Link>
              </Button>
            </motion.div>

            {/* Trust micro-copy */}
            <motion.div
              variants={rise}
              className="mt-8 flex flex-wrap justify-center gap-6 text-xs text-[hsl(var(--text-tertiary))]"
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                Gratuit pour démarrer
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                Données hébergées en France
              </span>
              <span className="flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                Mise en route &lt; 5 min
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 8 — FOOTER
          ════════════════════════════════════════════ */}
      <footer className="relative border-t border-white/[0.06] pt-16 pb-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Brand column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[hsl(var(--primary))]">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className={`text-base font-extrabold text-[hsl(var(--foreground))] ${DISPLAY}`}>
                  Les Extras
                </span>
              </Link>
              <p className="text-sm text-[hsl(var(--text-tertiary))] leading-relaxed max-w-xs">
                La plateforme de mise en relation pour le secteur
                médico-social. Renforts vérifiés, ateliers spécialisés.
              </p>
            </div>

            {/* Plateforme */}
            <div>
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">
                Plateforme
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Renfort", href: "#pillars" },
                  { label: "Ateliers", href: "#pillars" },
                  { label: "Comment ça marche", href: "#process" },
                  { label: "Tarifs", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">
                Ressources
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Centre d'aide", href: "#" },
                  { label: "Blog", href: "#" },
                  { label: "API", href: "#" },
                  { label: "Statut système", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Légal */}
            <div>
              <h4 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-4">
                Légal
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Conditions d'utilisation", href: "/terms" },
                  { label: "Politique de confidentialité", href: "/privacy" },
                  { label: "Mentions légales", href: "#" },
                  { label: "Contact", href: "#" },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[hsl(var(--text-tertiary))] hover:text-[hsl(var(--foreground))] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/[0.06] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-[hsl(var(--text-tertiary))]">
              © {new Date().getFullYear()} Les Extras. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-[hsl(var(--text-tertiary))]">
                Hébergé en France 🇫🇷
              </span>
              <span className="h-1 w-1 rounded-full bg-white/10" />
              <span className="text-xs text-[hsl(var(--text-tertiary))]">
                RGPD compliant
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
