"use client";

// Actions par apprenant sur la fiche session : délivrer l'attestation / le
// certificat (documents imprimables) et générer la facture.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function InscriptionDeliverables({
  inscriptionId,
  accountId,
  certifying,
  invoiced,
}: {
  inscriptionId: string;
  accountId: string;
  certifying: boolean;
  invoiced?: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(Boolean(invoiced));

  async function invoice() {
    setBusy(true);
    try {
      const inv = await apiRequest<{ number?: string }>(
        `/formations/inscriptions/${inscriptionId}/invoice`,
        { method: "POST", accountId, body: {} },
      );
      setDone(true);
      toast({ title: "Facture générée", description: inv?.number ? `N° ${inv.number}` : undefined });
      router.refresh();
    } catch (err) {
      toast({
        title: "Facturation impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button asChild size="sm" variant="outline">
        <a href={`/documents/attestation/${inscriptionId}`} target="_blank" rel="noopener">
          Attestation
        </a>
      </Button>
      {certifying ? (
        <Button asChild size="sm" variant="outline">
          <a href={`/documents/certificat/${inscriptionId}`} target="_blank" rel="noopener">
            Certificat
          </a>
        </Button>
      ) : null}
      <Button asChild size="sm" variant="outline">
        <a href={`/dashboard/formations/tutorat/${inscriptionId}`}>Tutorat</a>
      </Button>
      <Button size="sm" variant="ghost" onClick={invoice} disabled={busy || done}>
        {done ? "Facturé ✓" : busy ? "…" : "Facturer"}
      </Button>
    </div>
  );
}
