import { notFound } from "next/navigation";
import Link from "next/link";
import { getService } from "@/app/actions/marketplace";
import { getSession } from "@/lib/session";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Clock3, Users, CalendarDays, ShieldCheck, Target, BookOpen, ClipboardList } from "lucide-react";
import { ServiceDetailActions } from "@/components/marketplace/ServiceDetailActions";
import { getCategoryLabel, getPublicCibleLabels, formatDuration } from "@/lib/atelier-config";
import type { ServiceSlot } from "@/lib/atelier-config";

type PageProps = {
  params: Promise<{ id: string }>;
};

function getAvatarFallback(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getSession();
  const service = await getService(id);

  if (!service) {
    notFound();
  }

  const ownerName = service.owner?.profile
    ? `${service.owner.profile.firstName} ${service.owner.profile.lastName}`
    : "Freelance";

  const ownerJob = service.owner?.profile?.jobTitle ?? "Expert";
  const ownerBio = service.owner?.profile?.bio ?? "Aucune biographie disponible.";
  const slots = Array.isArray(service.slots) ? (service.slots as ServiceSlot[]) : [];
  const publicLabels = getPublicCibleLabels(service.publicCible ?? []);

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/marketplace" className="hover:text-foreground">Marketplace</Link>
        <span>/</span>
        <span className="text-foreground">{service.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="teal">
                {service.type === "WORKSHOP" ? "Atelier" : "Formation"}
              </Badge>
              {service.category && (
                <Badge variant="secondary">{getCategoryLabel(service.category)}</Badge>
              )}
              {service.durationMinutes > 0 && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock3 className="h-4 w-4" /> {formatDuration(service.durationMinutes)}
                </span>
              )}
            </div>

            <h1 className="font-display text-heading-xl tracking-tight">{service.title}</h1>

            {/* Public cible */}
            {publicLabels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {publicLabels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-[hsl(var(--color-violet-50))] text-[hsl(var(--color-violet-700))] text-xs font-medium border border-[hsl(var(--violet)/0.2)]"
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Owner mini-profile */}
            {service.owner?.id ? (
              <Link
                href={`/freelances/${service.owner.id}`}
                className="group flex items-center gap-3 pt-2 rounded-lg -m-1 p-1 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Voir le profil de ${ownerName}`}
              >
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                  <AvatarFallback className="bg-[hsl(var(--teal)/0.1)] text-[hsl(var(--teal))] font-bold">
                    {getAvatarFallback(ownerName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Proposé par</p>
                  <p className="font-medium text-foreground group-hover:text-[hsl(var(--teal))] group-hover:underline">
                    {ownerName}
                  </p>
                  <p className="text-xs text-muted-foreground">{ownerJob}</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-3 pt-2">
                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                  <AvatarFallback className="bg-[hsl(var(--teal)/0.1)] text-[hsl(var(--teal))] font-bold">
                    {getAvatarFallback(ownerName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Proposé par</p>
                  <p className="font-medium text-foreground">{ownerName}</p>
                  <p className="text-xs text-muted-foreground">{ownerJob}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          {service.description && (
            <div className="space-y-2">
              <h3 className="text-heading-sm">À propos de ce service</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{service.description}</p>
            </div>
          )}

          {/* Pedagogical sections */}
          {(service.objectives || service.methodology || service.evaluation) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {service.objectives && (
                <div className="bg-[hsl(var(--color-emerald-50))] border border-[hsl(var(--emerald)/0.2)] rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[hsl(var(--color-emerald-700))]">
                    <Target className="w-4 h-4" /> Objectifs
                  </div>
                  <p className="text-sm text-[hsl(var(--color-emerald-700))] leading-relaxed">{service.objectives}</p>
                </div>
              )}
              {service.methodology && (
                <div className="bg-[hsl(var(--color-teal-50))] border border-[hsl(var(--teal)/0.2)] rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[hsl(var(--color-teal-700))]">
                    <BookOpen className="w-4 h-4" /> Méthodologie
                  </div>
                  <p className="text-sm text-[hsl(var(--color-teal-700))] leading-relaxed">{service.methodology}</p>
                </div>
              )}
              {service.evaluation && (
                <div className="bg-[hsl(var(--color-violet-50))] border border-[hsl(var(--violet)/0.2)] rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[hsl(var(--color-violet-700))]">
                    <ClipboardList className="w-4 h-4" /> Évaluation
                  </div>
                  <p className="text-sm text-[hsl(var(--color-violet-700))] leading-relaxed">{service.evaluation}</p>
                </div>
              )}
            </div>
          )}

          {/* Materials */}
          {service.materials && (
            <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-4 border">
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--teal))] mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm">Matériel fourni</p>
                <p className="text-sm text-muted-foreground">{service.materials}</p>
              </div>
            </div>
          )}

          {/* Available slots */}
          {slots.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-heading-sm flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[hsl(var(--teal))]" />
                Créneaux disponibles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {slots.map((slot, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-sm">
                    <span className="font-medium capitalize">
                      {new Date(slot.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                    <span className="text-muted-foreground">
                      {slot.heureDebut} – {slot.heureFin}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Instructor bio */}
          <div className="bg-muted/30 p-6 rounded-xl border">
            <h3 className="text-heading-sm mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[hsl(var(--teal))]" />
              L&apos;Intervenant
            </h3>
            <div className="flex flex-col md:flex-row gap-6">
              <Avatar className="h-20 w-20 shrink-0">
                <AvatarFallback className="text-xl">{getAvatarFallback(ownerName)}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div>
                  {service.owner?.id ? (
                    <Link
                      href={`/freelances/${service.owner.id}`}
                      className="inline-block font-semibold text-lg hover:text-[hsl(var(--teal))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      aria-label={`Voir le profil de ${ownerName}`}
                    >
                      {ownerName}
                    </Link>
                  ) : (
                    <h4 className="font-semibold text-lg">{ownerName}</h4>
                  )}
                  <p className="text-sm text-[hsl(var(--teal))] font-medium">{ownerJob}</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{ownerBio}</p>
                {service.owner?.id && (
                  <Link
                    href={`/freelances/${service.owner.id}`}
                    className="inline-block text-sm text-[hsl(var(--teal))] font-medium hover:underline mt-1"
                  >
                    Voir le profil complet →
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY BUY BOX */}
        <div className="relative">
          <div className="sticky top-24">
            <Card className="border-2 border-[hsl(var(--teal)/0.2)] shadow-lg overflow-hidden">
              <div className="bg-[hsl(var(--teal)/0.05)] p-4 border-b border-[hsl(var(--teal)/0.1)]">
                <h3 className="font-semibold text-[hsl(var(--teal))] text-center">Récapitulatif</h3>
              </div>
              <CardContent className="p-6 space-y-5">
                {/* Price display */}
                <div>
                  {service.pricingType === "QUOTE" ? (
                    <div className="text-center py-2">
                      <p className="text-2xl font-bold text-amber-700">Sur devis</p>
                      <p className="text-xs text-muted-foreground mt-1">Le tarif est défini après échange</p>
                    </div>
                  ) : service.pricingType === "PER_PARTICIPANT" && service.pricePerParticipant ? (
                    <div className="flex items-end justify-between">
                      <span className="text-muted-foreground font-medium">Par participant</span>
                      <div className="text-right">
                        <span className="text-3xl font-bold">{service.pricePerParticipant} €</span>
                        <span className="text-xs text-muted-foreground block">/ pers.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-end justify-between">
                      <span className="text-muted-foreground font-medium">Prix forfaitaire</span>
                      <div className="text-right">
                        <span className="text-3xl font-bold">{service.price} €</span>
                        <span className="text-xs text-muted-foreground block">par session</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" /> Capacité
                    </span>
                    <span className="font-medium">{service.capacity} pers. max</span>
                  </div>
                  {service.durationMinutes > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Clock3 className="h-4 w-4" /> Durée
                      </span>
                      <span className="font-medium">{formatDuration(service.durationMinutes)}</span>
                    </div>
                  )}
                  {slots.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-4 w-4" /> Créneaux
                      </span>
                      <span className="font-medium">{slots.length} disponible{slots.length > 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* CTA — client-side component */}
                <ServiceDetailActions
                  serviceId={service.id}
                  pricingType={service.pricingType}
                  viewerRole={session?.user.role ?? null}
                  isOwner={session?.user.id === service.owner?.id}
                />

                <p className="text-xs text-center text-muted-foreground px-2">
                  Votre demande est transmise au freelance avant confirmation.
                </p>
              </CardContent>
            </Card>

            {/* Trust signals */}
            <div className="mt-6 space-y-3 px-2">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Profil Vérifié</p>
                  <p className="text-muted-foreground text-xs">L&apos;identité et les diplômes de ce freelance ont été contrôlés.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
