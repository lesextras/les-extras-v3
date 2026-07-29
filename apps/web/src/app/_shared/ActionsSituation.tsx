"use client";

// Actions sur une situation du GAP : corriger et supprimer.
//
// Deux droits, une seule barre : l'auteur dispose de sa parole, l'équipe
// modère. On le dit explicitement quand c'est une suppression de modération —
// supprimer le texte d'un pair sans le nommer serait un abus de position.
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Pencil, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";

export function ActionsSituation({
  id,
  estMienne,
  estAdmin,
  accountId,
}: {
  id: string;
  estMienne: boolean;
  estAdmin: boolean;
  accountId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirme, setConfirme] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  if (!estMienne && !estAdmin) return null;
  const moderation = !estMienne && estAdmin;

  async function supprimer() {
    setEnvoi(true);
    try {
      await apiRequest(`/gap/${id}`, { method: "DELETE", accountId });
      toast({
        title: "Situation supprimée",
        description: "Les réponses qu’elle portait ont été retirées avec elle.",
      });
      setConfirme(false);
      router.push("/gap");
      router.refresh();
    } catch (err) {
      toast({
        title: "Suppression impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {estMienne ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/gap/${id}/modifier`}>
              <Pencil className="size-4" /> Corriger
            </Link>
          </Button>
        ) : null}
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirme(true)}
        >
          <Trash2 className="size-4" />
          {moderation ? "Supprimer (modération)" : "Supprimer"}
        </Button>
      </div>

      <Dialog open={confirme} onOpenChange={setConfirme}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {moderation ? "Retirer cette situation du GAP ?" : "Supprimer votre situation ?"}
            </DialogTitle>
            <DialogDescription>
              {moderation
                ? "Vous agissez en tant que modérateur. La situation et toutes ses réponses seront définitivement retirées, y compris pour leur auteur."
                : "Votre situation et les réponses qu’elle a reçues seront définitivement supprimées. Les professionnels qui vous ont répondu perdront leur contribution."}
            </DialogDescription>
          </DialogHeader>
          {moderation ? (
            <p className="flex items-start gap-2 rounded-lg bg-warning/10 p-3 text-sm text-warning-foreground">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              À réserver aux contenus qui n’ont pas leur place ici. Pour un simple désaccord,
              répondez plutôt dans le fil.
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirme(false)} disabled={envoi}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={supprimer} disabled={envoi}>
              {envoi ? "Suppression…" : "Supprimer définitivement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
