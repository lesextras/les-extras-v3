// Catalogue PUBLIC des formations (vraies formations, pas des ateliers).
import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  MapPin,
  Search,
  ArrowRight,
  ShieldCheck,
  CalendarClock,
  GraduationCap,
  Building2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPublic } from "../../_shared/server";
import { VisuelCarte } from "../../_shared/VisuelCarte";
import { premierVisuel } from "@/lib/media";
import { PageHeader, EmptyState } from "../../_shared/ui";
import { RangeeDefilante } from "../../_shared/RangeeDefilante";
import { formatMoney, formatDate } from "../../_shared/format";
// Emoji, organisme de la maison et durée lisible : une seule source pour le
// catalogue, le carrousel d'accueil et les couvertures. Voir le fichier.
import { EMOJI_PARCOURS, dureeLisible, estMaison } from "@/lib/mini-formations";

import { metaPublique } from "@/lib/meta";
export const metadata: Metadata = metaPublique({
  title: "Formations Qualiopi pour le médico-social",
  description:
    "Formations pour les professionnels du médico-social : analyse des pratiques, prévention, spécialisations métier. Certifiées Qualiopi, finançables OPCO.",
  path: "/formations",
});

export interface FormationCard {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  objectives?: string | null;
  durationHours?: number | null;
  /** Durée en minutes, pour ce qui dure moins d'une heure (mini-formations). */
  durationMinutes?: number | null;
  publicTargets?: string[] | null;
  type?: "CERTIFIANTE" | "INTERNE";
  certifying?: boolean;
  cpfEligible?: boolean;
  images?: string[] | null;
  city?: string | null;
  categoryRef?: { id: string; title: string } | null;
  account?: { id: string; name: string; logoUrl?: string | null } | null;
  priceFrom?: string | number | null;
  nextSessionAt?: string | null;
  /** Mini-formation en ligne et gratuite : ni devis, ni session, ni prix. */
  freeOnline?: boolean;
  /** Adresse où la formation se suit réellement (plateforme pédagogique). */
  enrollUrl?: string | null;
}

const inputClass =
  "h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground hover:border-primary/30 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

type Filtres = {
  search?: string;
  category?: string;
  public?: string;
  organisme?: string;
  city?: string;
  cpf?: string;
  certifying?: string;
  priceMax?: string;
  sort?: string;
};

/**
 * Une carte de formation — le même gabarit que la carte atelier, à quoi
 * s'ajoutent la pastille emoji des mini-formations et la marque de la maison.
 *
 * `rang` ne sert qu'à décaler le flottement de la pastille : sans décalage,
 * les dix emoji de la grille montent et descendent en même temps, et la page
 * clignote au lieu de respirer.
 */
function CarteFormation({ f, rang }: { f: FormationCard; rang: number }) {
  const organisme = f.account?.name;
  const duree = dureeLisible(f);
  const maison = estMaison(f.account?.name);
  const emoji = EMOJI_PARCOURS[f.slug] ?? null;
  const visuel = premierVisuel(f.images);
  const lien = `/formations/${f.slug}`;
  return (
    <Card
      className={`group card-interactive relative flex h-full flex-col overflow-hidden ${
        maison ? "border-primary/40" : ""
      }`}
    >
      {/* Le visuel d'abord : une fiche sans image ne se clique pas. */}
      <Link href={lien} className="relative block aspect-[16/10] bg-muted">
        <VisuelCarte
          src={visuel}
          alt={f.title}
          sizes="(max-width: 640px) 100vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        >
          <span className="grid h-full place-items-center bg-gradient-to-br from-primary/25 via-primary/10 to-secondary/20">
            <span className="flex flex-col items-center gap-1.5 text-center">
              <GraduationCap className="size-6 text-primary/70" aria-hidden />
              <span className="px-4 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                {f.categoryRef?.title ?? "Formation"}
              </span>
            </span>
          </span>
        </VisuelCarte>
        {/* Le bandeau de thématique n'a de sens que sur les vignettes qui ne
            l'écrivent pas déjà : la couverture d'une mini-formation le porte
            en haut à gauche, et le repli de marque (sans photo) l'affiche en
            son centre. Dans les deux cas, le bandeau redisait le même mot —
            et sur la couverture, il recouvrait le bandeau blanc du bas. */}
        {f.categoryRef?.title && !emoji && visuel ? (
          <span className="absolute bottom-3 left-3 rounded-md bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
            {f.categoryRef.title}
          </span>
        ) : null}
      </Link>

      {/* La pastille emoji reprend celui de la couverture : sur une grille de
          dix vignettes, c'est lui qu'on retient, pas le titre. Hors du lien du
          visuel, donc purement décoratif et masqué aux lecteurs d'écran. */}
      {emoji ? (
        <span
          aria-hidden
          className="animate-emoji pointer-events-none absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-card/90 text-xl shadow-sm backdrop-blur-sm"
          style={{ animationDelay: `${(rang % 5) * 0.35}s` }}
        >
          {emoji}
        </span>
      ) : null}

      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* La marque de la maison passe avant les autres : c'est
      elle qui répond de la ligne à la ligne. */}
          {maison ? (
            <Badge className="gap-1">
              <Sparkles className="size-3" /> Conçue par ADéPA
            </Badge>
          ) : null}
          {f.certifying ? (
            <Badge variant="secondary" className="gap-1">
              <ShieldCheck className="size-3" /> Qualiopi
            </Badge>
          ) : null}
          {f.cpfEligible ? <Badge variant="outline">CPF</Badge> : null}
          {duree ? (
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {duree}
            </span>
          ) : null}
        </div>

        <Link href={lien}>
          <h2 className="text-lg font-semibold leading-snug text-foreground">
            {f.title}
          </h2>
        </Link>
        {f.summary ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {f.summary}
          </p>
        ) : null}

        <div className="mt-auto space-y-3 pt-2">
          {/* Les trois lignes que porte déjà une carte atelier :
      qui l'a conçue, où ça se passe, pour qui c'est fait.
      Sans elles, une fiche formation avait l'air inachevée à
      côté d'une fiche atelier de la même grille. */}
          <div className="space-y-1 text-sm text-muted-foreground">
            {organisme ? (
              <p className="flex items-center gap-1.5">
                <Building2 className="size-3.5 shrink-0" />
                <span className="truncate">{organisme}</span>
              </p>
            ) : null}
            {f.city ? (
              <p className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{f.city}</span>
              </p>
            ) : f.freeOnline ? (
              <p className="flex items-center gap-1.5">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">En ligne, à votre rythme</span>
              </p>
            ) : null}
            {(f.publicTargets?.length ?? 0) > 0 ? (
              <p className="line-clamp-2">
                <span className="font-medium">Public :</span>{" "}
                {f.publicTargets!.join(", ")}
              </p>
            ) : null}
            {f.nextSessionAt ? (
              <p className="flex items-center gap-1.5">
                <CalendarClock className="size-3.5 shrink-0" />
                <span className="truncate">
                  dès le {formatDate(f.nextSessionAt)}
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            {/* « Tarif sur devis » sur une formation gratuite ferait
        fuir exactement les gens qu'elle vise. Le mode gratuit
        se lit donc dès la carte. */}
            {f.freeOnline ? (
              <span className="text-base font-semibold text-primary">
                Gratuit · en ligne
              </span>
            ) : f.priceFrom ? (
              <span className="text-base font-semibold text-foreground">
                dès {formatMoney(f.priceFrom)}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">
                Tarif sur devis
              </span>
            )}
            <Button asChild size="sm" variant="outline">
              <Link href={lien}>
                Voir
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function FormationsCatalogPage({
  searchParams: searchParamsPromesse,
}: {
  searchParams?: Promise<Filtres>;
}) {
  const searchParams = await searchParamsPromesse;
  const qs = new URLSearchParams();
  for (const cle of [
    "search",
    "category",
    "public",
    "organisme",
    "city",
    "priceMax",
    "sort",
  ] as const) {
    const v = searchParams?.[cle];
    if (v) qs.set(cle, v);
  }
  if (searchParams?.cpf === "true") qs.set("cpf", "true");
  if (searchParams?.certifying === "true") qs.set("certifying", "true");
  qs.set("take", "60");

  const { data, error } = await fetchPublic<{
    items: FormationCard[];
    total: number;
    categories: string[];
    cities: string[];
    publics: string[];
    organismes: string[];
  }>(`/public/formations?${qs.toString()}`);

  const categories = data?.categories ?? [];
  const cities = data?.cities ?? [];
  const publics = data?.publics ?? [];
  const organismes = data?.organismes ?? [];
  // COMBIEN DE CHAMPS S'AFFICHENT VRAIMENT.
  //
  // Trois listes déroulantes n'apparaissent que si elles ont de quoi choisir
  // (pas de thématique enregistrée, pas de ville, un seul organisme → le champ
  // disparaît). Une grille figée à trois colonnes renvoyait donc le quatrième
  // champ à la ligne, seul, sous les trois autres. On compte ce qui sera
  // affiché et on demande exactement ce nombre de colonnes.
  //
  // Tailwind lit les classes dans le source : elles doivent être écrites en
  // toutes lettres, d'où la table plutôt qu'un `lg:grid-cols-${n}` calculé,
  // qui ne produirait aucun style.
  const COLONNES: Record<number, string> = {
    1: "lg:grid-cols-1",
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  };

  const filtree = Boolean(
    searchParams?.search ||
    searchParams?.category ||
    searchParams?.public ||
    searchParams?.organisme ||
    searchParams?.city ||
    searchParams?.priceMax ||
    searchParams?.cpf ||
    searchParams?.certifying,
  );

  // Budget et tri sont toujours là ; les trois autres dépendent des facettes.
  const nbChamps =
    2 +
    (categories.length > 0 ? 1 : 0) +
    (publics.length > 0 ? 1 : 0) +
    (organismes.length > 1 ? 1 : 0) +
    (cities.length > 0 ? 1 : 0);

  // DEUX RAYONS, PAS UNE GRILLE UNIQUE.
  //
  // Les mini-formations gratuites de l'association et les formations Qualiopi
  // vendues en intra ne s'achètent pas de la même façon, ne s'adressent pas
  // aux mêmes personnes et n'ont pas le même prix — l'une est gratuite et
  // s'ouvre en trois clics, l'autre se négocie au devis avec un établissement.
  // Mélangées dans la même grille, chacune brouille l'autre : le parent qui
  // cherche de l'aide tombe sur « à partir de 1 600 € », et le directeur qui
  // cherche une action de formation tombe sur « Gratuit ».
  const tous = data?.items ?? [];
  const gratuites = tous.filter((f) => f.freeOnline && estMaison(f.account?.name));
  const autres = tous.filter((f) => !(f.freeOnline && estMaison(f.account?.name)));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Nos formations"
        subtitle="Pensées pour le médico-social. Certification Qualiopi portée par ADéPA, finançables OPCO."
      />

      <form method="GET" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              name="search"
              defaultValue={searchParams?.search ?? ""}
              placeholder="Rechercher une formation…"
              className={`${inputClass} pl-9`}
              aria-label="Rechercher une formation"
            />
          </div>
          <Button type="submit" className="sm:w-auto">
            Filtrer
          </Button>
        </div>

        <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${COLONNES[nbChamps] ?? "lg:grid-cols-4"}`}>
          {categories.length > 0 ? (
            <select
              name="category"
              defaultValue={searchParams?.category ?? ""}
              className={inputClass}
              aria-label="Filtrer par thématique"
            >
              <option value="">Toutes les thématiques</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : null}

          {/* « Pour qui » avant « quoi » : sur le catalogue des ateliers, c'est
              l'entrée la plus utilisée. Elle manquait ici. */}
          {publics.length > 0 ? (
            <select
              name="public"
              defaultValue={searchParams?.public ?? ""}
              className={inputClass}
              aria-label="Filtrer par public visé"
            >
              <option value="">Tous les publics</option>
              {publics.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : null}

          {/* Un seul organisme aujourd'hui : le filtre n'apparaît qu'à partir
              du deuxième, sinon c'est une liste à un seul choix. */}
          {organismes.length > 1 ? (
            <select
              name="organisme"
              defaultValue={searchParams?.organisme ?? ""}
              className={inputClass}
              aria-label="Filtrer par organisme concepteur"
            >
              <option value="">Tous les organismes</option>
              {organismes.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : null}

          {cities.length > 0 ? (
            <select
              name="city"
              defaultValue={searchParams?.city ?? ""}
              className={inputClass}
              aria-label="Filtrer par ville"
            >
              <option value="">Toutes les villes</option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          ) : null}

          <input
            type="number"
            name="priceMax"
            min={0}
            step={50}
            defaultValue={searchParams?.priceMax ?? ""}
            placeholder="Budget max (€)"
            className={inputClass}
            aria-label="Budget maximum par participant"
          />

          <select
            name="sort"
            defaultValue={searchParams?.sort ?? ""}
            className={inputClass}
            aria-label="Trier les formations"
          >
            <option value="">Tri : les plus récentes</option>
            <option value="soonest">Prochaine session</option>
            <option value="price-asc">Prix croissant</option>
            <option value="price-desc">Prix décroissant</option>
            <option value="duration-asc">Durée la plus courte</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <label className="inline-flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              name="cpf"
              value="true"
              defaultChecked={searchParams?.cpf === "true"}
              className="size-4 rounded border-input accent-primary"
            />
            Éligible CPF
          </label>
          <label className="inline-flex items-center gap-2 text-muted-foreground">
            <input
              type="checkbox"
              name="certifying"
              value="true"
              defaultChecked={searchParams?.certifying === "true"}
              className="size-4 rounded border-input accent-primary"
            />
            Certifiante Qualiopi
          </label>
          {filtree ? (
            <Link
              href="/formations"
              className="text-primary underline-offset-4 hover:underline"
            >
              Réinitialiser les filtres
            </Link>
          ) : null}
          <span className="ml-auto text-muted-foreground">
            {data?.total ?? 0} formation{(data?.total ?? 0) > 1 ? "s" : ""}
          </span>
        </div>
      </form>

      {/* Le catalogue n'est pas vide : dire « en préparation » parce que l'API
          n'a pas répondu ferait fuir un visiteur venu de la publicité. */}
      {error ? (
        <EmptyState
          title="Catalogue momentanément indisponible"
          description="Réessayez dans quelques instants."
        />
      ) : tous.length === 0 ? (
        <EmptyState
          title={
            filtree
              ? "Aucune formation ne correspond"
              : "Catalogue de formations en préparation"
          }
          description={
            filtree
              ? "Élargissez vos critères, ou dites-nous ce que vous cherchez : nous montons des sessions sur mesure."
              : "Contactez-nous pour être informé de l’ouverture des prochaines sessions."
          }
        />
      ) : (
        <div className="space-y-10">
          {/* LE RAYON DE LA MAISON, EN PREMIER ET SIGNALÉ COMME TEL.
              C'est le seul dont l'association répond ligne à ligne, et le seul
              qu'on puisse ouvrir tout de suite. */}
          {gratuites.length > 0 ? (
            <section className="rounded-2xl border-2 border-primary/30 bg-primary-soft/30 p-5 sm:p-6">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    <Sparkles className="size-3.5" /> Conçues et tenues par
                    ADéPA
                  </p>
                  <h2 className="mt-1.5 text-xl font-bold text-foreground sm:text-2xl">
                    Les mini-formations gratuites
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Une compétence par parcours, quatre modules, une fiche A4 à
                    imprimer. Sans carte bancaire, sans date de fin.
                  </p>
                </div>
                <span className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                  {gratuites.length} parcours
                </span>
              </div>
              {/* SANS FILTRE, ON FAIT DÉFILER ; AVEC FILTRE, ON ÉTALE.
                  Une rangée qui défile se parcourt à l'œil, comme un rayon —
                  c'est ce qu'on veut quand on arrive sans idée précise. Mais
                  dès qu'on a filtré, on veut voir TOUS les résultats d'un
                  coup : cacher la moitié derrière une flèche, après un
                  filtrage, c'est laisser croire qu'il n'y en a que trois. */}
              {filtree ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {gratuites.map((f, i) => (
                    <CarteFormation key={f.id} f={f} rang={i} />
                  ))}
                </div>
              ) : (
                <RangeeDefilante etiquette="Mini-formations gratuites">
                  {gratuites.map((f, i) => (
                    <div key={f.id} className="w-[300px] shrink-0 snap-start md:w-[calc((100%-1.25rem)/2)]">
                      <CarteFormation f={f} rang={i} />
                    </div>
                  ))}
                </RangeeDefilante>
              )}
            </section>
          ) : null}

          {autres.length > 0 ? (
            <section>
              <div className="mb-5">
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <ShieldCheck className="size-3.5" /> Certification Qualiopi ·
                  finançables OPCO
                </p>
                <h2 className="mt-1.5 text-xl font-bold text-foreground sm:text-2xl">
                  Les formations en intra, dans votre établissement
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Animées chez vous, pour une équipe. Devis sous 72 h, sans
                  engagement.
                </p>
              </div>
              {/* Pas de rangée qui défile ici : elles se comptent sur les
                  doigts d'une main et se vendent au devis. Un directeur qui
                  cherche une action de formation veut les voir toutes, d'un
                  coup — pas en découvrir une à la fois. */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {autres.map((f, i) => (
                  <CarteFormation key={f.id} f={f} rang={i} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
