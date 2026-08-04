"use client";

// Actions par apprenant sur la fiche session : délivrer l'attestation / le
// certificat (documents imprimables) et générer la facture.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { FactureActions } from "./FactureActions";
import type { InvoiceStatus } from "./types";

export function InscriptionDeliverables({
  inscriptionId,
  accountId,
  certifying,
  invoiced,
  facture,
}: {
  inscriptionId: string;
  accountId: string;
  certifying: boolean;
  invoiced?: boolean;
  /** Facture déjà rattachée à cette inscription, s'il y en a une. */
  facture?: { id: string; status: InvoiceStatus; accountId: string } | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [creee, setCreee] = useState<{ id: string; status: InvoiceStatus } | null>(
    facture ? { id: facture.id, status: facture.status } : null,
  );
  const done = Boolean(invoiced) || Boolean(creee);

  async function invoice() {
    setBusy(true);
    try {
      const inv = await apiRequest<{ id: string; number?: string; status: InvoiceStatus }>(
        `/formations/inscriptions/${inscriptionId}/invoice`,
        { method: "POST", accountId, body: {} },
      );
      if (inv?.id) setCreee({ id: inv.id, status: inv.status ?? "DRAFT" });
      toast({
        title: "Facture créée",
        description: inv?.number
          ? `N° ${inv.number} — en brouillon. Émettez-la pour l'adresser au client.`
          : "En brouillon. Émettez-la pour l'adresser au client.",
      });
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
      {!done ? (
        <Button size="sm" variant="ghost" onClick={invoice} disabled={busy}>
          {busy ? "…" : "Facturer"}
        </Button>
      ) : null}

      {/* Une facture créée mais jamais émise ne sert à rien : elle n'a pas de
          date, le client ne la reçoit pas et ne peut pas la régler. Le geste
          manquait — c'est ici qu'il doit se trouver, au moment où l'on clôt
          l'inscription. */}
      {creee ? (
        <>
          <Button asChild size="sm" variant="outline">
            <a
              href={`/api/proxy/documents/facture/${creee.id}.pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Facture PDF
            </a>
          </Button>
          <FactureActions
            invoiceId={creee.id}
            accountId={accountId}
            statut={creee.status}
            estEmetteur={facture ? facture.accountId === accountId : true}
            compact
          />
        </>
      ) : null}
    </div>
  );
}
