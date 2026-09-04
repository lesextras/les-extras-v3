import type { Metadata } from "next";
import Link from "next/link";
import { metaPublique } from "@/lib/meta";
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

export const metadata: Metadata = metaPublique({
  title: "Cadre de confiance LEX, IA, déontologie et données",
  description:
    "Comment LEX traite les données des personnes accompagnées : pseudonymisation avant envoi au modèle, aucun entraînement sur vos écrits, notes brutes non conservées.",
  path: "/confiance-lex",
});

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
      "Prénoms, noms, dates de naissance et coordonnées deviennent des codes avant l’envoi. Le service d’IA ne voit jamais l’identité des personnes. Les noms sont rétablis ensuite, sur nos serveurs.",
  },
  {
    icone: MapPin,
    titre: "Où vont vos données, précisément",
    texte:
      "Plateforme, base et fichiers sont hébergés dans l’Union européenne. Le moteur de rédaction s’appuie sur un prestataire spécialisé, possiblement hors UE dans un cadre conforme au RGPD : il ne reçoit que des contenus pseudonymisés. Nous préférons vous le dire.",
  },
  {
    icone: Lock,
    titre: "Aucun entraînement sur vos écrits",
    texte:
      "Ce que vous écrivez n’entraîne aucun modèle, ni le nôtre ni celui d’un tiers. Les notes brutes ne sont pas conservées : seule la version validée est enregistrée.",
  },
  {
    icone: PenLine,
    titre: "Un brouillon, jamais un document final",
    texte:
      "LEX propose, vous relisez et validez. Vous restez l’auteur de l’écrit et le responsable de son contenu.",
  },
  {
    icone: XCircle,
    titre: "Aucune décision, aucun diagnostic",
    texte:
      "Ni évaluation, ni diagnostic, ni appréciation d’un danger, ni orientation. L’analyse reste le travail de l’équipe. C’est une limite volontaire, pas technique.",
  },
  {
    icone: ScrollText,
    titre: "Traçabilité complète",
    texte:
      "Qui a demandé, sur quel modèle d’écrit, et quand. La direction consulte et exporte ce journal : utile pour une évaluation HAS. Il enregistre la demande, jamais le contenu produit.",
  },
];

const ENGAGEMENTS_DIRECTION = [
  "Un modèle d’analyse d’impact (AIPD) prêt à compléter, fourni sur demande",
  "Un contrat de sous-traitance (DPA) type, conforme au RGPD",
  // « Téléchargeable » n'était vrai nulle part : aucun fichier, aucun lien.
  // Les deux lignes au-dessus disent « fourni sur demande » ; celle-ci
  // promettait un bouton qui n'existe pas, sur la page même qui sert à
  // établir la confiance.
  "Une charte d’usage d’équipe à adapter à votre projet d’établissement, fournie sur demande",
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
          Utiliser l’IA sur des situations d’enfants placés ou de personnes vulnérables n’est pas
          anodin. Voici ce que LEX fait de vos écrits, ce qu’il ne fait pas, et ce que nous
          fournissons à votre direction pour trancher.
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
Coller une note d’observation nominative dans un outil grand public, c’est envoyer en
          clair le prénom, l’âge et l’histoire d’un enfant à un service qui n’a aucune obligation
          envers votre secteur : sans trace, et sans personne pour en rendre compte.
        </p>
        <p className="mt-3 max-w-3xl leading-relaxed text-foreground/80">
LEX ne vous demande pas de renoncer à l’aide à la rédaction, mais de la faire dans un
          cadre : noms masqués, aucun entraînement, aucune note brute conservée, et un journal
          que votre direction peut ouvrir.
        </p>
      </section>

      {/* Pour la direction */}
      <section className="space-y-5">
        <h2 className="text-2xl font-semibold tracking-tight">Ce que nous fournissons à votre direction</h2>
        <p className="max-w-3xl leading-relaxed text-foreground/75">
Un usage clandestin de l’IA est le pire scénario pour un établissement. De quoi en
          faire une décision d’équipe, documentée et opposable :
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
LEX fait gagner du temps de mise en forme, pas d’analyse. Les études disponibles
            mesurent un gain réel mais modeste et très variable : nous ne promettrons donc pas
            « des heures gagnées chaque semaine ».
          </p>
          <p>
Ce qu’ils rapportent est autre chose : la page blanche est moins lourde, l’écrit du
            soir se fait le jour. C’est ce bénéfice-là que nous revendiquons.
          </p>
          <p>
LEX peut aussi se tromper ou produire une formulation trop normative. C’est pour cela
            que rien ne part sans votre relecture.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-2xl bg-primary p-8 text-primary-foreground">
        <h2 className="text-2xl font-semibold tracking-tight">Essayez avant de décider</h2>
        <p className="mt-2 max-w-2xl text-primary-foreground/85">
Gratuit chaque mois, sans carte bancaire ni date de fin. De quoi le confronter à un
          vrai rapport de situation.
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

      {/* Les guides ne vivaient que dans le pied de page et le plan du site.
          Ils ont leur place ici : quelqu'un qui lit cette page se demande si
          l'outil est sérieux, et six guides qui citent leurs articles de loi
          un par un répondent mieux que n'importe quelle promesse. */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Ce qu’on sait du métier, avant même de parler d’outil
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
Six guides en accès libre : rapport de situation, projet personnalisé, ESS et
          GEVA-Sco, information préoccupante, bilan de fin d’accompagnement. Chaque référence
          juridique y est citée telle qu’elle se vérifie.
        </p>
        <Link
          href="/guides"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Lire les guides
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      <p className="text-xs italic text-muted-foreground">
Fonctionnement de LEX au 21 août 2026. Toute question sur le traitement des données :
        écrivez-nous, nous répondons pièces à l’appui.
      </p>
    </div>
  );
}
