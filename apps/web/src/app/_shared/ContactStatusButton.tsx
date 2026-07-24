"use client";

// Bascule le statut d'une demande de contact (NEW ↔ HANDLED) — PATCH /admin/contacts/:id.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";

export function ContactStatusButton({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const next = status === "HANDLED" ? "NEW" : "HANDLED";

  async function toggle() {
    setLoading(true);
    try {
      await apiRequest(`/admin/contacts/${id}`, { method: "PATCH", body: { status: next } });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant={status === "HANDLED" ? "ghost" : "secondary"} disabled={loading} onClick={toggle}>
      {loading ? "…" : status === "HANDLED" ? "Rouvrir" : "Marquer traité"}
    </Button>
  );
}
