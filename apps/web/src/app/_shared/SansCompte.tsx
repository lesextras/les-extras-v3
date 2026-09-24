"use client";

// L'ÉCRAN D'UNE PERSONNE SANS COMPTE (24/09/2026, « 1 compte = 1 personne »).
//
// Sur Les Extras, un compte appartient à une seule personne. Quelqu'un qui
// accédait jusqu'ici à l'espace d'une autre personne (ancien « salarié »
// rattaché) n'a plus aucun compte : sans cet écran, chaque bloc du tableau de
// bord interrogeait l'API au nom d'un compte vide et affichait une erreur.
//
// ⚠ PAS DE LIEN VERS /register. La personne est déjà inscrite : un second
// formulaire d'inscription avec la même adresse serait refusé. Le compte se
// crée ici, à son nom (`POST /accounts`, dont elle devient titulaire).
//
// ⚠ IL FAUT SE RECONNECTER APRÈS LA CRÉATION. Le jeton de session porte la
// liste des comptes au moment de la connexion ; le nouveau n'y figure qu'au
// jeton suivant. On le dit, et le bouton le fait.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field } from "./form-fields";

type Choix = "ESTABLISHMENT" | "FREELANCE";

const CHOIX: Record<
  Choix,
  { bouton: string; icone: typeof Building2; champ: string; aide: string }
> = {
  ESTABLISHMENT: {
    bouton: "Créer mon compte établissement",
    icone: Building2,
    champ: "Nom de votre établissement",
    aide: "Il fixe l’adresse publique du compte : écrivez-le comme vous le dites (MECS Les Tilleuls).",
  },
  FREELANCE: {
    bouton: "Créer mon compte intervenant",
    icone: UserRound,
    champ: "Sous quel nom exercez-vous ?",
    aide: "C’est ce nom que verront les établissements. Votre nom propre convient très bien.",
  },
};

export function SansCompte({ prenom, nomComplet }: { prenom?: string | null; nomComplet: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [choix, setChoix] = useState<Choix | null>(null);
  const [nom, setNom] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [cree, setCree] = useState(false);

  function choisir(c: Choix) {
    setChoix(c);
    setNom(c === "FREELANCE" ? nomComplet : "");
  }

  async function creer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!choix) return;
    if (nom.trim().length < 2) {
      toast({ title: "Nom manquant", description: "Indiquez le nom du compte.", variant: "error" });
      return;
    }
    setEnvoi(true);
    try {
      await apiRequest("/accounts", { method: "POST", body: { name: nom.trim(), type: choix } });
      setCree(true);
    } catch (err) {
      toast({
        title: "Création impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnvoi(false);
    }
  }

  async function seReconnecter() {
    await fetch("/api/auth/session", { method: "DELETE" });
    router.push("/login?next=/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {prenom ? `Bonjour ${prenom}` : "Bonjour"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Sur Les Extras, chaque personne a son propre compte, qu’elle ne partage pas.
        </p>
        <p className="text-sm text-muted-foreground">
          Vous n’en avez pas encore : créez le vôtre pour publier, réserver ou proposer vos
          interventions.
        </p>
      </div>

      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="space-y-4 p-5">
          {cree ? (
            <div className="space-y-3">
              <p className="font-medium text-foreground">Votre compte est créé.</p>
              <p className="text-sm text-muted-foreground">
                Reconnectez-vous pour l’ouvrir : votre session actuelle ne le connaît pas encore.
              </p>
              <Button onClick={seReconnecter}>Me reconnecter</Button>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.keys(CHOIX) as Choix[]).map((c) => {
                  const { bouton, icone: Icone } = CHOIX[c];
                  return (
                    <Button
                      key={c}
                      type="button"
                      variant={choix === c ? "primary" : "outline"}
                      aria-pressed={choix === c}
                      onClick={() => choisir(c)}
                      className="justify-start"
                    >
                      <Icone aria-hidden="true" className="size-4" />
                      {bouton}
                    </Button>
                  );
                })}
              </div>

              {choix ? (
                <form onSubmit={creer} className="space-y-4">
                  <Field label={CHOIX[choix].champ} htmlFor="nom-compte" hint={CHOIX[choix].aide}>
                    <Input
                      id="nom-compte"
                      value={nom}
                      maxLength={160}
                      autoFocus
                      onChange={(e) => setNom(e.target.value)}
                    />
                  </Field>
                  <Button type="submit" loading={envoi}>
                    Créer le compte
                  </Button>
                </form>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
