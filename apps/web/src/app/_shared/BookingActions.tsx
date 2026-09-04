"use client";

/**
 * Actions sur une réservation — renfort (côté établissement) OU atelier
 * (côté intervenant).
 *
 * La machine à états du serveur est stricte, et c'est une qualité : chaque
 * transition fait un vrai travail (confirmer crée le créneau de planning,
 * terminer ouvre la fenêtre de pointage de 72 heures). L'erreur historique de
 * ce composant était de sauter des marches — « Retenir & confirmer » envoyait
 * REQUESTED → CONFIRMED, que le serveur refuse à juste titre. Résultat : une
 * erreur 400 sur chaque clic, et aucune candidature n'a jamais pu être
 * acceptée.
 *
 * Le chemin est donc affiché tel qu'il est : retenir (accept), puis confirmer
 * (confirm), puis démarrer (start), puis terminer (complete). Et au moment où
 * le renfort est confirmé, on propose LE geste que le produit vend — établir
 * le contrat à durée déterminée — au lieu de le laisser caché derrière un
 * lien non signalé.
 *
 * ⚠ DEUX CONTEXTES, ET IL A FALLU LES SÉPARER (3/09/2026).
 *
 * Ce composant n'était monté que sur les candidatures de renfort et sur les
 * réservations d'atelier ENCORE EN ATTENTE. Conséquence mesurée en production :
 * sur quinze réservations, UNE SEULE avait atteint « terminée ». Dès qu'un
 * intervenant acceptait un atelier, la ligne quittait la section « à traiter »
 * et il n'existait plus, dans toute l'interface, aucun bouton pour la faire
 * avancer — alors que le serveur réserve précisément ces transitions à
 * l'intervenant (`assertOffreur`).
 *
 * Et comme la facture d'atelier n'est préparée QUE par `complete()`, aucune
 * facture ne pouvait naître. Le chemin entre la prestation réalisée et l'argent
 * encaissé était coupé, sans qu'aucun écran ne le dise.
 *
 * Le `contexte` ne change que les LIBELLÉS et le pont vers le CDD : la machine
 * à états, elle, est la même des deux côtés. Écrire deux composants aurait fait
 * diverger les deux chemins au premier état ajouté.
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api";
import type { BookingStatus } from "./types";

export function BookingActions({
  bookingId,
  accountId,
  status,
  contexte = "renfort",
}: {
  bookingId: string;
  accountId: string;
  status: BookingStatus;
  /**
   * `renfort` : l'établissement traite une candidature, et le CDD est proposé
   * à la confirmation. `atelier` : l'intervenant traite une réservation reçue —
   * il n'y a pas de CDD, et les mots ne sont pas les mêmes : ce n'est pas une
   * candidature qu'il retient, c'est un établissement qui le sollicite.
   */
  contexte?: "renfort" | "atelier";
}) {
  const atelier = contexte === "atelier";
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  async function agir(action: string, okMsg: string, body?: Record<string, unknown>) {
    setLoading(action);
    try {
      await apiRequest(`/bookings/${bookingId}/${action}`, {
        method: "PATCH",
        ...(body ? { body } : {}),
        accountId,
      });
      toast({ title: okMsg });
      router.refresh();
    } catch (err) {
      toast({
        title: "Action impossible",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(null);
    }
  }

  const decliner = (
    <Button
      size="sm"
      variant="outline"
      className="text-destructive hover:text-destructive"
      loading={loading === "cancel"}
      disabled={loading !== null && loading !== "cancel"}
      onClick={() =>
        agir("cancel", atelier ? "Réservation déclinée" : "Candidature déclinée", {
          // Décliner exige un motif : il est transmis à la personne. Celui-ci
          // est neutre et vrai ; un échange détaillé passe par la messagerie.
          //
          // ⚠ Le motif suivait le sens du renfort dans les DEUX contextes :
          // sur un atelier, l'intervenant envoyait « candidature non retenue
          // par l'établissement » à l'établissement qui venait de le
          // solliciter — l'exact inverse de ce qui se passait.
          reason: atelier
            ? "L’intervenant n’est pas disponible pour cette demande."
            : "Candidature non retenue par l’établissement.",
        })
      }
    >
      Décliner
    </Button>
  );

  if (status === "REQUESTED") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          loading={loading === "accept"}
          disabled={loading !== null && loading !== "accept"}
          onClick={() =>
            agir(
              "accept",
              atelier
                ? "Réservation acceptée — confirmez la date pour la bloquer"
                : "Candidature retenue — confirmez pour bloquer le créneau",
            )
          }
        >
          {atelier ? "Accepter la réservation" : "Retenir"}
        </Button>
        {decliner}
      </div>
    );
  }

  if (status === "ACCEPTED") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          loading={loading === "confirm"}
          disabled={loading !== null && loading !== "confirm"}
          onClick={() =>
            agir(
              "confirm",
              atelier
                ? "Date confirmée — l’établissement est prévenu"
                : "Renfort confirmé — le créneau est posé sur le planning",
            )
          }
        >
          {atelier ? "Confirmer la date" : "Confirmer le renfort"}
        </Button>
        {decliner}
      </div>
    );
  }

  if (status === "CONFIRMED") {
    return (
      <div className="flex flex-wrap gap-2">
        {/* Le pont vers le CDD, au moment exact où l'on en a besoin : la
            personne est confirmée, l'établissement l'embauche. La page du
            document reprend tout ce qui est connu.
            Sur un atelier, il n'y a pas de CDD : l'intervenant facture. */}
        {atelier ? null : (
          <Button asChild size="sm">
            <Link href={`/documents/contrat/${bookingId}`}>Établir le CDD</Link>
          </Button>
        )}
        <Button
          size="sm"
          variant={atelier ? "primary" : "outline"}
          loading={loading === "start"}
          disabled={loading !== null && loading !== "start"}
          onClick={() =>
            agir("start", atelier ? "Atelier démarré" : "Mission démarrée")
          }
        >
          {atelier ? "Démarrer l’atelier" : "Démarrer la mission"}
        </Button>
      </div>
    );
  }

  if (status === "IN_PROGRESS") {
    return (
      <Button
        size="sm"
        variant="outline"
        loading={loading === "complete"}
        disabled={loading !== null && loading !== "complete"}
        onClick={() =>
          agir(
            "complete",
            atelier
              ? "Atelier terminé — votre facture est préparée en brouillon"
              : "Mission terminée — la fenêtre de pointage de 72 h est ouverte",
          )
        }
      >
        {atelier ? "Marquer l’atelier terminé" : "Marquer terminée"}
      </Button>
    );
  }

  return null;
}
