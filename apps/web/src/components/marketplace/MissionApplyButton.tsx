"use client";

import { Zap, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApplyToMission } from "@/lib/hooks/useApplyToMission";

interface MissionApplyButtonProps {
  missionId: string;
  className?: string;
}

export function MissionApplyButton({ missionId, className }: MissionApplyButtonProps) {
  const { apply, pendingMissionId, hasApplied } = useApplyToMission();
  const applied = hasApplied(missionId);
  const isThisPending = pendingMissionId === missionId;

  if (applied) {
    return (
      <Button
        variant="secondary"
        size="lg"
        disabled
        className={`w-full gap-2 font-bold ${className ?? ""}`}
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
        Mission prise
      </Button>
    );
  }

  return (
    <Button
      variant="action"
      size="lg"
      disabled={isThisPending}
      className={`w-full gap-2 font-bold ${className ?? ""}`}
      onClick={() => apply(missionId)}
    >
      {isThisPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Zap className="h-4 w-4 fill-current" aria-hidden="true" />
      )}
      {isThisPending ? "Envoi…" : "Postuler à cette mission"}
    </Button>
  );
}
