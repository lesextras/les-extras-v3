"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { applyToMission } from "@/app/actions/missions";

export function useApplyToMission() {
  const router = useRouter();
  const [isTransitionPending, startTransition] = useTransition();
  const [pendingMissionId, setPendingMissionId] = useState<string | null>(null);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const apply = (missionId: string) => {
    setPendingMissionId(missionId);

    startTransition(async () => {
      try {
        const result = await applyToMission(missionId);

        if (result.ok) {
          setAppliedIds((prev) => {
            const next = new Set(prev);
            next.add(missionId);
            return next;
          });
          toast.success("Mission prise", {
            description: "La mission vous est attribuée.",
          });
          router.refresh();
          return;
        }

        if (result.error?.includes("déjà postulé")) {
          setAppliedIds((prev) => {
            const next = new Set(prev);
            next.add(missionId);
            return next;
          });
          toast.info("Déjà postulé", { description: result.error });
          return;
        }

        if (result.error?.includes("déjà prise")) {
          toast.info("Mission déjà prise", { description: result.error });
          router.refresh();
          return;
        }

        toast.error("Impossible de postuler", {
          description: result.error ?? "Une erreur est survenue.",
        });
      } finally {
        setPendingMissionId(null);
      }
    });
  };

  return {
    apply,
    pendingMissionId,
    isPending: pendingMissionId !== null || isTransitionPending,
    hasApplied: (missionId: string) => appliedIds.has(missionId),
  };
}
