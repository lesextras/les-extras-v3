// Fiche PUBLIQUE d'une formation — même modèle commercial que la fiche atelier.
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star, Clock, Users, MapPin, CalendarClock, ShieldCheck, BadgeCheck, Eye,
} from "lucide-react";
import { fetchPublic } from "../../../_shared/server";
import { premierVisuel, visuels } from "@/lib/media";
import { formatMoney, formatDate } from "../../../_shared/format";
import { QrShare } from "../../../_shared/QrShare";
import { PublicQuoteForm } from "../../../_shared/PublicQuoteForm";
import type { FormationCard } from "../page";

interface FaqItem { question: string; answer: string }
interface SessionItem {
  id: string;
  title?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  maxSeats?: number | null;
  priceHt?: string | number | null;
  status: string;
  _count?: { inscriptions?: number };
}
interface FormationDetail extends FormationCard {
  program?: string | null;
  prerequisites?: string | null;
  targetAudience?: string | null;
  methodology?: string | null;
  evaluation?: string | null;
  faq?: FaqItem[] | null;
  certificationName?: string | null;
  views?: number | null;
  createdAt?: string;
  sessions?: SessionItem[];
  rating?: number | null;
  ratingCount?: number;
  related?: FormationCard[];
}

function resume(t: string, max = 155) {
  const plat = t.replace(/\s+/g, " ").trim();
  return plat.length > max ? `${plat.slice(0, max - 1).trimEnd()}…` : plat;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { data } = await fetchPublic<FormationDetail>(`/public/formations/${params.slug}`);
  if (!data) return { title: "Formation introuvable" };
  const desc = resume(data.objectives || data.summary || "Formation proposée sur Les Extras.");
  const image = premierVisuel(data.images);
  return {
    title: data.title,
    description: desc,
    alternates: { canonical: `/formations/${data.slug}` },
    openGraph: {
      title: `${data.title} · LES EXTRAS`,
      description: desc,
      type: "article",
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

export default async function FormationPubliquePage({
  params,
}: {
  params: { slug: string };
}) {
  const { data: f } = await fetchPublic<FormationDetail>(`/public/formations/${params.slug}`);
  if (!f) notFound();

  const images = visuels(f.images);
  const faq = Array.isArray(f.faq) ? f.faq : [];
  const sessions = f.sessions ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
        <Link href="/formations" className="hover:text-foreground">
          Nos formations
        </Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="text-foreground">{f.title}</span>
      </nav>

      {images.length > 0 ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
          <Image src={images[0]} alt={f.title} fill sizes="100vw" className="object-cover" priority unoptimized />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_330px]">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {f.categoryRef?.title ? <Badge variant="outline">{f.categoryRef.title}</Badge> : null}
              {f.certifying ? (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="size-3.5" /> Qualiopi · finançable OPCO
                </Badge>
              ) : null}
              {f.cpfEligible ? <Badge>CPF</Badge> : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {f.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {f.rating ? (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Star className="size-4 fill-current text-amber-500" />
                  {f.rating.toFixed(1)}
                  <span className="font-normal text-muted-foreground">
                    (satisfaction de {f.ratingCount} stagiaire{(f.ratingCount ?? 0) > 1 ? "s" : ""})
                  </span>
                </span>
              ) : null}
              {f.views ? (
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-4" /> {f.views} consultations
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {f.durationHours ? <Attribut icon={<Clock className="size-4" />} label="Durée" value={`${f.durationHours} h`} /> : null}
            {f.targetAudience ? <Attribut icon={<Users className="size-4" />} label="Public visé" value={f.targetAudience} /> : null}
            {f.city ? <Attribut icon={<MapPin className="size-4" />} label="Lieu" value={f.city} /> : null}
            {f.certificationName ? <Attribut icon={<BadgeCheck className="size-4" />} label="Certification" value={f.certificationName} /> : null}
          </div>

          <Bloc titre="Présentation" texte={f.summary} />
          <Bloc titre="Objectifs pédagogiques" texte={f.objectives} />
          <Bloc titre="Programme" texte={f.program} />
          <Bloc titre="Méthodologie pédagogique" texte={f.methodology} />
          <Bloc titre="Modalités d'évaluation" texte={f.evaluation} />
          <Bloc titre="Prérequis" texte={f.prerequisites} />

          {sessions.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Prochaines sessions</h2>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {s.title ?? `Session du ${formatDate(s.startDate)}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {[formatDate(s.startDate), s.location].filter(Boolean).join(" · ")}
                          {s.maxSeats
                            ? ` · ${Math.max(0, s.maxSeats - (s._count?.inscriptions ?? 0))} place(s) restante(s)`
                            : ""}
                        </p>
                      </div>
                      {s.priceHt ? (
                        <p className="font-semibold text-primary">{formatMoney(s.priceHt)} HT</p>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {faq.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Questions fréquentes</h2>
              <div className="space-y-2">
                {faq.map((item, i) => (
                  <details key={i} className="group rounded-xl border border-border bg-card p-4 open:shadow-soft">
                    <summary className="cursor-pointer list-none font-medium text-foreground marker:hidden">
                      {item.question}
                      <span className="float-right text-muted-foreground group-open:hidden">+</span>
                      <span className="float-right hidden text-muted-foreground group-open:inline">−</span>
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="space-y-4 p-5">
              {f.priceFrom ? (
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    à partir de {formatMoney(f.priceFrom)}
                  </p>
                  <p className="text-xs text-muted-foreground">Par participant, HT</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tarif sur devis</p>
              )}
              {f.nextSessionAt ? (
                <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarClock className="size-4" /> Prochaine session le {formatDate(f.nextSessionAt)}
                </p>
              ) : null}

              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link href={`/marketplace/formations/${f.id}`}>S’inscrire à une session</Link>
                </Button>
                <PublicQuoteForm formationSlug={f.slug} titre={f.title} />
                <p className="text-center text-xs text-muted-foreground">
                  Formation intra-établissement possible. Réponse garantie sous 72 h.
                </p>
              </div>

              <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Certification Qualiopi ADéPA</p>
                <p className="flex items-center gap-1.5"><BadgeCheck className="size-3.5" /> Attestation et certificat délivrés</p>
                <p className="flex items-center gap-1.5"><Users className="size-3.5" /> Émargement et suivi inclus</p>
              </div>
            </CardContent>
          </Card>

          <QrShare path={`/formations/${f.slug}`} title={f.title} fileName={f.slug} />

          {f.account ? (
            <Card>
              <CardContent className="space-y-2 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Organisme de formation
                </p>
                <p className="text-sm font-medium text-foreground">{f.account.name}</p>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>

      {f.related && f.related.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Autres formations</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {f.related.map((r) => (
              <Link key={r.id} href={`/formations/${r.slug}`} className="group">
                <Card className="h-full overflow-hidden transition group-hover:shadow-card">
                  {premierVisuel(r.images) ? (
                    <div className="relative aspect-[16/10] bg-muted">
                      <Image src={premierVisuel(r.images)!} alt={r.title} fill sizes="33vw" className="object-cover" unoptimized />
                    </div>
                  ) : null}
                  <CardContent className="space-y-1 p-4">
                    <p className="line-clamp-2 font-medium text-foreground">{r.title}</p>
                    {r.durationHours ? (
                      <p className="text-sm text-muted-foreground">{r.durationHours} h</p>
                    ) : null}
                    {r.priceFrom ? (
                      <p className="font-semibold text-primary">à partir de {formatMoney(r.priceFrom)}</p>
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
              "@type": "Course",
              name: f.title,
              description: resume(f.objectives || f.summary || f.title, 300),
              ...(images.length ? { image: images } : {}),
              provider: {
                "@type": "Organization",
                name: f.account?.name ?? "Les Extras",
              },
              ...(f.priceFrom
                ? {
                    offers: {
                      "@type": "Offer",
                      price: String(f.priceFrom),
                      priceCurrency: "EUR",
                      category: "Paid",
                    },
                  }
                : {}),
              ...(f.rating && f.ratingCount
                ? {
                    aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: f.rating,
                      reviewCount: f.ratingCount,
                    },
                  }
                : {}),
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Nos formations", item: "/formations" },
                { "@type": "ListItem", position: 2, name: f.title },
              ],
            },
            ...(faq.length
              ? [{
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: faq.map((q) => ({
                    "@type": "Question",
                    name: q.question,
                    acceptedAnswer: { "@type": "Answer", text: q.answer },
                  })),
                }]
              : []),
          ]),
        }}
      />
    </div>
  );
}

function Attribut({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Bloc({ titre, texte }: { titre: string; texte?: string | null }) {
  if (!texte) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-foreground">{titre}</h2>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{texte}</div>
    </section>
  );
}
