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
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Les pièces sont désormais fabriquées par le serveur.
          Une page HTML avec un bouton « Imprimer » suffit pour regarder ; elle
          ne suffit pas pour un organisme de formation. Le certificat de
          réalisation est la pièce qu'un OPCO ou la Caisse des dépôts exige en
          PDF pour libérer les fonds, et deux stagiaires de la même session
          repartaient jusqu'ici avec deux documents différents selon les marges
          réglées dans leur navigateur. */}
      <Button asChild size="sm" variant="outline">
        <a href={`/api/proxy/documents/attestation/${inscriptionId}.pdf`} target="_blank" rel="noopener">
          Attestation PDF
        </a>
      </Button>
      {certifying ? (
        <Button asChild size="sm" variant="outline">
          <a href={`/api/proxy/documents/certificat/${inscriptionId}.pdf`} target="_blank" rel="noopener">
            Certificat PDF
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
