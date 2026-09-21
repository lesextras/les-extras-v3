"use client";

// RÉGLER UN ATELIER EN LIGNE, sans compte.
//
// Ce chemin S'AJOUTE au devis et à la réservation par compte : il ne remplace
// rien. Il existe pour les acheteurs qui ne demanderont jamais de devis — une
// petite structure, une association, une famille — et qui repartent si on leur
// demande de créer un compte ou d'attendre 48 h.
//
// TROIS CHOSES SONT DITES ICI, AVANT LE BOUTON, ET PAS APRÈS : qui encaisse
// (l'intervenant, pas la plateforme), que la date reste un souhait tant qu'elle
// n'est pas confirmée, et ce qui se passe en cas d'annulation. Les trois sont
// des promesses qu'on ne peut pas tenir si on les écrit après le paiement.
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2, CreditCard, Info } from "lucide-react";

interface Confirmation {
  paye: boolean;
  atelier?: string;
  email?: string;
  montantCents?: number;
  dateSouhaitee?: string | null;
  creneau?: string | null;
  participants?: number | null;
  annulationTexte?: string | null;
}

const euros = (c: number) => (c / 100).toFixed(2).replace(".", ",") + " €";

export function PaiementAtelier({
  serviceId,
  titre,
  intervenant,
  prix,
  maxParticipants,
  creneaux,
  annulationTexte,
  depuis = "fiche",
}: {
  serviceId: string;
  titre: string;
  intervenant: string;
  /** En euros, tel qu'affiché sur la fiche. */
  prix: number;
  maxParticipants?: number | null;
  creneaux?: string[] | null;
  annulationTexte?: string | null;
  /**
   * D'OÙ ON PART, pour savoir où revenir après le paiement.
   *
   * Deux valeurs seulement, et le serveur les traduit lui-même en adresses :
   * on ne lui envoie jamais une URL de retour choisie par le navigateur, sans
   * quoi n'importe qui pourrait renvoyer un acheteur ailleurs après paiement.
   */
  depuis?: "fiche" | "espace";
}) {
  const { toast } = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [confirme, setConfirme] = useState<Confirmation | null>(null);
  const [annule, setAnnule] = useState(false);

  /**
   * AU RETOUR DU PRESTATAIRE DE PAIEMENT.
   *
   * On ne croit pas l'adresse sur parole : `?paiement=succes` se tape à la
   * main. C'est le serveur qui relit le paiement et décide. Tant qu'il n'a pas
   * répondu, rien n'est annoncé.
   */
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("paiement") === "annule") {
      setAnnule(true);
      return;
    }
    const session = p.get("session");
    if (p.get("paiement") !== "succes" || !session) return;

    let vivant = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/proxy/public/ateliers/${encodeURIComponent(serviceId)}/confirmer/${encodeURIComponent(session)}`,
          { method: "POST" },
        );
        if (!res.ok) throw new Error();
        const data = (await res.json()) as Confirmation;
        if (vivant && data.paye) setConfirme(data);
      } catch {
        if (vivant) {
          toast({
            title: "Paiement en cours de vérification",
            description:
              "Si la somme a été débitée, vous recevez un e-mail de confirmation. Sinon, rien n'a été prélevé.",
          });
        }
      }
    })();
    return () => {
      vivant = false;
    };
  }, [serviceId, toast]);

  async function payer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnvoi(true);
    try {
      const res = await fetch(`/api/proxy/public/ateliers/${encodeURIComponent(serviceId)}/payer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: f.get("email"),
          nom: f.get("nom") || undefined,
          telephone: f.get("telephone") || undefined,
          organisation: f.get("organisation") || undefined,
          message: f.get("message") || undefined,
          dateSouhaitee: f.get("dateSouhaitee") || undefined,
          creneau: f.get("creneau") || undefined,
          participants: f.get("participants") ? Number(f.get("participants")) : undefined,
          depuis,
        }),
      });
      const data = (await res.json().catch(() => null)) as { url?: string; message?: string } | null;
      if (!res.ok || !data?.url) {
        throw new Error(data?.message ?? "Le paiement n'a pas pu être ouvert.");
      }
      window.location.href = data.url;
    } catch (err) {
      setEnvoi(false);
      toast({
        title: "Paiement impossible",
        description:
          err instanceof Error ? err.message : "Réessayez, ou passez par la demande de devis.",
        variant: "error",
      });
    }
  }

  if (confirme?.paye) {
    return (
      <Card className="border-primary/40">
        <CardContent className="space-y-3 p-5">
          <p className="flex items-center gap-2 font-semibold text-foreground">
            <CheckCircle2 className="size-5 text-primary" /> Votre réservation est enregistrée
          </p>
          <p className="text-sm text-muted-foreground">
            {confirme.montantCents ? `${euros(confirme.montantCents)} réglés. ` : null}
            Un reçu part sur {confirme.email}. {intervenant} vous recontacte pour caler la date.
          </p>
          {confirme.annulationTexte ? (
            <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">En cas d&apos;annulation : </span>
              {confirme.annulationTexte}
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {annule ? (
        <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          Paiement abandonné : rien n&apos;a été prélevé.
        </p>
      ) : null}

      {!ouvert ? (
        <>
          <Button className="w-full" onClick={() => setOuvert(true)}>
            <CreditCard className="size-4" /> Réserver et payer en ligne
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {euros(Math.round(prix * 100))} réglés directement à {intervenant}. Sans compte à créer.
          </p>
        </>
      ) : (
        <form onSubmit={payer} className="space-y-3 rounded-xl border border-border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="nom" placeholder="Votre nom" autoComplete="name" />
            <Input name="email" type="email" required placeholder="Votre e-mail" autoComplete="email" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="telephone" placeholder="Téléphone (facultatif)" autoComplete="tel" />
            <Input name="organisation" placeholder="Structure (facultatif)" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs text-muted-foreground">
              Date souhaitée
              <Input name="dateSouhaitee" type="date" />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Participants
              <Input
                name="participants"
                type="number"
                min={1}
                max={maxParticipants ?? 500}
                placeholder={maxParticipants ? `${maxParticipants} maximum` : "Nombre"}
              />
            </label>
          </div>
          {creneaux && creneaux.length > 0 ? (
            <label className="grid gap-1 text-xs text-muted-foreground">
              Créneau
              <select
                name="creneau"
                className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                defaultValue=""
              >
                <option value="">Peu importe</option>
                {creneaux.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Textarea
            name="message"
            rows={3}
            placeholder="Public accueilli, objectifs, contraintes…"
          />

          {/* Ce que l'acheteur doit savoir AVANT de sortir sa carte. */}
          <div className="space-y-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="flex gap-2">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Le règlement est encaissé par <span className="font-medium text-foreground">{intervenant}</span>,
                qui assure l&apos;atelier. C&apos;est son nom qui apparaîtra sur votre relevé.
              </span>
            </p>
            <p className="pl-[22px]">
              La date reste un souhait tant que {intervenant} ne l&apos;a pas confirmée : cette
              fiche n&apos;a pas d&apos;agenda en ligne.
            </p>
            {annulationTexte ? (
              <p className="pl-[22px]">
                <span className="font-medium text-foreground">En cas d&apos;annulation : </span>
                {annulationTexte}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={envoi}>
            {envoi ? "Ouverture du paiement…" : `Payer ${euros(Math.round(prix * 100))}`}
          </Button>
          <button
            type="button"
            onClick={() => setOuvert(false)}
            className="w-full text-center text-xs text-muted-foreground underline underline-offset-4"
          >
            Annuler
          </button>
        </form>
      )}
    </div>
  );
}
