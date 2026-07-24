import type { MetadataRoute } from "next";
import { getApiBaseUrl } from "@/lib/api";

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

  const staticRoutes = [
    "",
    "/ateliers",
    "/formations",
    "/etablissements",
    "/freelances",
    "/marketplace",
    "/contact",
    "/legal/mentions-legales",
    "/legal/confidentialite",
    "/legal/cgu",
    "/login",
    "/register",
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.6,
  }));

  const dynamic: MetadataRoute.Sitemap = [];

  const catalog = await safeJson<{ items: { id: string; category?: string }[] }>(
    "/public/catalog?take=200",
  );
  for (const it of catalog?.items ?? []) {
    dynamic.push({
      url: `${base}/ateliers/${it.id}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return [...staticRoutes, ...dynamic];
}
