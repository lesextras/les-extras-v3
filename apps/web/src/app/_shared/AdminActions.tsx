"use client";

// Actions de modération (back-office ADMIN).
//   PATCH /admin/missions/:id/moderation { action: 'APPROVE' | 'REJECT' }
//   PATCH /admin/users/:id/status        { status: 'VERIFIED' | 'BANNED' }
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function ModerateMissionActions({
  missionId,
  accountId,
}: {
  missionId: string;
  accountId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  async function moderate(action: "APPROVE" | "REJECT") {
    setLoading(action);
    try {
      await apiRequest(`/admin/missions/${missionId}/moderation`, {
        method: "PATCH",
        body: { action },
        accountId,
      });
      toast({ title: action === "APPROVE" ? "Offre approuvée" : "Offre rejetée" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" disabled={loading !== null} onClick={() => moderate("APPROVE")}>
        {loading === "APPROVE" ? "…" : "Approuver"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive"
        disabled={loading !== null}
        onClick={() => moderate("REJECT")}
      >
        {loading === "REJECT" ? "…" : "Rejeter"}
      </Button>
    </div>
  );
}

export function UserStatusActions({
  userId,
  status,
  accountId,
}: {
  userId: string;
  status: string;
  accountId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  async function setStatus(next: "VERIFIED" | "BANNED") {
    setLoading(next);
    try {
      await apiRequest(`/admin/users/${userId}/status`, {
        method: "PATCH",
        body: { status: next },
        accountId,
      });
      toast({ title: next === "BANNED" ? "Utilisateur banni" : "Utilisateur réactivé" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(null);
    }
  }

  if (status === "BANNED") {
    return (
      <Button size="sm" variant="outline" disabled={loading !== null} onClick={() => setStatus("VERIFIED")}>
        {loading === "VERIFIED" ? "…" : "Réactiver"}
      </Button>
    );
  }
  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive hover:text-destructive"
      disabled={loading !== null}
      onClick={() => setStatus("BANNED")}
    >
      {loading === "BANNED" ? "…" : "Bannir"}
    </Button>
  );
}
