"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/useUIStore";
import { CalendarDays, FileText } from "lucide-react";

interface ServiceDetailActionsProps {
  serviceId: string;
  pricingType: string;
  viewerRole: "ESTABLISHMENT" | "FREELANCE" | "ADMIN" | null;
  isOwner: boolean;
}

export function ServiceDetailActions({ serviceId, pricingType, viewerRole, isOwner }: ServiceDetailActionsProps) {
  const openBookServiceModal = useUIStore((s) => s.openBookServiceModal);
  const openQuoteRequestModal = useUIStore((s) => s.openQuoteRequestModal);

  if (isOwner) {
    return (
      <Button size="lg" className="w-full text-md h-12 shadow-md hover:shadow-lg" asChild>
        <Link href="/dashboard/ateliers">Gérer ce service</Link>
      </Button>
    );
  }

  const canRequestService =
    viewerRole === "ESTABLISHMENT" || viewerRole === "FREELANCE";

  if (!canRequestService) {
    return (
      <Button size="lg" variant="outline" className="w-full text-md h-12" disabled>
        Action indisponible
      </Button>
    );
  }

  if (pricingType === "QUOTE") {
    return (
      <Button
        size="lg"
        className="w-full text-md h-12 shadow-md hover:shadow-lg bg-amber-600 hover:bg-amber-700 text-white gap-2"
        onClick={() => openQuoteRequestModal(serviceId)}
      >
        <FileText className="w-5 h-5" />
        Demander un devis
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="w-full text-md h-12 shadow-md hover:shadow-lg gap-2"
      onClick={() => openBookServiceModal(serviceId)}
    >
      <CalendarDays className="w-5 h-5" />
      Demander une réservation
    </Button>
  );
}
