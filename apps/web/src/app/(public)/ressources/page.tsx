import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Download, Sparkles } from "lucide-react";
import { metaPublique } from "@/lib/meta";
import { CATEGORIES_RESSOURCES, RESSOURCES, type CategorieRessource } from "@/lib/ressources";
import { METIERS_LEX, lienLex, type MetierLex } from "@/lib/lex-taches";

/**
 * LES RESSOURCES GRATUITES (01/10/2026, décision de Siham).
 *
 * Le mécanisme repris des blogs qui marchent (Lutin Bazar, MonÉcole) : une
 * ressource utile tout de suite, gratuite, sans e-mail, et sous chacune une
 * porte vers l'outil qui l'adapte à SA situation. Les filtres passent par
 * l'adresse (`?categorie=`, `?metier=`) : la page reste lisible sans
 * JavaScript et chaque filtre est une page que les moteurs indexent.
 */
export const metadata: Metadata = metaPublique({
  title: "Ressources gratuites : fiches activité, trames d’écrits, affiches",
  description:
    "Fiches activité, trames d’écrits, affiches et présentations à télécharger gratuitement, sans compte, pour l’éducation, l’animation et le social.",
  path: "/ressources",
});

type Params = Promise<Record<string, string | string[] | undefined>>;

const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function lien(categorie?: string, metier?: string) {
  const p = new URLSearchParams();
  if (categorie) p.set("categorie", categorie);
  if (metier) p.set("metier", metier);
  const q = p.toString();
  return q ? `/ressources?${q}` : "/ressources";
}

export default async function RessourcesPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;
  const categorie = CATEGORIES_RESSOURCES.find((c) => c.id === un(params.categorie))?.id as
    | CategorieRessource
    | undefined;
  const metier = METIERS_LEX.find((m) => m.id === un(params.metier))?.id as MetierLex | undefined;

  const visibles = RESSOURCES.filter(
    (r) => (!categorie || r.categorie === categorie) && (!metier || r.metiers.includes(metier)),
  );
  const sections = CATEGORIES_RESSOURCES.filter((c) => visibles.some((r) => r.categorie === c.id));

  const puce = (actif: boolean) =>
    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition " +
    (actif ? "border-foreground bg-foreground text-background" : "border-border bg-card hover:border-foreground/40");

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <span className="eyebrow">Gratuit · sans compte · sans e-mail</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance md:text-4xl">
          Des ressources prêtes à imprimer, pour demain matin
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Fiches activité, trames d’écrits, affiches et présentations, écrites par l’association
          ADéPA. Téléchargez, imprimez, copiez dans votre structure. Et quand la fiche standard ne
          colle pas à votre groupe, LEX l’adapte pour vous.
        </p>
      </header>

      <nav aria-label="Filtrer les ressources" className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Link href={lien(undefined, metier)} className={puce(!categorie)} aria-current={!categorie ? "page" : undefined}>
            Tout
          </Link>
          {CATEGORIES_RESSOURCES.map((c) => (
            <Link
              key={c.id}
              href={lien(c.id, metier)}
              className={puce(categorie === c.id)}
              aria-current={categorie === c.id ? "page" : undefined}
            >
              {c.titre}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Votre métier&nbsp;:</span>
          <Link href={lien(categorie, undefined)} className={puce(!metier)}>
            Tous
          </Link>
          {METIERS_LEX.map((m) => (
            <Link key={m.id} href={lien(categorie, m.id)} className={puce(metier === m.id)}>
              {m.label}
            </Link>
          ))}
        </div>
      </nav>

      {sections.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">
          Aucune ressource pour ce filtre pour l’instant.{" "}
          <Link href="/ressources" className="font-semibold text-primary hover:underline">
            Voir toutes les ressources
          </Link>
          .
        </p>
      ) : null}

      {sections.map((c) => (
        <section key={c.id} id={c.id} className="scroll-mt-24 space-y-5">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight">{c.titre}</h2>
            <p className="mt-1 text-muted-foreground">{c.texte}</p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibles
              .filter((r) => r.categorie === c.id)
              .map((r) => {
                const paysage = r.categorie === "presentations";
                return (
                  <li key={r.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
                    <a
                      href={r.fichier}
                      download
                      className="block border-b border-border bg-muted/40"
                      aria-label={`Télécharger ${r.titre} (PDF)`}
                    >
                      <Image
                        src={r.apercu}
                        alt={`Aperçu : ${r.titre}`}
                        width={520}
                        height={paysage ? 368 : 735}
                        className={paysage ? "aspect-[297/210] w-full object-cover" : "aspect-[4/3] w-full object-cover object-top"}
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      />
                    </a>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <span className="text-xs font-semibold uppercase tracking-wide text-primary">{r.theme}</span>
                      <h3 className="text-base font-semibold leading-snug">{r.titre}</h3>
                      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{r.description}</p>
                      <p className="text-xs text-muted-foreground">{r.format} · PDF gratuit</p>
                      <div className="flex flex-col gap-2">
                        <a
                          href={r.fichier}
                          download
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                        >
                          <Download className="size-4" aria-hidden />
                          Télécharger
                        </a>
                        {r.lex ? (
                          <Link
                            href={lienLex(r.lex.outil, r.lex.valeurs)}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold transition hover:bg-muted"
                          >
                            <Sparkles className="size-4 text-primary" aria-hidden />
                            {r.lex.libelle}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
          </ul>
        </section>
      ))}

      <section className="rounded-2xl border border-border bg-card p-8">
        <h2 className="text-xl font-bold tracking-tight">La fiche standard ne colle pas à votre groupe&nbsp;?</h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
          LEX prépare une activité pour votre âge, votre durée et votre matériel, améliore un écrit,
          ou transforme vos notes en compte rendu. Quinze résultats offerts chaque mois, sans carte
          bancaire. Les noms sont retirés avant l’envoi, et vous relisez tout.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/register?next=/dashboard/assistant"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Créer un compte pour écrire avec LEX
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/guides"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold transition hover:bg-muted"
          >
            Les guides des écrits professionnels
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Ces ressources sont libres d’utilisation et de copie dans votre structure. Elles ne se
          revendent pas. Les exemples qu’elles contiennent sont fictifs.
        </p>
      </section>
    </div>
  );
}
