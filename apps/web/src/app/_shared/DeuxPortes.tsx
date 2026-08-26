// Les deux portes d'entrée, juste sous le hero.
//
// Un établissement et un intervenant ne cherchent pas la même chose et ne
// lisent pas la même page. Tant qu'on ne leur demande pas qui ils sont, on
// écrit pour les deux à la fois — donc pour personne. Ici on pose la question
// tout de suite, et chaque porte mène à son propre parcours.
import Link from "next/link";
import { ArrowRight, Building2, UserRound } from "lucide-react";

const PORTES = [
  {
    icone: Building2,
    qui: "Je suis un établissement",
    titre: "Trouver un intervenant et gérer vos remplacements",
    texte:
      "MECS, IME, ITEP, EHPAD, SESSAD. Un renfort ce soir, un atelier au trimestre, une formation pour l’équipe.",
    reperes: ["Renfort en cascade", "Ateliers clés en main", "Devis sous 48 h"],
    href: "/renforteam",
    secondaire: { libelle: "Voir le catalogue", href: "/ateliers" },
    // Chaque porte porte sa couleur de bout en bout : liseré, fond, pastille,
    // repères. Deux cartes posées sur le même fond ne se distinguaient que par
    // un anneau à 25 % — invisible en lecture rapide, et c’est justement là
    // que le lecteur choisit son camp.
    teinte: "text-primary",
    bordure: "border-primary/35",
    carte: "bg-gradient-to-br from-primary/[0.16] via-background to-background",
    lisere: "bg-primary",
    pastille: "bg-primary text-primary-foreground",
    puce: "border-primary/25 bg-primary/5",
    halo: "bg-primary/20",
  },
  {
    icone: UserRound,
    qui: "Je suis un professionnel",
    titre: "Trouver des missions et proposer vos services",
    texte:
      "Éducateur, moniteur, AES, psychologue. Vos missions près de chez vous, vos ateliers au catalogue, zéro commission.",
    reperes: ["0 % de commission", "Contrat et facture générés", "Profil vérifié une fois"],
    // La porte menait droit au formulaire d’inscription : on demandait de
    // créer un compte avant d’avoir rien expliqué. Les deux portes mènent
    // désormais à une page qui explique, l’inscription est le lien secondaire.
    href: "/intervenant-independant",
    secondaire: { libelle: "Créer mon compte", href: "/register" },
    teinte: "text-secondary",
    bordure: "border-secondary/35",
    carte: "bg-gradient-to-br from-secondary/[0.16] via-background to-background",
    lisere: "bg-secondary",
    pastille: "bg-secondary text-secondary-foreground",
    puce: "border-secondary/25 bg-secondary/5",
    halo: "bg-secondary/20",
  },
];

export function DeuxPortes() {
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto max-w-[1360px] px-6 py-14 md:px-10 md:py-16">
        {/* La question était posée en petit gris, plus discrète que les deux
            cartes qu’elle annonce : c’est pourtant elle qui oriente toute la
            lecture de la page. */}
        <p className="text-center text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          Par où commencer ?
        </p>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {PORTES.map((p, i) => {
            const Icone = p.icone;
            return (
              <Link
                key={p.qui}
                href={p.href}
                className={
                  "group animate-fade-in-up " +
                  (i === 0 ? "stagger-1" : "stagger-2") +
                  " relative overflow-hidden rounded-2xl border " +
                  p.bordure +
                  " " +
                  p.carte +
                  " p-6 pt-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl md:p-8 md:pt-10"
                }
              >
                {/* Un liseré de la couleur du profil, et un fond dégradé qui en descend :
                    les deux cartes ne se confondent plus, même du coin de l’œil. */}
                <span className={"absolute inset-x-0 top-0 h-1.5 " + p.lisere} aria-hidden />
                <span
                  className={
                    "pointer-events-none absolute -right-16 -top-16 size-48 rounded-full " +
                    p.halo +
                    " opacity-50 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  }
                  aria-hidden
                />

                <div className="relative flex items-center gap-3">
                  <span
                    className={
                      "grid size-12 shrink-0 place-items-center rounded-xl shadow-sm transition-transform duration-300 group-hover:scale-110 " +
                      p.pastille
                    }
                  >
                    <Icone className="size-6" aria-hidden />
                  </span>
                  <span
                    className={
                      "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide " + p.pastille
                    }
                  >
                    {p.qui}
                  </span>
                </div>

                <p className="relative mt-5 text-[28px] font-bold leading-[1.15] tracking-tight text-foreground md:text-[34px]">
                  {p.titre}
                </p>
                <p className="relative mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                  {p.texte}
                </p>

                <ul className="relative mt-5 flex flex-wrap gap-2">
                  {p.reperes.map((r) => (
                    <li
                      key={r}
                      className={
                        "rounded-full border px-3 py-1 text-xs font-medium text-foreground/80 " + p.puce
                      }
                    >
                      {r}
                    </li>
                  ))}
                </ul>

                <p className={"relative mt-6 inline-flex items-center gap-1.5 text-sm font-bold " + p.teinte}>
                  Commencer
                  <ArrowRight
                    className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden
                  />
                </p>
              </Link>
            );
          })}
        </div>

        {/* Les liens secondaires sortent des cartes : un lien dans un lien n'est
            pas cliquable, et c'est un piège classique. */}
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {PORTES.filter((p: any) => p.secondaire).map((p: any) => (
            <p key={p.secondaire.href} className="text-center text-sm text-muted-foreground md:text-left md:pl-8">
              ou{" "}
              <Link href={p.secondaire.href} className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
                {p.secondaire.libelle}
              </Link>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
