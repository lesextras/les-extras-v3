// Ce que LEX apporte concrètement. Écrit du point de vue du bénéfice — le
// temps gagné, la charge mentale en moins — parce qu'un éducateur n'achète
// pas de l'IA : il achète une soirée de moins passée à rédiger.
import { PenLine, Lightbulb, FileText, MessageCircle, ShieldCheck, Clock } from "lucide-react";

const PRODUITS = [
  {
    icone: PenLine,
    nom: "Assistant d'écriture",
    promesse: "Vos notes brutes deviennent un écrit professionnel",
    detail:
      "Note d'observation, synthèse, rapport, transmission, projet personnalisé : cinq trames. Vous écrivez comme sur un carnet, LEX structure, vous relisez et corrigez.",
    gain: "≈ 30 min → 3 min par écrit",
  },
  {
    icone: Lightbulb,
    nom: "Générateur d'activités",
    promesse: "Une séance construite à partir du besoin réel",
    detail:
      "Vous décrivez le public et ce que vous voulez travailler. LEX propose objectifs, matériel, déroulé en quatre temps, points de vigilance et indicateurs d'observation.",
    gain: "La séance en 15 secondes",
  },
  {
    icone: FileText,
    nom: "Remplissage de fiches",
    promesse: "Publier un atelier sans y passer l'après-midi",
    detail:
      "Un brief de trois lignes suffit : LEX propose le titre, la description, le public visé, la durée et les objectifs. Vous ajustez, vous publiez.",
    gain: "La friction n°1 des intervenants",
  },
  {
    icone: MessageCircle,
    nom: "Bot d'aide",
    promesse: "Une réponse sur la plateforme, tout de suite",
    detail:
      "Intégré au site et à votre espace. Il répond sur le fonctionnement de la plateforme et refuse poliment tout ce qui sort de son champ.",
    gain: "Pas d'attente, pas de ticket",
  },
];

const GARANTIES = [
  {
    icone: ShieldCheck,
    titre: "Les noms ne quittent jamais votre écran",
    texte:
      "Prénoms, dates et coordonnées sont remplacés par des jetons avant l'envoi au modèle, puis restaurés localement. Le modèle ne voit jamais l'identité d'une personne accompagnée.",
  },
  {
    icone: FileText,
    titre: "Rien n'est enregistré sans vous",
    texte:
      "Ni les notes brutes, ni le brouillon. Seule la version que vous validez est sauvegardée, par une action explicite de votre part.",
  },
  {
    icone: Clock,
    titre: "LEX propose, vous décidez",
    texte:
      "Aucun diagnostic, aucune interprétation clinique, aucune décision. La responsabilité de l'écrit et de l'activité reste entièrement la vôtre.",
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
              className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40"
            >
              <div className="flex items-start gap-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-accent-foreground">
                  <Icone className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold">{p.nom}</h3>
                  <p className="text-sm font-medium text-primary">{p.promesse}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.detail}</p>
                  <p className="mt-3 inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {p.gain}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl border border-border bg-[hsl(222,22%,13%)] p-6 md:p-8">
        <h3 className="font-semibold">Ce qui rend LEX utilisable dans le médico-social</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Trois garanties, parce qu&apos;un outil qui touche à des écrits professionnels sur des
          personnes vulnérables n&apos;a pas droit à l&apos;à-peu-près.
        </p>
        <ul className="mt-5 grid gap-5 md:grid-cols-3">
          {GARANTIES.map((g) => {
            const Icone = g.icone;
            return (
              <li key={g.titre}>
                <Icone className="size-5 text-success" aria-hidden />
                <p className="mt-2 font-medium">{g.titre}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{g.texte}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
