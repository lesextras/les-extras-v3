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
  title: "LEX, l’assistant d’écriture des professionnels du médico-social",
  description:
    "Rapports, synthèses, transmissions : LEX met en forme vos observations sans jamais voir un nom. Quinze générations offertes chaque mois, sans carte bancaire.",
  path: "/lex",
});

/**
 * TROIS MOMENTS, PAS TROIS FONCTIONS.
 *
 * ⚠ CHAQUE ENTRÉE S'OUVRE SUR LA PHRASE DU COULOIR, celle qu'on s'entend dire
 * en vrai — pas sur le nom de l'outil. L'outil est nommé dans `reponse`, et
 * seulement là. Inverser les deux redonnerait une plaquette.
 */
const MOMENTS = [
  {
    icone: PenLine,
    quand: "Le soir, après le service",
    probleme:
      "« Le rapport de situation est pour demain. J’ai tout en tête, et je n’arrive pas à commencer. »",
    reponse:
      "Vous dictez ou collez vos notes telles qu’elles viennent. LEX rend un texte structuré, avec ce qui est observé d’un côté et ce qui est interprété de l’autre, que vous relisez et corrigez.",
    preuve: "Cinq trames : observation, synthèse, rapport, transmission, projet personnalisé.",
  },
  {
    icone: Sparkles,
    quand: "La veille d’une séance",
    probleme:
      "« Il faut faire quelque chose demain avec le groupe, et je n’ai ni idée ni temps de préparer. »",
    reponse:
      "Vous décrivez le besoin réel, l’âge, le nombre, ce qui coince. LEX propose une séance complète : objectifs, matériel, déroulé en quatre temps, points de vigilance.",
    preuve: "Une séance construite en quinze secondes, à ajuster ensuite.",
  },
  {
    icone: BookOpen,
    quand: "Quand il faut publier",
    probleme:
      "« Mon atelier est prêt depuis six mois. C’est la fiche à écrire qui me bloque. »",
    reponse:
      "Trois lignes de brief suffisent : LEX remplit le titre, la description, le public, la durée et les objectifs. Vous corrigez, vous publiez.",
    preuve: "C’est la friction numéro un des intervenants qui rejoignent le réseau.",
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
 * ⚠ LES MONTANTS SONT EN EUROS ENTIERS PARCE QUE LE CODE LES POSE AINSI
 * (1900, 4900, 8900, 900, 1900, 3900 centimes). Ne jamais écrire ici un prix
 * qui n'existe pas dans `billing.service.ts` — la règle n° 2 de ce projet.
 */
const FORMULES = [
  {
    nom: "Le compte gratuit",
    prix: "0 €",
    precision: "quinze générations chaque mois",
    pour: "Pour essayer sur de vrais écrits, sans rien engager.",
    points: [
      "Sans carte bancaire, sans date de fin",
      "Les générations non utilisées se reportent trois mois",
      "Tous les outils, sans restriction de fonction",
    ],
    vedette: true,
  },
  {
    nom: "LEX",
    prix: "19 €",
    precision: "par mois, 200 générations",
    pour: "Pour un professionnel qui écrit toutes les semaines.",
    points: ["Générations reportables", "Écriture, activités, fiches", "Sans engagement de durée"],
    vedette: false,
  },
  {
    nom: "LEX Pro",
    prix: "49 €",
    precision: "par mois, 600 générations",
    pour: "Pour un rythme d’écriture soutenu.",
    points: ["Générations reportables", "Support prioritaire", "Accompagnement à la prise en main"],
    vedette: false,
  },
  {
    nom: "LEX Équipe",
    prix: "89 €",
    precision: "par mois, pour tout l’établissement",
    pour: "Pour une équipe qui écrit avec les mêmes trames.",
    points: [
      "1 000 générations par mois, partagées",
      "Vos trames maison publiables à l’échelle de l’établissement",
      "La mise en relation reste gratuite, avec ou sans abonnement",
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
          Il est 21&nbsp;h, le rapport est pour demain, et la page est blanche.
        </h1>
        <p className="text-lg leading-relaxed text-foreground/75" lang="fr">
          Vous avez la situation entière en tête. Ce qui manque, ce n’est pas l’analyse&nbsp;: c’est
          la mise en forme, la phrase d’ouverture, le plan, le passage des notes du carnet à un
          document qu’un juge, une MDPH ou une famille va lire.
        </p>
        <p className="text-lg leading-relaxed text-foreground/75" lang="fr">
          LEX fait cette partie-là, et seulement celle-là. Il met en forme ce que{" "}
          <strong className="font-semibold text-foreground">vous</strong> avez observé,{" "}
          <strong className="font-semibold text-foreground">sans jamais voir un nom</strong>. Vous
          relisez, vous corrigez, vous signez&nbsp;: l’écrit reste le vôtre.
        </p>
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Créer un compte
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
          Quinze générations offertes chaque mois, sans carte bancaire et sans date de fin.
        </p>
      </header>

      {/* ═══ 2. TROIS MOMENTS DE LA SEMAINE ════════════════════════════════ */}
      <section className="space-y-6">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Trois moments où ça coince</h2>
          <p className="leading-relaxed text-foreground/75" lang="fr">
            Ce ne sont pas trois fonctions du logiciel&nbsp;: ce sont trois soirées de la semaine.
            Si aucune ne vous parle, LEX ne vous servira à rien, et il vaut mieux le savoir avant
            de créer un compte.
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
            Une génération = un écrit produit. Le compte gratuit n’est pas un essai&nbsp;: il n’a
            pas de date de fin, et il suffit à beaucoup de professionnels.
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
          Sans abonnement, des recharges ponctuelles existent aussi&nbsp;: 25 générations pour
          9&nbsp;€, 60 pour 19&nbsp;€, 150 pour 39&nbsp;€. Le détail de ce qui est facturé et de ce
          qui ne l’est pas est sur{" "}
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
