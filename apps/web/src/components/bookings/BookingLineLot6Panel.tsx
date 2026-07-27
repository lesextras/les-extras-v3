"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { RefreshCw, Star } from "lucide-react";
import {
  createReview,
  getReviewByBooking,
  type SerializedReview,
} from "@/app/actions/reviews";
import type {
  BookingLine,
  BookingLineStatus,
  DashboardRole,
} from "@/app/actions/bookings";
import { ReviewModal } from "@/components/modals/ReviewModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  isBookingAwaitingPayment,
  isBookingCompleted,
} from "@/lib/booking-status";
import { toast } from "sonner";

function isReviewableStatus(status: BookingLineStatus): boolean {
  return isBookingCompleted(status);
}

function getPaymentStatusLabel(status: BookingLineStatus): {
  label: string;
  variant: "amber" | "emerald" | "outline";
} | null {
  if (isBookingAwaitingPayment(status)) {
    return {
      label: "Règlement: en attente de validation par l'association",
      variant: "amber",
    };
  }

  if (status === "PAID") {
    return {
      label: "Règlement: validé par l'association",
      variant: "emerald",
    };
  }

  if (status === "COMPLETED") {
    return {
      label: "Règlement: suivi hors plateforme (V1)",
      variant: "outline",
    };
  }

  return null;
}

type BookingLineLot6PanelProps = {
  line: BookingLine;
  userRole: DashboardRole;
  onBookingUpdated?: () => Promise<void> | void;
  disabled?: boolean;
};

export function BookingLineLot6Panel({
  line,
  userRole,
  onBookingUpdated,
  disabled = false,
}: BookingLineLot6PanelProps) {
  const bookingId = line.relatedBookingId;
  const reviewUnsupportedForSlot =
    line.lineType === "SERVICE_BOOKING" &&
    userRole === "FREELANCE" &&
    line.viewerSide === "REQUESTER";
  const [review, setReview] = useState<SerializedReview | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isSubmittingReview, startSubmittingReview] = useTransition();

  const loadReview = useCallback(async () => {
    if (!bookingId) {
      setReview(null);
      setReviewError(null);
      setIsReviewLoading(false);
      return;
    }

    setIsReviewLoading(true);
    setReviewError(null);
    try {
      const result = await getReviewByBooking(bookingId);
      setReview(result);
    } catch (error) {
      setReview(null);
      setReviewError(
        error instanceof Error ? error.message : "Impossible de charger l'avis.",
      );
    } finally {
      setIsReviewLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void loadReview();
  }, [loadReview]);

  const paymentStatus = useMemo(
    () => getPaymentStatusLabel(line.status),
    [line.status],
  );

  const canCreateReview =
    Boolean(bookingId) &&
    isReviewableStatus(line.status) &&
    !review &&
    !isReviewLoading &&
    !reviewUnsupportedForSlot;

  const handleReviewSubmit = (data: { rating: number; text: string; tags: string[] }) => {
    if (!bookingId) {
      toast.error("Avis indisponible pour cette ligne.");
      return;
    }

    startSubmittingReview(async () => {
      const roleReviewType =
        userRole === "ESTABLISHMENT"
          ? "ESTABLISHMENT_TO_FREELANCE"
          : "FREELANCE_TO_ESTABLISHMENT";

      const normalizedText = data.text.trim();
      const tagsText = data.tags.length > 0 ? `Tags: ${data.tags.join(", ")}` : "";
      const comment = [normalizedText, tagsText].filter(Boolean).join("\n\n");

      const result = await createReview({
        bookingId,
        rating: data.rating,
        comment: comment || undefined,
        type: roleReviewType,
      });

      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success("Avis envoyé.");
      setIsReviewModalOpen(false);
      await loadReview();
      await onBookingUpdated?.();
    });
  };

  return (
    <div className="space-y-1.5">
      {paymentStatus ? (
        <Badge variant={paymentStatus.variant} size="sm">
          {paymentStatus.label}
        </Badge>
      ) : null}

      <div className="text-[11px] text-[hsl(var(--text-secondary))] space-y-1">
        {isReviewLoading ? (
          <span>Avis: chargement...</span>
        ) : reviewError ? (
          <div className="flex items-center gap-1.5">
            <span>Avis: {reviewError}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-1.5 text-[11px]"
              onClick={() => void loadReview()}
              disabled={disabled}
            >
              <RefreshCw className="h-3 w-3 mr-1" aria-hidden="true" />
              Réessayer
            </Button>
          </div>
        ) : review ? (
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-current text-amber-500" aria-hidden="true" />
              Avis envoyé ({review.rating}/5)
            </span>
          </div>
        ) : !bookingId ? (
          <span>Avis: indisponible pour cette ligne.</span>
        ) : !isReviewableStatus(line.status) ? (
          <span>Avis: disponible après mission terminée.</span>
        ) : reviewUnsupportedForSlot ? (
          <span>Avis: indisponible pour cette réservation.</span>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-[11px]"
            onClick={() => setIsReviewModalOpen(true)}
            disabled={disabled || isSubmittingReview || !canCreateReview}
          >
            Laisser un avis
          </Button>
        )}
      </div>

      <ReviewModal
        open={isReviewModalOpen}
        onOpenChange={setIsReviewModalOpen}
        targetName={line.interlocutor}
        context={`${line.typeLabel} · ${new Date(line.date).toLocaleDateString("fr-FR")}`}
        reviewerSide={userRole === "ESTABLISHMENT" ? "establishment" : "freelance"}
        onSubmit={handleReviewSubmit}
      />
    </div>
  );
}
