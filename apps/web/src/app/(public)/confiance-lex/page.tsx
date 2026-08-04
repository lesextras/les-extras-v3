import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  EyeOff,
  FileCheck,
  Lock,
  MapPin,
  PenLine,
  ScrollText,
  ShieldCheck,
  UserCheck,
  XCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cadre de confiance LEX — IA, déontologie et données",
  description:
    "Comment LEX traite les données des personnes accompagnées : pseudonymisation avant tout envoi, hébergement européen, aucun entraînement sur vos écrits, brouillon toujours relu et validé par le professionnel. Le cadre déontologique complet, écrit noir sur blanc.",
  alternates: { canonical: "/confiance-lex" },
};

/**
 * Le doute déontologique est la PREMIÈRE objection à l'IA rédactionnelle dans
 * le travail social — avant le prix, avant l'utilité. Une enquête nationale
 * menée auprès de 1 179 travailleurs sociaux (NASW / université du Texas,
 * hiver 2025-2026) le montre : deux tiers utilisent déjà l'IA, et deux tiers
 * réclament en priorité un cadre éthique clair.
 *
 * Cette page n'est donc pas une mention légale : c'est la réponse à
 * l'objection numéro un, et le seul argument qui distingue vraiment LEX de
 * l'usage sauvage de ChatGPT sur des situations d'enfants placés.
 */

const GARANTIES = [
  {
    icone: EyeOff,
    titre: "Les noms ne sortent jamais d’ici",
    texte:
      "Avant tout envoi au moteur d’IA, LEX remplace automatiquement les prénoms, noms, dates de naissance et coordonnées par des codes. Le service d’IA ne voit jamais l’identité des personnes accompagnées. Les identités sont rétablies ensuite, sur nos serveurs, dans le texte qui vous revient.",
  },
  {
    icone: MapPin,
    titre: "Hébergement européen",
    texte:
      "Vos données restent hébergées dans l’Union européenne. Nous n’utilisons pas de moteur soumis au CLOUD Act américain pour traiter des contenus relatifs à des personnes accompagnées.",
  },
  {
    icone: Lock,
    titre: "Aucun entraînement sur vos écrits",
    texte:
      "Ce que vous écrivez ne sert jamais à entraîner un modèle, ni le nôtre ni celui d’un tiers. Vos notes brutes ne sont pas conservées : seule la version que vous validez est enregistrée, dans votre espace.",
  },
  {
    icone: PenLine,
    titre: "Un brouillon, jamais un document final",
    texte:
      "LEX produit une proposition que vous relisez, corrigez et validez. Vous restez l’auteur de l’écrit et le responsable de son contenu. Rien n’est transmis ni archivé sans votre validation explicite.",
  },
  {
    icone: XCircle,
    titre: "Aucune décision, aucun diagnostic",
    texte:
      "LEX n’évalue pas une situation, ne pose pas de diagnostic, n’apprécie pas un danger et ne recommande aucune orientation. L’analyse et la décision restent le travail du professionnel et de l’équipe. C’est une limite volontaire, pas une limite technique.",
  },
  {
    icone: ScrollText,
    titre: "Traçabilité complète",
    texte:
      "Chaque génération est journalisée : qui a généré quoi, quand, et qui a validé. Le journal est consultable et exportable par la direction — utile pour un protocole d’équipe comme pour une évaluation HAS.",
  },
];

const ENGAGEMENTS_DIRECTION = [
  "Un modèle d’analyse d’impact (AIPD) prêt à compléter, fourni sur demande",
  "Un contrat de sous-traitance (DPA) type, conforme au RGPD",
  "Une charte d’usage d’équipe téléchargeable, à adapter à votre projet d’établissement",
  "L’export du journal des générations, à tout moment",
  "La suppression de vos contenus sur simple demande, sans délai de rétention caché",
];

export default function ConfianceLexPage() {
  return (
    <div className="space-y-16">
      {/* En-tête */}
      <header className="max-w-3xl space-y-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldCheck className="size-3.5" />
          Cadre de confiance
        </span>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          LEX écrit avec vous, jamais à votre place
        </h1>
        <p className="text-lg leading-relaxed text-foreground/75">
          Utiliser l’intelligence artificielle sur des situations d’enfants placés, de personnes
          handicapées ou de personnes âgées n’est pas anodin. Voici, sans langue de bois, ce que
          LEX fait de vos écrits, ce qu’il ne fait pas, et ce que nous nous engageons à vous
          fournir pour que votre direction puisse trancher en connaissance de cause.
        </p>
      </header>

      {/* Les garanties */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">Six garanties, vérifiables</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          {GARANTIES.map((g) => (
            <div
              key={g.titre}
              className="rounded-2xl border border-border bg-card p-6 shadow-soft"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <g.icone className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold text-foreground">{g.titre}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{g.texte}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ce que ça change concrètement */}
      <section className="rounded-2xl border-2 border-primary/30 bg-primary-soft/30 p-8">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <UserCheck className="size-5 text-primary" />
          La différence avec un assistant grand public
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-foreground/80">
          Beaucoup de professionnels utilisent déjà un assistant d’IA généraliste pour leurs
          écrits. C’est compréhensible, et c’est le vrai risque : coller une note d’observation
          nominative dans un outil grand public, c’est transmettre l’identité d’un enfant à un
          service qui n’a aucune obligation vis-à-vis de votre secteur, et souvent l’envoyer hors
          d’Europe.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed text-foreground/80">
          LEX ne vous demande pas de renoncer à l’aide à la rédaction. Il vous demande de la faire
          dans un cadre : noms masqués avant tout envoi, hébergement européen, aucune conservation
          des notes brutes, et un journal que votre direction peut ouvrir.
        </p>
      </section>

      {/* Pour la direction */}
      <section className="space-y-5">
        <h2 className="text-2xl font-semibold tracking-tight">Ce que nous fournissons à votre direction</h2>
        <p className="max-w-3xl leading-relaxed text-foreground/75">
          Un usage individuel et clandestin de l’IA est le pire des scénarios pour un
          établissement. Nous préférons vous outiller pour en faire une décision d’équipe,
          documentée et opposable.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2">
          {ENGAGEMENTS_DIRECTION.map((e) => (
            <li
              key={e}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm"
            >
              <FileCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              <span className="text-foreground/80">{e}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Limites assumées */}
      <section className="rounded-2xl border border-border bg-card p-8">
        <h2 className="text-xl font-semibold tracking-tight">Nos limites, dites franchement</h2>
        <div className="mt-4 space-y-3 leading-relaxed text-foreground/75">
          <p>
            LEX fait gagner du temps de mise en forme, pas du temps d’analyse. Les études
            disponibles sur les assistants de rédaction en santé mesurent un gain réel mais
            modeste, et très variable selon les personnes. Nous ne vous promettrons donc pas
            « des heures gagnées chaque semaine » : ce serait invérifiable.
          </p>
          <p>
            Ce que les professionnels nous rapportent, c’est autre chose : la page blanche est
            moins lourde, l’écrit du soir se fait le jour, et la charge mentale baisse. C’est un
            bénéfice réel, et c’est celui que nous revendiquons.
          </p>
          <p>
            Enfin, LEX peut se tromper, mal interpréter une notion métier ou produire une
            formulation trop normative. C’est exactement pour cette raison que rien ne part sans
            votre relecture.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-primary p-8 text-primary-foreground">
        <h2 className="text-2xl font-semibold tracking-tight">Essayez avant de décider</h2>
        <p className="mt-2 max-w-2xl text-primary-foreground/85">
          LEX est gratuit chaque mois, sans carte bancaire et sans date de fin. De quoi le
          confronter à un vrai rapport de situation avant d’en parler à votre équipe.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary-foreground px-5 text-sm font-semibold text-primary transition hover:opacity-90"
          >
            Créer un compte gratuit
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/frais-de-service"
            className="inline-flex h-11 items-center rounded-lg border border-primary-foreground/40 px-5 text-sm font-semibold transition hover:bg-primary-foreground/10"
          >
            Voir ce qui est gratuit et ce qui est payant
          </Link>
        </div>
      </section>

      <p className="text-xs italic text-muted-foreground">
        Cette page décrit le fonctionnement de LEX au 3 août 2026. Pour toute question relative au
        traitement des données, écrivez-nous : nous répondons avec les pièces justificatives.
      </p>
    </div>
  );
}
