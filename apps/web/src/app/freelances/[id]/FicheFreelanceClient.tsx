"use client";

import { FicheFreelance } from "@/components/patterns/fiche-freelance";
import { useUIStore } from "@/lib/stores/useUIStore";
import type { SerializedFreelanceDetail, SerializedService } from "@/app/actions/marketplace";
import type { TrustItem } from "@/components/ui/trust-block";

interface FicheFreelanceClientProps {
  freelance: SerializedFreelanceDetail;
  fullName: string;
  initials: string;
  rating: number;
  reviewCount: number;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m}`;
}

export function FicheFreelanceClient({
  freelance,
  fullName,
  initials,
  rating,
  reviewCount,
}: FicheFreelanceClientProps) {
  const openRenfortModal = useUIStore((s) => s.openRenfortModal);

  const profile = freelance.profile;

  const trustItems: TrustItem[] = [
    { label: "Identité vérifiée", status: "verified" },
    {
      label: profile?.siret ? "SIRET enregistré" : "SIRET non renseigné",
      status: profile?.siret ? "verified" : "pending",
    },
    {
      label: reviewCount > 0 ? `${reviewCount} avis vérifiés` : "Aucun avis pour l'instant",
      status: reviewCount > 0 ? "verified" : "pending",
    },
  ];

  const ateliers = freelance.ownerServices.map((s: SerializedService) => ({
    title: s.title,
    description: s.description ?? undefined,
    duration: formatDuration(s.durationMinutes),
    price: s.pricingType === "QUOTE" ? "Sur devis" : `${s.price}€`,
    tags: s.publicCible ?? undefined,
  }));

  const reviews = freelance.reviewsReceived.map((r) => {
    const ap = r.author.profile;
    return {
      authorName: ap
        ? ap.companyName || `${ap.firstName} ${ap.lastName}`
        : "Établissement",
      rating: r.rating,
      text: r.comment ?? "",
      context: new Date(r.createdAt).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      }),
    };
  });

  return (
    <div className="min-h-screen bg-[hsl(var(--surface-1))]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <FicheFreelance
          name={fullName}
          title={profile?.jobTitle ?? "Freelance"}
          city={profile?.city ?? "France"}
          rating={reviewCount > 0 ? rating : undefined}
          reviewCount={reviewCount > 0 ? reviewCount : undefined}
          avatarUrl={profile?.avatar ?? undefined}
          initials={initials}
          isVerified
          trustItems={trustItems}
          skills={profile?.skills ?? []}
          availableDays={profile?.availableDays ?? []}
          ateliers={ateliers}
          reviews={reviews}
          onProposeMission={() => openRenfortModal()}
        />
      </div>
    </div>
  );
}
