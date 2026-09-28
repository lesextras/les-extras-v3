"use client";

// Même contenu que les cartes du catalogue : visuel, catégorie, durée,
// résumé, concepteur, territoire, public, prix.
//
// ⚠ ATELIERS SEULEMENT DEPUIS LE 28/09/2026. Le carrousel portait aussi un
// rayon « Formations » (tag « Parcours gratuit » / « Formation Qualiopi »,
// pastille emoji du parcours, « Gratuit · en ligne »). Les formations ont
// quitté Les Extras pour adepa77.fr, le site du centre de formation ADéPA :
// ces branches sont retirées, et l'accueil présente les parcours gratuits
// dans un bloc à part (`CentreFormationAdepa`), qui renvoie vers adepa77.fr.
import { useRef } from "react";
import Link from "next/link";
import {
  ArrowRight, Building2, ChevronLeft, ChevronRight, MapPin, Star, ShieldCheck, BadgeCheck,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VisuelCarte } from "./VisuelCarte";
import { VignetteSansPhoto } from "./VignetteSansPhoto";
import { premierVisuel } from "@/lib/media";
import { formatMoney } from "./format";
import { resumeTerritoire } from "@/lib/territoires";
import { dureeLisible } from "@/lib/mini-formations";

export interface OfferCard {
  id: string;
  slug?: string;
  title: string;
  /**
   * ⚠⚠ LE RÉSUMÉ ÉTAIT DANS LA CHARGE UTILE ET N'ÉTAIT PAS AFFICHÉ.
   * `/public/highlights` renvoie `description` pour un atelier depuis le
   * début ; le carrousel de l'accueil ne le montrait pas. Une carte de
   * l'accueil disait donc trois fois moins qu'une carte du catalogue pour la
   * même fiche — titre, lieu, public, prix — et c'est l'accueil qui reçoit
   * tout le trafic publicitaire. Corrigé le 16/09/2026, demande de Siham :
   * « mets le même contenu que dans les cartes des pages ateliers ».
   */
  description?: string | null;
  /** Durée écrite à la main sur un atelier (« 2H »). */
  duration?: string | null;
  /** Départements couverts, en codes INSEE. Voir `lib/territoires.ts`. */
  departements?: string[] | null;
  images?: string[] | null;
  city?: string | null;
  publicTargets?: string[] | null;
  publicTarget?: string | null;
  price?: string | number | null;
  priceFrom?: string | number | null;
  durationHours?: number | null;
  /** Durée en minutes, pour ce qui dure moins d'une heure. */
  durationMinutes?: number | null;
  account?: { id: string; name: string; city?: string | null } | null;
  categoryRef?: { id: string; title: string } | null;
  rating?: number | null;
  reviewsCount?: number;
  verified?: boolean;
  qualiopi?: boolean;
}

export function OfferCarousel({
  items,
  basePath,
}: {
  items: OfferCard[];
  /** "/ateliers". */
  basePath: string;
}) {
  const piste = useRef<HTMLDivElement>(null);

  const glisser = (sens: -1 | 1) => {
    const p = piste.current;
    if (!p) return;
    p.scrollBy({ left: sens * Math.min(p.clientWidth * 0.85, 900), behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => glisser(-1)}
        aria-label="Voir les offres précédentes"
        className="absolute -left-3 top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow-card transition hover:bg-accent md:grid"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => glisser(1)}
        aria-label="Voir les offres suivantes"
        className="absolute -right-3 top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background shadow-card transition hover:bg-accent md:grid"
      >
        <ChevronRight className="size-5" />
      </button>

      {/*
        ⚠⚠ `md:px-9` ET `md:scroll-px-9` VONT ENSEMBLE, ET IL FAUT LES DEUX.

        Les deux flèches sont posées en `-left-3` / `-right-3`, par-dessus la
        piste. Sans la marge, la flèche gauche RECOUVRE le titre de la première
        carte — « LE PAPA Plan d'Activité Physique Adapté » se lisait « E PAPA
        Plan… », constaté en direct le 16/09/2026. Et sans le `scroll-px`,
        l'accrochage arrête la carte SOUS le bouton au lieu de s'arrêter à côté.

        C'est exactement le couple que `RangeeDefilante` documente déjà pour la
        même raison ; ce carrousel-ci ne l'avait pas.
      */}
      <div
        ref={piste}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 md:px-9 md:scroll-px-9 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((o, rang) => {
          const publics = o.publicTargets?.length
            ? o.publicTargets
            : o.publicTarget
              ? [o.publicTarget]
              : [];
          const prix = o.price ?? o.priceFrom ?? null;
          // ⚠ L'ADRESSE LISIBLE D'ABORD, PARTOUT. Le drapeau `useSlug` n'était
          // posé que sur une partie des cartes : les cartes d'ateliers de l'accueil
          // pointaient donc /ateliers/cms3it0g70015lt1wyr4sbhqr alors que
          // /ateliers/atelier-psycho-boxe existe et fonctionne. Une redirection
          // de plus à chaque clic, et le bénéfice du lien dispersé entre deux
          // adresses pour une seule fiche. Le catalogue, lui, faisait déjà
          // `slug ?? id` — les deux endroits disent maintenant la même chose.
          const href = `${basePath}/${o.slug ?? o.id}`;
          const duree = dureeLisible(o);
          const visuel = premierVisuel(o.images);
          const resume = o.description ?? null;
          // La durée écrite à la main d'un atelier (« 2H ») d'abord, sinon
          // celle calculée depuis les heures ou les minutes.
          const dureeAffichee = o.duration ?? duree;
          // Le tag dit la thématique (« Art-thérapie », « Musicothérapie ») :
          // c'est elle qui distingue les ateliers les uns des autres.
          const categorie = o.categoryRef?.title ?? null;
          /**
           * ⚠ ON N'AFFICHE PAS `city` TEL QUEL — même règle que le catalogue.
           * Seize fiches sur dix-sept ont une RÉGION dans un champ nommé
           * « ville » : la carte annonçait « Île-de-France » comme s'il
           * s'agissait d'un lieu de rendez-vous, alors que c'est l'intervenant
           * qui se déplace. Le territoire couvert répond à la seule question
           * que se pose un directeur : est-ce que ça vient jusqu'à moi.
           */
          const territoire =
            resumeTerritoire(o.departements ?? []) ?? o.city ?? o.account?.city ?? null;
          // Le concepteur, toujours affiché — y compris « ADéPA » sur ses
          // propres ateliers. C'est ce que fait la carte du catalogue, et la
          // même fiche doit se présenter de la même façon partout.
          const organisme = o.account?.name ?? null;
          return (
            // Un peu plus large qu'avant : la carte porte désormais un résumé
            // de trois lignes et un concepteur. À 280 px, « Se déplace : Toute
            // l'Île-de-France » se coupait au milieu.
            <Link
              key={o.id}
              href={href}
              className="group w-[300px] shrink-0 snap-start sm:w-[340px]"
            >
              {/* `flex flex-col` : sans lui, le `mt-auto` du bloc du bas n'a
                  rien contre quoi pousser et les prix de la rangée ne
                  s'alignent plus dès qu'un résumé fait deux lignes au lieu de
                  trois. */}
              <Card className="flex h-full flex-col overflow-hidden transition group-hover:shadow-card">
                <div className="relative aspect-[16/11] bg-muted">
                  <VisuelCarte src={visuel} alt={o.title} sizes="(max-width: 640px) 300px, 340px">
                    {/* Sans photo, la carte affichait un rectangle beige avec
                        « Les Extras » au milieu — le même pour toutes. */}
                    <VignetteSansPhoto
                      graine={o.slug ?? o.id ?? o.title}
                      libelle={o.categoryRef?.title ?? null}
                      motif="atelier"
                    />
                  </VisuelCarte>
                  {/*
                    ⚠ LE BANDEAU SUR LA PHOTO A ÉTÉ RETIRÉ LE 16/09/2026.

                    Depuis que la carte porte sa pastille de catégorie juste en
                    dessous, il écrivait la MÊME chose à deux centimètres
                    d'écart : « ATELIERS DU RÉSEAU » en surimpression, puis
                    « Ateliers du réseau » en pastille. Constaté en direct sur
                    les quatre cartes visibles de l'accueil.
                  */}
                </div>
                {/*
                  ⚠⚠ CE CORPS DE CARTE EST CELUI DU CATALOGUE, VOLONTAIREMENT.
                  Même ordre, mêmes icônes, mêmes formulations : catégorie et
                  durée, titre, résumé sur trois lignes, concepteur, territoire,
                  public, prix et « Voir ». Une même fiche ne doit pas se
                  présenter de deux façons selon la page où on la rencontre —
                  et c'est l'accueil qui était le plus pauvre des deux.
                */}
                <CardContent className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-center justify-between gap-2">
                    {/* ⚠ UN SEUL TAG, ET C'EST LA CATÉGORIE : le concepteur est
                        écrit trois lignes plus bas, comme sur toutes les autres
                        cartes. */}
                    {categorie ? (
                      <Badge variant="soft">{categorie}</Badge>
                    ) : (
                      <span />
                    )}
                    {dureeAffichee ? (
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        {dureeAffichee}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-start gap-1.5">
                    {/* Plus de `uppercase` : le catalogue écrit les titres tels
                        qu'ils ont été saisis, et deux casses pour un même
                        atelier se lisent comme deux offres différentes. */}
                    <h3 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground">
                      {o.title}
                    </h3>
                    {o.verified ? (
                      <BadgeCheck className="mt-1 size-4 shrink-0 text-success" aria-label="Validé" />
                    ) : null}
                    {o.qualiopi ? (
                      <ShieldCheck className="mt-1 size-4 shrink-0 text-warning" aria-label="Qualiopi" />
                    ) : null}
                  </div>

                  {resume ? (
                    <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {resume}
                    </p>
                  ) : null}

                  <div className="mt-auto space-y-3 pt-2">
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {organisme ? (
                        <p className="flex items-center gap-1.5">
                          <Building2 className="size-3.5 shrink-0" />
                          <span className="truncate">{organisme}</span>
                        </p>
                      ) : null}
                      {territoire ? (
                        <p className="flex items-center gap-1.5 font-medium text-foreground">
                          <MapPin className="size-3.5 shrink-0 text-primary" />
                          <span className="truncate">Se déplace : {territoire}</span>
                        </p>
                      ) : null}
                      {publics.length > 0 ? (
                        <p className="line-clamp-1">
                          <span className="font-medium">Public :</span> {publics.join(", ")}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                      <span className="inline-flex items-center gap-2">
                        <span className="text-base font-semibold text-foreground">
                          {prix ? formatMoney(prix) : "Sur devis"}
                        </span>
                        {o.rating ? (
                          <span className="inline-flex items-center gap-0.5 text-sm text-muted-foreground">
                            <Star className="size-3.5 fill-current text-amber-500" />
                            {o.rating.toFixed(1)}
                          </span>
                        ) : null}
                      </span>
                      {/*
                        ⚠ C'EST UN `span`, PAS UN BOUTON-LIEN. Toute la carte est
                        déjà un `<Link>` : y imbriquer un second lien est du HTML
                        invalide, que chaque navigateur répare à sa façon — et
                        c'est le piège que `_catalog.tsx` documente déjà. Le
                        catalogue, lui, peut se le permettre parce que sa carte
                        n'est pas cliquable en entier (elle porte le bouton
                        « mettre de côté »).
                      */}
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-foreground transition group-hover:border-primary group-hover:text-primary">
                        Voir
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
