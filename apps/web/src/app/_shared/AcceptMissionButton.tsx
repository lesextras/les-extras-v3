"use client";

// SOS Renfort — l'intervenant prend la mission.
//
// Deux modes coexistent, au choix de l'établissement à la publication :
//
//   AUTOMATIQUE      « Accepter cette mission » — premier arrivé, premier
//                    servi. La mission est attribuée immédiatement et le
//                    contrat est émis dans la foulée.
//
//   FILE_ENGAGEMENT  « Je prends la mission » — l'intervenant s'engage et
//                    prend rang. Son profil part à l'établissement, qui
//                    accepte ou refuse. Rien n'est confirmé avant.
//
// Le bouton doit dire la vérité sur ce qui va se passer. Promettre une
// attribution immédiate quand une validation est requise, c'est fabriquer une
// déception à chaque mission — et personne ne se réengage après ça.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import { Textarea } from "./form-fields";
import type { ModeAttribution } from "./types";

export function AcceptMissionButton({
  missionId,
  accountId,
  mode = "AUTOMATIQUE",
}: {
  missionId: string;
  accountId: string;
  mode?: ModeAttribution;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [motDeployé, setMotDeployé] = useState(false);
  const file = mode === "FILE_ENGAGEMENT";

  async function onAccept() {
    setLoading(true);
    try {
      const res = await apiRequest<{
        contractUrl?: string;
        presente?: boolean;
        engagement?: { rang: number };
      }>(`/missions/${missionId}/${file ? "sengager" : "accept"}`, {
        method: "POST",
        accountId,
        ...(file && message.trim() ? { body: { message: message.trim() } } : {}),
      });

      if (file || !res?.contractUrl) {
        toast({
          title: res?.presente === false ? "Vous êtes dans la file" : "Engagement enregistré",
          description:
            res?.presente === false
              ? `Une personne s'est engagée avant vous. Si l'établissement ne la retient pas, votre profil sera présenté.`
              : "Votre profil part à l'établissement pour validation. Vous recevrez sa réponse et le contrat dès l'acceptation.",
        });
        router.refresh();
        return;
      }

      toast({
        title: "Mission acceptée 🎉",
        description: "Elle vous est attribuée. Signez le contrat de mission.",
      });
      router.push(res.contractUrl);
      router.refresh();
    } catch (err) {
      // 409 = déjà pourvue par un autre intervenant.
      toast({
        title: "Mission non disponible",
        description: err instanceof Error ? err.message : "Cette mission vient d'être pourvue.",
        variant: "error",
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {file && motDeployé ? (
        <Textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Un mot à l'établissement : ce que vous connaissez du public, vos disponibilités…"
        />
      ) : null}
      <Button className="w-full" disabled={loading} onClick={onAccept}>
        {loading ? "…" : file ? "Je prends la mission" : "Accepter cette mission"}
      </Button>
      {file && !motDeployé ? (
        <button
          type="button"
          onClick={() => setMotDeployé(true)}
          className="w-full text-center text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          Ajouter un mot à l&apos;établissement (facultatif)
        </button>
      ) : null}
    </div>
  );
}
