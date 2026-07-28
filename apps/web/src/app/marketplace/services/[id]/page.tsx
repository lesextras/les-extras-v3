// Fiche d'un atelier / d'une formation courte.
// Structure calquée sur les fiches de les-extras.fr : galerie, attributs,
// contenu pédagogique, FAQ, intervenant, avis, fiches liées.
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Clock, Users, MapPin, Package, Eye, BadgeCheck } from "lucide-react";
import { requireSession, fetchApi } from "../../../_shared/server";
import { BookServiceModal } from "../../../_shared/modals/BookServiceModal";
import { RequestQuoteModal } from "../../../_shared/modals/RequestQuoteModal";
import {
  SERVICE_CATEGORY_LABEL,
  formatMoney,
  formatDate,
  fullName,
  initials,
} from "../../../_shared/format";

export const metadata: Metadata = { title: "Atelier" };

interface FaqItem { question: string; answer: string }
interface PriceExtra { label: string; price: number | string }
interface ReviewItem {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  author?: { firstName?: string | null; lastName?: string | null } | null;
}
interface RelatedItem {
  id: string;
  title: string;
  price?: string | number | null;
  city?: string | null;
  duration?: string | null;
  images?: string[] | null;
}
interface ServiceDetail {
  id: string;
  title: string;
  description: string;
  category: keyof typeof SERVICE_CATEGORY_LABEL;
  duration?: string | null;
  durationMinutes?: number | null;
  maxParticipants?: number | null;
  publicTarget?: string | null;
  publicTargets?: string[] | null;
  material?: string | null;
  prerequisites?: string | null;
  objectives?: string | null;
  methodology?: string | null;
  evaluation?: string | null;
  faq?: FaqItem[] | null;
  images?: string[] | null;
  priceExtras?: PriceExtra[] | null;
  price?: string | number | null;
  city?: string | null;
  views?: number | null;
  featured?: boolean;
  verified?: boolean;
  createdAt: string;
  categoryRef?: { id: string; title: string } | null;
  account?: {
    id: string;
    name?: string | null;
    city?: string | null;
    logoUrl?: string | null;
    owner?: {
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      profile?: { job?: string | null; bio?: string | null } | null;
    } | null;
  } | null;
  reviews?: ReviewItem[];
  rating?: number | null;
  /** 'service' = note de cet atelier, 'provider' = note de l'intervenant. */
  ratingSource?: "service" | "provider" | null;
  related?: RelatedItem[];
}

/** "8h00" à partir de 480 minutes ; retombe sur le libellé libre. */
function dureeLisible(minutes?: number | null, libelle?: string | null) {
  if (minutes && minutes > 0) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, "0")}`;
  }
  return libelle ?? null;
}

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const { data: service } = await fetchApi<ServiceDetail>(session, `/services/${params.id}`);
  if (!service) notFound();

  const isEstablishment = session.account.type === "ESTABLISHMENT";
  const images = service.images ?? [];
  const publics = service.publicTargets?.length
    ? service.publicTargets
    : service.publicTarget
      ? [service.publicTarget]
      : [];
  const duree = dureeLisible(service.durationMinutes, service.duration);
  const owner = service.account?.owner;
  const faq = Array.isArray(service.faq) ? service.faq : [];
  const extras = Array.isArray(service.priceExtras) ? service.priceExtras : [];
  const avis = service.reviews ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <Link
        href="/marketplace?type=services"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Retour aux ateliers
      </Link>

      {/* ── Galerie ─────────────────────────────────────────────────────── */}
      {images.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
          <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
            <Image
              src={images[0]}
              alt={service.title}
              fill
              sizes="(max-width: 640px) 100vw, 66vw"
              className="object-cover"
              unoptimized
            />
          </div>
          {images.length > 1 ? (
            <div className="grid gap-2">
              {images.slice(1, 3).map((src, i) => (
                <div
                  key={i}
                  className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted sm:aspect-auto sm:h-full"
                >
                  <Image
                    src={src}
                    alt={`${service.title} — visuel ${i + 2}`}
                    fill
                    sizes="33vw"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_330px]">
        <div className="space-y-8">
          {/* ── Titre & repères ──────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {service.categoryRef?.title ?? SERVICE_CATEGORY_LABEL[service.category]}
              </Badge>
              {service.verified ? (
                <Badge variant="secondary" className="gap-1">
                  <BadgeCheck className="size-3.5" /> Validé par Les Extras
                </Badge>
              ) : null}
              {service.featured ? <Badge>Mis en avant</Badge> : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {service.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {service.rating ? (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Star className="size-4 fill-current text-amber-400" />
                  {service.rating.toFixed(1)}
                  <span className="font-normal text-muted-foreground">
                    ({avis.length} avis
                    {service.ratingSource === "provider" ? " sur l\u2019intervenant" : ""})
                  </span>
                </span>
              ) : null}
              {service.views ? (
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-4" /> {service.views} consultations
                </span>
              ) : null}
              <span>Ajouté le {formatDate(service.createdAt)}</span>
            </div>
          </div>

          {/* ── Attributs ────────────────────────────────────────────────── */}
          <div className="grid gap-3 sm:grid-cols-2">
            {duree ? <Attribut icon={<Clock className="size-4" />} label="Durée" value={duree} /> : null}
            {service.maxParticipants ? (
              <Attribut
                icon={<Users className="size-4" />}
                label="Participants"
                value={`${service.maxParticipants} max`}
              />
            ) : null}
            {publics.length > 0 ? (
              <Attribut
                icon={<Users className="size-4" />}
                label="Public"
                value={publics.join(", ")}
              />
            ) : null}
            {service.material ? (
              <Attribut
                icon={<Package className="size-4" />}
                label="Matériel"
                value={service.material}
              />
            ) : null}
            {service.city ? (
              <Attribut icon={<MapPin className="size-4" />} label="Lieu" value={service.city} />
            ) : null}
            {service.prerequisites ? (
              <Attribut
                icon={<Package className="size-4" />}
                label="Prérequis"
                value={service.prerequisites}
              />
            ) : null}
          </div>

          {/* ── Contenu pédagogique ──────────────────────────────────────── */}
          <Bloc titre="Présentation" texte={service.description} />
          <Bloc titre="Objectifs" texte={service.objectives} />
          <Bloc titre="Méthodologie pédagogique" texte={service.methodology} />
          <Bloc titre="Modalités d'évaluation" texte={service.evaluation} />

          {/* ── FAQ ──────────────────────────────────────────────────────── */}
          {faq.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Questions fréquentes</h2>
              <div className="space-y-2">
                {faq.map((item, i) => (
                  <details
                    key={i}
                    className="group rounded-xl border border-border bg-card p-4 open:shadow-soft"
                  >
                    <summary className="cursor-pointer list-none font-medium text-foreground marker:hidden">
                      {item.question}
                      <span className="float-right text-muted-foreground group-open:hidden">+</span>
                      <span className="float-right hidden text-muted-foreground group-open:inline">
                        −
                      </span>
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {/* ── Avis ─────────────────────────────────────────────────────── */}
          {avis.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                {service.ratingSource === "service"
                  ? "Avis sur cet atelier"
                  : "Avis sur l\u2019intervenant"}
              </h2>
              <div className="space-y-2">
                {avis.map((a) => (
                  <Card key={a.id}>
                    <CardContent className="space-y-1 p-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3.5 ${
                                i < a.rating ? "fill-current text-amber-400" : "text-muted"
                              }`}
                            />
                          ))}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {fullName(a.author?.firstName, a.author?.lastName) || "Établissement"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(a.createdAt)}
                        </span>
                      </div>
                      {a.comment ? (
                        <p className="text-sm text-muted-foreground">{a.comment}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* ── Colonne d'action ───────────────────────────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <CardContent className="space-y-4 p-5">
              {service.price ? (
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {formatMoney(service.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">Tarif de référence, par séance</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tarif sur devis</p>
              )}

              {extras.length > 0 ? (
                <div className="space-y-1 border-t border-border pt-3">
                  <p className="text-xs font-medium text-muted-foreground">En supplément</p>
                  {extras.map((e, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{e.label}</span>
                      <span className="font-medium text-foreground">{formatMoney(e.price)}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {isEstablishment ? (
                <div className="space-y-2">
                  <BookServiceModal
                    serviceId={service.id}
                    serviceTitle={service.title}
                    price={service.price}
                    accountId={session.account.id}
                    trigger={<Button className="w-full">Réserver cet atelier</Button>}
                  />
                  <RequestQuoteModal
                    serviceId={service.id}
                    serviceTitle={service.title}
                    accountId={session.account.id}
                    trigger={
                      <Button variant="outline" className="w-full">
                        Demander un devis
                      </Button>
                    }
                  />
                  <p className="text-center text-xs text-muted-foreground">
                    Réservation immédiate, ou devis chiffré si votre besoin est spécifique.
                  </p>
                </div>
              ) : (
                <p className="text-center text-xs text-muted-foreground">
                  Seuls les établissements peuvent réserver.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Intervenant */}
          {service.account ? (
            <Card>
              <CardContent className="space-y-3 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Intervenant
                </p>
                <div className="flex items-center gap-3">
                  <Avatar className="size-11">
                    <AvatarImage src={service.account.logoUrl ?? undefined} />
                    <AvatarFallback>
                      {initials(owner?.firstName, owner?.lastName) ||
                        (service.account.name ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {fullName(owner?.firstName, owner?.lastName) || service.account.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {owner?.profile?.job ?? service.account.city ?? "Intervenant Les Extras"}
                    </p>
                  </div>
                </div>
                {owner?.profile?.bio ? (
                  <p className="line-clamp-4 text-sm text-muted-foreground">
                    {owner.profile.bio}
                  </p>
                ) : null}
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href={`/intervenants/${service.account.id}`}>
                    Voir toutes ses interventions
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>

      {/* ── Fiches liées ─────────────────────────────────────────────────── */}
      {service.related && service.related.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Dans la même famille</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {service.related.map((r) => (
              <Link key={r.id} href={`/marketplace/services/${r.id}`} className="group">
                <Card className="h-full overflow-hidden transition group-hover:shadow-card">
                  {r.images?.[0] ? (
                    <div className="relative aspect-[16/10] bg-muted">
                      <Image
                        src={r.images[0]}
                        alt={r.title}
                        fill
                        sizes="33vw"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <CardContent className="space-y-1 p-4">
                    <p className="line-clamp-2 font-medium text-foreground">{r.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {[r.duration, r.city].filter(Boolean).join(" · ")}
                    </p>
                    {r.price ? (
                      <p className="font-semibold text-primary">{formatMoney(r.price)}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Référencement : la fiche est un service proposé par un intervenant. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: service.title,
            description: service.description?.slice(0, 300),
            serviceType: SERVICE_CATEGORY_LABEL[service.category],
            areaServed: service.city ?? undefined,
            provider: {
              "@type": "Organization",
              name: service.account?.name ?? "Les Extras",
            },
            ...(service.price
              ? {
                  offers: {
                    "@type": "Offer",
                    price: String(service.price),
                    priceCurrency: "EUR",
                  },
                }
              : {}),
            ...(service.rating && avis.length
              ? {
                  aggregateRating: {
                    "@type": "AggregateRating",
                    ratingValue: service.rating,
                    reviewCount: avis.length,
                  },
                }
              : {}),
          }),
        }}
      />
    </div>
  );
}

function Attribut({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
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
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {texte}
      </div>
    </section>
  );
}
