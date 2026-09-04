// Donner son avis — la page vers laquelle mène l'enquête envoyée une semaine
// après la première mise en ligne (voir api/community/enquete.scheduler.ts).
//
// ⚠ AUCUN JETON DANS L'ADRESSE. Le lien du courriel mène ici, et la personne
// est identifiée parce qu'elle est connectée. Un identifiant de compte glissé
// dans une URL se retrouve dans les journaux du serveur, dans l'historique du
// navigateur et dans le premier partage d'écran venu.
//
// ⚠ La page est ouverte à TOUT LE MONDE, pas seulement aux invités de
// l'enquête : quelqu'un qui a un ennui aujourd'hui ne doit pas attendre qu'on
// lui écrive pour le dire.
import type { Metadata } from "next";
import { requireSession, fetchApi } from "../../../_shared/server";
import { PageHeader } from "../../../_shared/ui";
import { Card, CardContent } from "@/components/ui/card";
import { FormulaireAvis } from "../../../_shared/FormulaireAvis";

export const metadata: Metadata = { title: "Donner mon avis" };

interface RetourDejaFait {
  id: string;
  createdAt: string;
  noteGlobale: number;
}

export default async function MonAvisPage() {
  const session = await requireSession();
  const { data: deja } = await fetchApi<RetourDejaFait[]>(
    session,
    "/community/retour-experience/mien",
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Donner mon avis"
        subtitle="Quatre questions, une minute. C'est ce qui nous dit quoi corriger."
      />

      {deja && deja.length > 0 ? (
        <Card className="border-secondary/30 bg-secondary/5">
          <CardContent className="p-4 text-sm text-muted-foreground">
            Vous avez déjà donné votre avis le{" "}
            <span className="font-medium text-foreground">
              {new Date(deja[0].createdAt).toLocaleDateString("fr-FR")}
            </span>
            . Merci. Vous pouvez en laisser un autre : si quelque chose a changé,
            en bien ou en mal, c'est utile de le savoir.
          </CardContent>
        </Card>
      ) : null}

      <FormulaireAvis accountId={session.account.id} />

      <p className="text-xs leading-relaxed text-muted-foreground">
        Vos réponses sont lues par l'association. Un problème signalé est traité
        dans la journée. Rien n'est publié sur le site sans votre accord.
      </p>
    </div>
  );
}
