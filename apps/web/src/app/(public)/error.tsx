"use client";

// Frontière d'erreur du groupe (public).
//
// Sans ce fichier, une exception au rendu d'une page publique — API en vrac,
// réponse malformée — affichait l'écran d'erreur brut de Next.js sur
// les-extras.fr : fond blanc, pas de logo, aucun lien de retour. C'est la
// vitrine du produit : elle doit rester présentable même quand ça casse.
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useRepriseAutomatique } from "@/lib/reprise-deploiement";

export default function ErreurPublique({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);
  // Pendant une mise en ligne, la page se répare seule (voir lib/reprise-deploiement).
  const etat = useRepriseAutomatique(error, () => {
    router.refresh();
    reset();
  });

  if (etat !== "abandon") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center"
      >
        <span className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" aria-hidden="true" />
        <h1 className="text-2xl font-semibold text-foreground">Le site se met à jour</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {etat === "version"
            ? "Une nouvelle version vient d’être mise en ligne. La page se recharge."
            : "Cette page revient d’elle-même dans quelques secondes, inutile de recharger."}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Incident technique
        </p>
        <h1 className="text-2xl font-semibold text-foreground">
          Cette page n’a pas pu s’afficher
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Le problème vient de chez nous, pas de vous. Réessayez dans un instant
          et si vous cherchiez un intervenant en urgence, appelez-nous plutôt que
          d’attendre.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Réessayer</Button>
        <Button asChild variant="outline">
          <Link href="/">Retour à l’accueil</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/contact">Nous écrire</Link>
        </Button>
      </div>
    </div>
  );
}
