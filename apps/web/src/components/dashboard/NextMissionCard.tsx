"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react";
import { EASE_PREMIUM, hoverLift } from "@/lib/motion";

/* ─── E.6.1 — Next Mission Card ──────────────────────────────────
   Elevated card showing the freelance's next confirmed mission
   with countdown ("dans 2 jours"), date, location, and schedule.
   Sits atop the freelance dashboard for immediate visibility.
   ─────────────────────────────────────────────────────────────── */

export interface NextMissionCardProps {
  /** Canonical details link */
  detailsHref: string;
  /** Mission title */
  title: string;
  /** Establishment name */
  establishment: string;
  /** City / location */
  city: string;
  /** Scheduled date (ISO) */
  scheduledAt: string;
  /** Display date string, e.g. "Lundi 18 mars" */
  dateDisplay: string;
  /** Time range, e.g. "8h–16h" */
  timeRange?: string;
}

function getCountdown(dateStr: string): string {
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  if (diffMs < 0) return "En cours";
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Demain";
  return `Dans ${diffDays} jours`;
}

export function NextMissionCard({
  detailsHref,
  title,
  establishment,
  city,
  scheduledAt,
  dateDisplay,
  timeRange,
}: NextMissionCardProps) {
  const countdown = getCountdown(scheduledAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE_PREMIUM }}
      whileHover={hoverLift}
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 border-[hsl(var(--teal)/0.25)]",
        "bg-gradient-to-br from-[hsl(var(--color-teal-50))] to-card",
        "shadow-md p-6"
      )}
    >
      {/* Countdown badge */}
      <Badge variant="info" className="mb-4 text-sm font-semibold">
        {countdown}
      </Badge>

      <h3 className="text-heading-md font-display mb-1">{title}</h3>
      <p className="text-body-sm text-muted-foreground mb-4">{establishment}</p>

      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-[hsl(var(--teal))]" aria-hidden="true" />
          {dateDisplay}
        </span>
        {timeRange && (
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-[hsl(var(--teal))]" aria-hidden="true" />
            {timeRange}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-[hsl(var(--teal))]" aria-hidden="true" />
          {city}
        </span>
      </div>

      <Button variant="default" size="sm" className="min-h-[44px]" asChild>
        <Link href={detailsHref}>
          Voir les détails
          <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
        </Link>
      </Button>
    </motion.div>
  );
}
