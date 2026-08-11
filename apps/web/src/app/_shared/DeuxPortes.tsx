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
    titre: "Trouver un intervenant",
    texte: "MECS, IME, ITEP, EHPAD, SESSAD. Un renfort ce soir, un atelier au trimestre, une formation pour l'équipe.",
    reperes: ["Renfort en cascade", "Ateliers clés en main", "Devis sous 48 h"],
    href: "/sos-renfort",
    secondaire: { libelle: "Voir le catalogue", href: "/ateliers" },
    teinte: "text-primary",
    fond: "bg-primary/10",
    anneau: "ring-primary/25",
    halo: "bg-primary/20",
  },
  {
    icone: UserRound,
    qui: "Je suis un professionnel",
    titre: "Trouver des missions",
    texte: "Éducateur, moniteur, AES, psychologue. Vos missions près de chez vous, vos ateliers au catalogue, zéro commission.",
    reperes: ["0 % de commission", "Contrat et facture générés", "Profil vérifié une fois"],
    href: "/register",
    secondaire: { libelle: "Devenir intervenant", href: "/intervenants" },
    teinte: "text-secondary",
    fond: "bg-secondary/10",
    anneau: "ring-secondary/25",
    halo: "bg-secondary/20",
  },
];

export function DeuxPortes() {
  return (
    <section className="border-y border-border bg-card/40">
      <div className="mx-auto max-w-[1360px] px-6 py-14 md:px-10 md:py-16">
        <p className="text-center text-sm font-medium text-muted-foreground">
          Par où commencer ?
        </p>

        <div className="mt-7 grid gap-5 md:grid-cols-2">
          {PORTES.map((p, i) => {
            const Icone = p.icone;
            return (
              <Link
                key={p.qui}
                href={p.href}
                className={`group animate-fade-in-up ${
                  i === 0 ? "stagger-1" : "stagger-2"
                } relative overflow-hidden rounded-2xl bg-background p-6 ring-1 ring-inset ${p.anneau} transition-all duration-300 hover:-translate-y-1 hover:shadow-card md:p-8`}
              >
                {/* Le halo grandit au survol : la carte répond avant le clic. */}
                <span
                  className={`pointer-events-none absolute -right-16 -top-16 size-48 rounded-full ${p.halo} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100`}
                  aria-hidden
                />

                <div className="relative flex items-center gap-3">
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-xl ${p.fond} ${p.teinte} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icone className="size-5" aria-hidden />
                  </span>
                  <span className={`text-sm font-semibold ${p.teinte}`}>{p.qui}</span>
                </div>

                <p className="relative mt-5 text-2xl font-semibold tracking-tight text-foreground md:text-[26px]">
                  {p.titre}
                </p>
                <p className="relative mt-2 max-w-md text-[15px] leading-relaxed text-muted-foreground">
                  {p.texte}
                </p>

                <ul className="relative mt-5 flex flex-wrap gap-2">
                  {p.reperes.map((r) => (
                    <li
                      key={r}
                      className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/80"
                    >
                      {r}
                    </li>
                  ))}
                </ul>

                <p className={`relative mt-6 inline-flex items-center gap-1.5 text-sm font-semibold ${p.teinte}`}>
                  Commencer
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </p>
              </Link>
            );
          })}
        </div>

        {/* Les liens secondaires sortent des cartes : un lien dans un lien n'est
            pas cliquable, et c'est un piège classique. */}
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {PORTES.map((p) => (
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
