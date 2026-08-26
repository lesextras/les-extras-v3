"use client";

// CHANGER L’ADRESSE DE SON COMPTE (26/08/2026).
//
// Le champ « Email » de la fiche est volontairement reste desactive : on ne
// change pas une adresse de connexion au fil de la frappe, au milieu d’un
// formulaire qu’on enregistre pour tout autre chose. C’est un geste a part,
// avec sa propre confirmation.
//
// Le mot de passe est demande ici et part directement a l’API. Il n’est ni
// conserve ni relu : le champ est vide des que la reponse revient.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field } from "./form-fields";
import { SectionTitle } from "./ui";

export function ChangerEmail({ emailActuel }: { emailActuel: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [ouvert, setOuvert] = useState(false);
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [envoi, setEnvoi] = useState(false);

  async function valider(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEnvoi(true);
    try {
      const reponse = await apiRequest<{ email: string; message: string }>(
        "/auth/email",
        { method: "PATCH", body: { email, password: motDePasse } },
      );
      toast({ title: "Adresse mise à jour", description: reponse.message });
      setMotDePasse("");
      setEmail("");
      setOuvert(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Changement impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <SectionTitle title="Adresse e-mail" />
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Votre compte utilise <span className="font-medium text-foreground">{emailActuel}</span>.
          C’est l’adresse qui reçoit le lien de confirmation, les alertes de mission et les devis.
        </p>

        {!ouvert ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setOuvert(true)}>
            Changer d’adresse
          </Button>
        ) : (
          <form onSubmit={valider} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Nouvelle adresse" htmlFor="nouvelEmail">
                <Input
                  id="nouvelEmail"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field label="Votre mot de passe" htmlFor="motDePasseActuel">
                <Input
                  id="motDePasseActuel"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={motDePasse}
                  onChange={(e) => setMotDePasse(e.target.value)}
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              La confirmation repart de zéro : un lien partira vers la nouvelle adresse, et
              c’est elle qui servira à vous connecter.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm" disabled={envoi}>
                {envoi ? "Envoi…" : "Valider le changement"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={envoi}
                onClick={() => {
                  setOuvert(false);
                  setMotDePasse("");
                }}
              >
                Annuler
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
