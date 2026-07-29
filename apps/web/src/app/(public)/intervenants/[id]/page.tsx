// Fiche publique d'un intervenant : sa présentation, sa réputation et toutes
// ses interventions — équivalent des pages « host » du site actuel.
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, BadgeCheck } from "lucide-react";
import { fetchPublic } from "../../../_shared/server";
import { formatMoney, formatDate, fullName, initials } from "../../../_shared/format";

interface VendorService {
  id: string;
  title: string;
  description: string;
  price?: string | number | null;
  city?: string | null;
  duration?: string | null;
  maxParticipants?: number | null;
  images?: string[] | null;
  featured?: boolean;
  verified?: boolean;
}
interface Vendor {
  id: string;
  name?: string | null;
  city?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  owner?: {
    firstName?: string | null;
    lastName?: string | null;
    profile?: { job?: string | null; bio?: string | null; skills?: string[] | null } | null;
  } | null;
  services: VendorService[];
  reviews: {
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
    author?: { firstName?: string | null; lastName?: string | null } | null;
  }[];
  rating?: number | null;
  palier?: "NOUVEAU" | "CONFIRME" | "SUPER_EXTRA";
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { data } = await fetchPublic<Vendor>(`/public/vendors/${params.id}`);
  const nom = fullName(data?.owner?.firstName, data?.owner?.lastName) || data?.name;
  return {
    title: nom || "Intervenant",
    description: data?.owner?.profile?.bio?.slice(0, 160),
  };
}

export default async function VendorPage({ params }: { params: { id: string } }) {
  const { data: vendor } = await fetchPublic<Vendor>(`/public/vendors/${params.id}`);
  if (!vendor) notFound();

  const nom = fullName(vendor.owner?.firstName, vendor.owner?.lastName) || vendor.name || "Intervenant";
  const metier = vendor.owner?.profile?.job;
  const competences = vendor.owner?.profile?.skills ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      {/* ── En-tête ──────────────────────────────────────────────────────── */}
      <header className="flex flex-wrap items-start gap-5">
        <Avatar className="size-20">
          <AvatarImage src={vendor.logoUrl ?? undefined} />
          <AvatarFallback className="text-lg">
            {initials(vendor.owner?.firstName, vendor.owner?.lastName) ||
              nom.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {nom}
            {vendor.palier === "SUPER_EXTRA" ? (
              <Badge className="gap-1 align-middle text-xs" title="10 missions terminées minimum, note moyenne d'au moins 4,5 et moins de 5 % d'annulations">
                <BadgeCheck className="size-3" /> Super Extra
              </Badge>
            ) : vendor.palier === "CONFIRME" ? (
              <Badge variant="secondary" className="gap-1 align-middle text-xs" title="Au moins 3 missions terminées avec une note moyenne d'au moins 4">
                <BadgeCheck className="size-3" /> Confirmé
              </Badge>
            ) : null}
          </h1>
          <p className="text-muted-foreground">
            {[metier, vendor.city].filter(Boolean).join(" · ") || "Intervenant Les Extras"}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {vendor.rating ? (
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <Star className="size-4 fill-current text-amber-500" />
                {vendor.rating.toFixed(1)}
                <span className="font-normal text-muted-foreground">
                  ({vendor.reviews.length} avis)
                </span>
              </span>
            ) : null}
            <span className="text-muted-foreground">
              {vendor.services.length} intervention{vendor.services.length > 1 ? "s" : ""} proposée
              {vendor.services.length > 1 ? "s" : ""}
            </span>
            <span className="text-muted-foreground">
              Sur Les Extras depuis {formatDate(vendor.createdAt)}
            </span>
          </div>
        </div>
      </header>

      {vendor.owner?.profile?.bio ? (
        <Card>
          <CardContent className="whitespace-pre-wrap p-5 text-sm leading-relaxed text-muted-foreground">
            {vendor.owner.profile.bio}
          </CardContent>
        </Card>
      ) : null}

      {competences.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {competences.map((c) => (
            <Badge key={c} variant="outline">
              {c}
            </Badge>
          ))}
        </div>
      ) : null}

      {/* ── Ses interventions ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Ses interventions</h2>
        {vendor.services.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucune intervention publiée pour le moment.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {vendor.services.map((s) => (
              <Link key={s.id} href={`/marketplace/services/${s.id}`} className="group">
                <Card className="h-full overflow-hidden transition group-hover:shadow-card">
                  {s.images?.[0] ? (
                    <div className="relative aspect-[16/10] bg-muted">
                      <Image
                        src={s.images[0]}
                        alt={s.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : null}
                  <CardContent className="space-y-2 p-4">
                    <div className="flex flex-wrap gap-1.5">
                      {s.verified ? (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <BadgeCheck className="size-3" /> Validé
                        </Badge>
                      ) : null}
                      {s.featured ? <Badge className="text-xs">Mis en avant</Badge> : null}
                    </div>
                    <p className="line-clamp-2 font-medium text-foreground">{s.title}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {[s.duration, s.maxParticipants ? `${s.maxParticipants} pers. max` : null, s.city]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {s.price ? (
                      <p className="font-semibold text-primary">{formatMoney(s.price)}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Avis ─────────────────────────────────────────────────────────── */}
      {vendor.reviews.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Avis des établissements</h2>
          <div className="space-y-2">
            {vendor.reviews.map((a) => (
              <Card key={a.id}>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3.5 ${
                            i < a.rating ? "fill-current text-amber-500" : "text-muted"
                          }`}
                        />
                      ))}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {fullName(a.author?.firstName, a.author?.lastName) || "Établissement"}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                  </div>
                  {a.comment ? <p className="text-sm text-muted-foreground">{a.comment}</p> : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
