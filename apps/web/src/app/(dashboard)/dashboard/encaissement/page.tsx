import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession, fetchApi } from "../../../_shared/server";
import type { Service } from "../../../_shared/types";
import { Encaissement } from "./Encaissement";

export const metadata: Metadata = { title: "Mon encaissement" };

/**
 * MON ENCAISSEMENT — l’écran qui manquait.
 *
 * Le paiement en ligne existait entièrement côté serveur : Stripe Connect, la
 * commission, les quatre conditions, le composant de règlement sur la fiche
 * publique. Mais relier son compte n’était proposé nulle part à un intervenant,
 * et la méthode qui allume l’option sur une fiche n’avait aucun appelant côté
 * web. Le drapeau restait donc faux pour tout le monde, par construction, et
 * aucun bouton « payer » ne pouvait apparaître nulle part.
 *
 * Réservé aux intervenants : un établissement achète, il n’encaisse pas.
 */
export interface EtatStripe {
  relie: boolean;
  pret: boolean;
  compteId: string | null;
  versementsActifs: boolean;
  paiementsActifs: boolean;
  aFournir: string[];
  commissionVentePourcent: number;
}

export default async function EncaissementPage() {
  const session = await requireSession();
  if (session.account.type !== "FREELANCE") redirect("/dashboard");

  const [etatRes, fichesRes] = await Promise.all([
    fetchApi<EtatStripe>(session, "/paiements/stripe/etat"),
    fetchApi<Service[]>(session, "/services?scope=account"),
  ]);

  return (
    <Encaissement etat={etatRes.data ?? null} fiches={fichesRes.data ?? []} />
  );
}
