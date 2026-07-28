"use client";

// Timeline par profil : ce que fait la plateforme, étape par étape, pour
// chaque type de compte. Le visiteur se reconnaît, puis suit son chemin.
import * as React from "react";
import Link from "next/link";
import { Building2, UserRound, Check, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Etape = { titre: string; texte: string; niveau: "gratuit" | "adhesion" | "usage" };

const PARCOURS: Record<"etablissement" | "intervenant", { etapes: Etape[]; cta: { href: string; label: string } }> = {
  etablissement: {
    cta: { href: "/register", label: "Créer un compte établissement" },
    etapes: [
      { niveau: "gratuit", titre: "Créez votre espace", texte: "Votre structure, vos unités, vos membres. En quelques minutes, sans engagement." },
      { niveau: "gratuit", titre: "Organisez votre équipe interne", texte: "Planning, missions confiées à vos propres salariés, messagerie, pointage des heures : tout est gratuit, pour toujours." },
      { niveau: "gratuit", titre: "Sécurisez vos obligations", texte: "Coffre-fort de conformité : CNI, casier, diplômes, URSSAF — avec alerte avant chaque expiration." },
      { niveau: "usage", titre: "Réservez un atelier du réseau", texte: "Quinze médiations clés en main. Devis sous 48 h, contrat et facture générés. Vous ne payez que la prestation." },
      { niveau: "usage", titre: "Publiez un SOS Renfort", texte: "Diffusion en cascade : votre équipe d'abord, puis les intervenants déjà venus, enfin le réseau. Le premier qui accepte est engagé." },
      { niveau: "usage", titre: "Formez vos équipes", texte: "Parcours certifiés Qualiopi, finançables par votre OPCO. Émargement, attestations et registre automatiques." },
      { niveau: "adhesion", titre: "Adhérez pour débloquer LEX", texte: "Assistant d'écriture, générateur d'activités éducatives et assistant intégré — l'IA au service de vos équipes." },
    ],
  },
  intervenant: {
    cta: { href: "/register", label: "Proposer mes services" },
    etapes: [
      { niveau: "gratuit", titre: "Créez votre profil", texte: "Diplômes, expériences, zones d'intervention. Profil vérifié par l'équipe : c'est ce qui rassure les établissements." },
      { niveau: "gratuit", titre: "Publiez vos ateliers", texte: "Vos médiations au catalogue, avec vos tarifs. Vous touchez 100 % de votre prix : aucune commission ne vous est prélevée." },
      { niveau: "gratuit", titre: "Répondez aux missions de renfort", texte: "Les opportunités qui correspondent à votre profil, classées par pertinence. Candidature en un clic." },
      { niveau: "gratuit", titre: "Animez des formations", texte: "Intervenez dans les parcours certifiants portés par la certification Qualiopi de l'association." },
      { niveau: "gratuit", titre: "Laissez la paperasse à la plateforme", texte: "Contrat, déclaration d'heures, facture : générés automatiquement. Vous facturez l'association, elle facture le client." },
      { niveau: "gratuit", titre: "Gagnez en visibilité", texte: "Avis après chaque mission, articles sur l'Édublog, points de fidélité : votre travail devient votre réputation." },
      { niveau: "adhesion", titre: "Adhérez pour débloquer LEX", texte: "Vos notes brutes deviennent des écrits professionnels, et l'IA conçoit vos activités éducatives." },
    ],
  },
};

const BADGE: Record<Etape["niveau"], { label: string; classe: string; icone: typeof Check }> = {
  gratuit: { label: "Gratuit", classe: "bg-success/15 text-success", icone: Check },
  usage: { label: "À l'usage", classe: "bg-secondary/15 text-secondary", icone: ArrowRight },
  adhesion: { label: "Adhésion", classe: "bg-primary/15 text-primary", icone: Lock },
};

export function TimelineParcours() {
  const [profil, setProfil] = React.useState<"etablissement" | "intervenant">("etablissement");
  const data = PARCOURS[profil];

  return (
    <div>
      {/* Sélecteur de profil */}
      <div className="mx-auto flex w-fit rounded-full border border-border bg-card p-1">
        {([
          ["etablissement", "Je suis un établissement", Building2],
          ["intervenant", "Je suis un intervenant", UserRound],
        ] as const).map(([cle, label, Icone]) => (
          <button
            key={cle}
            type="button"
            onClick={() => setProfil(cle)}
            aria-pressed={profil === cle}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors md:px-5",
              profil === cle
                ? "bg-primary text-primary-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icone className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Fil vertical */}
      <ol className="relative mx-auto mt-10 max-w-2xl border-l border-border pl-8">
        {data.etapes.map((e, i) => {
          const b = BADGE[e.niveau];
          const Icone = b.icone;
          return (
            <li key={e.titre} className="relative pb-8 last:pb-0">
              <span className="absolute -left-[41px] grid size-8 place-items-center rounded-full border border-border bg-card text-xs font-bold text-foreground">
                {i + 1}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold">{e.titre}</h3>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", b.classe)}>
                  <Icone className="size-3" />
                  {b.label}
                </span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{e.texte}</p>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 text-center">
        <Button asChild size="lg">
          <Link href={data.cta.href}>
            {data.cta.label}
            <ArrowRight />
          </Link>
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Gratuit = sans limite de durée · À l'usage = vous payez la prestation · Adhésion = LEX inclus
        </p>
      </div>
    </div>
  );
}
