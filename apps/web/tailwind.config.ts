import type { Config } from "tailwindcss";

const config: Config = {
  // Dark mode via data-theme attribute
  darkMode: ["selector", '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans:    ["var(--font-body)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      fontSize: {
        /* B.2 — Full Typography Scale */
        "display-2xl": ["3rem",      { lineHeight: "1.08", letterSpacing: "-0.03em",  fontWeight: "800" }],
        "display-xl":  ["2.5rem",    { lineHeight: "1.1",  letterSpacing: "-0.03em",  fontWeight: "800" }],
        "display-lg":  ["2rem",      { lineHeight: "1.15", letterSpacing: "-0.025em", fontWeight: "700" }],
        "heading-xl":  ["1.5rem",    { lineHeight: "1.25", letterSpacing: "-0.02em",  fontWeight: "700" }],
        "heading-lg":  ["1.25rem",   { lineHeight: "1.3",  letterSpacing: "-0.015em", fontWeight: "600" }],
        "heading-md":  ["1.125rem",  { lineHeight: "1.35", letterSpacing: "-0.01em",  fontWeight: "600" }],
        "heading-sm":  ["1rem",      { lineHeight: "1.4",  letterSpacing: "-0.01em",  fontWeight: "600" }],
        "body-lg":     ["1rem",      { lineHeight: "1.6",  fontWeight: "400" }],
        "body-md":     ["0.875rem",  { lineHeight: "1.55", fontWeight: "400" }],
        "body-sm":     ["0.8125rem", { lineHeight: "1.5",  fontWeight: "400" }],
        "caption":     ["0.75rem",   { lineHeight: "1.4",  letterSpacing: "0.02em",   fontWeight: "500" }],
        "overline":    ["0.6875rem", { lineHeight: "1.3",  letterSpacing: "0.08em",   fontWeight: "600" }],
        /* Legacy aliases */
        "heading":     ["1.25rem",   { lineHeight: "1.3",  letterSpacing: "-0.015em", fontWeight: "600" }],
      },
      colors: {
        /* ── Shadcn tokens ── */
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },

        /* ── Brand tokens LES EXTRAS — Quietly Bold (B.1 full scale) ── */

        /* Teal — Primary (confiance, navigation) */
        teal: {
          DEFAULT: "hsl(var(--teal))",
          dim:     "hsl(var(--teal-dim))",
          50:      "hsl(var(--color-teal-50))",
          100:     "hsl(var(--color-teal-100))",
          200:     "hsl(var(--color-teal-200))",
          300:     "hsl(var(--color-teal-300))",
          400:     "hsl(var(--color-teal-400))",
          500:     "hsl(var(--color-teal-500))",
          600:     "hsl(var(--color-teal-600))",
          700:     "hsl(var(--color-teal-700))",
          800:     "hsl(var(--color-teal-800))",
          900:     "hsl(var(--color-teal-900))",
        },

        /* Coral → Terracotta — Action (CTA, urgence) */
        coral: {
          DEFAULT: "hsl(var(--coral))",
          dim:     "hsl(var(--coral-dim))",
          50:      "hsl(var(--color-coral-50))",
          100:     "hsl(var(--color-coral-100))",
          200:     "hsl(var(--color-coral-200))",
          300:     "hsl(var(--color-coral-300))",
          400:     "hsl(var(--color-coral-400))",
          500:     "hsl(var(--color-coral-500))",
          600:     "hsl(var(--color-coral-600))",
          700:     "hsl(var(--color-coral-700))",
          800:     "hsl(var(--color-coral-800))",
          900:     "hsl(var(--color-coral-900))",
        },

        /* Sand — Chaleur, accueil, onboarding */
        sand: {
          DEFAULT: "hsl(var(--sand))",
          dim:     "hsl(var(--sand-dim))",
          50:      "hsl(var(--color-sand-50))",
          100:     "hsl(var(--color-sand-100))",
          200:     "hsl(var(--color-sand-200))",
          300:     "hsl(var(--color-sand-300))",
          400:     "hsl(var(--color-sand-400))",
          500:     "hsl(var(--color-sand-500))",
          600:     "hsl(var(--color-sand-600))",
          700:     "hsl(var(--color-sand-700))",
        },

        /* Navy — Text scale */
        navy: {
          50:      "hsl(var(--color-navy-50))",
          100:     "hsl(var(--color-navy-100))",
          200:     "hsl(var(--color-navy-200))",
          300:     "hsl(var(--color-navy-300))",
          400:     "hsl(var(--color-navy-400))",
          500:     "hsl(var(--color-navy-500))",
          600:     "hsl(var(--color-navy-600))",
          700:     "hsl(var(--color-navy-700))",
          800:     "hsl(var(--color-navy-800))",
          900:     "hsl(var(--color-navy-900))",
        },

        /* Violet — Ateliers, compétences */
        violet: {
          DEFAULT: "hsl(var(--violet))",
          50:      "hsl(var(--color-violet-50))",
          100:     "hsl(var(--color-violet-100))",
          500:     "hsl(var(--color-violet-500))",
          700:     "hsl(var(--color-violet-700))",
        },

        /* Logo Gray — Neutre structural */
        "logo-gray": {
          DEFAULT: "hsl(var(--logo-gray))",
          50:      "hsl(var(--color-gray-100))",
          100:     "hsl(var(--color-gray-100))",
          400:     "hsl(var(--color-gray-400))",
          500:     "hsl(var(--color-gray-400))",
        },

        /* Emerald — Succès, validé */
        emerald: {
          DEFAULT: "hsl(var(--emerald))",
          50:      "hsl(var(--color-emerald-50))",
          100:     "hsl(var(--color-emerald-100))",
          500:     "hsl(var(--color-emerald-500))",
          700:     "hsl(var(--color-emerald-700))",
        },

        /* Amber — Avertissement */
        amber: {
          DEFAULT: "hsl(var(--amber))",
          50:      "hsl(var(--color-amber-50))",
          100:     "hsl(var(--color-amber-100))",
          500:     "hsl(var(--color-amber-500))",
          700:     "hsl(var(--color-amber-700))",
        },

        /* Red — Erreur, destructif */
        red: {
          50:      "hsl(var(--color-red-50))",
          100:     "hsl(var(--color-red-100))",
          500:     "hsl(var(--color-red-500))",
          700:     "hsl(var(--color-red-700))",
        },

        /* Surface secondaire */
        surface: {
          2: "hsl(var(--surface-2))",
        },
      },
      borderRadius: {
        none:  "var(--radius-none)",
        sm:    "var(--radius-sm)",
        md:    "var(--radius-md)",
        lg:    "var(--radius-lg)",
        xl:    "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
        full:  "var(--radius-full)",
      },
      spacing: {
        "space-0":   "var(--space-0)",
        "space-0.5": "var(--space-0-5)",
        "space-1":   "var(--space-1)",
        "space-1.5": "var(--space-1-5)",
        "space-2":   "var(--space-2)",
        "space-3":   "var(--space-3)",
        "space-4":   "var(--space-4)",
        "space-5":   "var(--space-5)",
        "space-6":   "var(--space-6)",
        "space-8":   "var(--space-8)",
        "space-10":  "var(--space-10)",
        "space-12":  "var(--space-12)",
        "space-16":  "var(--space-16)",
        "space-20":  "var(--space-20)",
        "space-24":  "var(--space-24)",
      },
      zIndex: {
        "base":     "var(--z-base)",
        "raised":   "var(--z-raised)",
        "dropdown": "var(--z-dropdown)",
        "sticky":   "var(--z-sticky)",
        "overlay":  "var(--z-overlay)",
        "modal":    "var(--z-modal)",
        "drawer":   "var(--z-drawer)",
        "toast":    "var(--z-toast)",
        "tooltip":  "var(--z-tooltip)",
        "max":      "var(--z-max)",
      },
      boxShadow: {
        /* B.5 — Shadow Scale (navy-tinted, not pure black) */
        "xs":         "0 1px 2px hsla(220,25%,15%,0.04)",
        "card":       "0 1px 3px hsla(220,25%,15%,0.05), 0 4px 12px hsla(220,25%,15%,0.05)",
        "card-md":    "0 2px 8px hsla(220,25%,15%,0.06), 0 8px 24px hsla(220,25%,15%,0.07)",
        "card-lg":    "0 4px 16px hsla(220,25%,15%,0.08), 0 16px 48px hsla(220,25%,15%,0.09)",
        "card-hover": "0 8px 32px hsla(220,25%,15%,0.10), 0 2px 8px hsla(220,25%,15%,0.07)",
        "xl":         "0 8px 32px hsla(220,25%,15%,0.10), 0 2px 8px hsla(220,25%,15%,0.07)",
        /* Glow accents — updated for deeper palette */
        "glow-teal":  "0 0 0 3px hsl(170,45%,92%), 0 4px 20px hsla(170,55%,30%,0.22)",
        "glow-coral": "0 0 0 3px hsl(14,80%,94%), 0 4px 20px hsla(14,65%,48%,0.22)",
        "glow-sand":  "0 0 0 3px hsl(32,80%,93%), 0 4px 16px hsla(32,75%,50%,0.18)",
        /* Focus ring shadows (B.5) */
        "focus-teal": "0 0 0 3px hsl(170,45%,92%), 0 4px 20px hsla(170,55%,30%,0.22)",
        "focus-coral": "0 0 0 3px hsl(14,80%,94%), 0 4px 20px hsla(14,65%,48%,0.22)",
        /* Aliases */
        "warm-card":    "0 2px 12px hsla(220,25%,15%,0.07), 0 1px 3px hsla(220,25%,15%,0.04)",
        "warm-card-lg": "0 8px 32px hsla(220,25%,15%,0.10), 0 2px 8px hsla(220,25%,15%,0.06)",
        /* Glass shadows (kept for compat, reduced intensity) */
        "glass":    "0 8px 32px hsla(0,0%,0%,0.05), inset 0 1px 0 0 hsla(0,0%,100%,0.4)",
        "glass-lg": "0 12px 48px hsla(0,0%,0%,0.07), inset 0 1px 0 0 hsla(0,0%,100%,0.5)",
        "glass-sm": "0 4px 16px hsla(0,0%,0%,0.03), inset 0 1px 0 0 hsla(0,0%,100%,0.3)",
        /* Dark mode glass shadows */
        "dark-glass":    "0 4px 24px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 0 rgba(255,255,255,0.05)",
        "dark-glass-lg": "0 8px 40px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 0 rgba(255,255,255,0.08)",
        "dark-glow-teal":  "0 0 0 1px hsla(185,84%,24%,0.3), 0 4px 24px hsla(185,84%,24%,0.2), 0 12px 48px hsla(185,84%,24%,0.1)",
        "dark-glow-coral": "0 0 0 1px hsla(14,65%,52%,0.3), 0 4px 24px hsla(14,65%,52%,0.2)",
      },
      animation: {
        "fade-up":        "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in":        "fade-in 0.3s ease both",
        "scale-in":       "scale-in 0.3s cubic-bezier(0.16,1,0.3,1) both",
        "slide-in-left":  "slide-in-left 0.35s cubic-bezier(0.16,1,0.3,1) both",
        "float":          "float 4s ease-in-out infinite",
        "bounce-gentle":  "bounce-gentle 2s ease-in-out infinite",
        "pulse-ring-teal":  "pulse-ring-teal 2.2s ease infinite",
        "pulse-ring-coral": "pulse-ring-coral 2.2s ease infinite",
        "shimmer":        "shimmer 1.8s infinite",
        "glass-shimmer":  "glass-shimmer 2.5s ease-in-out infinite",
        "spotlight-pulse": "spotlight-pulse 3s ease-in-out infinite",
        "border-flow":    "border-flow 4s ease infinite",
        "count-up":       "count-up 0.4s cubic-bezier(0.22,1,0.36,1) both",
        "ripple":         "ripple-expand 0.6s ease forwards",
        "oscillate":     "oscillate 5s ease-in-out infinite",
        "shimmer-sweep": "shimmer-sweep 4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
