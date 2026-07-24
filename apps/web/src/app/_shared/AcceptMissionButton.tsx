"use client";

// SOS Renfort — le freelance accepte la mission (premier arrivé, premier servi).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function AcceptMissionButton({
  missionId,
  accountId,
}: {
  missionId: string;
  accountId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function onAccept() {
    setLoading(true);
    try {
      const res = await apiRequest<{ contractUrl?: string }>(`/missions/${missionId}/accept`, {
        method: "POST",
        accountId,
      });
      toast({
        title: "Mission acceptée 🎉",
        description: "Elle vous est attribuée. Signez le contrat de mission.",
      });
      router.push(res?.contractUrl ?? "/dashboard/planning");
      router.refresh();
    } catch (err) {
      // 409 = déjà pourvue par un autre intervenant.
      toast({
        title: "Mission non disponible",
        description: err instanceof Error ? err.message : "Cette mission vient d'être pourvue.",
        variant: "error",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button className="w-full" disabled={loading} onClick={onAccept}>
      {loading ? "…" : "Accepter cette mission"}
    </Button>
  );
}
