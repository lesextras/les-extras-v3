"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrustBlock, type TrustItem } from "@/components/ui/trust-block";
import { ReviewCard } from "@/components/ui/review-card";
import { AtelierCard } from "@/components/ui/atelier-card";
import {
  MapPin,
  Star,
  ShieldCheck,
  MessageCircle,
  Calendar,
  Briefcase,
} from "lucide-react";

/* ─── D.3 — Fiche Freelance ──────────────────────────────────────
   Full freelance profile page, viewed by an establishment.
   Sections: Identity, Trust, Skills, Availability, Ateliers,
   Reviews, Mission history.
   CTA sticky bottom on mobile: "Proposer une mission" (coral).
   ─────────────────────────────────────────────────────────────── */

export interface FreelanceReview {
  authorName: string;
  authorRole?: string;
  authorOrg?: string;
  rating: number;
  text: string;
  context?: string;
}

export interface FreelanceAtelier {
  title: string;
  description?: string;
  rating?: number;
  duration?: string;
  price?: string;
  tags?: string[];
}

export interface MissionHistoryItem {
  title: string;
  establishment: string;
  date: string;
  status: "completed" | "in-progress";
}

export interface FicheFreelanceProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Freelance display name */
  name: string;
  /** Professional title */
  title: string;
  /** City */
  city: string;
  /** Average rating */
  rating?: number;
  /** Number of reviews */
  reviewCount?: number;
  /** Avatar URL */
  avatarUrl?: string;
  /** Initials fallback */
  initials?: string;
  /** Verified status */
  isVerified?: boolean;
  /** Trust block items */
  trustItems?: TrustItem[];
  /** Skill/competence badges */
  skills?: string[];
  /** Available days this week (e.g. ["Lun", "Mar", "Jeu"]) */
  availableDays?: string[];
  /** Ateliers proposed */
  ateliers?: FreelanceAtelier[];
  /** Reviews */
  reviews?: FreelanceReview[];
  /** Mission history */
  missionHistory?: MissionHistoryItem[];
  /** CTA: propose mission */
  onProposeMission?: () => void;
  /** CTA: start chat */
  onChat?: () => void;
}

export function FicheFreelance({
  className,
  name,
  title,
  city,
  rating,
  reviewCount,
  avatarUrl,
  initials,
  isVerified,
  trustItems,
  skills,
  availableDays,
  ateliers,
  reviews,
  missionHistory,
  onProposeMission,
  onChat,
  ...props
}: FicheFreelanceProps) {
  return (
    <div className={cn("space-y-6 pb-20 lg:pb-6", className)} {...props}>
      {/* ─── Hero / Identity ─── */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {/* Avatar XL */}
        <div className="relative shrink-0 self-center sm:self-start">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))] text-2xl font-bold">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              initials || name.charAt(0)
            )}
          </div>
          {isVerified && (
            <div className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[hsl(var(--color-teal-500))] text-white ring-2 ring-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 text-center sm:text-left space-y-1">
          <h1 className="text-heading-xl text-[hsl(var(--text-primary))]">
            {name}
          </h1>
          <p className="text-body-lg text-[hsl(var(--text-secondary))]">
            {title}
          </p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-body-sm text-[hsl(var(--text-secondary))]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {city}
            </span>
            {rating !== undefined && (
              <span className="inline-flex items-center gap-1 text-[hsl(var(--color-amber-700))]">
                <Star
                  className="h-3.5 w-3.5 fill-[hsl(var(--color-amber-500))]"
                  aria-hidden="true"
                />
                {rating.toFixed(1)}
                {reviewCount !== undefined && (
                  <span className="text-[hsl(var(--text-tertiary))]">
                    ({reviewCount} avis)
                  </span>
                )}
              </span>
            )}
            {isVerified && (
              <Badge variant="teal" size="sm">
                Profil vérifié
              </Badge>
            )}
          </div>

          {/* Desktop actions */}
          <div className="hidden sm:flex items-center gap-2 pt-2">
            {onChat && (
              <Button variant="outline" size="sm" onClick={onChat}>
                <MessageCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                Contacter
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Trust Block ─── */}
      {trustItems && trustItems.length > 0 && (
        <section>
          <h2 className="text-overline text-[hsl(var(--text-tertiary))] uppercase tracking-widest mb-3">
            Vérifications
          </h2>
          <TrustBlock variant="block" items={trustItems} />
        </section>
      )}

      {/* ─── Skills & Specializations ─── */}
      {skills && skills.length > 0 && (
        <section>
          <h2 className="text-overline text-[hsl(var(--text-tertiary))] uppercase tracking-widest mb-3">
            Compétences & Spécialisations
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge key={skill} variant="violet" size="md">
                {skill}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* ─── Availability ─── */}
      {availableDays && availableDays.length > 0 && (
        <section>
          <h2 className="text-overline text-[hsl(var(--text-tertiary))] uppercase tracking-widest mb-3">
            Disponibilités
          </h2>
          <div className="flex gap-2">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(
              (day) => {
                const isAvailable = availableDays.includes(day);
                return (
                  <div
                    key={day}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg text-body-sm font-medium transition-colors",
                      isAvailable
                        ? "bg-[hsl(var(--color-teal-50))] text-[hsl(var(--color-teal-700))] border border-[hsl(var(--teal)/0.2)]"
                        : "bg-[hsl(var(--color-navy-50))] text-[hsl(var(--text-tertiary))]"
                    )}
                  >
                    {day.slice(0, 2)}
                  </div>
                );
              }
            )}
          </div>
        </section>
      )}

      {/* ─── Ateliers ─── */}
      {ateliers && ateliers.length > 0 && (
        <section>
          <h2 className="text-overline text-[hsl(var(--text-tertiary))] uppercase tracking-widest mb-3">
            Ateliers proposés
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ateliers.map((atelier) => (
              <AtelierCard
                key={atelier.title}
                title={atelier.title}
                freelanceName={name}
                rating={atelier.rating}
                description={atelier.description}
                duration={atelier.duration}
                price={atelier.price}
                tags={atelier.tags}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Reviews ─── */}
      {reviews && reviews.length > 0 && (
        <section>
          <h2 className="text-overline text-[hsl(var(--text-tertiary))] uppercase tracking-widest mb-3">
            Avis
          </h2>
          <div className="space-y-3">
            {reviews.map((review, i) => (
              <ReviewCard
                key={i}
                authorName={review.authorName}
                authorRole={review.authorRole}
                authorOrg={review.authorOrg}
                rating={review.rating}
                text={review.text}
                context={review.context}
              />
            ))}
          </div>
        </section>
      )}

      {/* ─── Mission History ─── */}
      {missionHistory && missionHistory.length > 0 && (
        <section>
          <h2 className="text-overline text-[hsl(var(--text-tertiary))] uppercase tracking-widest mb-3">
            Historique missions
          </h2>
          <div className="space-y-2">
            {missionHistory.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border border-border p-3"
              >
                <Briefcase
                  className="h-4 w-4 shrink-0 text-[hsl(var(--text-tertiary))]"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-medium text-[hsl(var(--text-primary))] truncate">
                    {m.title}
                  </p>
                  <p className="text-caption text-[hsl(var(--text-tertiary))]">
                    {m.establishment} · {m.date}
                  </p>
                </div>
                <Badge
                  variant={m.status === "completed" ? "emerald" : "teal"}
                  size="sm"
                >
                  {m.status === "completed" ? "Terminée" : "En cours"}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Sticky CTA (mobile) ─── */}
      {onProposeMission && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-card/95 backdrop-blur-sm p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden">
          <Button
            variant="coral"
            size="lg"
            className="w-full"
            onClick={onProposeMission}
          >
            Proposer une mission
          </Button>
        </div>
      )}
    </div>
  );
}
