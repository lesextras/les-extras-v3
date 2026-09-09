// Ce que LEX apporte concrètement. Écrit du point de vue du bénéfice — le
// temps gagné, la charge mentale en moins — parce qu’un éducateur n’achète
// pas de l’IA : il achète une soirée de moins passée à rédiger.
//
// Le bloc était un aplat crème de bout en bout : quatre cartes blanches sur
// fond clair, un encadré vert pâle, et quatre paragraphes de détail que
// personne ne lit debout. Chaque outil porte maintenant sa couleur, le détail
// tient en une ligne, et les garanties passent sur une bande sombre — c’est
// elle qui referme le bloc au lieu de le laisser se dissoudre.
import { PenLine, Lightbulb, FileText, MessageCircle, ShieldCheck, Lock, Scale } from "lucide-react";

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
    texte: "Prénoms et coordonnées sont remplacés avant l’envoi.",
  },
  {
    icone: Lock,
    titre: "Rien n’est enregistré sans vous",
    texte: "Seule la version que vous validez est gardée.",
  },
  {
    icone: Scale,
    titre: "LEX propose, vous décidez",
    texte: "Aucun diagnostic : l’écrit reste le vôtre.",
  },
];

export function OffreLex() {
  return (
    <div className="space-y-8">
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
        <ul className="grid gap-7 px-6 py-7 md:grid-cols-3 md:gap-9 md:px-9 md:py-9">
          {GARANTIES.map((g) => {
            const Icone = g.icone;
            return (
              <li key={g.titre}>
                <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icone className="size-5" aria-hidden />
                </span>
                <h4 className="mt-3.5 text-base font-bold text-foreground">{g.titre}</h4>
                <p className="mt-1.5 text-base leading-relaxed text-muted-foreground">{g.texte}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
