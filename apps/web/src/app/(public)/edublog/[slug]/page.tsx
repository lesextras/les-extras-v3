// Article public : lisible sans connexion, indexable, partageable.
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Building2, Newspaper } from "lucide-react";
import { fetchPublic } from "../../../_shared/server";
import { exigerFiche, metaIntrouvable } from "../../../_shared/fiche-publique";
import { formatDate, initials, fullName } from "../../../_shared/format";
import { RichText, texteBrut } from "../../../_shared/RichText";
import type { ArticleCard } from "../page";
// Couvertures d'articles : médiathèque WordPress, hôtes hérités réécrits.
import { visuel } from "@/lib/media";
import { VisuelCarte } from "../../../_shared/VisuelCarte";
import { SOCLE_OG, SOCLE_TWITTER, titreSeo } from "@/lib/meta";

interface ArticleDetail extends ArticleCard {
  content?: string | null;
  related?: ArticleCard[];
  /** Dernière modification — sert de `dateModified` aux données structurées. */
  updatedAt?: string | null;
}

const resume = (t: string, max = 155) => texteBrut(t, max);

export async function generateMetadata({
  params: paramsPromesse,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await paramsPromesse;
  const res = await fetchPublic<ArticleDetail>(`/articles/feed/${params.slug}`);
  const { data } = res;
  // 200 alors que la fiche n'existe pas : le squelette de `(public)/loading.tsx`
  // ouvre une frontière Suspense, la coquille part donc AVANT que `notFound()`
  // ne s'exécute, et le code de statut est déjà joué. On ne peut plus le
  // corriger — mais on peut dire aux robots de ne pas indexer : sans cela,
  // chaque URL périmée ou mal tapée entre au catalogue de Google comme une
  // page valide.
  if (!data) return metaIntrouvable(res, "Actualité introuvable")!;
  const desc = resume(data.excerpt || data.content || data.title);
  const image = visuel(data.coverUrl) ?? undefined;
  return {
    // Balise calibrée pour la page de résultats (16 articles dépassaient les
    // 65 caractères affichés par Google, jusqu'à 103) ; le H1 de l'article et
    // le titre de partage restent entiers. Voir `titreSeo` dans lib/meta.ts.
    title: titreSeo(data.title),
    description: desc,
    alternates: { canonical: `/edublog/${data.slug}` },
    // La couverture de l'article prime quand elle existe ; sinon la carte du
    // site prend le relais, sans quoi un article sans couverture se partageait
    // en rectangle gris. `SOCLE_OG` / `SOCLE_TWITTER` réémettent au passage le
    // `siteName`, la locale et le format de carte : déclarer ces deux objets
    // remplace ceux du layout racine au lieu de les compléter (fusion en
    // surface). Voir `lib/meta.ts`.
    openGraph: {
      ...SOCLE_OG,
      title: `${data.title} · LES EXTRAS`,
      description: desc,
      type: "article",
      publishedTime: data.publishedAt ?? undefined,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      ...SOCLE_TWITTER,
      title: `${data.title} · LES EXTRAS`,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ArticlePage({ params: paramsPromesse }: { params: Promise<{ slug: string }>}) {
  const params = await paramsPromesse;
  const resa = await fetchPublic<ArticleDetail>(`/articles/feed/${params.slug}`);
  const a = exigerFiche(resa, "Actualité");

  const nom = a.account?.name ?? "Les Extras";
  const auteur = fullName(a.author?.firstName, a.author?.lastName);

  // « UTILISATEUR » SIGNAIT DIX-NEUF ARTICLES SUR VINGT-TROIS.
  //
  // `fullName()` renvoie le mot « Utilisateur » quand il n'a ni prénom ni nom :
  // c'est un libellé d'interface, pratique dans une liste, désastreux dans des
  // données structurées. Le JSON-LD le prenait pour un vrai nom et déclarait
  // `author: { "@type": "Person", name: "Utilisateur" }` — Google enregistrait
  // donc une personne nommée « Utilisateur » comme autrice de référence sur des
  // articles d'accompagnement de jeunes majeurs. Le secteur médico-social est
  // précisément celui où Google pèse l'identité et l'expertise de l'auteur.
  //
  // Rien à inventer et rien à réparer en base : quand aucune personne n'est
  // rattachée, l'auteur EST l'organisation qui publie. C'est exact, c'est ce
  // que schema.org prévoit, et c'est ce que la page affiche déjà à l'écran.
  const auteurPersonne = a.author?.firstName || a.author?.lastName ? auteur : null;

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
        <Link href="/edublog" className="hover:text-foreground">Édublog</Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="text-foreground">{a.title}</span>
      </nav>

      <header className="space-y-4">
        {a.category?.title ? <Badge variant="outline">{a.category.title}</Badge> : null}
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {a.title}
        </h1>
        {a.excerpt ? <p className="text-lg text-muted-foreground">{a.excerpt}</p> : null}
        <div className="flex flex-wrap items-center gap-4 border-y border-border py-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarImage src={a.account?.logoUrl ?? undefined} />
              <AvatarFallback className="text-[10px]">{initials(nom)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground">{nom}</span>
          </span>
          {auteurPersonne ? <span>par {auteurPersonne}</span> : null}
          {a.account?.type === "ESTABLISHMENT" ? (
            <span className="inline-flex items-center gap-1"><Building2 className="size-3.5" /> Établissement</span>
          ) : null}
          {a.publishedAt ? <span>{formatDate(a.publishedAt)}</span> : null}
          {a.views ? (
            <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {a.views} lectures</span>
          ) : null}
        </div>
      </header>

      {/* SANS COUVERTURE, L ARTICLE COMMENCAIT DANS LE VIDE (26/08/2026).

          L image d en-tete disparaissait purement et simplement : le titre
          tombait sur le texte, et l article paraissait bacle a cote de ceux
          qui ont une photo. Le repli de marque tient la place. */}
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
        <VisuelCarte src={visuel(a.coverUrl)} alt={a.title} sizes="100vw" priority>
          <span className="grid h-full place-items-center bg-gradient-to-br from-primary/25 via-primary/10 to-secondary/20">
            <span className="flex flex-col items-center gap-1.5 text-center">
              <Newspaper className="size-6 text-primary/70" aria-hidden />
              <span className="px-4 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                {"Édublog"}
              </span>
            </span>
          </span>
        </VisuelCarte>
      </div>

      {a.content ? (
        <RichText value={a.content} />
      ) : null}

      {a.account && a.account.type === "FREELANCE" ? (
        <Card className="bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-muted-foreground">
              Publié par <span className="font-medium text-foreground">{nom}</span>, intervenant sur Les Extras.
            </p>
            <Button asChild size="sm">
              <Link href={`/intervenants/${a.account.id}`}>Voir ses interventions</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {a.related && a.related.length > 0 ? (
        <section className="space-y-3 pt-4">
          <h2 className="text-lg font-semibold text-foreground">À lire aussi</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {a.related.map((r) => (
              <Link key={r.id} href={`/edublog/${r.slug}`} className="group">
                <Card className="h-full overflow-hidden transition group-hover:shadow-card">
                  <div className="relative aspect-[16/10] bg-muted">
                    <VisuelCarte src={visuel(r.coverUrl)} alt={r.title} sizes="33vw">
                      <span className="grid h-full place-items-center bg-gradient-to-br from-primary/25 via-primary/10 to-secondary/20">
                        <span className="flex flex-col items-center gap-1.5 text-center">
                          <Newspaper className="size-6 text-primary/70" aria-hidden />
                          <span className="px-4 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                            {"Édublog"}
                          </span>
                        </span>
                      </span>
                    </VisuelCarte>
                  </div>
                  <CardContent className="p-4">
                    <p className="line-clamp-2 text-sm font-medium text-foreground">{r.title}</p>
                    {r.publishedAt ? (
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.publishedAt)}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: a.title.slice(0, 110),
              description: resume(a.excerpt || a.content || a.title, 300),
              ...(visuel(a.coverUrl) ? { image: [visuel(a.coverUrl)!] } : {}),
              datePublished: a.publishedAt ?? undefined,
              // Aucune date de mise à jour n'était déclarée : pour Google, un
              // article revu la semaine dernière avait la fraîcheur de sa date
              // de publication d'origine.
              dateModified: a.updatedAt ?? a.publishedAt ?? undefined,
              author: auteurPersonne
                ? { "@type": "Person", name: auteurPersonne }
                : { "@type": "Organization", name: nom },
              publisher: { "@type": "Organization", name: "LES EXTRAS" },
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Édublog", item: "/edublog" },
                { "@type": "ListItem", position: 2, name: a.title },
              ],
            },
          ]),
        }}
      />
    </article>
  );
}
