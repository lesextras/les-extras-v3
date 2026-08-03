"use client";

// Boutons de paiement Stripe : abonnement, rechargement de crédits,
// paiement d'une facture en une fois. POST /billing/checkout → redirection
// vers l'URL Stripe Checkout renvoyée par l'API.
import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

type Kind = "credit_pack" | "subscription" | "invoice";

export function CheckoutButton({
  accountId,
  kind,
  packId,
  planId,
  invoiceId,
  label,
  variant = "primary",
  disabled,
}: {
  accountId: string;
  kind: Kind;
  packId?: string;
  planId?: string;
  invoiceId?: string;
  label: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  disabled?: boolean;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function go() {
    setLoading(true);
    try {
      const res = await apiRequest<{ url: string }>("/billing/checkout", {
        method: "POST",
        // Le compte payeur n'est plus transmis : c'est le garde serveur qui
        // le détermine, à partir du compte actif dont il a vérifié l'accès.
        body: { kind, packId, planId, invoiceId },
      });
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      throw new Error("URL de paiement absente.");
    } catch (err) {
      toast({
        title: "Paiement indisponible",
        description:
          err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
      setLoading(false);
    }
  }

  return (
    <Button onClick={go} disabled={disabled || loading} variant={variant}>
      {loading ? "Redirection…" : label}
    </Button>
  );
}
