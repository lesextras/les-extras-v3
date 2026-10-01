import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Download,
  FileSpreadsheet,
  FileText,
  Presentation,
  Search,
  Sparkles,
} from "lucide-react";
import { metaPublique } from "@/lib/meta";
import {
  CATEGORIES_RESSOURCES,
  FORMATS_RESSOURCES,
  INCONTOURNABLES,
  PUBLICS_RESSOURCES,
  RESSOURCES,
  formatsDe,
  normaliserRecherche,
  type CategorieRessource,
  type FormatModifiable,
  type FormatRessource,
  type PublicRessource,
  type Ressource,
} from "@/lib/ressources";
import { METIERS_LEX, lienLex, type MetierLex } from "@/lib/lex-taches";

/**
 * LA BANQUE D'OUTILS GRATUITS (01/10/2026, décision de Siham).
 *
 * Le mécanisme repris des blogs qui marchent (Lutin Bazar, MonÉcole, les
 * blogs d'éducateurs) : beaucoup d'outils utiles tout de suite, gratuits,
 * sans e-mail, rangés et filtrables, et sous chacun une porte vers l'outil
 * qui l'adapte à SA situation. Les filtres passent par l'adresse
 * (`?categorie=`, `?public=`, `?metier=`, `?format=`, `?q=`) : la page reste
 * lisible sans JavaScript et chaque filtre est une page que les moteurs
 * indexent.
 */
export const metadata: Metadata = metaPublique({
  title: "Outils gratuits à télécharger : éducation, animation, social",
  description:
    "Plus de 100 outils gratuits sans compte : emplois du temps visuels, tableaux de motivation, grilles d’observation, trames d’écrits, jeux. PDF et Word.",
  path: "/ressources",
});

type Params = Promise<Record<string, string | string[] | undefined>>;
type Filtres = {
  categorie?: CategorieRessource;
  public?: PublicRessource;
  metier?: MetierLex;
  format?: FormatRessource;
  q?: string;
};

const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function lien(f: Filtres, change: Partial<Filtres>) {
  const suite = { ...f, ...change };
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(suite)) if (v) p.set(k, v);
  const q = p.toString();
  return q ? `/ressources?${q}` : "/ressources";
}

const ICONE: Record<FormatModifiable, typeof FileText> = {
  word: FileText,
  excel: FileSpreadsheet,
  powerpoint: Presentation,
};
const LIBELLE: Record<FormatModifiable, string> = {
  word: "Word",
  excel: "Excel",
  powerpoint: "PowerPoint",
};

function correspond(r: Ressource, f: Filtres) {
  if (f.categorie && r.categorie !== f.categorie) return false;
  if (f.public && !r.publics.includes(f.public)) return false;
  if (f.metier && !r.metiers.includes(f.metier)) return false;
  if (f.format && !formatsDe(r).includes(f.format)) return false;
  if (f.q) {
    const texte = normaliserRecherche(`${r.titre} ${r.description} ${r.theme}`);
    if (
      !normaliserRecherche(f.q)
        .split(/\s+/)
        .filter(Boolean)
        .every((m) => texte.includes(m))
    )
      return false;
  }
  return true;
}

function Carte({ r }: { r: Ressource }) {
  const paysage =
    r.categorie === "presentations" || r.format.includes("paysage");
  return (
    <li
      key={r.id}
      className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft"
    >
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
          className="aspect-[4/3] w-full object-cover object-top"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </a>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          {r.theme}
        </span>
        <h3 className="text-base font-semibold leading-snug">{r.titre}</h3>
        <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
          {r.description}
        </p>
        <p className="text-xs text-muted-foreground">
          {r.format} · PDF
          {r.modifiables.map((m) => ` + ${LIBELLE[m.type]}`).join("")} · gratuit
        </p>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <a
              href={r.fichier}
              download
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <Download className="size-4" aria-hidden />
              PDF
            </a>
            {r.modifiables.map((m) => {
              const Icone = ICONE[m.type];
              return (
                <a
                  key={m.type}
                  href={m.fichier}
                  download
                  className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold transition hover:bg-muted"
                  aria-label={`Télécharger ${r.titre} en ${LIBELLE[m.type]} modifiable`}
                >
                  <Icone className="size-4 text-primary" aria-hidden />
                  {LIBELLE[m.type]}
                </a>
              );
            })}
          </div>
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
}

export default async function RessourcesPage({
  searchParams,
}: {
  searchParams: Params;
}) {
  const params = await searchParams;
  const f: Filtres = {
    categorie: CATEGORIES_RESSOURCES.find((c) => c.id === un(params.categorie))
      ?.id,
    public: PUBLICS_RESSOURCES.find((p) => p.id === un(params.public))?.id,
    metier: METIERS_LEX.find((m) => m.id === un(params.metier))?.id,
    format: FORMATS_RESSOURCES.find((x) => x.id === un(params.format))?.id,
    q: un(params.q)?.trim().slice(0, 80) || undefined,
  };
  const filtre = Boolean(
    f.categorie || f.public || f.metier || f.format || f.q,
  );

  const visibles = RESSOURCES.filter((r) => correspond(r, f));
  const sections = CATEGORIES_RESSOURCES.filter((c) =>
    visibles.some((r) => r.categorie === c.id),
  );
  // Les compteurs des catégories tiennent compte des AUTRES filtres :
  // « Familles (4) » dit combien on en verra en cliquant.
  const compte = (c: CategorieRessource) =>
    RESSOURCES.filter((r) => correspond(r, { ...f, categorie: c })).length;

  const puce = (actif: boolean) =>
    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition " +
    (actif
      ? "border-foreground bg-foreground text-background"
      : "border-border bg-card hover:border-foreground/40");

  return (
    <div className="space-y-10">
      <header className="max-w-3xl">
        <span className="eyebrow">Gratuit · sans compte · sans e-mail</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-balance md:text-4xl">
          {RESSOURCES.length} outils prêts à imprimer ou à modifier
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
          Emplois du temps visuels, tableaux de motivation, grilles
          d’observation, trames d’écrits, jeux, plannings et modèles pour les
          familles, écrits par l’association ADéPA. En PDF à imprimer et, quand
          c’est utile, en Word, Excel ou PowerPoint à modifier. Et quand l’outil
          standard ne colle pas à votre groupe, LEX l’adapte pour vous.
        </p>
      </header>

      <form
        action="/ressources"
        method="get"
        role="search"
        className="flex max-w-2xl gap-2"
      >
        {f.categorie ? (
          <input type="hidden" name="categorie" value={f.categorie} />
        ) : null}
        {f.public ? (
          <input type="hidden" name="public" value={f.public} />
        ) : null}
        {f.metier ? (
          <input type="hidden" name="metier" value={f.metier} />
        ) : null}
        {f.format ? (
          <input type="hidden" name="format" value={f.format} />
        ) : null}
        <label className="relative flex-1">
          <span className="sr-only">Rechercher un outil</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={f.q ?? ""}
            placeholder="Rechercher : planning, émotions, autorisation…"
            className="h-11 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-foreground/40"
          />
        </label>
        <button
          type="submit"
          className="h-11 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          Chercher
        </button>
      </form>

      <nav aria-label="Filtrer les outils" className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href={lien(f, { categorie: undefined })}
            className={puce(!f.categorie)}
            aria-current={!f.categorie ? "page" : undefined}
          >
            Tout
          </Link>
          {CATEGORIES_RESSOURCES.map((c) => {
            const n = compte(c.id);
            if (!n && f.categorie !== c.id) return null;
            return (
              <Link
                key={c.id}
                href={lien(f, { categorie: c.id })}
                className={puce(f.categorie === c.id)}
                aria-current={f.categorie === c.id ? "page" : undefined}
              >
                {c.titre} <span className="opacity-60">({n})</span>
              </Link>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="w-24 shrink-0 text-muted-foreground">
            Pour qui&nbsp;:
          </span>
          <Link
            href={lien(f, { public: undefined })}
            className={puce(!f.public)}
          >
            Tous
          </Link>
          {PUBLICS_RESSOURCES.map((p) => (
            <Link
              key={p.id}
              href={lien(f, { public: p.id })}
              className={puce(f.public === p.id)}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="w-24 shrink-0 text-muted-foreground">
            Votre métier&nbsp;:
          </span>
          <Link
            href={lien(f, { metier: undefined })}
            className={puce(!f.metier)}
          >
            Tous
          </Link>
          {METIERS_LEX.map((m) => (
            <Link
              key={m.id}
              href={lien(f, { metier: m.id })}
              className={puce(f.metier === m.id)}
            >
              {m.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="w-24 shrink-0 text-muted-foreground">
            Format&nbsp;:
          </span>
          <Link
            href={lien(f, { format: undefined })}
            className={puce(!f.format)}
          >
            Tous
          </Link>
          {FORMATS_RESSOURCES.map((x) => (
            <Link
              key={x.id}
              href={lien(f, { format: x.id })}
              className={puce(f.format === x.id)}
            >
              {x.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          <strong className="text-foreground">{visibles.length}</strong> outil
          {visibles.length > 1 ? "s" : ""}
          {filtre ? " pour ces filtres" : ""}
        </span>
        {filtre ? (
          <Link
            href="/ressources"
            className="font-semibold text-primary hover:underline"
          >
            Effacer les filtres
          </Link>
        ) : null}
      </div>

      {!filtre ? (
        <section id="incontournables" className="scroll-mt-24 space-y-5">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight">
              Les incontournables
            </h2>
            <p className="mt-1 text-muted-foreground">
              Les outils qu’on cherche le plus dans les structures : budget,
              inscription, fiche sanitaire, scénario social, emploi du temps
              visuel, tableau de motivation.
            </p>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INCONTOURNABLES.map((id) => RESSOURCES.find((r) => r.id === id))
              .filter((r): r is Ressource => r !== undefined)
              .map((r) => (
                <Carte key={r.id} r={r} />
              ))}
          </ul>
        </section>
      ) : null}

      {sections.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-muted-foreground">
          Aucun outil pour ces filtres pour l’instant.{" "}
          <Link
            href="/ressources"
            className="font-semibold text-primary hover:underline"
          >
            Voir tous les outils
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
              .map((r) => (
                <Carte key={r.id} r={r} />
              ))}
          </ul>
        </section>
      ))}

      <section className="rounded-2xl border border-border bg-card p-8">
        <h2 className="text-xl font-bold tracking-tight">
          L’outil standard ne colle pas à votre groupe&nbsp;?
        </h2>
        <p className="mt-3 max-w-3xl leading-relaxed text-muted-foreground">
          LEX prépare une activité pour votre âge, votre durée et votre
          matériel, améliore un écrit, ou transforme vos notes en compte rendu.
          Quinze résultats offerts chaque mois, sans carte bancaire. Les noms
          sont retirés avant l’envoi, et vous relisez tout.
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
          Ces outils sont libres d’utilisation et de copie dans votre structure.
          Ils ne se revendent pas. Les exemples qu’ils contiennent sont fictifs.
          Les modèles (autorisations, convocations) sont à adapter et à faire
          valider par votre structure.
        </p>
      </section>
    </div>
  );
}
