/**
 * L'écran d'un salarié qu'aucun établissement n'a encore rattaché.
 *
 * Il remplace la page demandée plutôt que de la laisser échouer : le serveur
 * refuse déjà ces routes, et une succession d'erreurs ne dit pas à la personne
 * ce qu'on attend d'elle. Ici, trois choses sont dites dans l'ordre : pourquoi
 * c'est fermé, ce qui reste ouvert, et le geste qui ouvre le reste.
 *
 * Ce n'est pas une page d'erreur : la personne n'a rien fait de travers.
 */
import Link from "next/link";
import { Building2, Lock, PenLine, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DemandeRattachement } from "./DemandeRattachement";

export function EnAttenteRattachement({
  accountId,
  demandes,
}: {
  accountId: string;
  /** Demandes déjà envoyées, en attente de réponse. */
  demandes?: { id: string; nom: string; envoyeeLe?: string | null }[];
}) {
  const enAttente = demandes ?? [];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
          <Building2 className="size-6" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Votre compte attend son établissement
        </h1>
        <p className="text-muted-foreground">
          Vous avez créé un compte de salarié. Les missions, les ateliers, les réservations et la
          facturation appartiennent à la maison qui vous emploie : ils s’ouvriront dès qu’un
          établissement vous aura rattaché. Une même adresse peut d’ailleurs être rattachée à
          plusieurs établissements.
        </p>
      </div>

      {enAttente.length > 0 ? (
        <Card className="border-primary/30 bg-primary-soft/40">
          <CardContent className="space-y-2 p-5">
            <h2 className="font-semibold text-foreground">Demande en cours</h2>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {enAttente.map((d) => (
                <li key={d.id}>
                  <span className="font-medium text-foreground">{d.nom}</span> — en attente de
                  réponse
                  {d.envoyeeLe ? ` (envoyée le ${d.envoyeeLe})` : ""}
                </li>
              ))}
            </ul>
            <p className="pt-1 text-sm text-muted-foreground">
              Vous serez prévenu ici et par e-mail dès qu’une réponse arrive. Vous pouvez en
              demander une autre en attendant.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="font-semibold text-foreground">Demander votre rattachement</h2>
          <DemandeRattachement accountId={accountId} />
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/10 via-transparent to-secondary/10">
        <CardContent className="space-y-3 p-5">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Sparkles className="size-4 text-primary" />
            Ce que vous pouvez déjà faire
          </h2>
          <p className="text-sm text-muted-foreground">
            LEX vous est ouvert dès maintenant, avec votre dotation de crédits du mois. Vos notes
            brutes deviennent un écrit professionnel, les noms sont masqués avant tout envoi, et
            rien de ce que vous écrivez n’est conservé.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/dashboard/assistant">
                <PenLine />
                Écrire avec LEX
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/mon-dossier">Compléter mon dossier</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        Vous vous êtes trompé de profil ? Un compte d’intervenant indépendant, lui, publie et
        facture sans rattachement. Écrivez-nous depuis « Support », en haut à droite : nous le
        changeons sans vous faire recréer de compte.
      </p>
    </div>
  );
}
