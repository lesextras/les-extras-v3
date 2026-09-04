// DÉSINSCRIPTION PAR JETON — pour qui a demandé une fiche sans créer de compte.
//
// Le lien du courriel arrive ici avec `?j=<jeton>`. La page confirme d'un
// clic : un POST, jamais un GET automatique — un antivirus ou un aperçu de
// messagerie qui suit les liens ne doit pas désabonner quelqu'un à son insu.
import type { Metadata } from "next";
import { metaPublique } from "@/lib/meta";
import { Desinscription } from "./Desinscription";

export const metadata: Metadata = {
  ...metaPublique({
    title: "Ne plus recevoir les parcours",
    description: "Retrait de la séquence d’accueil des parcours gratuits, en un clic.",
    path: "/desinscription",
  }),
  robots: { index: false, follow: false },
};

export default async function DesinscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ j?: string }>;
}) {
  const { j } = await searchParams;
  return (
    <div className="mx-auto max-w-lg space-y-6 py-8">
      <h1 className="text-2xl font-bold text-foreground">Ne plus recevoir les parcours</h1>
      <Desinscription jeton={typeof j === "string" ? j.slice(0, 80) : ""} />
    </div>
  );
}
