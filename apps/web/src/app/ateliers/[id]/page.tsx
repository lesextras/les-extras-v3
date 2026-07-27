import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getService } from "@/app/actions/marketplace";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { ServiceDetailActions } from "@/components/marketplace/ServiceDetailActions";
import {
  GraduationCap,
  Clock,
  Users,
  Star,
  CheckCircle,
  Package,
  Target,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

function getInitials(first: string, last: string) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

export default async function FicheAtelierPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const service = await getService(params.id);
  if (!service) notFound();

  const owner = service.owner;
  const ownerProfile = owner?.profile;
  const ownerName = ownerProfile
    ? `${ownerProfile.firstName} ${ownerProfile.lastName}`
    : "Intervenant";
  const ownerInitials = ownerProfile
    ? getInitials(ownerProfile.firstName, ownerProfile.lastName)
    : "I";

  const pricingLabel =
    service.pricingType === "QUOTE"
      ? "Sur devis"
      : service.pricingType === "PER_PARTICIPANT"
        ? `${service.pricePerParticipant ?? service.price}€ / participant`
        : `${service.price}€ / session`;

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-1))]">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="bg-[hsl(var(--color-violet-50))] border-b border-[hsl(var(--violet)/0.16)]">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/ateliers"
            className="inline-flex items-center gap-1.5 text-body-sm text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--text-primary))] mb-6 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Tous les ateliers
          </Link>

          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-xl bg-[hsl(var(--color-violet-100))] flex items-center justify-center shrink-0">
              <GraduationCap className="h-7 w-7 text-[hsl(var(--violet))]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-heading-xl mb-2">{service.title}</h1>
              <div className="flex flex-wrap items-center gap-3 text-body-sm">
                {/* Owner */}
                {owner?.id ? (
                  <Link
                    href={`/freelances/${owner.id}`}
                    className="flex items-center gap-2 text-[hsl(var(--text-secondary))] hover:text-[hsl(var(--teal))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    aria-label={`Voir le profil de ${ownerName}`}
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={ownerProfile?.avatar ?? ""}
                        alt={ownerName}
                      />
                      <AvatarFallback className="text-xs bg-[hsl(var(--color-violet-100))] text-[hsl(var(--violet))]">
                        {ownerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span>par {ownerName}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 text-[hsl(var(--text-secondary))]">
                    <Avatar className="h-6 w-6">
                      <AvatarImage
                        src={ownerProfile?.avatar ?? ""}
                        alt={ownerName}
                      />
                      <AvatarFallback className="text-xs bg-[hsl(var(--color-violet-100))] text-[hsl(var(--violet))]">
                        {ownerInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span>par {ownerName}</span>
                  </div>
                )}

                {/* Category */}
                {service.category && (
                  <Badge variant="outline" size="sm" className="border-[hsl(var(--violet)/0.40)] text-[hsl(var(--violet))]">
                    {service.category}
                  </Badge>
                )}

                {/* Price */}
                <span className="font-semibold text-[hsl(var(--violet))]">
                  {pricingLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 pb-28 md:pb-12">

        {/* Description */}
        {service.description && (
          <section>
            <h2 className="text-heading-sm mb-3">Description</h2>
            <GlassCard variant="solid" className="p-5">
              <p className="text-body-lg text-[hsl(var(--text-secondary))] leading-relaxed whitespace-pre-wrap">
                {service.description}
              </p>
            </GlassCard>
          </section>
        )}

        {/* Objectifs & Méthodologie */}
        {(service.objectives || service.methodology) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {service.objectives && (
              <section>
                <h2 className="text-heading-sm mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-[hsl(var(--violet))]" />
                  Objectifs
                </h2>
                <GlassCard variant="solid" className="p-5 h-full">
                  <p className="text-body-sm text-[hsl(var(--text-secondary))] whitespace-pre-wrap">
                    {service.objectives}
                  </p>
                </GlassCard>
              </section>
            )}
            {service.methodology && (
              <section>
                <h2 className="text-heading-sm mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-[hsl(var(--violet))]" />
                  Méthodologie
                </h2>
                <GlassCard variant="solid" className="p-5 h-full">
                  <p className="text-body-sm text-[hsl(var(--text-secondary))] whitespace-pre-wrap">
                    {service.methodology}
                  </p>
                </GlassCard>
              </section>
            )}
          </div>
        )}

        {/* Infos pratiques */}
        <section>
          <h2 className="text-heading-sm mb-4">Informations pratiques</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <GlassCard variant="teal" className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-[hsl(var(--teal))]" />
              <p className="text-body-xs text-[hsl(var(--text-secondary))] mb-0.5">Durée</p>
              <p className="font-semibold text-[hsl(var(--text-primary))]">
                {formatDuration(service.durationMinutes)}
              </p>
            </GlassCard>

            <GlassCard variant="teal" className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-[hsl(var(--teal))]" />
              <p className="text-body-xs text-[hsl(var(--text-secondary))] mb-0.5">Capacité</p>
              <p className="font-semibold text-[hsl(var(--text-primary))]">
                {service.capacity} pers. max
              </p>
            </GlassCard>

            <GlassCard variant="teal" className="p-4 text-center">
              <Star className="h-5 w-5 mx-auto mb-1 text-[hsl(var(--teal))]" />
              <p className="text-body-xs text-[hsl(var(--text-secondary))] mb-0.5">Tarif</p>
              <p className="font-semibold text-[hsl(var(--text-primary))]">
                {pricingLabel}
              </p>
            </GlassCard>

            <GlassCard variant="teal" className="p-4 text-center">
              <Package className="h-5 w-5 mx-auto mb-1 text-[hsl(var(--teal))]" />
              <p className="text-body-xs text-[hsl(var(--text-secondary))] mb-0.5">Matériel</p>
              <p className="font-semibold text-[hsl(var(--text-primary))] text-sm">
                {service.materials ?? "Non précisé"}
              </p>
            </GlassCard>
          </div>
        </section>

        {/* Public cible */}
        {service.publicCible && service.publicCible.length > 0 && (
          <section>
            <h2 className="text-heading-sm mb-3">Public cible</h2>
            <div className="flex flex-wrap gap-2">
              {service.publicCible.map((p) => (
                <Badge key={p} variant="outline" className="border-[hsl(var(--violet)/0.40)] text-[hsl(var(--violet))]">
                  {p}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Évaluation */}
        {service.evaluation && (
          <section>
            <h2 className="text-heading-sm mb-3">Évaluation & suivi</h2>
            <GlassCard variant="solid" className="p-5">
              <p className="text-body-sm text-[hsl(var(--text-secondary))] whitespace-pre-wrap">
                {service.evaluation}
              </p>
            </GlassCard>
          </section>
        )}

        {/* Intervenant */}
        {ownerProfile && (
          <section>
            <h2 className="text-heading-sm mb-4">L'intervenant</h2>
            <GlassCard variant="solid" className="p-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14 shrink-0">
                  <AvatarImage
                    src={ownerProfile.avatar ?? ""}
                    alt={ownerName}
                  />
                  <AvatarFallback className="bg-[hsl(var(--color-violet-100))] text-[hsl(var(--violet))]">
                    {ownerInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[hsl(var(--text-primary))]">
                    {ownerName}
                  </p>
                  {ownerProfile.jobTitle && (
                    <p className="text-body-sm text-[hsl(var(--teal))] font-medium">
                      {ownerProfile.jobTitle}
                    </p>
                  )}
                  {ownerProfile.bio && (
                    <p className="text-body-sm text-[hsl(var(--text-secondary))] mt-2 line-clamp-3">
                      {ownerProfile.bio}
                    </p>
                  )}
                  {owner?.id && (
                    <Link
                      href={`/freelances/${owner.id}`}
                      className="text-body-sm text-[hsl(var(--teal))] hover:underline mt-2 inline-block"
                    >
                      Voir le profil complet →
                    </Link>
                  )}
                </div>
              </div>
            </GlassCard>
          </section>
        )}
      </div>

      {/* ── CTA sticky ──────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border">
        <ServiceDetailActions
          serviceId={service.id}
          pricingType={service.pricingType}
          viewerRole={session.user.role ?? null}
          isOwner={session.user.id === owner?.id}
        />
      </div>
    </div>
  );
}
