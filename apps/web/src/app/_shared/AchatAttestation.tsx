"use client";

// ACHETER SON ATTESTATION DE SUIVI — sans compte, depuis la fiche du parcours.
//
// ⚠⚠ AUCUNE CONNEXION N'EST DEMANDÉE, ET C'EST STRUCTUREL. Les parcours
// gratuits se suivent sur la plateforme pédagogique de l'association : on y
// arrive par le bouton de la fiche, sans jamais créer de compte Les Extras.
// Exiger une inscription pour acheter le document qui atteste du parcours
// qu'on vient de finir ferait abandonner presque tout le monde — et il n'y a
// rien à rattacher : l'attestation nomme une personne, elle n'ouvre aucun accès.
//
// ⚠ LE BOUTON N'EXISTE QUE SI LA FICHE PORTE UN PRIX. Tant que
// `Formation.attestationPrixCents` est nul, ce composant n'est pas monté : la
// vente est fermée côté serveur ET côté écran, et la fiche se lit comme avant.
import { useState } from "react";
import { BadgeCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/api";

export function AchatAttestation({
  formation,
  prixCents,
}: {
  /** Identifiant ou adresse lisible de la formation. */
  formation: string;
  prixCents: number;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [renonce, setRenonce] = useState(false);

  const prix = (prixCents / 100).toFixed(2).replace(".", ",");

  async function commander(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setMessage(null);
    const fd = new FormData(e.currentTarget);
    setEnvoi(true);
    try {
      const r = await apiRequest<{ url?: string; deja?: boolean; message?: string }>(
        "/attestations",
        {
          method: "POST",
          body: {
            formation,
            email: String(fd.get("email") || "").trim(),
            prenom: String(fd.get("prenom") || "").trim(),
            nom: String(fd.get("nom") || "").trim(),
            renonciationRetractation: renonce,
          },
        },
      );
      // Une commande déjà payée ne repart pas en paiement : on dit où elle en est.
      if (r?.deja) {
        setMessage(r.message ?? "Votre commande est déjà enregistrée.");
        return;
      }
      if (r?.url) window.location.href = r.url;
    } catch (err) {
      setErreur(
        err instanceof Error
          ? err.message
          : "La commande n’a pas pu être ouverte. Réessayez dans un instant.",
      );
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <BadgeCheck />
          Demander mon attestation ({prix} €)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Attestation de suivi</DialogTitle>
          <DialogDescription lang="fr">
            Un document nominatif qui atteste que vous avez suivi ce parcours.
            Il est établi au nom que vous indiquez ici.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={commander} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="att-prenom" required>
                Prénom
              </Label>
              <Input id="att-prenom" name="prenom" required maxLength={80} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="att-nom" required>
                Nom
              </Label>
              <Input id="att-nom" name="nom" required maxLength={80} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="att-email" required>
              Adresse e-mail
            </Label>
            <Input id="att-email" name="email" type="email" required maxLength={180} />
            <p className="text-xs text-muted-foreground">
              C’est à cette adresse que l’attestation sera envoyée.
            </p>
          </div>

          {/*
            ⚠⚠ LA CASE EST DÉCOCHÉE, ET ELLE DOIT LE RESTER. Le droit de
            rétractation de quatorze jours ne s'éteint que sur demande EXPRESSE
            d'exécution immédiate (art. L221-25 et L221-28, 1° c. conso). Une
            case pré-cochée n'est pas une demande : la renonciation serait
            inopposable, et la pré-cocher serait exactement le procédé que la
            loi vise.
          */}
          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-muted/40 p-3">
            <input
              type="checkbox"
              checked={renonce}
              onChange={(e) => setRenonce(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 border-input text-primary"
            />
            <span className="text-xs leading-relaxed text-muted-foreground" lang="fr">
              Je demande à recevoir mon attestation <strong>sans attendre</strong> et je
              reconnais qu’en le demandant, je renonce à mon droit de rétractation de
              quatorze jours. Sans cette demande, l’attestation est envoyée à l’issue de
              ce délai.
            </span>
          </label>

          <div className="rounded-lg border border-border p-3 text-xs leading-relaxed text-muted-foreground" lang="fr">
            <p>
              <strong className="text-foreground">Ce que c’est :</strong> une attestation
              de suivi, délivrée sous quinze jours ouvrés. Une erreur sur votre nom se
              rectifie sans frais.
            </p>
            <p className="mt-1.5">
              <strong className="text-foreground">Ce que ce n’est pas :</strong> ni
              diplôme, ni certification professionnelle. Elle ne confère aucun titre et
              n’ouvre aucun droit à exercer.
            </p>
          </div>

          {erreur ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {erreur}
            </p>
          ) : null}
          {message ? (
            <p className="rounded-lg border border-primary/40 bg-primary-soft/40 p-3 text-sm">
              {message}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={envoi} className="w-full">
              {envoi ? <Loader2 className="animate-spin" /> : null}
              Payer {prix} €
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
