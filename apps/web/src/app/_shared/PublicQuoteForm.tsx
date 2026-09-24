"use client";

// Demande de devis SANS COMPTE. Exiger une inscription avant le premier contact
// fait perdre l'essentiel des demandes : on prend les coordonnées, on qualifie après.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2 } from "lucide-react";

const CHAMPS: {
  name: string;
  label: string;
  requis?: boolean;
  type?: string;
  inputMode?: "text" | "email" | "tel" | "numeric";
  autoComplete?: string;
  exemple?: string;
}[] = [
  { name: "name", label: "Nom et prénom", requis: true, autoComplete: "name" },
  { name: "email", label: "E-mail", requis: true, type: "email", inputMode: "email", autoComplete: "email" },
  { name: "phone", label: "Téléphone", type: "tel", inputMode: "tel", autoComplete: "tel" },
  { name: "organization", label: "Structure", autoComplete: "organization", exemple: "MECS, IME…" },
  { name: "role", label: "Votre fonction", autoComplete: "organization-title" },
  { name: "city", label: "Ville", autoComplete: "address-level2" },
  { name: "desiredDate", label: "Période souhaitée", exemple: "Novembre, un mardi" },
  { name: "participants", label: "Nombre de participants", inputMode: "numeric" },
];

export function PublicQuoteForm({
  serviceId,
  formationSlug,
  titre,
  principal = false,
}: {
  serviceId?: string;
  formationSlug?: string;
  titre: string;
  /**
   * Rend le déclencheur en bouton PLEIN plutôt qu'en bouton bordé.
   *
   * Sur une fiche publique, c'est ce chemin-là qui doit être le premier :
   * l'accueil promet « sans compte, sans engagement », et proposer d'abord
   * « Réserver » — qui redirige vers la connexion — contredit la promesse au
   * moment précis où le visiteur allait agir.
   */
  principal?: boolean;
}) {
  const { toast } = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);

  async function soumettre(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setEnvoi(true);
    try {
      const res = await fetch("/api/proxy/public/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId,
          formationSlug,
          name: f.get("name"),
          email: f.get("email"),
          phone: f.get("phone") || undefined,
          organization: f.get("organization") || undefined,
          role: f.get("role") || undefined,
          city: f.get("city") || undefined,
          desiredDate: f.get("desiredDate") || undefined,
          participants: f.get("participants") || undefined,
          message: f.get("message"),
          website: f.get("website") || undefined,
        }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        throw new Error(
          Array.isArray(d.message) ? d.message[0] : (d.message ?? "Envoi impossible"),
        );
      }
      setEnvoye(true);
    } catch (err) {
      toast({ title: "Envoi impossible", description: (err as Error).message });
    } finally {
      setEnvoi(false);
    }
  }

  // LE FORMULAIRE S’OUVRE EN POP-UP, PAS DANS LA COLONNE.
  //
  // Déplié sur place, il poussait le prix, la carte de l’intervenant et tout
  // le bas de page vers le bas : on cliquait pour demander un devis et la
  // fiche se réorganisait sous les yeux. En pop-up, la fiche ne bouge pas et
  // le formulaire a la place qu’il lui faut.
  return (
    <Dialog open={ouvert} onOpenChange={setOuvert}>
      <DialogTrigger asChild>
        <Button variant={principal ? "primary" : "outline"} className="w-full">
          Demander un devis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Demander un devis</DialogTitle>
          <DialogDescription>
            {titre} : chiffré sous 48 h, sans engagement, et sans créer de compte.
          </DialogDescription>
        </DialogHeader>
        {envoye ? (
          <div className="space-y-1 py-4 text-center">
            <CheckCircle2 className="mx-auto size-6 text-success" />
            <p className="font-medium text-foreground">Demande envoyée</p>
            <p className="text-sm text-muted-foreground">
              Nous revenons vers vous sous 48 h avec un devis chiffré.
            </p>
          </div>
        ) : (
          <form onSubmit={soumettre} className="relative space-y-3">
          {/* Champ-piège anti-robot : invisible pour un humain, rempli par les bots. */}
          <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
            <label htmlFor="devis-website">Ne pas remplir</label>
            <input id="devis-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          {/* ⚠ UN LIBELLÉ VISIBLE PAR CHAMP (24/09/2026). Les champs n'avaient
              qu'un texte indicatif, qui disparaît dès qu'on tape et que les
              lecteurs d'écran annoncent mal. Chaque champ a son <label>, le
              bon type de clavier et l'autocomplétion. */}
          <div className="grid gap-3 sm:grid-cols-2">
            {CHAMPS.map((c) => (
              <div key={c.name} className="space-y-1">
                <label htmlFor={`devis-${c.name}`} className="text-sm font-medium text-foreground">
                  {c.label}
                  {c.requis ? <span className="text-destructive"> *</span> : null}
                </label>
                <Input
                  id={`devis-${c.name}`}
                  name={c.name}
                  type={c.type ?? "text"}
                  inputMode={c.inputMode}
                  autoComplete={c.autoComplete}
                  required={c.requis}
                  placeholder={c.exemple}
                />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label htmlFor="devis-message" className="text-sm font-medium text-foreground">
              Votre besoin<span className="text-destructive"> *</span>
            </label>
            <Textarea
              id="devis-message"
              name="message"
              required
              rows={4}
              aria-describedby="devis-message-aide"
              placeholder="Le public concerné, vos contraintes, ce que vous attendez de l’atelier."
            />
            <p id="devis-message-aide" className="text-xs text-muted-foreground">
              N’indiquez ni le nom d’une personne accompagnée, ni une information de santé : un
              besoin se décrit sans elles.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Vos coordonnées servent uniquement à traiter cette demande. Aucun compte
            n’est créé, aucune donnée n’est transmise à un tiers.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOuvert(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={envoi}>
              {envoi ? "Envoi…" : "Envoyer ma demande"}
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
