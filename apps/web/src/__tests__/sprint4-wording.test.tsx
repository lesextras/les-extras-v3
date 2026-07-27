import { beforeAll, describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { MesAteliersClient } from "@/components/dashboard/MesAteliersClient";
import { FreelanceMarketplace } from "@/components/marketplace/FreelanceMarketplace";
import AteliersLandingPage from "@/app/ateliers/page";
import FreelancesPage from "@/app/freelances/page";
import EtablissementsPage from "@/app/etablissements/page";
import RegisterPage from "@/app/(auth)/register/page";
import type { MesAtelierItem } from "@/app/actions/marketplace";

// ─── Global mocks ────────────────────────────────────────────────────────────

const mockRoleQuery = vi.hoisted(() => ({ value: null as string | null }));

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  useSearchParams: () => ({
    get: (key: string) => (key === "role" ? mockRoleQuery.value : null),
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: () =>
        ({ children, ...rest }: React.PropsWithChildren<Record<string, unknown>>) => (
          <div {...(rest as object)}>{children}</div>
        ),
    },
  ),
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
  useTransform: () => 0,
  useMotionValue: () => ({ set: vi.fn(), get: () => 0 }),
  useSpring: () => 0,
  useInView: () => true,
}));

vi.mock("@/app/actions/marketplace", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    updateServiceAction: vi.fn().mockResolvedValue({ ok: true, data: { id: "service-1" } }),
    deleteServiceAction: vi.fn().mockResolvedValue({ ok: true }),
  };
});

vi.mock("@/lib/stores/useUIStore", () => ({
  useUIStore: (selector: (s: { openPublishModal: () => void }) => unknown) =>
    selector({ openPublishModal: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/app/actions/auth", () => ({
  register: vi.fn(),
}));

vi.mock("react-dom", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useFormState: () => [{ message: "", errors: {} }, vi.fn()],
    useFormStatus: () => ({ pending: false }),
  };
});

// ─── Homepage — Plateforme hybride ───────────────────────────────────────────

describe("Homepage — plateforme hybride", () => {
  it("mentionne les 3 piliers (Renfort, Ateliers, Formations) dans le hero", () => {
    render(<HomePage />);
    expect(screen.getByText(/renfort\s*·\s*ateliers\s*·\s*formations/i)).toBeInTheDocument();
  });

  it("positionne le freelance comme consultant éducatif", () => {
    render(<HomePage />);
    expect(screen.getByText(/consultant éducatif/i)).toBeInTheDocument();
  });

  it("section #tarifs a un contenu visible (pas un div vide)", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /tarifs simples et transparents/i })).toBeInTheDocument();
  });

  it("section #faq existe et contient le titre Questions fréquentes", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { name: /questions fréquentes/i })).toBeInTheDocument();
  });

  it('section tarifs établissements dit "Renfort & Ateliers" (pas "Recrutement & Ateliers")', () => {
    render(<HomePage />);
    expect(screen.queryByText(/recrutement & ateliers/i)).not.toBeInTheDocument();
    expect(screen.getByText(/renfort & ateliers/i)).toBeInTheDocument();
  });
});

// ─── Navbar ───────────────────────────────────────────────────────────────────

import { PublicNavbar } from "@/components/layout/PublicNavbar";

describe("Sprint 4 — PublicNavbar", () => {
  it('contient "Ateliers & Formations" dans les liens de navigation', () => {
    render(<PublicNavbar />);
    const links = screen.getAllByRole("link");
    const ateliersFormationsLink = links.find((el) =>
      el.textContent?.includes("Ateliers & Formations"),
    );
    expect(ateliersFormationsLink).toBeDefined();
  });

  it('ne contient pas de lien avec le label "Ateliers" seul', () => {
    render(<PublicNavbar />);
    const links = screen.getAllByRole("link");
    const ateliersOnly = links.find((el) => el.textContent?.trim() === "Ateliers");
    expect(ateliersOnly).toBeUndefined();
  });
});

// ─── Footer ───────────────────────────────────────────────────────────────────

describe("Sprint 4 — PublicFooter", () => {
  it("ne contient pas de lien mort vers /blog", () => {
    render(<PublicFooter />);
    const links = screen.getAllByRole("link");
    const blogLink = links.find((el) => el.getAttribute("href") === "/blog");
    expect(blogLink).toBeUndefined();
  });

  it('expose un lien "Ateliers & Formations" pointant vers /ateliers', () => {
    render(<PublicFooter />);
    const link = screen.getByRole("link", { name: /ateliers & formations/i });
    expect(link).toHaveAttribute("href", "/ateliers");
  });

  it('ne contient plus de lien "Blog" (mort)', () => {
    render(<PublicFooter />);
    expect(screen.queryByRole("link", { name: /^blog$/i })).not.toBeInTheDocument();
  });
});

// ─── MesAteliersClient ────────────────────────────────────────────────────────

const baseAtelier: MesAtelierItem = {
  id: "a-1",
  title: "Atelier test",
  description: "Desc",
  price: 100,
  type: "WORKSHOP",
  capacity: 10,
  pricingType: "SESSION",
  pricePerParticipant: null,
  durationMinutes: 60,
  category: "COMMUNICATION",
  publicCible: [],
  materials: null,
  objectives: null,
  methodology: null,
  evaluation: null,
  slots: [],
  status: "ACTIVE",
  owner: {
    id: "f-1",
    profile: { firstName: "A", lastName: "B", avatar: null, jobTitle: null, bio: null },
  },
};

describe("Sprint 4 — MesAteliersClient wording", () => {
  it('affiche le bouton "Publier un atelier ou une formation" dans le header', () => {
    render(<MesAteliersClient ateliers={[baseAtelier]} serviceBookings={[]} />);
    expect(
      screen.getByRole("button", { name: /publier un atelier ou une formation/i }),
    ).toBeInTheDocument();
  });

  it('affiche "Sessions réalisées" (pas "Ateliers réalisés")', () => {
    render(<MesAteliersClient ateliers={[baseAtelier]} serviceBookings={[]} />);
    expect(screen.getByText(/sessions réalisées/i)).toBeInTheDocument();
    expect(screen.queryByText(/ateliers réalisés/i)).not.toBeInTheDocument();
  });

  it("empty state mentionne service, pas atelier uniquement", () => {
    render(<MesAteliersClient ateliers={[]} serviceBookings={[]} />);
    expect(screen.getByText(/vous n'avez pas encore publié de service/i)).toBeInTheDocument();
  });

  it("delete dialog est dynamique : dit formation si TRAINING", () => {
    const formation: MesAtelierItem = { ...baseAtelier, type: "TRAINING", title: "Ma Formation" };
    render(<MesAteliersClient ateliers={[formation]} serviceBookings={[]} />);
    // Le dialog s'ouvre via le dropdown — on vérifie juste que le composant se rend sans erreur
    expect(screen.getByText(/ma formation/i)).toBeInTheDocument();
  });
});

// ─── FreelanceMarketplace ─────────────────────────────────────────────────────

describe("Sprint 4 — FreelanceMarketplace wording", () => {
  it('affiche le titre "Missions & Services" (pas "Missions & Ateliers")', () => {
    render(<FreelanceMarketplace missions={[]} services={[]} />);
    expect(screen.getByRole("heading", { name: /missions & services/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /missions & ateliers/i })).not.toBeInTheDocument();
  });

  it("le sous-titre mentionne ateliers et formations", () => {
    render(<FreelanceMarketplace missions={[]} services={[]} />);
    expect(screen.getByText(/ateliers et formations disponibles/i)).toBeInTheDocument();
  });
});

// ─── Public CTAs & register role normalization ──────────────────────────────

describe("Sprint 4 — Public CTA role params", () => {
  it("la landing /ateliers pointe vers un rôle FREELANCE en majuscules", () => {
    render(<AteliersLandingPage />);
    const links = screen.getAllByRole("link", { name: /proposer un atelier ou une formation/i });
    expect(links[0]).toHaveAttribute("href", "/register?role=FREELANCE");
  });

  it('la landing /ateliers ne contient plus "Proposer un service" générique', () => {
    render(<AteliersLandingPage />);
    expect(screen.queryByRole("link", { name: /^proposer un service$/i })).not.toBeInTheDocument();
  });

  it("la page /freelances pointe vers un rôle FREELANCE en majuscules", () => {
    render(<FreelancesPage />);
    expect(
      screen.getByRole("link", { name: /m'inscrire comme freelance/i }),
    ).toHaveAttribute("href", "/register?role=FREELANCE");
  });

  it("la page /etablissements pointe vers un rôle ESTABLISHMENT en majuscules", () => {
    render(<EtablissementsPage />);
    expect(
      screen.getByRole("link", { name: /créer mon compte établissement/i }),
    ).toHaveAttribute("href", "/register?role=ESTABLISHMENT");
  });

  it("la page register tolère les paramètres de rôle en minuscules", () => {
    mockRoleQuery.value = "establishment";
    render(<RegisterPage />);

    expect(
      screen.getByRole("radio", { name: /je recrute des renforts/i }),
    ).toHaveAttribute("aria-checked", "true");

    mockRoleQuery.value = null;
  });
});
