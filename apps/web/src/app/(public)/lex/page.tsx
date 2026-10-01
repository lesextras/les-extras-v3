import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  PenLine,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { metaPublique } from "@/lib/meta";
import { OffreLex } from "@/app/_shared/OffreLex";

/**
 * LA PAGE LEX — elle n'existait pas, et c'était le trou le plus visible du
 * site public (constat de Siham, 21/09/2026 : « il n'y a pas de page lex »).
 *
 * LEX était vendu par une SECTION de l'accueil et par `/confiance-lex`. Or ces
 * deux pages répondent à deux questions différentes, et aucune ne répondait à
 * la première :
 *   • l'accueil dit CE QUE C'EST, en trente secondes, au milieu d'autre chose ;
 *   • `/confiance-lex` répond à « ai-je le droit de m'en servir sur un enfant
 *     placé ? » — c'est-à-dire l'objection de la DIRECTION ;
 *   • personne ne répondait à « est-ce que ça va m'aider, moi, ce soir ? ».
 *
 * ⚠ CETTE PAGE COMMENCE PAR LE PROBLÈME, JAMAIS PAR LE PRODUIT. C'est la règle
 * d'écriture choisie par Siham pour toute la refonte du 21/09 (voir
 * `_shared/QuatreSituations.tsx`, qui l'applique sur l'accueil). Le premier
 * écran décrit une soirée que le lecteur a vécue ; le produit n'arrive qu'au
 * deuxième.
 *
 * ⚠ ELLE NE RÉÉCRIT PAS `OffreLex` : le trajet d'un écrit et les quatre outils
 * viennent du composant partagé, qui est déjà la source unique sur l'accueil.
 * Deux descriptions du même produit divergent au premier changement — c'est
 * exactement ce qui était arrivé au bloc « pourquoi pas ChatGPT », écrit deux
 * fois à trois centimètres d'écart.
 *
 * ⚠ LES PRIX SONT RELUS DANS LE CODE, PAS RECOPIÉS D'UNE AUTRE PAGE.
 * `SUBSCRIPTION_PLANS`, `ESTABLISHMENT_PLAN` et `CREDIT_PACKS`
 * (`apps/api/src/billing/billing.service.ts`) + `FREE_MONTHLY_CREDITS`
 * (`credits.constants.ts`). La grille a déjà changé une fois ; c'est le code
 * qui fait foi, jamais la mémoire du projet.
 */
export const metadata: Metadata = metaPublique({
  title: "LEX, vos activités et vos écrits du quotidien",
  description:
    "Préparer une activité, améliorer un écrit, mettre vos notes en compte rendu : LEX le fait en quelques étapes. Quinze résultats offerts par mois.",
  path: "/lex",
});

/**
 * TROIS MOMENTS, PAS TROIS FONCTIONS.
 *
 * ⚠ CHAQUE ENTRÉE S'OUVRE SUR LA PHRASE DU COULOIR, celle qu'on s'entend dire
 * en vrai — pas sur le nom de l'outil. L'outil est nommé dans `reponse`, et
 * seulement là. Inverser les deux redonnerait une plaquette.
 */
/*
 * ⚠⚠ LES TROIS TÂCHES DU 1er OCTOBRE 2026 (décision de Siham) : LEX devient
 * l'outil du quotidien de l'éducation, de l'animation, de la protection de
 * l'enfance, du handicap, du social et des associations. Ce sont les trois
 * entrées du nouvel écran (`LexQuotidien`), dans le même ordre.
 */
const MOMENTS = [
  {
    icone: Sparkles,
    quand: "Préparer ou adapter une activité",
    probleme:
      "« Il faut faire quelque chose demain avec le groupe, et je n’ai ni idée ni temps de préparer. »",
    reponse:
      "Vous donnez l’objectif, l’âge, le nombre et la durée. LEX rend une fiche : déroulé minuté, consignes, variantes, points de vigilance. Une adaptation part des besoins que vous décrivez, jamais d’un diagnostic.",
    preuve: "Des fiches gratuites à télécharger, ou adaptées à votre groupe.",
  },
  {
    icone: PenLine,
    quand: "Améliorer mon écrit",
    probleme: "« Mon texte est trop long, et ma cheffe dit qu’il y a des jugements dedans. »",
    reponse:
      "Vous collez votre texte et vous choisissez : plus clair, plus factuel, plus court, ou objectifs observables. LEX rend la version proposée et signale les formulations à vérifier.",
    preuve: "Rien n’est ajouté : ce qui manque est posé en question.",
  },
  {
    icone: BookOpen,
    quand: "Mes notes en compte rendu",
    probleme:
      "« Le rapport est pour demain. J’ai tout en tête, et je n’arrive pas à commencer. »",
    reponse:
      "Vous collez vos notes telles qu’elles viennent. LEX rend une note d’observation, une transmission, un compte rendu de réunion ou d’activité, un bilan, avec ce qui reste à compléter.",
    preuve: "Vous relisez, vous corrigez, vous signez.",
  },
];

/**
 * ⚠ CE BLOC N'EST PAS UNE PRÉCAUTION JURIDIQUE, C'EST UN ARGUMENT DE VENTE.
 * Dans ce secteur, la première objection n'est pas le prix mais la
 * déontologie ; un outil qui dit clairement ce qu'il refuse de faire se
 * défend en réunion d'équipe, et c'est ce qui permet à quelqu'un de le
 * proposer à sa direction sans y risquer sa crédibilité.
 *
 * ⚠ AUCUNE LIGNE NE PROMET UNE VÉRIFICATION NI UN CONTRÔLE. C'est la famille
 * de promesse retirée partout ailleurs du site (fiche atelier le 4/09, layout
 * d'inscription le 16/09, layout racine le 21/09), et `promesses-interdites`
 * la teste.
 */
const JAMAIS = [
  "Aucun diagnostic, aucune évaluation clinique, aucune appréciation d’un danger.",
  "Aucune décision d’orientation : l’analyse reste le travail de l’équipe.",
  "Aucun prénom, aucune date de naissance, aucune coordonnée envoyée au moteur.",
  "Aucun entraînement de modèle sur ce que vous écrivez.",
  "Aucune note brute conservée : seule la version que vous validez est gardée.",
];

/**
 * ⚠ GRILLE DU 1er OCTOBRE 2026 (décision de Siham), relue dans
 * `billing.service.ts` : CREDIT_PACKS (490 centimes, 20 crédits),
 * SUBSCRIPTION_PLANS (990 centimes, 60 par mois), ESTABLISHMENT_PLAN (8900
 * centimes, 1 000 par mois) et FREE_MONTHLY_CREDITS (15). Trois choix payants,
 * les mêmes fonctions partout : seule la quantité change. Ne jamais écrire
 * ici un prix qui n'existe pas dans le code.
 */
const FORMULES = [
  {
    nom: "Le compte gratuit",
    prix: "0 €",
    precision: "quinze résultats chaque mois",
    pour: "Pour essayer sur de vraies tâches, sans rien engager.",
    points: [
      "Sans carte bancaire, sans date de fin",
      "Les résultats non utilisés se reportent trois mois",
      "Les trois tâches, sans restriction",
    ],
    vedette: true,
  },
  {
    nom: "J’en ai besoin parfois",
    prix: "4,90 €",
    precision: "le pack de 20 résultats, sans abonnement",
    pour: "Pour les semaines chargées, sans engagement.",
    points: ["Payé une fois", "Les mêmes fonctions", "S’ajoute à votre solde"],
    vedette: false,
  },
  {
    nom: "Je l’utilise régulièrement",
    prix: "9,90 €",
    precision: "par mois, 60 résultats",
    pour: "Pour un professionnel qui prépare et écrit chaque semaine.",
    points: ["Résultats reportables", "Les mêmes fonctions", "Sans engagement de durée"],
    vedette: false,
  },
  {
    nom: "Pour mon équipe",
    prix: "89 €",
    precision: "par mois, pour toute la structure",
    pour: "Pour une équipe qui écrit avec les mêmes trames.",
    points: [
      "1 000 résultats par mois, répartis entre les personnes de votre choix",
      "Chacun garde son compte, avec un plafond par mois : vous voyez les chiffres, jamais les écrits",
      "Vos trames maison ouvertes à toute l’équipe",
    ],
    vedette: false,
  },
];

export default function LexPage() {
  return (
    <div className="space-y-20">
      {/* ═══ 1. LA SOIRÉE — le problème, avant le produit ═══════════════════ */}
      <header className="max-w-3xl space-y-5">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <PenLine className="size-3.5" aria-hidden />
          LEX · l’assistant d’écriture
        </span>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl text-balance" lang="fr">
          Préparez vos activités et vos écrits du quotidien, en quelques étapes.
        </h1>
        <p className="text-lg leading-relaxed text-foreground/75" lang="fr">
          Pour l’éducation, l’animation, la protection de l’enfance, le handicap, le social et les
          associations. Une activité à monter pour demain, un écrit à reprendre, des notes à
          transformer en compte rendu&nbsp;: vous choisissez la tâche, vous donnez les quelques
          informations utiles, LEX rend un résultat court, prêt à modifier.
        </p>
        <p className="text-lg leading-relaxed text-foreground/75" lang="fr">
          LEX fait cette partie-là, et seulement celle-là. Il met en forme ce que{" "}
          <strong className="font-semibold text-foreground">vous</strong> avez observé,{" "}
          <strong className="font-semibold text-foreground">sans jamais voir un nom</strong>. Vous
          relisez, vous corrigez, vous signez&nbsp;: l’écrit reste le vôtre.
        </p>
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
          {/* ⚠ `next` RAMÈNE DANS L'ASSISTANT après l'inscription (audit du
              28/09/2026) : sans lui, on tombait sur le tableau de bord. Le
              libellé est celui de `INSCRIPTION.ecrireAvecLex`, écrit en dur
              pour que `inscription-liens.test.ts` le vérifie. */}
          <Link
            href="/register?next=/dashboard/assistant"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Créer un compte pour écrire avec LEX
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/confiance-lex"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Cadre de confiance LEX
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <p className="flex items-center gap-2 text-sm text-foreground/60">
          <Clock className="size-4 shrink-0" aria-hidden />
          Quinze résultats offerts chaque mois, sans carte bancaire et sans date de fin.
        </p>
      </header>

      {/* ═══ 2. TROIS MOMENTS DE LA SEMAINE ════════════════════════════════ */}
      <section className="space-y-6">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Trois tâches, un seul outil</h2>
          <p className="leading-relaxed text-foreground/75" lang="fr">
            Le premier écran de LEX pose une seule question&nbsp;: que voulez-vous terminer&nbsp;?
            Votre métier change les exemples et les écrits proposés, pas l’outil. Si aucune de ces
            trois tâches ne vous parle, LEX ne vous servira à rien, et il vaut mieux le savoir
            avant de créer un compte.
          </p>
        </div>
        <ul className="grid gap-5 md:grid-cols-3">
          {MOMENTS.map((m) => {
            const Icone = m.icone;
            return (
              <li
                key={m.quand}
                className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-soft"
              >
                <div className="flex items-center gap-2.5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icone className="size-5" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    {m.quand}
                  </span>
                </div>
                <p className="mt-4 text-base font-semibold leading-snug text-foreground" lang="fr">
                  {m.probleme}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-foreground/75" lang="fr">
                  {m.reponse}
                </p>
                <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-foreground/60">
                  {m.preuve}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ═══ 3. LE TRAJET D'UN ÉCRIT, ET LES OUTILS ════════════════════════
          Composant partagé avec l'accueil : une seule description du produit
          pour tout le site. Voir l'en-tête de ce fichier.

          ⚠ PAS DE TITRE DE SECTION ICI, ET C'EST UN CORRECTIF (vérifié en
          direct après le premier déploiement). `OffreLex` porte DÉJÀ son
          propre titre « Ce qui part, et ce qui revient » et sa phrase
          d'introduction : en ajoutant les miens au-dessus, la page affichait
          deux fois le même titre et deux fois la même phrase, à trois
          centimètres d'écart. C'est exactement le défaut que cette refonte
          corrige ailleurs — il ne faut pas le réintroduire ici.

          Si un jour cette section a besoin d'une introduction propre à la
          page, elle doit dire autre chose que le composant, pas la même chose
          autrement. */}
      <OffreLex />

      {/* ═══ 4. CE QUE LEX NE FERA JAMAIS ══════════════════════════════════ */}
      <section className="rounded-2xl border-2 border-primary/30 bg-primary-soft/30 p-8">
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <ShieldCheck className="size-6 shrink-0 text-primary" aria-hidden />
          Ce que LEX ne fera jamais
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-foreground/80" lang="fr">
          Ces limites ne sont pas techniques, elles sont volontaires. C’est ce qui permet de poser
          l’outil sur la table en réunion d’équipe plutôt que de s’en servir en cachette, le pire
          scénario pour un établissement.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {JAMAIS.map((j) => (
            <li
              key={j}
              className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 text-sm"
            >
              <X className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span className="leading-relaxed text-foreground/80" lang="fr">
                {j}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-foreground/70">
          Le détail (hébergement, sous-traitance, journal des générations, modèle d’analyse
          d’impact pour votre direction) est sur{" "}
          <Link href="/confiance-lex" className="font-semibold text-primary hover:underline">
            le cadre de confiance
          </Link>
          .
        </p>
      </section>

      {/* ═══ 5. COMBIEN ÇA COÛTE ═══════════════════════════════════════════ */}
      <section className="space-y-6">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Combien ça coûte</h2>
          <p className="leading-relaxed text-foreground/75" lang="fr">
            Un crédit = un résultat&nbsp;: une fiche, un écrit amélioré ou un compte rendu. Le
            compte gratuit n’est pas un essai&nbsp;: il n’a pas de date de fin.
          </p>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FORMULES.map((f) => (
            <li
              key={f.nom}
              className={
                "flex h-full flex-col rounded-2xl border p-6 " +
                (f.vedette
                  ? "border-primary/45 bg-primary-soft/40 shadow-card"
                  : "border-border bg-card shadow-soft")
              }
            >
              <h3 className="text-base font-bold tracking-tight text-foreground">{f.nom}</h3>
              <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{f.prix}</p>
              <p className="mt-1 text-xs text-foreground/60">{f.precision}</p>
              <p className="mt-4 text-sm leading-relaxed text-foreground/75" lang="fr">
                {f.pour}
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {f.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[13px] leading-relaxed">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
                    <span className="text-foreground/75">{p}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
        <p className="text-sm text-foreground/70" lang="fr">
          Copier, corriger et relire ne consomment rien, et un échec technique rend le
          crédit. Le détail de ce qui est facturé et de ce qui ne l’est pas est sur{" "}
          <Link href="/frais-de-service" className="font-semibold text-primary hover:underline">
            la page des frais de service
          </Link>
          .
        </p>
      </section>

      {/* ═══ 6. POUR ALLER PLUS LOIN ═══════════════════════════════════════
          ⚠ CES LIENS NE SONT PAS DU REMPLISSAGE : les guides des écrits
          professionnels sont le travail de référencement du site (voir le
          benchmark du 2/09). Une page LEX qui ne pointe pas dessus laisse ces
          neuf guides sans lien depuis la page la plus proche de leur sujet. */}
      <section className="rounded-2xl border border-border bg-card p-8">
        <h2 className="text-xl font-bold tracking-tight">Avant même d’écrire une ligne</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-foreground/75" lang="fr">
          Nos guides des écrits professionnels sont en libre accès, sans compte&nbsp;: ce qu’on
          attend d’un rapport de situation, d’une note d’incident, d’un courrier aux parents, et
          ce que les textes disent vraiment. Plusieurs règles que tout le monde cite n’existent
          pas.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/ressources"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold transition hover:bg-muted"
          >
            Les ressources gratuites à télécharger
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/guides"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold transition hover:bg-muted"
          >
            Les guides des écrits professionnels
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/comparatif-assistants-redaction"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold transition hover:bg-muted"
          >
            Comparer les assistants de rédaction
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
    </div>
  );
}
