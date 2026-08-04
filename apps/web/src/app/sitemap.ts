import type { MetadataRoute } from "next";
import { getApiBaseUrl } from "@/lib/api";
import { METIERS, VILLES } from "./(public)/renfort/donnees";
import { RUBRIQUES } from "./(public)/aide/contenu";

// Sitemap dynamique : pages statiques publiques + catalogue & missions publiés.
// Régénéré périodiquement (revalidate) et tolérant à une API indisponible.
export const revalidate = 3600;

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.WEB_PUBLIC_URL ??
    "https://app.les-extras.fr"
  ).replace(/\/$/, "");
}

async function safeJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const now = new Date();

  // Uniquement des URL réellement publiques et servant un 200 :
  // /freelances n'existe pas (404) et /marketplace redirige vers la connexion.
  const staticRoutes = [
    "",
    "/ateliers",
    "/formations",
    "/edublog",
    "/notre-histoire",
    "/catalogue",
    "/contact",
    // Les deux dispositifs ont désormais une vitrine publique qui répond 200.
    // /dashboard/gap n'y a plus sa place : elle redirige vers la connexion,
    // et un sitemap qui pointe une redirection gaspille le budget de crawl.
    "/gap",
    "/sos-renfort",
    "/intervenants",
    "/outils",
    "/outils/cout-remplacement",
    "/outils/budget-ateliers",
    // Les mentions, CGU, confidentialité et RGPD tiennent sur une seule page
    // à ancres : annoncer des sous-routes inexistantes envoyait Google sur
    // trois 404 depuis notre propre sitemap.
    "/legal",
    "/legal/cookies",
    "/login",
    "/register",
    // Centre d'aide, démonstration, frais de service et entrées de référencement
    // local : autant de pages qui répondent à une recherche précise.
    "/aide",
    "/demo",
    "/frais-de-service",
    "/confiance-lex",
    "/simulateur",
    "/renfort",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.6,
  }));

  // Pages écrites en dur mais nombreuses : rubriques d'aide, métiers, territoires.
  // Elles ne dépendent pas de l'API, donc elles restent dans le sitemap même si
  // l'API est indisponible au moment de la génération.
  const editoriales: MetadataRoute.Sitemap = [
    ...RUBRIQUES.map((r) => ({
      url: `${base}/aide/${r.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...METIERS.map((m) => ({
      url: `${base}/renfort/metier/${m.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...VILLES.map((v) => ({
      url: `${base}/renfort/${v.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];

  const dynamic: MetadataRoute.Sitemap = [];
  const vendorIds = new Set<string>();

  // L'API plafonne `take` à 60 : on pagine, sinon la requête part en 400 et le
  // sitemap se retrouve vide de toute fiche (le catalogue devient invisible).
  const PAGE = 60;
  for (let skip = 0; skip < 600; skip += PAGE) {
    const page = await safeJson<{
      items: { id: string; account?: { id?: string } | null }[];
      total?: number;
    }>(`/public/catalog?take=${PAGE}&skip=${skip}`);
    const items = page?.items ?? [];
    for (const it of items) {
      dynamic.push({
        url: `${base}/ateliers/${it.id}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      if (it.account?.id) vendorIds.add(it.account.id);
    }
    if (items.length < PAGE) break;
  }

  // Formations publiées : fiches vitrine indexables.
  const formations = await safeJson<{ items: { slug: string }[] }>(
    "/public/formations?take=60",
  );
  for (const f of formations?.items ?? []) {
    dynamic.push({
      url: `${base}/formations/${f.slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Actualités publiées : contenu frais, c'est ce qui fait revenir Google.
  const actus = await safeJson<{ items: { slug: string }[] }>("/articles/feed?take=50");
  for (const a of actus?.items ?? []) {
    dynamic.push({
      url: `${base}/edublog/${a.slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  // Missions de renfort ouvertes : le référencement longue traîne
  // (« remplacement éducateur Melun ») est notre premier canal d'acquisition
  // d'intervenants. Les missions passées sont exclues côté API.
  const missions = await safeJson<{ items: { id: string; updatedAt?: string }[] }>(
    "/public/missions?take=100",
  );
  for (const m of missions?.items ?? []) {
    dynamic.push({
      url: `${base}/missions/${m.id}`,
      lastModified: m.updatedAt ? new Date(m.updatedAt) : now,
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  // Pages intervenants : preuve sociale et maillage interne vers les fiches.
  for (const id of vendorIds) {
    dynamic.push({
      url: `${base}/intervenants/${id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  return [...staticRoutes, ...editoriales, ...dynamic];
}
