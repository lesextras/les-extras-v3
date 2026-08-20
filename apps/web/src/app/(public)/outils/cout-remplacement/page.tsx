// Outil public gratuit — aimant d'acquisition et argument de vente.
import type { Metadata } from "next";
import Link from "next/link";
import { CalculateurRemplacement } from "../../../_shared/CalculateurRemplacement";

export const metadata: Metadata = {
  title: "Coût d'un remplacement : intérim ou indépendant",
  description:
    "Comparez le coût réel d'un remplacement en médico-social : agence d'intérim (coefficient de facturation) contre intervenant indépendant. Calcul instantané, paramètres ajustables, sans inscription.",
  alternates: { canonical: "/outils/cout-remplacement" },
  openGraph: {
    url: "/outils/cout-remplacement",
    title: "Coût d'un remplacement : intérim ou indépendant",
    description:
      "Comparez le coût réel d'un remplacement en médico-social : agence d'intérim contre intervenant indépendant. Calcul instantané, sans inscription.",
  },
};

export default function CoutRemplacementPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <span className="eyebrow">Outil gratuit · sans inscription</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
          Combien vous coûte vraiment un remplacement ?
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Une agence d'intérim facture le brut du poste multiplié par un coefficient qui couvre
          charges, indemnités et marge. Un intervenant indépendant facture son tarif, en direct.
          Comparez les deux sur votre situation réelle — les paramètres sont modifiables.
        </p>
      </div>

      <CalculateurRemplacement />

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Pourquoi l'écart est-il si important ?</h2>
        <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            Le <strong className="font-semibold text-foreground">coefficient de facturation</strong> d'une
            agence couvre les charges patronales, les indemnités de fin de mission, les congés payés
            et sa marge commerciale. Il s'applique à chaque heure travaillée.
          </p>
          <p>
            Un <strong className="font-semibold text-foreground">intervenant indépendant</strong> facture
            un tarif unique, négocié en direct : il gère lui-même ses charges et sa protection sociale.
            Sur Les Extras, <strong className="font-semibold text-foreground">aucune commission n'est prélevée
            sur l'intervenant</strong>, et contrat, facture et suivi des heures sont générés automatiquement —
            c'est le temps administratif de votre équipe qui disparaît.
          </p>
          <p>
            À vérifier de votre côté : le statut de l'intervenant (auto-entrepreneur, société), ses
            attestations URSSAF et son assurance responsabilité civile professionnelle. Les pièces
            obligatoires sont suivies dans le coffre-fort de conformité de la plateforme.
          </p>
        </div>
        <p className="mt-4 text-sm">
          <Link href="/ateliers" className="font-semibold text-primary hover:underline">
            Voir le catalogue d'interventions →
          </Link>
        </p>
      </div>
    </div>
  );
}
