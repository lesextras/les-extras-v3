"use client";

// Bascule salarié → intervenant. Un salarié d'établissement peut proposer ses
// interventions en son nom propre : on lui crée un compte intervenant et on
// recopie les fiches qu'il choisit — en brouillon, jamais publiées à sa place.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Field } from "./form-fields";
import { Input } from "@/components/ui/input";

export interface FicheImportable {
  id: string;
  title: string;
  category: string;
  price?: string | number | null;
  status: string;
}

export function DevenirIntervenant({
  sourceAccountId,
  fiches,
  nomParDefaut,
}: {
  sourceAccountId: string;
  fiches: FicheImportable[];
  nomParDefaut: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [nom, setNom] = useState(nomParDefaut);
  const [choisies, setChoisies] = useState<string[]>([]);
  const [envoi, setEnvoi] = useState(false);

  function basculer(id: string) {
    setChoisies((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function creer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (nom.trim().length < 2) {
      toast({
        title: "Nom manquant",
        description: "Indiquez le nom sous lequel vous exercerez.",
        variant: "error",
      });
      return;
    }
    setEnvoi(true);
    try {
      const res = await apiRequest<{ importees: number; dejaExistant: boolean }>(
        "/accounts/devenir-intervenant",
        {
          method: "POST",
          body: {
            name: nom.trim(),
            ...(choisies.length ? { sourceAccountId, serviceIds: choisies } : {}),
          },
        },
      );
      toast({
        title: res.dejaExistant ? "Compte intervenant retrouvé" : "Compte intervenant créé",
        description:
          res.importees > 0
            ? `${res.importees} fiche${res.importees > 1 ? "s" : ""} reprise${res.importees > 1 ? "s" : ""} en brouillon. Relisez-les avant publication.`
            : "Basculez sur ce compte depuis le sélecteur en haut de page.",
      });
      router.refresh();
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

  return (
    <form onSubmit={creer} className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-6">
          <Field
            label="Sous quel nom exercez-vous ?"
            htmlFor="nom-intervenant"
            hint="C'est ce nom que verront les établissements sur vos fiches. Votre nom propre convient très bien."
          >
            <Input
              id="nom-intervenant"
              value={nom}
              maxLength={160}
              onChange={(e) => setNom(e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      {fiches.length > 0 ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div>
              <h2 className="font-semibold">Reprendre des fiches existantes</h2>
              <p className="text-sm text-muted-foreground">
                Les fiches que vous cochez sont recopiées sur votre compte intervenant{" "}
                <strong>en brouillon</strong>. Rien n&apos;est publié sans votre relecture, et les
                fiches d&apos;origine ne sont pas modifiées.
              </p>
            </div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {fiches.map((f) => (
                <li key={f.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-accent/50">
                    <input
                      type="checkbox"
                      checked={choisies.includes(f.id)}
                      onChange={() => basculer(f.id)}
                      className="size-4 shrink-0 rounded border-input accent-[hsl(var(--primary))]"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">{f.title}</span>
                    {f.price != null ? (
                      <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                        {Number(f.price).toLocaleString("fr-FR", {
                          style: "currency",
                          currency: "EUR",
                        })}
                      </span>
                    ) : null}
                    <Badge variant="muted">{f.status === "PUBLISHED" ? "Publiée" : "Brouillon"}</Badge>
                  </label>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              {choisies.length} fiche{choisies.length > 1 ? "s" : ""} sélectionnée
              {choisies.length > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Button type="submit" disabled={envoi}>
        {envoi ? "Création…" : "Créer mon compte intervenant"}
      </Button>
    </form>
  );
}
