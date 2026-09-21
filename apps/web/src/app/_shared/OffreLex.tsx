// CE QUE LEX APPORTE — en deux blocs, pas en trois.
//
// ⚠⚠ REFONTE DU 16/09/2026 (demande de Siham : « il y a trop de parties »).
// Le composant empilait TROIS encadrés — « Pourquoi pas simplement ChatGPT ? »
// (3 cartes), les quatre outils, puis « Utilisable dans le médico-social »
// (3 colonnes de garanties) — soit dix cartes pour une seule section.
//
// Et deux de ces trois blocs disaient LA MÊME CHOSE, à deux écrans d'écart :
//   « Les noms »  ↔  « Les noms ne sortent jamais »
//   « Le cadre : aucun diagnostic »  ↔  « LEX propose, vous décidez : aucun
//      diagnostic, aucune décision »
// C'est exactement la redite que le déplacement du bloc ChatGPT dans ce
// composant devait supprimer — elle avait seulement changé de place.
//
// ⚠ LA SORTIE N'EST PAS DE COUPER DU TEXTE, C'EST DE LE MONTRER. Les garanties
// sont des étapes d'un trajet : les notes partent, les noms sont retirés, le
// modèle écrit, la personne relit. Un schéma dit ça d'un coup d'œil là où trois
// colonnes de puces demandent d'être lues. Le schéma remplace donc les deux
// blocs de texte, et la réponse à « pourquoi pas ChatGPT » tient en une ligne
// sous le trajet : une IA généraliste n'a ni l'étape 2, ni l'étape 4.
//
// ⚠ AUCUN « MEILLEUR QUE », AUCUN CHIFFRE DE COMPARAISON. On décrit un
// comportement observable de part et d'autre, le lecteur conclut. Une
// comparaison chiffrée contre un produit nommé se défend devant un juge
// (art. L122-1 c. conso) ; un fait vérifiable, non.
//
// ⚠ NE PAS REMETTRE UN BLOC « POURQUOI PAS CHATGPT » DANS `page.tsx` : c'est
// la séparation des deux qui avait produit la redite la première fois.
import Link from "next/link";
import {
  PenLine,
  Lightbulb,
  FileText,
  MessageCircle,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * LE TRAJET D'UN ÉCRIT — en SVG animé, pas en GIF.
 *
 * ⚠ VOLONTAIREMENT PAS UN FICHIER .GIF, et il ne faut pas le remplacer par un.
 * Un GIF pèse des centaines de kilo-octets pour un trait et quatre cercles, il
 * arrive pixellisé sur un écran moderne, il ne sait pas changer de couleur
 * entre le thème clair et le thème sombre, et il continue de tourner quand le
 * visiteur a demandé moins d'animations. Ce SVG fait le même travail en deux
 * kilo-octets, prend `currentColor`, et s'arrête sous `prefers-reduced-motion`
 * (les trois classes utilisées sont déjà dans la liste coupée de `globals.css`).
 *
 * ⚠ LES JALONS SONT AUX CENTRES DES QUATRE COLONNES (12,5 % · 37,5 % · 62,5 %
 * · 87,5 %) : c'est ce qui aligne le rail avec la grille HTML posée dessous.
 * Changer le nombre d'étapes oblige à recalculer les deux.
 */
function RailQuatreEtapes() {
  const positions = [12.5, 37.5, 62.5, 87.5];
  return (
    <svg
      viewBox="0 0 400 26"
      preserveAspectRatio="none"
      className="h-[26px] w-full text-primary"
      role="img"
      aria-label="Le trajet d’un écrit, en quatre étapes : vos notes, les noms sont retirés, le modèle écrit, vous relisez."
    >
      {/* Le rail en clair : il dit où ça va avant que la bille n'y aille. */}
      <line
        x1="50"
        y1="13"
        x2="350"
        y2="13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.2"
      />
      <line
        x1="50"
        y1="13"
        x2="350"
        y2="13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="animate-rail"
      />
      {positions.map((p, i) => (
        <circle
          key={p}
          cx={p * 4}
          cy="13"
          r="6"
          fill="currentColor"
          className="animate-jalon"
          style={{ animationDelay: `${260 + i * 340}ms` }}
        />
      ))}
      {/* La bille boucle : c'est elle qui rend le schéma vivant, et c'est la
          seule animation en boucle du bloc. */}
      <circle cx="50" cy="13" r="3.5" fill="currentColor" className="animate-bille" />
    </svg>
  );
}

/**
 * LES QUATRE ÉTAPES — et chacune porte une garantie plutôt qu'une promesse.
 *
 * ⚠ CE SONT LES ANCIENNES « TROIS GARANTIES », REMISES À LEUR PLACE. Elles
 * vivaient dans un encadré séparé, en trois colonnes de puces : des affirmations
 * hors sol, qu'il fallait croire. Posées sur les étapes du trajet, elles
 * deviennent vérifiables — on voit À QUEL MOMENT les noms partent, et à quel
 * moment la personne reprend la main.
 */
const ETAPES = [
  {
    numero: "1",
    titre: "Vos notes",
    texte: "Écrites comme elles viennent, avec les vrais prénoms.",
    exemple: "Kevin a refusé de se lever, 3ᵉ fois cette semaine.",
    tonExemple: "text-muted-foreground",
  },
  {
    numero: "2",
    titre: "Les noms partent",
    texte: "Prénoms, dates et coordonnées deviennent des jetons, avant l’envoi.",
    exemple: "[le jeune] a refusé de se lever, 3ᵉ fois cette semaine.",
    tonExemple: "text-primary",
    /** L'étape qui fait toute la différence : elle est mise en avant. */
    cle: true,
  },
  {
    numero: "3",
    titre: "Le modèle écrit",
    texte: "Il ne voit jamais un prénom. Aucun diagnostic : il renvoie à l’équipe.",
    exemple: "Observé d’un côté, interprété de l’autre.",
    tonExemple: "text-muted-foreground",
  },
  {
    numero: "4",
    titre: "Vous relisez",
    texte: "Les vrais noms reviennent chez vous. Rien n’est gardé sans votre accord.",
    exemple: "Kevin a refusé de se lever…",
    tonExemple: "text-muted-foreground",
  },
];

const PRODUITS = [
  {
    icone: PenLine,
    nom: "Assistant d’écriture",
    promesse: "Vos notes brutes deviennent un écrit professionnel",
    detail: "Cinq trames : observation, synthèse, rapport, transmission, projet personnalisé.",
    gain: "≈ 30 min → 3 min",
    bordure: "border-primary/40",
    fond: "bg-gradient-to-br from-primary/[0.18] via-card to-card",
    lisere: "bg-primary",
    pastille: "bg-primary text-primary-foreground",
    teinte: "text-primary",
    puce: "border-primary/30 bg-primary/10 text-primary",
  },
  {
    icone: Lightbulb,
    nom: "Générateur d’activités",
    promesse: "Une séance construite à partir du besoin réel",
    detail: "Objectifs, matériel, déroulé en quatre temps, points de vigilance.",
    gain: "La séance en 15 secondes",
    bordure: "border-secondary/40",
    fond: "bg-gradient-to-br from-secondary/[0.18] via-card to-card",
    lisere: "bg-secondary",
    pastille: "bg-secondary text-secondary-foreground",
    teinte: "text-secondary",
    puce: "border-secondary/30 bg-secondary/10 text-secondary",
  },
  {
    icone: FileText,
    nom: "Remplissage de fiches",
    promesse: "Publier un atelier sans y passer l’après-midi",
    detail: "Trois lignes de brief : titre, description, public, durée, objectifs.",
    gain: "La friction n°1 des intervenants",
    bordure: "border-amber-500/40",
    fond: "bg-gradient-to-br from-amber-500/[0.18] via-card to-card",
    lisere: "bg-amber-500",
    pastille: "bg-amber-500 text-amber-950",
    teinte: "text-amber-600",
    puce: "border-amber-500/40 bg-amber-500/15 text-amber-600",
  },
  {
    icone: MessageCircle,
    nom: "Bot d’aide",
    promesse: "Une réponse sur la plateforme, tout de suite",
    detail: "Il répond sur le fonctionnement du site, à toute heure.",
    gain: "Pas d’attente, pas de ticket",
    bordure: "border-emerald-600/40",
    fond: "bg-gradient-to-br from-emerald-600/[0.18] via-card to-card",
    lisere: "bg-emerald-600",
    pastille: "bg-emerald-600 text-white",
    teinte: "text-emerald-600",
    puce: "border-emerald-600/40 bg-emerald-600/15 text-emerald-600",
  },
];

export function OffreLex() {
  return (
    <div className="space-y-8">
      {/* ═══ 1. LE TRAJET D'UN ÉCRIT — le schéma, et les garanties dessus ═══ */}
      <section className="reflet relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/[0.10] via-card to-card p-6 md:p-8">
        <span
          className="animate-trait absolute left-0 top-6 bottom-6 w-[3px] rounded-full bg-primary"
          aria-hidden
        />
        <div className="pl-2">
          <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
            Ce qui part, et ce qui revient
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground" lang="fr">
            Le même écrit, à chaque étape. C’est le seul endroit du produit où il
            faut regarder avant de s’en servir avec de vraies situations.
          </p>

          {/* Le rail, aligné sur les colonnes posées juste en dessous. */}
          <div className="mt-7 hidden md:block">
            <RailQuatreEtapes />
          </div>

          <ol className="mt-3 grid gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-5">
            {ETAPES.map((e) => (
              <li
                key={e.numero}
                className={
                  "rounded-xl border p-4 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg " +
                  (e.cle
                    ? "border-primary/45 bg-primary/[0.07] shadow-card"
                    : "border-border bg-card/70")
                }
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={
                      "relative grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold " +
                      (e.cle
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground")
                    }
                  >
                    {e.numero}
                    {/* L'anneau ne pulse que sur l'étape qui fait la
                        différence : quatre anneaux qui pulsent ne signalent
                        plus rien. */}
                    {e.cle ? (
                      <span
                        className="animate-anneau absolute inset-0 rounded-lg bg-primary"
                        aria-hidden
                      />
                    ) : null}
                  </span>
                  <h4 className="text-sm font-bold leading-snug text-foreground">{e.titre}</h4>
                </div>
                <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground" lang="fr">
                  {e.texte}
                </p>
                {/*
                  ⚠ L'EXEMPLE EST LE MÊME TEXTE À QUATRE MOMENTS, et c'est lui
                  qui fait la démonstration : on voit « Kevin » devenir
                  « [le jeune] », puis redevenir « Kevin » chez soi. Une phrase
                  de garantie ne prouve rien ; cette transformation, si.
                */}
                <p
                  className={
                    "mt-3 rounded-lg border border-border/70 bg-background/60 px-2.5 py-2 font-mono text-[11px] leading-relaxed " +
                    e.tonExemple
                  }
                  lang="fr"
                >
                  {e.exemple}
                </p>
              </li>
            ))}
          </ol>

          {/*
            ⚠ « POURQUOI PAS CHATGPT » TIENT ICI, EN UNE LIGNE. La question
            occupait trois cartes ; le schéma au-dessus ayant déjà montré les
            quatre étapes, il ne reste qu'à dire lesquelles manquent ailleurs.
            On ne nomme aucun produit et on n'affirme rien de « meilleur » : on
            décrit deux comportements, le lecteur conclut.
          */}
          <div className="mt-6 rounded-xl border border-border bg-card/70 p-4">
            <p className="text-sm font-semibold text-foreground" lang="fr">
              «&nbsp;Pourquoi pas simplement une IA généraliste&nbsp;?&nbsp;»
            </p>
            <ul className="mt-2.5 grid gap-2 sm:grid-cols-2">
              <li className="flex items-start gap-2 text-[13px] leading-relaxed text-muted-foreground/80">
                <X className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>
                  Elle n’a ni l’étape&nbsp;2 ni l’étape&nbsp;4 : elle voit les vrais noms, et
                  garde ce qu’on lui donne.
                </span>
              </li>
              <li className="flex items-start gap-2 text-[13px] leading-relaxed text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  Elle répond aussi quand la question relève du soin. LEX renvoie à l’équipe
                  pluridisciplinaire.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ═══ 2. LES QUATRE OUTILS ═══ */}
      <ul className="grid gap-4 md:grid-cols-2">
        {PRODUITS.map((p) => {
          const Icone = p.icone;
          return (
            <li
              key={p.nom}
              className={
                "group relative overflow-hidden rounded-2xl border p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl " +
                p.bordure +
                " " +
                p.fond
              }
            >
              <span className={"absolute inset-x-0 top-0 h-1 " + p.lisere} aria-hidden />
              <div className="relative flex items-start gap-4">
                <span
                  className={
                    "grid size-11 shrink-0 place-items-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 " +
                    p.pastille
                  }
                >
                  <Icone className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold tracking-tight">{p.nom}</h3>
                  <p className={"mt-0.5 text-sm font-semibold " + p.teinte}>{p.promesse}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.detail}</p>
                  <p
                    className={
                      "mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold " + p.puce
                    }
                  >
                    {p.gain}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* ═══ 3. L'APPEL À L'ACTION ═══
          ⚠ LA SECTION LEX N'EN AVAIT AUCUN (ajouté le 16/09/2026, demande de
          Siham). On montrait le trajet d'un écrit et les quatre outils, puis la
          page passait aux tarifs : la seule section du site qui décrive un
          produit payant ne proposait rien à faire. Le lecteur qui venait d'être
          convaincu devait remonter chercher un bouton ailleurs.

          ⚠ LE LIBELLÉ EST « CRÉER UN COMPTE », EXACTEMENT COMME L'AUTRE BOUTON
          DE LA PAGE QUI MÈNE À `/register`. Un libellé par destination : c'est
          la règle posée le 12/08 puis re-cassée le 3/09 par un « Découvrir
          LEX » qui promettait une découverte et livrait un formulaire
          d'inscription. Tout libellé de ce bloc qui s'écarterait de celui-ci
          ferait croire à une seconde destination.

          ⚠ AUCUN PRIX ÉCRIT ICI. Les trois montants sont dans la section
          « Tarifs », une seule fois, et c'est là qu'ils se comparent. Ce qui
          est annoncé — quinze générations offertes chaque mois, sans carte
          bancaire, sans date de fin — est la dotation gratuite permanente
          telle que le code la pose (`credits.constants.ts`) : ce n'est pas un
          essai, et l'écrire autrement serait un compte à rebours qui n'existe
          pas.

          ⚠ LE SECOND LIEN EST UNE SORTIE, PAS UNE SECONDE ACTION. Quelqu'un qui
          hésite sur les données ne s'inscrira pas : il veut lire le cadre
          avant. Le libellé est celui du pied de page, pour la même raison que
          ci-dessus. */}
      <div className="rounded-2xl border-2 border-primary/30 bg-primary-soft p-6 text-center md:p-8">
        <p className="text-lg font-bold tracking-tight text-accent-foreground md:text-xl" lang="fr">
          Quinze générations offertes chaque mois, sans carte bancaire.
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-accent-foreground/80" lang="fr">
          Sans date de fin&nbsp;: c’est la dotation du compte gratuit, pas un essai. Vous
          écrivez votre première observation avec vos propres mots, et vous jugez sur le
          résultat.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild variant="primary" size="lg">
            <Link href="/register">
              Créer un compte
              <ArrowRight />
            </Link>
          </Button>
          <Link
            href="/confiance-lex"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Cadre de confiance LEX
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
