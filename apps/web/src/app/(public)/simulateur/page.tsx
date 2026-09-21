// Simulateur d'économies : le visiteur saisit SES chiffres, la page calcule.
// Aucun chiffre de référence inventé — c'est la condition pour rester honnête.
import type { Metadata } from "next";
import { Calculateur } from "./Calculateur";
import { metaPublique } from "@/lib/meta";

export const metadata: Metadata = metaPublique({
  title: "Simulateur d'économies, renfort sans commission",
  description:
    "Calculez ce que vous coûtent la commission de votre intermédiaire actuel et le temps de coordination des remplacements, à partir de vos propres chiffres.",
  path: "/simulateur",
});

export default function SimulateurPage() {
  /*
   * ⚠ HORS OFFRE PUBLIQUE DEPUIS LE 19/09/2026 — ET LE GARDE-FOU N'EST PAS ICI.
   *
   * Cette page vend le renfort de POSTE, celui qui se conclut en CDD salarié.
   * Décision de Siham : il sort de la vitrine (voir `@/lib/offre`). Rien n'est
   * supprimé — la page reste entière et redevient servie en repassant
   * NEXT_PUBLIC_OFFRE_PUBLIQUE à « complete ».
   *
   * ⚠⚠ NE PAS REMETTRE DE `redirect()` NI DE `notFound()` DANS CE COMPOSANT.
   * On a essayé, et c'est le piège que `next.config.mjs` documente déjà deux
   * fois : dans une page prérendue, Next ne peut pas émettre de 3xx et retombe
   * sur un rafraîchissement méta — mesuré ici, la route répondait **200** en
   * servant la page « Erreur 404 ». La redirection appartient à la
   * configuration : elle est dans `redirects()`, section « OFFRE PUBLIQUE ».
   */
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Combien vous coûte votre organisation actuelle des renforts ?
        </h1>
        <p className="mt-3 text-muted-foreground">
          Saisissez vos chiffres : le calcul se fait avec eux, et seulement avec eux.
        </p>
      </div>
      <div className="mt-10">
        <Calculateur />
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        Ce simulateur n'utilise aucune statistique externe : les montants affichés sont le produit
        direct de vos saisies. Pour un chiffrage précis adapté à votre structure,{" "}
        <a href="/demo" className="underline">demandez une démo</a>.
      </p>
    </div>
  );
}
