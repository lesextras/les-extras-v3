"use client";

/**
 * LA FILE D'ENGAGEMENT — vue établissement.
 *
 * L'écran ne demande jamais de trier un tas de dossiers : il pose UNE question
 * à la fois, sur UNE personne, et donne les deux réponses possibles. C'est ce
 * qui rend la décision rapide — et c'est parce qu'elle est rapide qu'on peut
 * se permettre de diffuser l'offre très largement en amont.
 *
 * Les profils suivants sont visibles, mais grisés : savoir qu'il y a trois
 * personnes derrière change la façon dont on répond à la première.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "./form-fields";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { fullName, initials } from "./format";
import type { EngagementStatut, MissionEngagement } from "./types";

const LIBELLE: Record<EngagementStatut, string> = {
  PRESENTE: "À valider",
  EN_ATTENTE: "En file",
  ACCEPTE: "Retenu",
  REFUSE: "Écarté",
  RETIRE: "S'est retiré",
  CADUC: "Sans suite",
};

export function FileEngagement({
  missionId,
  accountId,
  peutDecider,
}: {
  missionId: string;
  accountId: string;
  peutDecider: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [file, setFile] = useState<MissionEngagement[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [motifOuvert, setMotifOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);

  async function charger() {
    try {
      const rows = await apiRequest<MissionEngagement[]>(`/missions/${missionId}/engagements`, {
        accountId,
      });
      setFile(Array.isArray(rows) ? rows : []);
      setErreur(null);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Chargement impossible");
      setFile([]);
    }
  }

  useEffect(() => {
    void charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missionId, accountId]);

  async function decider(engagementId: string, decision: "ACCEPTE" | "REFUSE") {
    setEnCours(true);
    try {
      const res = await apiRequest<{ contractUrl?: string; suivantPresente?: boolean }>(
        `/missions/${missionId}/engagements/${engagementId}/decision`,
        {
          method: "POST",
          accountId,
          body: { decision, ...(decision === "REFUSE" && motif.trim() ? { motif: motif.trim() } : {}) },
        },
      );
      if (decision === "ACCEPTE") {
        toast({
          title: "Profil retenu ✅",
          description: "La mission est pourvue et le contrat d'engagement vient d'être émis.",
        });
        if (res?.contractUrl) router.push(res.contractUrl);
      } else {
        toast({
          title: "Profil écarté",
          description: res?.suivantPresente
            ? "La personne a été prévenue. Le profil suivant vous est présenté."
            : "La personne a été prévenue. La mission reste diffusée : plus personne en file pour l'instant.",
        });
      }
      setMotif("");
      setMotifOuvert(false);
      await charger();
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : "Réessayez dans un instant.",
        variant: "error",
      });
    } finally {
      setEnCours(false);
    }
  }

  if (file === null) {
    return <p className="px-4 py-6 text-center text-sm text-muted-foreground">Chargement…</p>;
  }
  if (erreur) {
    return <p className="px-4 py-6 text-center text-sm text-destructive">{erreur}</p>;
  }
  if (file.length === 0) {
    return (
      <p className="rounded-lg bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
        Personne ne s&apos;est encore engagé. Dès qu&apos;un intervenant prendra la mission, son
        profil apparaîtra ici pour validation.
      </p>
    );
  }

  const presente = file.find((e) => e.statut === "PRESENTE");
  const enFile = file.filter((e) => e.statut === "EN_ATTENTE");
  const traites = file.filter((e) => !["PRESENTE", "EN_ATTENTE"].includes(e.statut));

  return (
    <div className="space-y-4">
      {presente ? (
        <div className="rounded-xl border-2 border-primary/40 bg-primary-soft/30 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11">
                <AvatarImage src={presente.account?.owner?.avatarUrl ?? undefined} />
                <AvatarFallback>
                  {initials(
                    presente.account?.owner?.firstName,
                    presente.account?.owner?.lastName,
                  )}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {fullName(
                    presente.account?.owner?.firstName,
                    presente.account?.owner?.lastName,
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {presente.account?.owner?.profile?.job ?? "Intervenant"}
                  {presente.account?.owner?.profile?.city
                    ? ` · ${presente.account.owner.profile.city}`
                    : ""}
                  {` · ${presente.rang}${presente.rang === 1 ? "er" : "e"} à s'être engagé·e`}
                </p>
              </div>
            </div>
            <Badge>À valider</Badge>
          </div>

          {presente.message ? (
            <p className="mt-3 rounded-lg bg-background/70 p-3 text-sm italic text-foreground/80">
              « {presente.message} »
            </p>
          ) : null}

          {peutDecider ? (
            <div className="mt-4 space-y-2">
              {motifOuvert ? (
                <Textarea
                  rows={2}
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Motif du refus, transmis à la personne (ex. : diplôme d'État attendu sur ce poste)"
                />
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button disabled={enCours} onClick={() => decider(presente.id, "ACCEPTE")}>
                  Accepter et éditer le contrat
                </Button>
                {motifOuvert ? (
                  <Button
                    variant="outline"
                    disabled={enCours}
                    onClick={() => decider(presente.id, "REFUSE")}
                  >
                    Confirmer le refus
                  </Button>
                ) : (
                  <Button variant="ghost" disabled={enCours} onClick={() => setMotifOuvert(true)}>
                    Refuser ce profil
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Rien n&apos;est confirmé pour l&apos;intervenant tant que vous n&apos;avez pas
                accepté. Un refus présente aussitôt le profil suivant.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              La validation est réservée à la direction, à l&apos;administration et aux chefs de
              service.
            </p>
          )}
        </div>
      ) : null}

      {enFile.length > 0 ? (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {enFile.length} personne(s) derrière
          </p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {enFile.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-sm text-foreground">
                  {fullName(e.account?.owner?.firstName, e.account?.owner?.lastName)}
                  <span className="ml-2 text-xs text-muted-foreground">
                    {e.account?.owner?.profile?.job ?? "Intervenant"}
                  </span>
                </span>
                <Badge variant="outline">{`${e.rang}e`}</Badge>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {traites.length > 0 ? (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs text-muted-foreground">
            Historique ({traites.length})
          </summary>
          <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
            {traites.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="text-sm text-muted-foreground">
                  {fullName(e.account?.owner?.firstName, e.account?.owner?.lastName)}
                  {e.motifRefus ? <span className="ml-2 text-xs">· {e.motifRefus}</span> : null}
                </span>
                <Badge variant="outline">{LIBELLE[e.statut]}</Badge>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
