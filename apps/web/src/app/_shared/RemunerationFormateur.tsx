"use client";

// LA SECONDE FACTURE D'UNE FORMATION.
//
// Une formation vendue en met deux en jeu : l'organisme facture
// l'établissement qui inscrit, puis le formateur facture à l'organisme la
// prestation qu'il a assurée. Seule la première existait à l'écran.
//
// Le bloc a deux visages, et un seul est montré à la fois :
//   — côté ORGANISME, on fixe le montant convenu avec le formateur ;
//   — côté FORMATEUR, on lit ce montant et on émet sa propre facture.
//
// Le formateur émet sous SON SIRET, depuis SON compte : la plateforme met le
// document en forme, elle ne facture au nom de personne. C'est aussi pour cela
// que le bouton n'apparaît jamais côté organisme, même s'il connaît le montant.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { FactureActions } from "./FactureActions";
import type { InvoiceStatus } from "./types";

const euros = (v: number) =>
  v.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export function RemunerationFormateur({
  sessionId,
  accountId,
  montant,
  facture,
  peutFixer,
  estFormateur,
  formateur,
  interne,
}: {
  sessionId: string;
  accountId: string;
  /** Rémunération déjà fixée, hors taxes. `null` si rien n'est convenu. */
  montant: number | null;
  facture: { id: string; number?: string | null; status: InvoiceStatus; accountId: string } | null;
  /** L'organisme ou l'établissement hôte : eux seuls fixent le montant. */
  peutFixer: boolean;
  estFormateur: boolean;
  formateur: string | null;
  /** Formation interne : le formateur est salarié, sa rémunération est en paie. */
  interne: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [valeur, setValeur] = useState(montant != null ? String(montant) : "");
  const [enregistre, setEnregistre] = useState(montant);
  const [creee, setCreee] = useState(facture);

  // Une formation interne ne donne lieu à aucun achat de prestation : le
  // formateur est salarié de la structure, il est payé par la paie. Afficher
  // un bloc de facturation ici induirait en erreur.
  if (interne) return null;

  async function fixer() {
    const n = Number(valeur.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) {
      toast({ title: "Montant invalide", variant: "error" });
      return;
    }
    setBusy(true);
    try {
      await apiRequest(`/formations/sessions/${sessionId}`, {
        method: "PATCH",
        accountId,
        body: { trainerFeeHt: Math.round(n * 100) / 100 },
      });
      setEnregistre(Math.round(n * 100) / 100);
      toast({
        title: "Rémunération enregistrée",
        description: "Le formateur peut désormais vous adresser sa facture.",
      });
      router.refresh();
    } catch (err) {
      toast({
        title: "Enregistrement impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  async function facturer() {
    setBusy(true);
    try {
      const inv = await apiRequest<{ id: string; number?: string; status: InvoiceStatus }>(
        `/formations/sessions/${sessionId}/trainer-invoice`,
        { method: "POST", accountId, body: {} },
      );
      if (inv?.id) {
        setCreee({
          id: inv.id,
          number: inv.number ?? null,
          status: inv.status ?? "DRAFT",
          accountId,
        });
      }
      toast({
        title: "Facture créée",
        description: inv?.number
          ? `N° ${inv.number} — en brouillon, à votre nom. Émettez-la pour l'adresser à l'organisme.`
          : "En brouillon, à votre nom. Émettez-la pour l'adresser à l'organisme.",
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
    <Card>
      <CardHeader>
        <h3 className="font-semibold text-foreground">Rémunération du formateur</h3>
        <p className="text-xs text-muted-foreground">
          {peutFixer
            ? "Ce que vous achetez au formateur, distinct du prix vendu à l’établissement. C’est ce montant qu’il vous facturera."
            : "Le montant convenu avec l’organisme pour cette session. Vous facturez sous votre propre SIRET."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {formateur ? (
          <p className="text-sm text-foreground">
            Formateur : <span className="font-medium">{formateur}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun formateur désigné sur cette session.</p>
        )}

        {peutFixer ? (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs text-muted-foreground">
              Montant HT
              <Input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={valeur}
                onChange={(e) => setValeur(e.target.value)}
                className="mt-1 w-40"
                placeholder="0,00"
              />
            </label>
            <Button size="sm" onClick={fixer} disabled={busy}>
              {busy ? "…" : "Enregistrer"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-foreground">
            {enregistre != null && enregistre > 0 ? (
              <span className="text-lg font-bold tabular-nums">{euros(enregistre)} HT</span>
            ) : (
              <span className="text-muted-foreground">
                Aucune rémunération fixée pour l’instant : l’organisme doit la renseigner avant que
                vous puissiez la facturer.
              </span>
            )}
          </p>
        )}

        {/* Le geste de facturation n'existe QUE pour le formateur. L'organisme
            ne peut pas établir la facture de son prestataire : ce serait de
            l'autofacturation, qui suppose un mandat écrit que personne n'a
            signé ici. */}
        {estFormateur ? (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
            {!creee ? (
              <Button
                size="sm"
                onClick={facturer}
                disabled={busy || !(enregistre != null && enregistre > 0)}
              >
                {busy ? "…" : "Facturer ma prestation"}
              </Button>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">
                  {creee.number ? `Facture ${creee.number}` : "Facture créée"}
                </span>
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
                  estEmetteur={creee.accountId === accountId}
                  compact
                />
              </>
            )}
          </div>
        ) : creee ? (
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            Le formateur a émis sa facture{creee.number ? ` (${creee.number})` : ""} ; vous la
            retrouvez dans Devis &amp; factures.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
