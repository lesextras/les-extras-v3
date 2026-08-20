// Article public : lisible sans connexion, indexable, partageable.
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Building2 } from "lucide-react";
import { fetchPublic } from "../../../_shared/server";
import { formatDate, initials, fullName } from "../../../_shared/format";
import { RichText, texteBrut } from "../../../_shared/RichText";
import type { ArticleCard } from "../page";

interface ArticleDetail extends ArticleCard {
  content?: string | null;
  related?: ArticleCard[];
}

const resume = (t: string, max = 155) => texteBrut(t, max);

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { data } = await fetchPublic<ArticleDetail>(`/articles/feed/${params.slug}`);
  // 200 alors que la fiche n'existe pas : le squelette de `(public)/loading.tsx`
  // ouvre une frontière Suspense, la coquille part donc AVANT que `notFound()`
  // ne s'exécute, et le code de statut est déjà joué. On ne peut plus le
  // corriger — mais on peut dire aux robots de ne pas indexer : sans cela,
  // chaque URL périmée ou mal tapée entre au catalogue de Google comme une
  // page valide.
  if (!data) return { title: "Actualité introuvable", robots: { index: false, follow: false } };
  const desc = resume(data.excerpt || data.content || data.title);
  const image = data.coverUrl ?? undefined;
  return {
    title: data.title,
    description: desc,
    alternates: { canonical: `/edublog/${data.slug}` },
    openGraph: {
      title: `${data.title} · LES EXTRAS`,
      description: desc,
      type: "article",
      publishedTime: data.publishedAt ?? undefined,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${data.title} · LES EXTRAS`,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const { data: a } = await fetchPublic<ArticleDetail>(`/articles/feed/${params.slug}`);
  if (!a) notFound();

  const nom = a.account?.name ?? "Les Extras";
  const auteur = fullName(a.author?.firstName, a.author?.lastName);

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
          {auteur ? <span>par {auteur}</span> : null}
          {a.account?.type === "ESTABLISHMENT" ? (
            <span className="inline-flex items-center gap-1"><Building2 className="size-3.5" /> Établissement</span>
          ) : null}
          {a.publishedAt ? <span>{formatDate(a.publishedAt)}</span> : null}
          {a.views ? (
            <span className="inline-flex items-center gap-1"><Eye className="size-3.5" /> {a.views} lectures</span>
          ) : null}
        </div>
      </header>

      {a.coverUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
          <Image src={a.coverUrl} alt={a.title} fill sizes="100vw" className="object-cover" priority />
        </div>
      ) : null}

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
                  {r.coverUrl ? (
                    <div className="relative aspect-[16/10] bg-muted">
                      <Image src={r.coverUrl} alt={r.title} fill sizes="33vw" className="object-cover" />
                    </div>
                  ) : null}
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
              ...(a.coverUrl ? { image: [a.coverUrl] } : {}),
              datePublished: a.publishedAt ?? undefined,
              author: { "@type": auteur ? "Person" : "Organization", name: auteur || nom },
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
