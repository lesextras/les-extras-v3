"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import type { Service } from "@/app/_shared/types";
import type { EtatStripe } from "./page";

interface Conditions {
  paiementEnLigne: boolean;
  annulationTexte: string;
  annulationParDefaut: boolean;
  prixCents: number;
  manques: string[];
  possible: boolean;
}

export function Encaissement({
  etat,
  fiches,
}: {
  etat: EtatStripe | null;
  fiches: Service[];
}) {
  const { toast } = useToast();
  const [travail, setTravail] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  // Stripe renvoie la personne ici même, une fois le dossier rempli.
  async function partir(chemin: string, quoi: string) {
    setTravail(quoi);
    setErreur(null);
    try {
      const r = await apiRequest<{ url: string }>(chemin, {
        method: "POST",
        body: { retour: `${window.location.origin}/dashboard/encaissement` },
      });
      window.location.href = r.url;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Opération impossible.");
      setTravail(null);
    }
  }
  const relie = etat?.relie ?? false;
  const pret = etat?.pret ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Mon encaissement</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reliez un compte pour être payé directement, puis choisissez les fiches
          qui acceptent la carte. Le devis et la facture ne changent pas : le
          paiement en ligne ajoute un chemin, il n’en remplace aucun.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-foreground">Compte d’encaissement</p>
            <span className="text-sm text-muted-foreground">
              {pret ? "Prêt" : relie ? "Dossier à terminer" : "Non relié"}
            </span>
          </div>

          {!relie ? (
            <p className="text-sm text-muted-foreground">
              Tant qu’aucun compte n’est relié, personne ne peut vous régler par
              carte. Votre dossier d’identité — pièce, IBAN — se remplit
              entièrement chez Stripe : ni cette page ni Les Extras ne voient ces
              informations, et aucun mot de passe ne se tape ici.
            </p>
          ) : null}

          {relie && !pret && etat && etat.aFournir.length > 0 ? (
            <div className="space-y-1">
              <p className="text-sm text-foreground">Il manque encore :</p>
              <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                {enFrancais(etat.aFournir).map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {etat ? (
            <p className="text-xs text-muted-foreground">
              Commission Les Extras sur une vente en ligne :{" "}
              {etat.commissionVentePourcent} %.
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => partir("/paiements/stripe/lier", "lier")}
              disabled={travail !== null}
            >
              {travail === "lier"
                ? "Ouverture…"
                : relie
                  ? "Terminer mon dossier"
                  : "Relier mon compte"}
            </Button>
            {relie ? (
              <Button
                variant="outline"
                onClick={() => partir("/paiements/stripe/tableau-de-bord", "tdb")}
                disabled={travail !== null}
              >
                {travail === "tdb" ? "Ouverture…" : "Gérer chez Stripe"}
              </Button>
            ) : null}
          </div>

          {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
        </CardContent>
      </Card>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Mes fiches</h2>
        {fiches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Vous n’avez pas encore de fiche publiée.
          </p>
        ) : (
          fiches.map((f) => <LigneFiche key={f.id} fiche={f} toast={toast} />)
        )}
      </div>
    </div>
  );
}

/**
 * UNE FICHE ET SON RÉGLAGE.
 *
 * Les conditions ne se chargent qu’à l’ouverture : une personne qui a quinze
 * fiches ne déclenche pas quinze appels pour en régler une.
 */
function LigneFiche({
  fiche,
  toast,
}: {
  fiche: Service;
  toast: ReturnType<typeof useToast>["toast"];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, setEtat] = useState<Conditions | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function charger() {
    setOccupe(true);
    setErreur(null);
    try {
      setEtat(await apiRequest<Conditions>(`/ateliers/${fiche.id}/paiement`));
      setOuvert(true);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Lecture impossible.");
    } finally {
      setOccupe(false);
    }
  }

  async function enregistrer(corps: Record<string, unknown>, mot: string) {
    setOccupe(true);
    setErreur(null);
    try {
      setEtat(
        await apiRequest<Conditions>(`/ateliers/${fiche.id}/paiement`, {
          method: "PATCH",
          body: corps,
        }),
      );
      toast({ title: mot });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
    } finally {
      setOccupe(false);
    }
  }
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{fiche.title}</p>
            {etat ? (
              <p className="text-xs text-muted-foreground">
                {etat.paiementEnLigne
                  ? "Paiement en ligne actif"
                  : "Paiement en ligne inactif"}
              </p>
            ) : null}
          </div>
          {!ouvert ? (
            <Button variant="outline" size="sm" onClick={charger} disabled={occupe}>
              {occupe ? "…" : "Régler le paiement"}
            </Button>
          ) : null}
        </div>

        {ouvert && etat ? (
          <div className="space-y-3 border-t border-border pt-3">
            {etat.manques.length > 0 ? (
              <div className="space-y-1">
                <p className="text-sm text-foreground">
                  Avant d’encaisser sur cette fiche :
                </p>
                <ul className="list-disc space-y-0.5 pl-5 text-sm text-muted-foreground">
                  {etat.manques.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Conditions d’annulation
              </p>
              <p className="text-xs text-muted-foreground">
                {etat.annulationParDefaut
                  ? "Proposition par défaut. Gardée telle quelle, elle vous engage."
                  : "Vos conditions, telles que l’acheteur les lira."}
              </p>
              <Textarea
                defaultValue={etat.annulationTexte}
                rows={3}
                onBlur={(e) => {
                  const v = e.currentTarget.value;
                  if (v.trim() !== etat.annulationTexte.trim()) {
                    void enregistrer({ annulationTexte: v }, "Conditions enregistrées");
                  }
                }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {etat.paiementEnLigne ? (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={occupe}
                  onClick={() =>
                    enregistrer({ paiementEnLigne: false }, "Paiement en ligne désactivé")
                  }
                >
                  Désactiver le paiement en ligne
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={occupe || !etat.possible}
                  onClick={() =>
                    enregistrer({ paiementEnLigne: true }, "Paiement en ligne activé")
                  }
                >
                  Activer le paiement en ligne
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setOuvert(false)}>
                Fermer
              </Button>
            </div>
          </div>
        ) : null}

        {erreur ? <p className="text-sm text-destructive">{erreur}</p> : null}
      </CardContent>
    </Card>
  );
}

/**
 * CE QUE STRIPE RÉCLAME, DIT EN FRANÇAIS.
 *
 * L’API renvoie des codes de champs — `representative.dob.day`,
 * `tos_acceptance.date` — qui ne veulent rien dire pour un éducateur. On
 * regroupe par famille et on nomme la famille : la personne sait quoi préparer
 * avant d’ouvrir Stripe, sans lire une nomenclature.
 */
function enFrancais(codes: string[]): string[] {
  const familles: Array<[RegExp, string]> = [
    [/^external_account/, "Un IBAN pour recevoir les versements"],
    [/^(representative|individual|person)\.(dob|first_name|last_name)/, "L’identité du représentant : nom, date de naissance"],
    [/^(representative|individual|person)\.(address|phone|email)/, "Les coordonnées du représentant : adresse, téléphone, courriel"],
    [/^(representative|individual|person)\.verification/, "Une pièce d’identité"],
    [/^business_profile/, "L’activité : secteur et site ou description"],
    [/^business_type/, "Le statut : auto-entrepreneur, société, association"],
    [/^company/, "Les informations de la structure : SIRET, adresse"],
    [/^tos_acceptance/, "L’acceptation des conditions Stripe"],
  ];
  const vus = new Set<string>();
  for (const code of codes) {
    const f = familles.find(([re]) => re.test(code));
    vus.add(f ? f[1] : code);
  }
  return [...vus];
}
