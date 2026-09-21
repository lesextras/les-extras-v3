import type { MetadataRoute } from "next";
import { getApiBaseUrl } from "@/lib/api";
import { METIERS, VILLES } from "./(public)/renfort/donnees";
import { RUBRIQUES } from "./(public)/aide/contenu";
import { GUIDES_ECRITS } from "./(public)/guides/contenu";
import { ETABLISSEMENTS } from "./(public)/ateliers-pour/donnees";
import { LANDINGS } from "./(public)/l/donnees";
import { renfortSalarieVisible } from "@/lib/offre";

// Sitemap dynamique : pages statiques publiques + catalogue & missions publiés.
// Régénéré périodiquement (revalidate) et tolérant à une API indisponible.
export const revalidate = 3600;

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.WEB_PUBLIC_URL ??
    "https://les-extras.fr"
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

  /*
   * ⚠ UN SITEMAP QUI DÉCLARE UNE 404 EST PIRE QUE PAS DE SITEMAP.
   *
   * Depuis le 19/09/2026, les pages du renfort de POSTE — celui qui se conclut
   * en CDD salarié — répondent 404 hors offre publique (voir `@/lib/offre`).
   * Elles doivent donc sortir d'ici EN MÊME TEMPS, sans quoi on envoie Google
   * sur une quinzaine d'adresses mortes depuis notre propre fichier.
   *
   * Rien n'est retiré des listes : elles sont filtrées à la génération, et
   * reviennent entières avec NEXT_PUBLIC_OFFRE_PUBLIQUE=complete.
   */
  const renfortSalarie = renfortSalarieVisible();
  const HORS_OFFRE = new Set([
    "/outils/cout-remplacement",
    "/comparatif-plateformes-remplacement",
    "/simulateur",
    "/renfort",
  ]);

  // Uniquement des URL réellement publiques et servant un 200 :
  // /freelances n'existe pas (404) et /marketplace redirige vers la connexion.
  const staticRoutes = [
    "",
    "/ateliers",
    "/formations",
    // Le chemin à travers le catalogue gratuit : trois niveaux, l'ordre
    // conseillé, et ce que chaque niveau apprend à faire. Sans entrée au
    // sitemap, la page n'existe que pour qui connaît son adresse.
    "/parcours-de-formation",
    "/edublog",
    "/notre-histoire",
    "/partenaires-associatifs",
    "/catalogue",
    "/contact",
    // Le dispositif a désormais une vitrine publique qui répond 200.
    "/renforteam",
    "/intervenant-independant",
    "/outils",
    "/outils/cout-remplacement",
    "/outils/budget-ateliers",
    // Les mentions, CGU, confidentialité et RGPD tiennent sur une seule page
    // à ancres : annoncer des sous-routes inexistantes envoyait Google sur
    // trois 404 depuis notre propre sitemap.
    "/legal",
    "/legal/cookies",
    // `/login` et `/register` ont été RETIRÉS : ce sont des formulaires, pas
    // des pages de contenu. Elles sont désormais en `noindex` (voir le layout
    // du groupe `(auth)`) et un sitemap qui déclare une page noindex envoie à
    // Google deux consignes contradictoires.
    // Centre d'aide, démonstration, frais de service et entrées de référencement
    // local : autant de pages qui répondent à une recherche précise.
    "/aide",
    // Les deux modes d'emploi pas à pas — cibles naturelles d'une campagne
    // d'acquisition : on y comprend le produit avant le formulaire.
    "/mode-demploi",
    "/mode-demploi/etablissement",
    "/mode-demploi/intervenant",
    "/demo",
    "/frais-de-service",
    // Les deux comparatifs tarifaires : ce sont des pages de contenu à part
    // entière, écrites à partir des grilles publiques des autres acteurs, et
    // elles répondent à une requête très précise (« combien coûte… »).
    "/comparatif-plateformes-remplacement",
    "/comparatif-assistants-redaction",
    // Le carrefour des guides des écrits professionnels. Les guides eux-mêmes
    // sont ajoutés plus bas, comme les rubriques d'aide.
    "/guides",
    // Page réglementaire de l'organisme de formation : identité, prérequis,
    // délais d'accès, évaluation, accessibilité, indicateurs, réclamation.
    // C'est la première page qu'un OPCO ou un stagiaire cherche, et elle
    // n'existait que sur toulali.fr.
    "/informations-reglementaires",
    "/confiance-lex",
    "/simulateur",
    "/renfort",
  ]
    .filter((p) => renfortSalarie || !HORS_OFFRE.has(p))
    .map((p) => ({
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
    // Une page d'atterrissage par type d'établissement pour les ateliers :
    // une direction d'IME ne cherche pas « atelier médico-social », elle
    // cherche « atelier IME ». Ce découpage n'existait que pour le renfort.
    ...ETABLISSEMENTS.map((e) => ({
      url: `${base}/ateliers-pour/${e.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Priorité haute : ce sont les pages sur lesquelles on va chercher les
    // professionnels qui rédigent, et donc les futurs utilisateurs de LEX.
    ...GUIDES_ECRITS.map((g) => ({
      url: `${base}/guides/${g.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    // Les pages d'atterrissage par produit : courtes, mais ce sont des pages
    // de contenu à part entière, et une campagne qui pointe dessus doit
    // trouver Google déjà au courant.
    // `/l/renfort` vend le CDD direct : elle sort avec les autres.
    ...LANDINGS.filter((l) => renfortSalarie || l.slug !== "renfort").map((l) => ({
      url: `${base}/l/${l.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...(renfortSalarie
      ? METIERS.map((m) => ({
          url: `${base}/renfort/metier/${m.slug}`,
          lastModified: now,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }))
      : []),
    ...(renfortSalarie
      ? VILLES.map((v) => ({
          url: `${base}/renfort/${v.slug}`,
          lastModified: now,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }))
      : []),
  ];

  const dynamic: MetadataRoute.Sitemap = [];
  const vendorIds = new Set<string>();

  // L'API plafonne `take` à 60 : on pagine, sinon la requête part en 400 et le
  // sitemap se retrouve vide de toute fiche (le catalogue devient invisible).
  const PAGE = 60;
  for (let skip = 0; skip < 600; skip += PAGE) {
    const page = await safeJson<{
      items: { id: string; slug?: string | null; account?: { id?: string } | null }[];
      total?: number;
    }>(`/public/catalog?take=${PAGE}&skip=${skip}`);
    const items = page?.items ?? [];
    for (const it of items) {
      dynamic.push({
        // L'adresse lisible dès qu'elle existe : déclarer l'identifiant
        // enverrait Google sur une 308 depuis notre propre sitemap.
        url: `${base}/ateliers/${it.slug ?? it.id}`,
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
