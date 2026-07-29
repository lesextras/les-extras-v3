import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Check, MonitorPlay, Users } from "lucide-react";
import { ContactForm } from "../../_shared/ContactForm";

export const metadata: Metadata = {
  title: "Demander une démonstration",
  description:
    "Vingt minutes en visio pour voir la plateforme sur votre propre besoin : renfort, ateliers, formations, conformité. Sans engagement.",
  alternates: { canonical: "/demo" },
};

// Le parcours d'inscription libre suffit à un chef de service curieux. Un groupe
// de dix établissements, non : il veut voir tourner l'outil sur son organisation
// avant d'engager quoi que ce soit. C'est cette porte-là qui manquait.

const DEROULE = [
  {
    icone: Users,
    titre: "On écoute d’abord",
    texte: "Vos unités, vos métiers en tension, votre façon de gérer les remplacements aujourd’hui.",
  },
  {
    icone: MonitorPlay,
    titre: "On montre sur votre cas",
    texte: "Pas une démonstration générique : on publie un vrai besoin, avec vos métiers et vos créneaux.",
  },
  {
    icone: CalendarClock,
    titre: "On repart avec un plan",
    texte: "Ce qui est gratuit, ce qui est facturé, et par quoi commencer dans votre structure.",
  },
];

const POUR_QUI = [
  "Groupes et sièges qui gèrent plusieurs établissements",
  "Directions qui veulent chiffrer avant d’engager",
  "Structures avec des besoins de renfort récurrents",
  "Équipes qui cherchent un plan de formation Qualiopi",
];

export default function DemoPage() {
  return (
    <div className="section">
      <div className="grid gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
        <div>
          <span className="eyebrow">
            <MonitorPlay className="size-3.5" aria-hidden />
            Démonstration
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground text-balance md:text-4xl">
            Vingt minutes, sur votre propre besoin
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
            En visio, avec quelqu’un qui connaît le médico-social. On vous montre la
            plateforme tourner sur votre organisation, pas sur un jeu de données inventé.
          </p>

          <ol className="mt-9 space-y-4">
            {DEROULE.map((d, i) => {
              const Icone = d.icone;
              return (
                <li
                  key={d.titre}
                  className={`animate-fade-in-up ${["stagger-1", "stagger-2", "stagger-3"][i]} flex gap-4`}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icone className="size-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-semibold text-foreground">{d.titre}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
                      {d.texte}
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-9 rounded-xl border border-border bg-card p-5">
            <p className="text-sm font-semibold text-foreground">Plutôt pour</p>
            <ul className="mt-3 space-y-2">
              {POUR_QUI.map((p) => (
                <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Vous êtes un intervenant, ou un établissement qui veut juste essayer ?{" "}
              <Link href="/register" className="font-medium text-primary hover:underline">
                Créez un compte
              </Link>
              , c’est gratuit et sans rendez-vous.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 md:p-7">
          <p className="text-lg font-semibold text-foreground">Prendre rendez-vous</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Laissez vos coordonnées, on revient vers vous sous 48 h ouvrées avec deux
            créneaux.
          </p>
          <div className="mt-6">
            <ContactForm
              sujets={[
                "Démonstration — établissement",
                "Démonstration — groupe ou siège",
                "Démonstration — plan de formation",
                "Démonstration — autre",
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
