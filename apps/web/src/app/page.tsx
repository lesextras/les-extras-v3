"use client";

import Link from "next/link";
import {
  motion, useScroll, useTransform, useMotionValue, useSpring, useInView,
} from "framer-motion";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { useRef, useState, useEffect, useCallback } from "react";
import {
  ArrowRight, CheckCircle, Star, Zap,
  TrendingUp, Users, BadgeCheck, ArrowUpRight, CalendarDays,
  FileText, DollarSign, Briefcase, Sparkles,
  Check, Quote, ChevronRight, Building2, UserCheck, Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* constants */
const DISPLAY = "font-[family-name:var(--font-display)]";
const MONO = "font-[family-name:var(--font-mono)]";

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const rise = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ── Hooks & Primitives ── */
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

function Tilt({ children, className }: { children: React.ReactNode; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 240, damping: 30 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 240, damping: 30 });
  const move = useCallback((e: React.MouseEvent) => {
    if (!el.current) return;
    const r = el.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  }, [mx, my]);
  const leave = useCallback(() => { mx.set(0); my.set(0); }, [mx, my]);
  return (
    <motion.div ref={el} style={{ rotateX: rx, rotateY: ry, transformPerspective: 1200 }}
      onMouseMove={move} onMouseLeave={leave} className={className}>
      {children}
    </motion.div>
  );
}

function Blob({ className, d = 0 }: { className: string; d?: number }) {
  return (
    <motion.div className={className}
      animate={{ x: [0, 20, -15, 0], y: [0, -18, 10, 0], scale: [1, 1.05, 0.96, 1] }}
      transition={{ duration: 22, delay: d, repeat: Infinity, ease: "easeInOut" }} />
  );
}

/* ── Scroll Progress Bar ── */
function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: "left" }}
      className="fixed top-0 left-0 right-0 z-[60] h-[3px] bg-gradient-to-r from-[hsl(var(--teal))] via-[hsl(var(--coral))] to-[hsl(var(--violet))]"
    />
  );
}

/* ── Floating Toast ── */
function FloatingToast() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 3500);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!show || dismissed) return;
    const t = setTimeout(() => setDismissed(true), 5000);
    return () => clearTimeout(t);
  }, [show, dismissed]);

  if (!show || dismissed) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className="fixed bottom-6 right-6 z-50 glass-panel dark-card-shadow rounded-xl p-4 pr-5 max-w-[320px] cursor-pointer"
      onClick={() => setDismissed(true)}
    >
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-lg bg-[hsl(var(--coral))] text-white flex items-center justify-center shrink-0 shadow-md">
          <Briefcase className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${MONO} text-[10px] text-[hsl(var(--text-tertiary))] uppercase tracking-wider mb-0.5`}>
            Il y a 12s
          </p>
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
            Nouvelle candidature reçue
          </p>
          <p className="text-xs text-[hsl(var(--text-secondary))] mt-0.5">
            IDE · EHPAD Les Oliviers · Match 98%
          </p>
        </div>
      </div>
      <div className="mt-3 h-[2px] rounded-full bg-[hsl(var(--border))] overflow-hidden">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: 5, ease: "linear" }}
          className="h-full bg-[hsl(var(--coral))] rounded-full"
        />
      </div>
    </motion.div>
  );
}

/* ── Dashboard Panel (Hero Right) ── */
function DashboardPanel() {
  const missions = [
    { role: "IDE", place: "EHPAD Les Oliviers", time: "Demain 7h–15h", pay: "320€", urgent: true, match: 98 },
    { role: "AS", place: "Clinique St-Joseph", time: "Jeu. 8h–16h", pay: "245€", urgent: false, match: 91 },
    { role: "AES", place: "EHPAD Le Parc", time: "Ven. 14h–22h", pay: "210€", urgent: false, match: 87 },
  ];

  return (
    <div className="relative w-full max-w-[460px] mx-auto" aria-hidden="true">
      {/* Ambient glow behind the card */}
      <div className="absolute -inset-12 rounded-[3rem] opacity-60 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 40% 30%, hsl(185 84% 24% / 0.18), transparent 65%)" }} />

      <motion.div initial={{ opacity: 0, y: 50, rotate: 2 }} animate={{ opacity: 1, y: 0, rotate: 0.5 }}
        transition={{ delay: 0.4, duration: 0.9, type: "spring", stiffness: 70 }}>
        <Tilt className="relative glass-panel dark-card-shadow shimmer-border rounded-2xl overflow-hidden cursor-default">
          {/* Header bar */}
          <div className="px-5 py-4 border-b border-[hsl(var(--border))] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.8, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-[hsl(var(--emerald))]" />
              <span className={`${MONO} text-[11px] text-[hsl(var(--text-secondary))] font-medium`}>
                MATCHING LIVE
              </span>
            </div>
            <span className={`${MONO} text-[10px] font-bold text-[hsl(var(--teal))]`}>3 nouvelles</span>
          </div>

          {/* KPIs row */}
          <div className="grid grid-cols-3 gap-3 p-4">
            {[
              { l: "Taux pourvoi", v: "97%", c: "text-[hsl(var(--emerald))]" },
              { l: "Délai moyen", v: "47s", c: "text-[hsl(var(--coral))]" },
              { l: "Freelances", v: "1 247", c: "text-[hsl(var(--teal))]" },
            ].map((k, i) => (
              <div key={i} className="rounded-lg bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] p-3 text-center">
                <p className="text-[9px] text-[hsl(var(--text-tertiary))] uppercase tracking-wider mb-1">{k.l}</p>
                <p className={`${MONO} text-sm font-bold ${k.c}`}>{k.v}</p>
              </div>
            ))}
          </div>

          {/* Mission rows */}
          <div className="divide-y divide-[hsl(var(--border))]">
            {missions.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.18, duration: 0.5 }}
                className="px-5 py-3.5 flex items-center gap-3.5 hover:bg-[hsl(var(--surface-2)/0.5)] transition-colors">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${m.urgent
                  ? "bg-[hsl(var(--coral))] text-white shadow-md" : "bg-[hsl(var(--teal-light))] border border-[hsl(var(--teal)/0.20)] text-[hsl(var(--teal))]"}`}>
                  <Briefcase className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-[hsl(var(--foreground))]">{m.role}</span>
                    {m.urgent && (
                      <motion.span animate={{ opacity: [1, 0.6, 1] }} transition={{ duration: 1.4, repeat: Infinity }}
                        className={`${MONO} text-[8px] font-bold bg-[hsl(var(--coral))] text-white px-1.5 py-0.5 rounded-full`}>
                        URGENT
                      </motion.span>
                    )}
                  </div>
                  <p className="text-[10px] text-[hsl(var(--text-secondary))] truncate">{m.place} · {m.time}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={`${MONO} text-xs font-bold text-[hsl(var(--emerald))]`}>{m.pay}</p>
                  <p className={`${MONO} text-[9px] text-[hsl(var(--teal))]`}>{m.match}%</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-[hsl(var(--border))] flex items-center justify-between">
            <span className={`${MONO} text-[10px] text-[hsl(var(--text-tertiary))]`}>Mission confirmée :</span>
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.2 }}
              className={`${MONO} text-xs font-bold text-[hsl(var(--coral))]`}>47s ⚡</motion.span>
          </div>
        </Tilt>
      </motion.div>

      {/* Satellite card: Verified Profile */}
      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.8, type: "spring", stiffness: 200, damping: 15 }}
        className="absolute -top-4 -right-6 glass-panel dark-card-shadow rounded-xl px-3.5 py-2.5 flex items-center gap-2"
        style={{ animation: "float 5s ease-in-out infinite" }}>
        <BadgeCheck className="h-4 w-4 text-[hsl(var(--teal))]" />
        <div>
          <p className="text-[10px] font-bold text-[hsl(var(--foreground))]">Profil vérifié</p>
          <p className={`${MONO} text-[9px] text-[hsl(var(--emerald))]`}>ADELI ✓ Diplôme ✓</p>
        </div>
      </motion.div>

      {/* Satellite card: Mission Confirmed */}
      <motion.div initial={{ opacity: 0, scale: 0.5, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 2.6, type: "spring", stiffness: 260, damping: 16 }}
        className="absolute -bottom-5 -left-5 flex items-center gap-2 glass-panel dark-card-shadow px-4 py-2.5 rounded-full">
        <motion.div animate={{ rotate: [0, 360] }} transition={{ delay: 2.8, duration: 0.45 }}>
          <CheckCircle className="h-4 w-4 text-[hsl(var(--emerald))]" />
        </motion.div>
        <span className="text-xs font-bold text-[hsl(var(--emerald))]">Mission confirmée</span>
        <span className={`${MONO} text-[10px] text-[hsl(var(--text-secondary))]`}>47s</span>
      </motion.div>

      {/* Glass sphere decorations */}
      <div className="absolute top-1/4 -left-10 h-6 w-6 rounded-full bg-[hsl(var(--teal)/0.15)] border border-[hsl(var(--teal)/0.25)] backdrop-blur-sm pointer-events-none"
        style={{ animation: "float 7s ease-in-out infinite 1s" }} />
      <div className="absolute bottom-1/3 -right-8 h-4 w-4 rounded-full bg-[hsl(var(--coral)/0.15)] border border-[hsl(var(--coral)/0.25)] backdrop-blur-sm pointer-events-none"
        style={{ animation: "float 6s ease-in-out infinite 2s" }} />
    </div>
  );
}

/* ── Stat for Stats Band ── */
function StatBand({ value, label, suffix, prefix }: { value: number; label: string; suffix?: string; prefix?: string }) {
  const { val, ref } = useCounter(value);
  return (
    <motion.div variants={rise} className="flex flex-col items-center gap-1.5 py-6">
      <span ref={ref} className={`${MONO} text-3xl sm:text-4xl font-bold tabular-nums tracking-tight text-[hsl(var(--foreground))]`}>
        {prefix}{val.toLocaleString("fr-FR")}
        {suffix && <span className="text-[hsl(var(--teal))]">{suffix}</span>}
      </span>
      <span className="text-[10px] font-semibold text-[hsl(var(--text-tertiary))] uppercase tracking-[0.18em]">{label}</span>
    </motion.div>
  );
}

/* ── Process Step ── */
function ProcessStep({ n, title, desc, icon: Icon }: {
  n: string; title: string; desc: string; icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div variants={rise} className="relative flex flex-col items-center text-center gap-4 flex-1">
      <div className="relative">
        <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--teal))] text-white flex items-center justify-center shadow-lg dark-glow-teal">
          <Icon className="h-5 w-5" />
        </div>
        <span className={`${MONO} absolute -top-2 -right-2 text-[10px] font-bold text-[hsl(var(--coral))] bg-[hsl(var(--coral-light))] border border-[hsl(var(--coral)/0.25)] rounded-full h-5 w-5 flex items-center justify-center`}>
          {n}
        </span>
      </div>
      <h3 className={`${DISPLAY} font-bold text-[hsl(var(--foreground))] text-lg`}>{title}</h3>
      <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed max-w-[240px]">{desc}</p>
    </motion.div>
  );
}

/* ── Pillar Card ── */
function PillarCard({ tag, title, desc, features, accent, children }: {
  tag: string; title: string; desc: string;
  features: string[];
  accent: "teal" | "coral";
  children?: React.ReactNode;
}) {
  const colors = {
    teal: {
      tagBg: "bg-[hsl(var(--teal-light))]", tagText: "text-[hsl(var(--teal))]",
      tagBorder: "border-[hsl(var(--teal)/0.25)]", check: "text-[hsl(var(--teal))]",
    },
    coral: {
      tagBg: "bg-[hsl(var(--coral-light))]", tagText: "text-[hsl(var(--coral))]",
      tagBorder: "border-[hsl(var(--coral)/0.25)]", check: "text-[hsl(var(--coral))]",
    },
  };
  const c = colors[accent];
  return (
    <motion.div variants={rise}
      className="relative glass-panel dark-card-shadow highlight-top rounded-2xl p-7 sm:p-9 overflow-hidden">
      <div className={`${MONO} inline-flex items-center gap-2 text-[11px] font-medium ${c.tagText} px-3 py-1.5 rounded-full border ${c.tagBorder} ${c.tagBg} mb-5`}>
        <Sparkles className="h-3 w-3" /> {tag}
      </div>
      <h3 className={`${DISPLAY} text-2xl font-bold text-[hsl(var(--foreground))] mb-3`}>{title}</h3>
      <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed mb-6">{desc}</p>
      <ul className="space-y-3 mb-7">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Check className={`h-4 w-4 ${c.check} shrink-0 mt-0.5`} />
            <span className="text-sm text-[hsl(var(--text-secondary))]">{f}</span>
          </li>
        ))}
      </ul>
      {children}
    </motion.div>
  );
}

/* ── Testimonial Card (Grid) ── */
function TestimonialCardGrid({ quote, name, role, rating, initials }: {
  quote: string; name: string; role: string; rating: number; initials: string;
}) {
  return (
    <motion.div variants={rise}
      className="relative glass-panel dark-card-shadow rounded-2xl p-6 sm:p-7 overflow-hidden group">
      {/* Quote mark background */}
      <Quote className="absolute top-4 right-4 h-16 w-16 text-[hsl(var(--teal)/0.08)] rotate-180" />

      <div className="relative z-10">
        <div className="flex gap-0.5 mb-4">
          {Array.from({ length: rating }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-[hsl(var(--amber))] text-[hsl(var(--amber))]" />
          ))}
        </div>
        <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed mb-6 italic">
          &ldquo;{quote}&rdquo;
        </p>
        <div className="pt-4 border-t border-[hsl(var(--border))] flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[hsl(var(--teal))] flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-bold text-[hsl(var(--foreground))]">{name}</p>
            <p className="text-xs text-[hsl(var(--text-tertiary))]">{role}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── FAQ Item ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[hsl(var(--border))] last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full text-left py-5 flex items-center justify-between gap-4"
        aria-expanded={open ? "true" : "false"}>
        <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{q}</span>
        <ChevronRight className={`h-4 w-4 shrink-0 text-[hsl(var(--text-tertiary))] transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <p className="pb-5 text-sm text-[hsl(var(--text-secondary))] leading-relaxed">{a}</p>
      )}
    </div>
  );
}

/* ── Testimonials data ── */
const testimonials = [
  { quote: "On est passé de 4h de téléphone à 47 secondes. Les Extras a sauvé nos week-ends.", name: "Dr. Marie-Claire Dubois", role: "Directrice · EHPAD La Résidence du Parc", rating: 5, initials: "MD" },
  { quote: "Interface d'une clarté absolue. Mes cadres n'ont eu besoin d'aucune formation.", name: "Thomas Bergeron", role: "DRH · Groupe Santé Horizon", rating: 5, initials: "TB" },
  { quote: "En 3 mois j'ai doublé mes revenus. Le Fast-Apply me laisse me concentrer sur mes patients.", name: "Sophie Martin", role: "Infirmière IDE · Freelance", rating: 5, initials: "SM" },
];

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 160]);
  const heroO = useTransform(scrollYProgress, [0, 0.4], [1, 0]);

  /* Navbar scroll shadow — now handled by PublicNavbar */

  return (
    <div className="relative min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] overflow-x-hidden">
      {/* ── Scroll Progress ── */}
      <ScrollProgress />

      {/* ── Background layers ── */}
      <div className="pointer-events-none fixed inset-0 z-0 dot-mesh" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-grid-lines" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 z-0 glow-ambient-teal" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 z-0 glow-ambient-coral" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-grain" aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <Blob className="absolute -top-40 right-[5%] w-[700px] h-[700px] rounded-full bg-gradient-to-br from-[hsl(var(--teal)/0.12)] to-transparent blur-3xl" d={0} />
        <Blob className="absolute top-[55%] -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-[hsl(var(--violet)/0.08)] to-transparent blur-3xl" d={7} />
        <Blob className="absolute bottom-[8%] right-[20%] w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-[hsl(var(--coral)/0.10)] to-transparent blur-3xl" d={12} />
      </div>

      {/* ── Floating Toast ── */}
      <FloatingToast />

      <div className="relative z-10">
        {/* ══════════ NAVBAR ══════════ */}
        <PublicNavbar />


        <main>
          {/* ══════════ HERO ══════════ */}
          <section ref={heroRef} className="relative min-h-screen flex items-center pt-28 pb-20 px-6 lg:pt-32">
            <motion.div style={{ y: heroY, opacity: heroO }} className="mx-auto max-w-7xl w-full">
              <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
                {/* Left: Copy */}
                <div className="flex-1 max-w-[600px]">
                  <motion.div initial={{ opacity: 0, y: 12, scale: 0.92 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.4, type: "spring" }}
                    className="inline-flex items-center gap-2.5 rounded-full glass-panel px-4 py-1.5 mb-8">
                    <motion.div animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
                      className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--emerald))]" />
                    <span className={`${MONO} text-[11px] text-[hsl(var(--text-secondary))]`}>
                      Marketplace médico-social — France
                    </span>
                  </motion.div>

                  <motion.h1 initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, delay: 0.1 }}
                    className={`${DISPLAY} text-[clamp(2.4rem,5vw,4.2rem)] font-bold tracking-tight leading-[1.08]`}>
                    <span className="text-[hsl(var(--foreground))]">Le bon profil.</span>
                    <br />
                    <span className="text-[hsl(var(--text-secondary))] italic font-medium mt-1 block">
                      Au bon endroit.
                    </span>
                    <span className="relative inline-block mt-1">
                      <span className="text-gradient-dark">Toujours.</span>
                    </span>
                  </motion.h1>

                  <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                    transition={{ delay: 0.9, duration: 0.6, ease: "easeOut" }}
                    className="h-[3px] w-24 rounded-full origin-left bg-gradient-to-r from-[hsl(var(--teal))] via-[hsl(var(--coral))] to-[hsl(var(--violet))] mt-5 mb-6" />

                  <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="text-lg text-[hsl(var(--text-secondary))] max-w-[480px] leading-relaxed">
                    Publiez un besoin de renfort en{" "}
                    <strong className="text-[hsl(var(--foreground))] font-semibold">30 secondes</strong>.
                    Des soignants vérifiés postulent{" "}
                    <strong className="text-[hsl(var(--foreground))] font-semibold">en un clic</strong>.
                    Contrats &amp; paiements{" "}
                    <strong className="text-[hsl(var(--foreground))] font-semibold">100% auto</strong>.
                  </motion.p>

                  <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.30 }}
                    className={`${MONO} text-[11px] font-semibold text-[hsl(var(--teal))] uppercase tracking-widest mt-4`}>
                    Renfort · Ateliers · Formations — en un seul endroit
                  </motion.p>

                  <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.38 }}
                    className="mt-9 flex flex-col sm:flex-row gap-3">
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button asChild size="lg" variant="coral"
                        className={`${DISPLAY} h-12 px-7 text-base font-semibold rounded-xl w-full sm:w-auto shadow-lg shadow-[hsl(var(--coral)/0.30)]`}>
                        <Link href="/register?role=ESTABLISHMENT">
                          Trouver un renfort <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.97 }}>
                      <Button asChild size="lg" variant="teal-soft"
                        className={`${DISPLAY} h-12 px-7 text-base font-semibold rounded-xl w-full sm:w-auto`}>
                        <Link href="/register?role=FREELANCE">Proposer mes services</Link>
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Proof row */}
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                    className="mt-8 flex items-center gap-6 flex-wrap">
                    {[
                      { icon: Building2, label: "500+ établissements", c: "text-[hsl(var(--teal))]" },
                      { icon: UserCheck, label: "2 400 freelances", c: "text-[hsl(var(--emerald))]" },
                      { icon: Star, label: "4.9/5 satisfaction", c: "text-[hsl(var(--amber))]" },
                    ].map((t, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.72 + i * 0.09 }}
                        className="flex items-center gap-1.5 text-xs text-[hsl(var(--text-tertiary))]">
                        <t.icon className={`h-3.5 w-3.5 ${t.c}`} />
                        <span>{t.label}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>

                {/* Right: Dashboard Panel */}
                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, duration: 0.85, type: "spring", stiffness: 65 }}
                  className="flex-1 mt-16 lg:mt-0 flex justify-center">
                  <DashboardPanel />
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* ══════════ STATS BAND ══════════ */}
          <section id="etablissements" className="relative border-y border-[hsl(var(--border))]">
            <div className="absolute inset-0 bg-[hsl(var(--surface-2)/0.5)]" />
            <div className="relative z-10 mx-auto max-w-6xl px-6">
              <motion.div variants={stagger} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[hsl(var(--border))]">
                <StatBand value={500} label="Établissements" suffix="+" />
                <StatBand value={2400} label="Freelances vérifiés" />
                <StatBand value={2} label="Délai moyen" prefix="<" suffix="h" />
                <StatBand value={49} label="Satisfaction" suffix="/5" />
              </motion.div>
            </div>
          </section>

          {/* ══════════ PROCESS (4 Steps) ══════════ */}
          <section className="py-28 px-6">
            <div className="mx-auto max-w-5xl">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} className="text-center mb-16">
                <div className={`${MONO} inline-flex items-center gap-2 text-[11px] font-medium text-[hsl(var(--teal))] px-3 py-1.5 rounded-full border border-[hsl(var(--teal)/0.25)] bg-[hsl(var(--teal-light))] mb-5`}>
                  <Zap className="h-3 w-3" /> Comment ça marche
                </div>
                <h2 className={`${DISPLAY} text-3xl sm:text-5xl font-bold tracking-tight text-[hsl(var(--foreground))] leading-[1.10]`}>
                  4 étapes, <span className="text-gradient-dark">zéro friction.</span>
                </h2>
              </motion.div>

              {/* Connecting line */}
              <div className="relative">
                <div className="absolute top-7 left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-[hsl(var(--teal)/0.3)] via-[hsl(var(--teal)/0.15)] to-[hsl(var(--teal)/0.3)] hidden md:block" />
                <motion.div variants={stagger} initial="hidden" whileInView="show"
                  viewport={{ once: true, margin: "-40px" }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
                  <ProcessStep n="01" icon={FileText} title="Créez le besoin"
                    desc="Poste, date, horaires. Formulaire guidé en 30 secondes." />
                  <ProcessStep n="02" icon={Zap} title="Publiez"
                    desc="Alerte automatique aux profils qualifiés dans un rayon de 30 km." />
                  <ProcessStep n="03" icon={Users} title="Recevez"
                    desc="Les freelances vérifiés postulent. Consultez profils et avis." />
                  <ProcessStep n="04" icon={CheckCircle} title="Validez"
                    desc="Cliquez Confirmer. Contrat et accès générés automatiquement." />
                </motion.div>
              </div>
            </div>
          </section>

          {/* ══════════ PILLARS: SOS Renfort + Ateliers ══════════ */}
          <section id="renfort" className="py-24 px-6">
            <div className="mx-auto max-w-7xl">
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5 }} className="text-center mb-16">
                <div className={`${MONO} inline-flex items-center gap-2 text-[11px] font-medium text-[hsl(var(--coral))] px-3 py-1.5 rounded-full border border-[hsl(var(--coral)/0.25)] bg-[hsl(var(--coral-light))] mb-5`}>
                  <Sparkles className="h-3 w-3" /> Nos solutions
                </div>
                <h2 className={`${DISPLAY} text-3xl sm:text-5xl font-bold tracking-tight text-[hsl(var(--foreground))] mb-5 leading-[1.10]`}>
                  Deux piliers.{" "}
                  <span className="text-gradient-dark">Une plateforme.</span>
                </h2>
                <p className="text-lg text-[hsl(var(--text-secondary))] max-w-lg mx-auto">
                  Remplacement d&apos;urgence ou ateliers thérapeutiques — tout est centralisé.
                </p>
              </motion.div>

              <motion.div variants={stagger} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Pillar 1: SOS Renfort */}
                <PillarCard
                  tag="SOS Renfort"
                  title="Remplacez en un clic"
                  desc="Un soignant absent ? Publiez et recevez des candidatures qualifiées en moins de 2 heures."
                  accent="coral"
                  features={[
                    "Publication en 30 secondes",
                    "Matching intelligent par diplôme & distance",
                    "Confirmations instantanées",
                    "Contrats auto-générés, conformes",
                  ]}
                >
                  {/* Demo card: Urgent Mission */}
                  <div className="rounded-xl bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-[hsl(var(--coral))] text-white flex items-center justify-center shadow-md">
                        <Briefcase className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[hsl(var(--foreground))]">IDE Nuit</span>
                          <span className={`${MONO} text-[8px] font-bold bg-[hsl(var(--coral))] text-white px-1.5 py-0.5 rounded-full`}>
                            URGENT
                          </span>
                        </div>
                        <p className="text-[10px] text-[hsl(var(--text-tertiary))]">EHPAD Les Oliviers · Ce soir 20h–6h</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        <span className={`${MONO} text-[9px] px-2 py-0.5 rounded-full bg-[hsl(var(--teal-light))] text-[hsl(var(--teal))] border border-[hsl(var(--teal)/0.20)]`}>
                          IDE
                        </span>
                        <span className={`${MONO} text-[9px] px-2 py-0.5 rounded-full bg-[hsl(var(--surface-2))] text-[hsl(var(--text-secondary))] border border-[hsl(var(--border))]`}>
                          Nuit
                        </span>
                      </div>
                      <span className={`${MONO} text-sm font-bold text-[hsl(var(--emerald))]`}>320€</span>
                    </div>
                    <Button size="sm" variant="coral" className="w-full mt-3 text-xs font-semibold">
                      Postuler <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </PillarCard>

                {/* Pillar 2: Ateliers */}
                <PillarCard
                  tag="Ateliers & Formations"
                  title="Proposez vos services"
                  desc="Art-thérapie, musicothérapie, sophrologie, formations certifiantes — publiez vos services et remplissez votre agenda."
                  accent="teal"
                  features={[
                    "Catalogue visible par tous les établissements",
                    "Réservation en 1 clic par les directeurs",
                    "Demandes centralisées sur la plateforme",
                    "Gestion planning intégrée",
                  ]}
                >
                  {/* Demo card: Atelier */}
                  <div id="ateliers" className="rounded-xl bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-8 w-8 rounded-lg bg-[hsl(var(--teal))] text-white flex items-center justify-center shadow-md">
                        <Palette className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[hsl(var(--foreground))]">Art-thérapie</span>
                          <span className={`${MONO} text-[8px] font-bold bg-[hsl(var(--teal))] text-white px-1.5 py-0.5 rounded-full`}>
                            THÉRAPEUTIQUE
                          </span>
                        </div>
                        <p className="text-[10px] text-[hsl(var(--text-tertiary))]">2h · Groupe 8 pers. · Matériel inclus</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1.5">
                        <span className={`${MONO} text-[9px] px-2 py-0.5 rounded-full bg-[hsl(var(--violet-light))] text-[hsl(var(--violet))] border border-[hsl(var(--violet)/0.20)]`}>
                          Art
                        </span>
                        <span className={`${MONO} text-[9px] px-2 py-0.5 rounded-full bg-[hsl(var(--surface-2))] text-[hsl(var(--text-secondary))] border border-[hsl(var(--border))]`}>
                          Groupe
                        </span>
                      </div>
                      <span className={`${MONO} text-sm font-bold text-[hsl(var(--emerald))]`}>180€</span>
                    </div>
                    <Button size="sm" variant="teal" className="w-full mt-3 text-xs font-semibold">
                      Réserver <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </PillarCard>
              </motion.div>
            </div>
          </section>

          {/* ══════════ FREELANCE / INDEPENDANTS ══════════ */}
          <section id="freelances" className="py-28 px-6">
            <div className="mx-auto max-w-7xl">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.65 }}
                className="relative glass-panel dark-card-shadow highlight-top rounded-2xl overflow-hidden">
                {/* Top gradient line */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[hsl(var(--teal))] via-[hsl(var(--violet))] to-[hsl(var(--coral))]" />
                {/* Background glows */}
                <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-gradient-to-bl from-[hsl(var(--teal)/0.08)] to-transparent rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-gradient-to-tr from-[hsl(var(--coral)/0.06)] to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 p-8 sm:p-14">
                  <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-20">
                    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                      className="flex-1 space-y-6 max-w-xl">
                      <div className={`${MONO} inline-flex items-center gap-2 text-[11px] font-medium text-[hsl(var(--violet))] px-3 py-1.5 rounded-full border border-[hsl(var(--violet)/0.25)] bg-[hsl(var(--violet-light))]`}>
                        <Sparkles className="h-3 w-3" /> Espace Freelances
                      </div>
                      <h2 className={`${DISPLAY} text-3xl sm:text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] leading-tight`}>
                        Votre talent mérite{" "}
                        <span className="text-[hsl(var(--violet))]">mieux qu&apos;un planning vide.</span>
                      </h2>
                      <p className="text-lg text-[hsl(var(--text-secondary))] leading-relaxed">
                        Positionnez-vous comme <strong className="text-[hsl(var(--foreground))] font-semibold">consultant éducatif</strong>. Proposez vos services, choisissez vos missions et maximisez vos revenus.
                      </p>
                      <div className="space-y-3 pt-1">
                        {[
                          { icon: Zap, text: "Fast-Apply : postulez en 1 seconde", c: "bg-[hsl(var(--coral))] text-white" },
                          { icon: FileText, text: "Factures et contrats auto-générés", c: "bg-[hsl(var(--teal))] text-white" },
                          { icon: TrendingUp, text: "Vos services sur la marketplace", c: "bg-[hsl(var(--violet))] text-white" },
                          { icon: DollarSign, text: "Paiement garanti sous 72h", c: "bg-[hsl(var(--emerald))] text-white" },
                        ].map((item, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.08 }}
                            className="flex items-start gap-3">
                            <div className={`h-7 w-7 rounded-lg ${item.c} flex items-center justify-center shrink-0 mt-0.5 shadow-md`}>
                              <item.icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-sm font-medium text-[hsl(var(--foreground)/0.85)]">{item.text}</span>
                          </motion.div>
                        ))}
                      </div>
                      <div className="pt-2 flex items-center gap-4">
                        <motion.div whileTap={{ scale: 0.97 }}>
                          <Button asChild size="lg" variant="coral"
                            className={`${DISPLAY} h-12 px-7 text-sm font-semibold rounded-xl shadow-lg shadow-[hsl(var(--coral)/0.20)]`}>
                            <Link href="/register?role=FREELANCE">
                              Créer mon profil gratuit <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </Button>
                        </motion.div>
                      </div>
                      <p className={`${MONO} text-[10px] font-semibold text-[hsl(var(--text-tertiary))] uppercase tracking-widest`}>
                        Commission 0% · 100 premières inscriptions
                      </p>
                    </motion.div>

                    <motion.div initial={{ opacity: 0, y: 35, rotate: 2 }} whileInView={{ opacity: 1, y: 0, rotate: 0.8 }}
                      viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2, type: "spring", stiffness: 75 }}
                      className="flex-1 w-full hidden lg:block" aria-hidden="true">
                      <Tilt className="glass-panel dark-card-shadow rounded-2xl p-6 cursor-default">
                        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[hsl(var(--border))]">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-[hsl(var(--violet))] text-white flex items-center justify-center shadow-md">
                              <TrendingUp className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="h-2.5 w-20 rounded-full bg-[hsl(var(--foreground)/0.10)]" />
                              <div className="h-2 w-14 rounded-full bg-[hsl(var(--foreground)/0.06)] mt-1.5" />
                            </div>
                          </div>
                          <span className={`${MONO} text-[9px] font-semibold text-[hsl(var(--emerald))] px-2 py-0.5 rounded-full border border-[hsl(var(--emerald)/0.25)] bg-[hsl(var(--emerald-light))]`}>
                            En ligne
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2.5 mb-5">
                          {[
                            { l: "CA mois", v: "2 840€", c: "text-[hsl(var(--emerald))]", bg: "bg-[hsl(var(--emerald-light))]" },
                            { l: "Missions", v: "12", c: "text-[hsl(var(--foreground))]", bg: "bg-[hsl(var(--surface-2))]" },
                            { l: "Note", v: "4.9★", c: "text-[hsl(var(--amber))]", bg: "bg-[hsl(var(--amber-light))]" },
                          ].map((k, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }} transition={{ delay: 0.4 + i * 0.08 }}
                              className={`rounded-xl ${k.bg} border border-[hsl(var(--border))] p-3`}>
                              <p className="text-[9px] text-[hsl(var(--text-tertiary))] mb-0.5">{k.l}</p>
                              <p className={`${MONO} text-sm font-semibold ${k.c}`}>{k.v}</p>
                            </motion.div>
                          ))}
                        </div>
                        {[
                          { t: "IDE", p: "EHPAD Les Oliviers", pay: "320€", u: true },
                          { t: "AS", p: "Clinique Saint-Joseph", pay: "245€", u: false },
                        ].map((m, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }} transition={{ delay: 0.55 + i * 0.12 }}
                            className="rounded-xl bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] p-3.5 mb-2.5 flex items-center gap-3">
                            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0
                              ${m.u ? "bg-[hsl(var(--coral))] text-white shadow-md" : "bg-[hsl(var(--surface-2))] text-[hsl(var(--text-secondary))] border border-[hsl(var(--border))]"}`}>
                              <CalendarDays className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-[hsl(var(--foreground))]">{m.t}</p>
                                {m.u && <span className={`${MONO} text-[8px] font-bold bg-[hsl(var(--coral))] text-white px-1.5 py-0.5 rounded-full`}>URGENT</span>}
                              </div>
                              <p className="text-[10px] text-[hsl(var(--text-secondary))] truncate">{m.p}</p>
                            </div>
                            <span className={`${MONO} text-xs font-semibold text-[hsl(var(--emerald))] shrink-0`}>{m.pay}</span>
                          </motion.div>
                        ))}
                      </Tilt>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>

          {/* ══════════ TESTIMONIALS (3-card grid) ══════════ */}
          <section id="temoignages" className="py-24 px-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--surface-2)/0.3)] to-transparent" />
            <div className="relative z-10 mx-auto max-w-7xl">
              <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} className="text-center mb-14">
                <div className={`${MONO} inline-flex items-center gap-2 text-[11px] font-medium text-[hsl(var(--amber))] px-3 py-1.5 rounded-full border border-[hsl(var(--amber)/0.25)] bg-[hsl(var(--amber-light))] mb-5`}>
                  <Star className="h-3 w-3 fill-current" /> Témoignages
                </div>
                <h2 className={`${DISPLAY} text-3xl sm:text-5xl font-bold tracking-tight text-[hsl(var(--foreground))] leading-tight`}>
                  Adopté par des centaines{" "}
                  <span className="text-gradient-dark">d&apos;établissements.</span>
                </h2>
              </motion.div>

              <motion.div variants={stagger} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-50px" }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {testimonials.map((t, i) => (
                  <TestimonialCardGrid key={i} {...t} />
                ))}
              </motion.div>
            </div>
          </section>

          {/* ══════════ TARIFS ══════════ */}
          <section id="tarifs" className="py-24 px-6">
            <div className="mx-auto max-w-5xl">
              <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.55 }}
                className="text-center mb-12">
                <div className={`${MONO} inline-flex items-center gap-2 text-[11px] font-medium text-[hsl(var(--teal))] px-3 py-1.5 rounded-full border border-[hsl(var(--teal)/0.25)] bg-[hsl(var(--teal-light))] mb-5`}>
                  <Check className="h-3 w-3" /> Tarification
                </div>
                <h2 className={`${DISPLAY} text-3xl sm:text-4xl font-bold tracking-tight text-[hsl(var(--foreground))]`}>
                  Tarifs simples et transparents
                </h2>
              </motion.div>
              <motion.div variants={stagger} initial="hidden" whileInView="show"
                viewport={{ once: true, margin: "-40px" }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div variants={rise}
                  className="glass-panel dark-card-shadow rounded-2xl p-8 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[hsl(var(--coral))] text-white flex items-center justify-center shadow-md">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`${DISPLAY} text-lg font-bold text-[hsl(var(--foreground))]`}>Établissements</p>
                      <p className={`${MONO} text-[11px] text-[hsl(var(--text-tertiary))] uppercase tracking-wide`}>Renfort &amp; Ateliers</p>
                    </div>
                  </div>
                  <ul className="space-y-3 pt-2 flex-1">
                    {[
                      "Publication de renforts gratuite",
                      "Commission uniquement sur réservation confirmée",
                      "Accès au catalogue ateliers & formations",
                      "Support prioritaire inclus",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-[hsl(var(--teal))] shrink-0 mt-0.5" />
                        <span className="text-sm text-[hsl(var(--foreground)/0.85)]">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="coral" className={`${DISPLAY} w-full h-11 font-semibold rounded-xl mt-4`}>
                    <Link href="/register?role=ESTABLISHMENT">Commencer gratuitement</Link>
                  </Button>
                </motion.div>
                <motion.div variants={rise}
                  className="glass-panel dark-card-shadow rounded-2xl p-8 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-[hsl(var(--violet))] text-white flex items-center justify-center shadow-md">
                      <UserCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className={`${DISPLAY} text-lg font-bold text-[hsl(var(--foreground))]`}>Consultants éducatifs</p>
                      <p className={`${MONO} text-[11px] text-[hsl(var(--text-tertiary))] uppercase tracking-wide`}>Freelances &amp; Intervenants</p>
                    </div>
                  </div>
                  <ul className="space-y-3 pt-2 flex-1">
                    {[
                      "Commission 0% — 100 premières inscriptions",
                      "Paiement garanti sous 72h",
                      "Factures & contrats auto-générés",
                      "Visibilité marketplace incluse",
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-[hsl(var(--teal))] shrink-0 mt-0.5" />
                        <span className="text-sm text-[hsl(var(--foreground)/0.85)]">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild variant="teal-soft" className={`${DISPLAY} w-full h-11 font-semibold rounded-xl mt-4`}>
                    <Link href="/register?role=FREELANCE">Créer mon profil</Link>
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* ══════════ FAQ ══════════ */}
          <section id="faq" className="py-20 px-6">
            <div className="mx-auto max-w-3xl">
              <motion.div initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.55 }}
                className="text-center mb-10">
                <div className={`${MONO} inline-flex items-center gap-2 text-[11px] font-medium text-[hsl(var(--amber))] px-3 py-1.5 rounded-full border border-[hsl(var(--amber)/0.25)] bg-[hsl(var(--amber-light))] mb-5`}>
                  <Quote className="h-3 w-3" /> FAQ
                </div>
                <h2 className={`${DISPLAY} text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]`}>
                  Questions fréquentes
                </h2>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
                className="glass-panel dark-card-shadow rounded-2xl px-6 sm:px-8">
                {[
                  { q: "Qu'est-ce qu'une mission de renfort ?", a: "Une mission de renfort est une intervention temporaire où un établissement recrute un soignant ou éducateur freelance pour couvrir un besoin urgent d'équipe." },
                  { q: "Quelle différence entre un atelier et une formation ?", a: "Un atelier est une session d'animation collective (art-thérapie, Snoezelen…), tandis qu'une formation transmet des compétences professionnelles certifiables." },
                  { q: "Comment fonctionne le paiement ?", a: "Les paiements sont sécurisés et garantis sous 72h. Factures et contrats sont générés automatiquement après confirmation de la mission." },
                ].map((item, i) => (
                  <FaqItem key={i} q={item.q} a={item.a} />
                ))}
              </motion.div>
            </div>
          </section>

          {/* ══════════ CTA FINAL ══════════ */}
          <section className="py-20 px-6">
            <div className="mx-auto max-w-5xl">
              <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }} transition={{ duration: 0.6, type: "spring" }}
                className="relative glass-panel-dense dark-card-shadow highlight-top rounded-2xl overflow-hidden">
                {/* Radial glow accents */}
                <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-[hsl(var(--teal)/0.15)] blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 -left-16 w-60 h-60 rounded-full bg-[hsl(var(--coral)/0.12)] blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[hsl(var(--violet)/0.06)] blur-3xl pointer-events-none" />
                {/* Shimmer sweep */}
                <motion.div animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent skew-x-12 pointer-events-none" />

                <div className="relative z-10 p-10 sm:p-16">
                  <div className="flex flex-col lg:flex-row items-center gap-10">
                    <div className="flex-1 text-center lg:text-left">
                      <h2 className={`${DISPLAY} text-3xl sm:text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] mb-4`}>
                        Prêt à ne plus jamais{" "}
                        <em className="not-italic text-gradient-dark">manquer de personnel ?</em>
                      </h2>
                      <p className="text-lg text-[hsl(var(--text-secondary))] max-w-lg">
                        Rejoignez les établissements qui ont automatisé leur recrutement temporaire.
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                      <motion.div whileTap={{ scale: 0.97 }}>
                        <Button asChild size="lg" variant="coral"
                          className={`${DISPLAY} h-12 px-8 text-base font-semibold rounded-xl shadow-xl shadow-[hsl(var(--coral)/0.30)]`}>
                          <Link href="/register?role=ESTABLISHMENT">
                            Commencer gratuitement <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </motion.div>
                      <motion.div whileTap={{ scale: 0.97 }}>
                        <Button asChild size="lg" variant="ghost"
                          className={`${DISPLAY} h-12 px-8 text-base font-semibold rounded-xl border border-[hsl(var(--border))] text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--foreground))]`}>
                          <Link href="/register?role=FREELANCE">
                            Espace Freelance <ArrowUpRight className="ml-1.5 h-4 w-4" />
                          </Link>
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                  <p className={`${MONO} mt-8 text-[11px] text-[hsl(var(--text-tertiary))] font-medium text-center lg:text-left`}>
                    Aucune carte bancaire · Annulation libre · Support prioritaire
                  </p>
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        {/* ══════════ FOOTER ══════════ */}
        <PublicFooter />
      </div>
    </div>
  );
}
