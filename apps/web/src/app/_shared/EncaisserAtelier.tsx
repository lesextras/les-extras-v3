"use client";

// ENCAISSER SON ATELIER EN LIGNE — la carte que voit l'intervenant sur SA fiche.
//
// L'option ne s'allume que si quatre choses sont réunies. Plutôt que de refuser
// au moment du clic, on affiche la liste dès l'arrivée : quelqu'un qui voit ce
// qui manque peut le régler ; quelqu'un qui se prend un refus abandonne.
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { AlertCircle, CheckCircle2, CreditCard } from "lucide-react";

interface Conditions {
  paiementEnLigne: boolean;
  annulationTexte: string | null;
  /** Vrai tant que l'intervenant n'a pas écrit les siennes. */
  annulationParDefaut?: boolean;
  prixCents: number;
  manques: string[];
  possible: boolean;
}

export function EncaisserAtelier({
  serviceId,
  accountId,
}: {
  serviceId: string;
  accountId: string;
}) {
  const { toast } = useToast();
  const [etat, setEtat] = useState<Conditions | null>(null);
  const [texte, setTexte] = useState("");
  const [occupe, setOccupe] = useState(false);
  const [echec, setEchec] = useState(false);

  const charger = useCallback(async () => {
    try {
      const c = await apiRequest<Conditions>(`/ateliers/${serviceId}/paiement`, { accountId });
      setEtat(c);
      setTexte(c.annulationTexte ?? "");
    } catch {
      // Une fiche qui n'est pas un atelier n'a pas de réglage de paiement :
      // ce n'est pas une panne, la carte disparaît, c'est tout.
      setEchec(true);
    }
  }, [serviceId, accountId]);

  useEffect(() => {
    void charger();
  }, [charger]);

  async function enregistrer(paiementEnLigne?: boolean) {
    setOccupe(true);
    try {
      const c = await apiRequest<Conditions>(`/ateliers/${serviceId}/paiement`, {
        method: "PATCH",
        accountId,
        body: { annulationTexte: texte, ...(paiementEnLigne !== undefined ? { paiementEnLigne } : {}) },
      });
      setEtat(c);
      toast({
        title: c.paiementEnLigne
          ? "Le règlement en ligne est ouvert sur cette fiche"
          : "Enregistré",
      });
    } catch (err) {
      toast({
        title: "Impossible pour le moment",
        description: err instanceof Error ? err.message : "Réessayez.",
        variant: "error",
      });
    } finally {
      setOccupe(false);
    }
  }

  if (echec || !etat) return null;

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <CreditCard className="size-3.5" /> Encaisser en ligne
        </p>

        <p className="text-sm text-muted-foreground">
          Une personne sans compte peut régler cet atelier depuis sa fiche publique. L&apos;argent
          arrive <span className="font-medium text-foreground">sur votre compte</span>, pas sur
          celui de la plateforme : c&apos;est votre nom sur le relevé de l&apos;acheteur, et
          c&apos;est vous qui remboursez si l&apos;atelier n&apos;a pas lieu. La demande de devis
          reste affichée dans tous les cas.
        </p>

        {etat.possible ? (
          <p className="flex items-start gap-2 text-sm text-foreground">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            {etat.paiementEnLigne
              ? "Le règlement en ligne est ouvert sur cette fiche."
              : "Tout est prêt : vous pouvez l’ouvrir."}
          </p>
        ) : (
          <div className="space-y-1.5 rounded-lg bg-muted p-3">
            <p className="flex items-center gap-2 text-sm font-medium text-foreground">
              <AlertCircle className="size-4 shrink-0" /> Il manque encore :
            </p>
            <ul className="list-disc space-y-1 pl-8 text-xs text-muted-foreground">
              {etat.manques.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}

        <label className="grid gap-1 text-xs text-muted-foreground">
          Vos conditions d&apos;annulation
          <Textarea
            rows={5}
            value={texte}
            onChange={(e) => setTexte(e.target.value)}
          />
          <span>
            {etat.annulationParDefaut
              ? "Ce texte vous est proposé : gardez-le tel quel, ou réécrivez-le à votre façon. Il devient le vôtre dès que vous ouvrez le règlement en ligne."
              : "Ce sont vos conditions, telles que vous les avez écrites."}{" "}
            Elles s&apos;affichent avant le bouton de paiement et sont recopiées dans le reçu de
            l&apos;acheteur. On ne prend pas l&apos;argent de quelqu&apos;un sans lui avoir dit à
            quelles conditions il le récupère.
          </span>
        </label>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={occupe} onClick={() => void enregistrer()}>
            Enregistrer
          </Button>
          {etat.paiementEnLigne ? (
            <Button variant="outline" size="sm" disabled={occupe} onClick={() => void enregistrer(false)}>
              Fermer le règlement en ligne
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={occupe || !etat.possible}
              onClick={() => void enregistrer(true)}
            >
              Ouvrir le règlement en ligne
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
