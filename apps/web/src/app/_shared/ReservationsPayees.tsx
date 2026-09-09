"use client";

// LES ATELIERS DÉJÀ PAYÉS EN LIGNE.
//
// Séparés des réservations classiques à dessein : ici l'argent est DÉJÀ chez
// l'intervenant. Ce qui reste à faire n'est donc pas « accepter ou décliner »,
// mais « confirmer la date, ou rendre l'argent ». Deux gestes seulement, et le
// second est irréversible — il part réellement chez le prestataire de paiement.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export type StatutReservation =
  | "PAYEE"
  | "CONFIRMEE"
  | "REALISEE"
  | "ANNULEE"
  | "REMBOURSEE";

export interface ReservationPayee {
  id: string;
  email: string;
  nom: string | null;
  telephone: string | null;
  organisation: string | null;
  message: string | null;
  dateSouhaitee: string | null;
  creneau: string | null;
  participants: number | null;
  montantCents: number;
  statut: StatutReservation;
  annulationTexte: string | null;
  noteInterne: string | null;
  rembourseeAt: string | null;
  montantRembourseCents: number | null;
  createdAt: string;
  service: { id: string; title: string } | null;
}

const LIBELLE: Record<StatutReservation, string> = {
  PAYEE: "Payée, date à confirmer",
  CONFIRMEE: "Date confirmée",
  REALISEE: "Atelier réalisé",
  ANNULEE: "Annulée",
  REMBOURSEE: "Remboursée",
};

const euros = (c: number) => (c / 100).toFixed(2).replace(".", ",") + " €";

export function ReservationsPayees({
  initiales,
  accountId,
}: {
  initiales: ReservationPayee[];
  accountId: string;
}) {
  const { toast } = useToast();
  const [liste, setListe] = useState(initiales);
  const [occupe, setOccupe] = useState<string | null>(null);
  const [aRembourser, setARembourser] = useState<string | null>(null);

  function remplacer(maj: ReservationPayee) {
    setListe((l) => l.map((r) => (r.id === maj.id ? { ...r, ...maj } : r)));
  }

  async function changer(id: string, corps: Record<string, unknown>) {
    setOccupe(id);
    try {
      const maj = await apiRequest<ReservationPayee>(`/ateliers/reservations/${id}`, {
        method: "PATCH",
        accountId,
        body: corps,
      });
      remplacer(maj);
    } catch (err) {
      toast({
        title: "Impossible pour le moment",
        description: err instanceof Error ? err.message : "Réessayez.",
        variant: "error",
      });
    } finally {
      setOccupe(null);
    }
  }

  async function rembourser(id: string) {
    setOccupe(id);
    try {
      const maj = await apiRequest<ReservationPayee>(`/ateliers/reservations/${id}/rembourser`, {
        method: "POST",
        accountId,
        body: {},
      });
      remplacer(maj);
      setARembourser(null);
      toast({
        title: "Remboursement envoyé",
        description: "La somme est reprise sur votre compte et rendue à l’acheteur.",
      });
    } catch (err) {
      toast({
        title: "Remboursement impossible",
        description: err instanceof Error ? err.message : "Réessayez.",
        variant: "error",
      });
    } finally {
      setOccupe(null);
    }
  }

  if (liste.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun atelier payé en ligne pour l’instant. Le règlement immédiat s’ouvre fiche par
        fiche, depuis la fiche elle-même.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {liste.map((r) => {
        const date = r.dateSouhaitee
          ? new Date(r.dateSouhaitee).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : null;
        const fini = r.statut === "REMBOURSEE" || r.statut === "ANNULEE";

        return (
          <div key={r.id} className="space-y-3 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {r.service?.title ?? "Atelier"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.nom || "Sans nom"} · {r.email}
                  {r.telephone ? ` · ${r.telephone}` : ""}
                  {r.organisation ? ` · ${r.organisation}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {date ? `Date souhaitée : ${date}` : "Date à convenir"}
                  {r.creneau ? ` · ${r.creneau}` : ""}
                  {r.participants ? ` · ${r.participants} participant${r.participants > 1 ? "s" : ""}` : ""}
                </p>
                {r.message ? (
                  <p className="max-w-prose whitespace-pre-line rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                    {r.message}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold text-foreground">{euros(r.montantCents)}</p>
                <Badge variant="outline" className="mt-1">
                  {LIBELLE[r.statut]}
                </Badge>
                {r.montantRembourseCents ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {euros(r.montantRembourseCents)} rendus
                  </p>
                ) : null}
              </div>
            </div>

            {!fini ? (
              <div className="flex flex-wrap items-center gap-2">
                {r.statut === "PAYEE" ? (
                  <Button
                    size="sm"
                    disabled={occupe === r.id}
                    onClick={() => void changer(r.id, { statut: "CONFIRMEE" })}
                  >
                    Confirmer la date
                  </Button>
                ) : null}
                {r.statut === "CONFIRMEE" ? (
                  <Button
                    size="sm"
                    disabled={occupe === r.id}
                    onClick={() => void changer(r.id, { statut: "REALISEE" })}
                  >
                    Marquer comme réalisé
                  </Button>
                ) : null}
                {aRembourser === r.id ? (
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {euros(r.montantCents)} seront repris sur votre compte et rendus. Sans
                      retour possible.
                    </span>
                    <Button
                      size="sm"
                      variant="destructive"
                      disabled={occupe === r.id}
                      onClick={() => void rembourser(r.id)}
                    >
                      {occupe === r.id ? "Envoi…" : "Confirmer le remboursement"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setARembourser(null)}>
                      Non
                    </Button>
                  </span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={occupe === r.id}
                    onClick={() => setARembourser(r.id)}
                  >
                    Rembourser
                  </Button>
                )}
              </div>
            ) : null}

            <Textarea
              rows={2}
              defaultValue={r.noteInterne ?? ""}
              placeholder="Votre note sur cette réservation. Jamais montrée à l’acheteur."
              onBlur={(e) => {
                if (e.target.value !== (r.noteInterne ?? "")) {
                  void changer(r.id, { noteInterne: e.target.value });
                }
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
