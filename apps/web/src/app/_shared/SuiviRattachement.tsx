"use client";

// Suivi des demandes de rattachement d'un compte « salarié » (créé en solo,
// droits freelance en attendant). Sans cet encart, la personne qui avait
// envoyé sa demande depuis le wizard n'avait plus AUCUN endroit où en voir
// l'état : ni confirmation qu'elle est toujours en attente, ni refus, ni
// moyen de la retirer. Une demande qu'on ne peut plus voir est une demande
// qu'on croit perdue.
//
//   GET    /attachment-requests/mine   (chargé côté serveur, passé en prop)
//   DELETE /attachment-requests/:id    (retirer une demande en attente)
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export interface DemandeRattachement {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  decidedAt?: string | null;
  establishmentAccount?: { id: string; name: string } | null;
}

/** Une décision plus vieille que ça n'est plus une nouvelle : on ne l'affiche plus. */
const DECISION_VISIBLE_JOURS = 14;

export function filtrerDemandesVisibles(demandes: DemandeRattachement[]): DemandeRattachement[] {
  const limite = Date.now() - DECISION_VISIBLE_JOURS * 24 * 60 * 60 * 1000;
  return demandes.filter((d) => {
    if (d.status === "PENDING") return true;
    const decide = d.decidedAt ? new Date(d.decidedAt).getTime() : 0;
    return decide > limite;
  });
}

export function SuiviRattachement({
  demandes,
  accountId,
}: {
  demandes: DemandeRattachement[];
  accountId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  const visibles = filtrerDemandesVisibles(demandes);
  if (visibles.length === 0) return null;

  async function retirer(id: string) {
    setBusyId(id);
    try {
      await apiRequest(`/attachment-requests/${id}`, { method: "DELETE", accountId });
      toast({ title: "Demande retirée" });
      startTransition(() => router.refresh());
    } catch (err) {
      toast({
        title: "Retrait impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <p className="text-sm font-semibold text-foreground">
          <Building2 className="mr-1.5 inline size-4 text-primary" aria-hidden />
          Rattachement à un établissement
        </p>
        <ul className="space-y-2">
          {visibles.map((d) => {
            const nom = d.establishmentAccount?.name ?? "Établissement";
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                {d.status === "PENDING" ? (
                  <>
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="size-4 shrink-0 text-amber-600" aria-hidden />
                      <span>
                        Demande envoyée à <strong className="text-foreground">{nom}</strong> — en
                        attente de sa réponse. Vous gardez tous vos droits de compte indépendant.
                      </span>
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={busyId === d.id}
                      onClick={() => retirer(d.id)}
                    >
                      Retirer la demande
                    </Button>
                  </>
                ) : d.status === "APPROVED" ? (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
                    <span>
                      <strong className="text-foreground">{nom}</strong> a accepté votre
                      rattachement : l&apos;établissement apparaît désormais dans votre sélecteur de
                      compte, en haut de l&apos;écran.
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <XCircle className="size-4 shrink-0 text-destructive" aria-hidden />
                    <span>
                      <strong className="text-foreground">{nom}</strong> a refusé votre demande.
                      Rien ne change pour vous : votre compte indépendant continue exactement comme
                      avant, et vous pouvez redemander plus tard.
                    </span>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
