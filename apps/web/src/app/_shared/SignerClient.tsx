"use client";

/**
 * Le geste de signature, vu du signataire.
 *
 * Un seul écran, une seule chose à faire : saisir le code reçu par courriel.
 * Tout le contexte nécessaire est rappelé — quel document, quelle portée
 * juridique — parce qu'on ne signe pas un contrat de travail sur un écran qui
 * ne dit pas ce qu'on signe.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field, Textarea } from "./form-fields";

export interface DemandeSignature {
  id: string;
  documentType: "CONTRAT_CDD" | "PROPOSITION" | "DEVIS";
  documentId: string;
  signataireNom: string;
  signataireEmail: string;
  statut: "EN_ATTENTE" | "SIGNEE" | "REFUSEE" | "EXPIREE" | "ANNULEE";
  signeLe: string | null;
  empreinte: string;
  prestataireActif: string | null;
}

const DOCUMENT: Record<DemandeSignature["documentType"], string> = {
  CONTRAT_CDD: "Contrat à durée déterminée",
  PROPOSITION: "Proposition d'engagement",
  DEVIS: "Devis",
};

export function SignerClient({
  demande,
  accountId,
}: {
  demande: DemandeSignature;
  accountId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function action(chemin: string, corps?: Record<string, unknown>) {
    setBusy(chemin);
    setErreur(null);
    try {
      await apiRequest(`/signatures/${demande.id}${chemin}`, {
        method: "POST",
        accountId,
        body: corps ?? {},
      });
      return true;
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Action impossible");
      return false;
    } finally {
      setBusy(null);
    }
  }

  if (demande.statut === "SIGNEE") {
    return (
      <Card>
        <CardContent className="space-y-3 p-6 text-center">
          <Badge variant="success">Document signé</Badge>
          <p className="text-sm text-muted-foreground">
            Signé le{" "}
            {demande.signeLe
              ? new Date(demande.signeLe).toLocaleString("fr-FR", {
                  dateStyle: "long",
                  timeStyle: "short",
                })
              : ""}
            . Le dossier de preuve est conservé par l'établissement.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (demande.statut !== "EN_ATTENTE") {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Badge variant="muted">
            {demande.statut === "REFUSEE"
              ? "Demande refusée"
              : demande.statut === "ANNULEE"
                ? "Demande annulée"
                : "Demande expirée"}
          </Badge>
          <p className="mt-2 text-sm text-muted-foreground">
            Cette demande n'est plus active. Si vous devez signer ce document, demandez à
            l'établissement de relancer une demande.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <h3 className="font-semibold text-foreground">{DOCUMENT[demande.documentType]}</h3>
        <p className="text-xs text-muted-foreground">
          Demande adressée à {demande.signataireNom} · {demande.signataireEmail}
        </p>
        <p className="font-mono text-[11px] text-muted-foreground">
          empreinte {demande.empreinte.slice(0, 24)}…
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-prose rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          En saisissant le code reçu par courriel, vous apposez une signature électronique sur ce
          document (article 1367 du code civil). L'heure, votre adresse de connexion et
          l'empreinte du document sont consignées dans un dossier de preuve.
        </p>

        <div className="flex flex-wrap items-end gap-2">
          <Field label="Code reçu par courriel" htmlFor="code-signature">
            <Input
              id="code-signature"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-36 text-center font-mono text-lg tracking-[0.4em]"
            />
          </Field>
          <Button
            loading={busy === "/signer"}
            disabled={busy !== null || code.length !== 6}
            onClick={async () => {
              if (await action("/signer", { code })) {
                toast({ title: "Document signé", description: "Merci — tout est enregistré." });
                router.refresh();
              }
            }}
          >
            Signer
          </Button>
          <Button
            variant="ghost"
            loading={busy === "/code"}
            disabled={busy !== null && busy !== "/code"}
            onClick={async () => {
              if (await action("/code")) toast({ title: "Nouveau code envoyé" });
            }}
          >
            Renvoyer un code
          </Button>
        </div>

        {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}

        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            Je ne souhaite pas signer
          </summary>
          <div className="mt-2 space-y-2">
            <Textarea id="motif-refus" rows={2} placeholder="Motif du refus (facultatif)" />
            <Button
              size="sm"
              variant="outline"
              loading={busy === "/refuser"}
              disabled={busy !== null && busy !== "/refuser"}
              onClick={async () => {
                const el = document.getElementById("motif-refus") as HTMLTextAreaElement | null;
                if (await action("/refuser", { motif: el?.value || undefined })) {
                  toast({ title: "Refus enregistré" });
                  router.refresh();
                }
              }}
            >
              Refuser de signer
            </Button>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
