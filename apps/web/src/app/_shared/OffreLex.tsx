// Ce que LEX apporte concrètement. Écrit du point de vue du bénéfice — le
// temps gagné, la charge mentale en moins — parce qu’un éducateur n’achète
// pas de l’IA : il achète une soirée de moins passée à rédiger.
//
// Le bloc était un aplat crème de bout en bout : quatre cartes blanches sur
// fond clair, un encadré vert pâle, et quatre paragraphes de détail que
// personne ne lit debout. Chaque outil porte maintenant sa couleur, le détail
// tient en une ligne, et les garanties passent sur une bande sombre — c’est
// elle qui referme le bloc au lieu de le laisser se dissoudre.
import {
  PenLine,
  Lightbulb,
  FileText,
  MessageCircle,
  ShieldCheck,
  Lock,
  Scale,
  Check,
  X,
  EyeOff,
  Stethoscope,
  AlignLeft,
} from "lucide-react";

/**
 * « POURQUOI PAS SIMPLEMENT CHATGPT ? » — LA QUESTION, EN TROIS LIGNES.
 *
 * ⚠⚠ ELLE TENAIT EN SEPT PARAGRAPHES SUR L'ACCUEIL, ET ELLE DISAIT DEUX FOIS
 * LA MÊME CHOSE. Le bloc pesait ~250 mots au-dessus de ce composant — et ses
 * trois arguments étaient déjà repris, mot pour mot, par la bande GARANTIES
 * quelques centimètres plus bas : « les noms ne sortent jamais », « rien n'est
 * enregistré sans vous », « LEX propose, vous décidez ». Personne ne lit deux
 * fois le même argument ; on saute les deux.
 *
 * Il est donc DANS ce composant, et plus au-dessus : une seule unité visuelle,
 * de la question jusqu'aux garanties. ⚠ NE PAS LE REMETTRE DANS `page.tsx` —
 * c'est la séparation qui avait produit la redite.
 *
 * ⚠ AUCUN « MEILLEUR QUE », AUCUN CHIFFRE DE COMPARAISON. On décrit un
 * comportement observable de part et d'autre, le lecteur conclut. Une
 * comparaison chiffrée contre un produit nommé se défend devant un juge
 * (art. L122-1 c. conso) ; un fait vérifiable, non.
 */
const DIFFERENCES = [
  {
    icone: EyeOff,
    sujet: "Les noms",
    generaliste: "Voit les vrais noms",
    lex: "Les remplace par [la mère], [l’éducateur] — et vous montre le texte exact qui part.",
  },
  {
    icone: Stethoscope,
    sujet: "Le cadre",
    generaliste: "Répond, même quand ça relève du soin",
    lex: "Aucun diagnostic : il renvoie à l’équipe pluridisciplinaire et aux soignants.",
  },
  {
    icone: AlignLeft,
    sujet: "La forme",
    generaliste: "Rend un texte à reformater",
    lex: "Rend le genre attendu : observé d’un côté, interprété de l’autre.",
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

const GARANTIES = [
  {
    icone: ShieldCheck,
    titre: "Les noms ne sortent jamais",
    points: [
      "Prénoms, dates et coordonnées deviennent des jetons",
      "Le remplacement se fait avant l’envoi au modèle",
    ],
  },
  {
    icone: Lock,
    titre: "Rien n’est enregistré sans vous",
    points: [
      "Ni les notes brutes, ni le brouillon",
      "Seule la version que vous validez est gardée",
    ],
  },
  {
    icone: Scale,
    titre: "LEX propose, vous décidez",
    points: [
      "Aucun diagnostic, aucune décision",
      "La responsabilité de l’écrit reste la vôtre",
    ],
  },
];

export function OffreLex() {
  return (
    <div className="space-y-8">
      {/*
        La question ouvre le bloc — c'est celle que tout le monde se pose et
        que personne ne posait à voix haute. Trois lignes, trois mécanismes
        vérifiables dans le produit.
      */}
      <section className="reflet relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/[0.12] via-card to-card p-6 md:p-7">
        <span
          className="animate-trait absolute left-0 top-6 bottom-6 w-[3px] rounded-full bg-primary"
          aria-hidden
        />
        <div className="pl-2">
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            «&nbsp;Pourquoi pas simplement ChatGPT&nbsp;?&nbsp;»
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground" lang="fr">
            Parce qu’une IA généraliste ne connaît ni vos écrits, ni vos obligations, ni les
            personnes que vous accompagnez.
          </p>

          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {DIFFERENCES.map((d) => {
              const Icone = d.icone;
              return (
                <li
                  key={d.sujet}
                  className="group rounded-xl border border-border bg-card/70 p-4 transition duration-300 hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="relative grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground transition-transform duration-300 group-hover:scale-110">
                      <Icone className="size-4" aria-hidden />
                      <span className="animate-anneau absolute inset-0 rounded-lg bg-primary" aria-hidden />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                      {d.sujet}
                    </span>
                  </div>

                  {/* Le comportement de l'IA généraliste, barré : on le lit
                      comme « ce qu'on ne veut pas », sans avoir à l'écrire. */}
                  <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground/80">
                    <X className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span className="line-through">{d.generaliste}</span>
                  </p>
                  <p className="mt-1.5 flex items-start gap-1.5 text-sm leading-relaxed text-foreground" lang="fr">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    <span>{d.lex}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

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

      {/* ⚠ CE BANDEAU ÉTAIT UN APLAT FRAMBOISE, ET IL NE SE LISAIT PAS.
          Du blanc sur du rose vif, en petit corps, sur trois colonnes serrées :
          les trois garanties les plus importantes du produit — celles qu'une
          direction lit avant de signer — étaient les moins lisibles de la page.

          Elles reviennent sur fond clair, en texte de lecture, avec de l'air
          entre les colonnes. La framboise reste, mais là où elle sert : le
          filet du haut, les pastilles, le titre. Une couleur d'accent
          n'accentue plus rien quand elle couvre tout. */}
      <div className="reflet overflow-hidden rounded-2xl border border-border bg-nacre shadow-card">
        <span className="block h-1.5 w-full bg-primary" aria-hidden />
        <div className="px-6 pt-7 md:px-9">
          <h3 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
            Utilisable dans le médico-social
          </h3>
          <p className="mt-1 text-base text-muted-foreground">Trois garanties, pas des intentions.</p>
        </div>
        {/* Trois colonnes bâties comme celles de « Trois besoins, un même
            chemin » : l'icône et le titre centrés en tête de colonne, puis une
            liste à puces alignée à gauche — une puce se lit, un paragraphe se
            saute. Le corps est celui du texte courant, pas du petit texte. */}
        <ul className="grid gap-9 px-6 py-8 md:grid-cols-3 md:gap-10 md:px-9 md:py-10">
          {GARANTIES.map((g) => {
            const Icone = g.icone;
            return (
              <li key={g.titre}>
                <span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icone className="size-6" aria-hidden />
                </span>
                <h4 className="mt-4 text-center text-lg font-bold leading-snug text-foreground text-balance">
                  {g.titre}
                </h4>
                <ul className="mt-4 space-y-2.5">
                  {g.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-base leading-relaxed text-muted-foreground">
                      <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
