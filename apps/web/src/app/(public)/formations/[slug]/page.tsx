// Fiche PUBLIQUE d'une formation — même modèle commercial que la fiche atelier.
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star, Clock, Users, MapPin, CalendarClock, ShieldCheck, BadgeCheck, Eye, ListChecks,
} from "lucide-react";
import { fetchPublic } from "../../../_shared/server";
import { premierVisuel, visuels } from "@/lib/media";
import { SOCLE_OG, SOCLE_TWITTER } from "@/lib/meta";
import { titreFiche } from "@/lib/titre-fiche";
import { formatMoney, formatDate } from "../../../_shared/format";
import { QrShare } from "../../../_shared/QrShare";
import { PublicQuoteForm } from "../../../_shared/PublicQuoteForm";
import type { FormationCard } from "../page";

interface FaqItem { question: string; answer: string }
interface SessionItem {
  id: string;
  title?: string | null;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  maxSeats?: number | null;
  priceHt?: string | number | null;
  status: string;
  _count?: { inscriptions?: number };
}
interface FormationDetail extends FormationCard {
  program?: string | null;
  prerequisites?: string | null;
  targetAudience?: string | null;
  methodology?: string | null;
  evaluation?: string | null;
  faq?: FaqItem[] | null;
  certificationName?: string | null;
  views?: number | null;
  createdAt?: string;
  sessions?: SessionItem[];
  rating?: number | null;
  ratingCount?: number;
  related?: FormationCard[];
}

function resume(t: string, max = 155) {
  const plat = t.replace(/\s+/g, " ").trim();
  return plat.length > max ? `${plat.slice(0, max - 1).trimEnd()}…` : plat;
}

export async function generateMetadata({
  params: paramsPromesse,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const params = await paramsPromesse;
  const { data } = await fetchPublic<FormationDetail>(`/public/formations/${params.slug}`);
  // 200 alors que la fiche n'existe pas : le squelette de `(public)/loading.tsx`
  // ouvre une frontière Suspense, la coquille part donc AVANT que `notFound()`
  // ne s'exécute, et le code de statut est déjà joué. On ne peut plus le
  // corriger — mais on peut dire aux robots de ne pas indexer : sans cela,
  // chaque URL périmée ou mal tapée entre au catalogue de Google comme une
  // page valide.
  if (!data) return { title: "Formation introuvable", robots: { index: false, follow: false } };
  const desc = resume(data.objectives || data.summary || "Formation proposée sur Les Extras.");
  const image = premierVisuel(data.images);
  // `titreFiche` ouvre par le type de page : sans lui, une formation et un
  // atelier portant le même intitulé — cela existe — sortaient deux titres
  // identiques, donc deux pages qui se concurrencent au lieu de se compléter.
  // Il garantit aussi les 65 caractères, suffixe « · LES EXTRAS » compris.
  // Voir `lib/titre-fiche.ts`.
  const titre = titreFiche("formation", data.title);
  return {
    title: titre,
    description: desc,
    alternates: { canonical: `/formations/${data.slug}` },
    // Le visuel de la fiche prime quand il existe ; sinon la carte du site
    // prend le relais, sans quoi une formation sans image se partageait en
    // rectangle gris. `SOCLE_OG` / `SOCLE_TWITTER` réémettent au passage le
    // `siteName`, la locale et le format de carte : déclarer ces deux objets
    // remplace ceux du layout racine au lieu de les compléter (fusion en
    // surface). Voir `lib/meta.ts`.
    openGraph: {
      ...SOCLE_OG,
      title: `${titre} · LES EXTRAS`,
      description: desc,
      type: "article",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      ...SOCLE_TWITTER,
      title: `${titre} · LES EXTRAS`,
      description: desc,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function FormationPubliquePage({
  params: paramsPromesse,
}: {
  params: Promise<{ slug: string }>;
}) {
  const params = await paramsPromesse;
  const { data: f } = await fetchPublic<FormationDetail>(`/public/formations/${params.slug}`);
  if (!f) notFound();

  const images = visuels(f.images);
  const faq = Array.isArray(f.faq) ? f.faq : [];
  const sessions = f.sessions ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted-foreground">
        <Link href="/formations" className="hover:text-foreground">
          Nos formations
        </Link>
        <span className="mx-2" aria-hidden>/</span>
        <span className="text-foreground">{f.title}</span>
      </nav>

      {images.length > 0 ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
          <Image src={images[0]} alt={f.title} fill sizes="100vw" className="object-cover" priority />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_330px]">
        <div className="space-y-8">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {f.categoryRef?.title ? <Badge variant="outline">{f.categoryRef.title}</Badge> : null}
              {f.certifying ? (
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="size-3.5" /> Qualiopi · finançable OPCO
                </Badge>
              ) : null}
              {f.cpfEligible ? <Badge>CPF</Badge> : null}
              {f.freeOnline ? <Badge className="gap-1">Gratuit · en ligne</Badge> : null}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {f.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {f.rating ? (
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Star className="size-4 fill-current text-amber-500" />
                  {f.rating.toFixed(1)}
                  <span className="font-normal text-muted-foreground">
                    (satisfaction de {f.ratingCount} stagiaire{(f.ratingCount ?? 0) > 1 ? "s" : ""})
                  </span>
                </span>
              ) : null}
              {f.views ? (
                <span className="inline-flex items-center gap-1">
                  <Eye className="size-4" /> {f.views} consultations
                </span>
              ) : null}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {f.durationHours ? <Attribut icon={<Clock className="size-4" />} label="Durée" value={`${f.durationHours} h`} /> : null}
            {f.targetAudience ? <Attribut icon={<Users className="size-4" />} label="Public visé" value={f.targetAudience} ton="primaire" /> : null}
            {/* LES PRÉREQUIS REMONTENT ICI (03/09/2026, demande Siham).
                Ils vivaient en bas de page, en bloc de texte, pendant que
                « Public visé » occupait une demi-colonne et laissait l'autre
                vide : sur une mini-formation, ni durée en heures, ni ville, ni
                certification ne sont renseignées, donc l'encart restait seul
                sur sa ligne. Les deux vont ensemble à la lecture — à qui ça
                s'adresse, et ce qu'il faut avant — et ils comblent la ligne. */}
            {f.prerequisites ? <Attribut icon={<ListChecks className="size-4" />} label="Prérequis" value={f.prerequisites} ton="secondaire" /> : null}
            {f.city ? <Attribut icon={<MapPin className="size-4" />} label="Lieu" value={f.city} /> : null}
            {f.certificationName ? <Attribut icon={<BadgeCheck className="size-4" />} label="Certification" value={f.certificationName} /> : null}
          </div>

          <Bloc titre="Présentation" texte={f.summary} />
          <Bloc titre="Objectifs pédagogiques" texte={f.objectives} />
          <Bloc titre="Programme" texte={f.program} />
          <Bloc titre="Méthodologie pédagogique" texte={f.methodology} />
          <Bloc titre="Modalités d'évaluation" texte={f.evaluation} />

          {sessions.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Prochaines sessions</h2>
              <div className="space-y-2">
                {sessions.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {s.title ?? `Session du ${formatDate(s.startDate)}`}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {[formatDate(s.startDate), s.location].filter(Boolean).join(" · ")}
                          {s.maxSeats
                            ? ` · ${Math.max(0, s.maxSeats - (s._count?.inscriptions ?? 0))} place(s) restante(s)`
                            : ""}
                        </p>
                      </div>
                      {s.priceHt ? (
                        <p className="font-semibold text-primary">{formatMoney(s.priceHt)} HT</p>
                      ) : null}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}

          {faq.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">Questions fréquentes</h2>
              <div className="space-y-2">
                {faq.map((item, i) => (
                  <details key={i} className="group rounded-xl border border-border bg-card p-4 open:shadow-soft">
                    <summary className="cursor-pointer list-none font-medium text-foreground marker:hidden">
                      {item.question}
                      <span className="float-right text-muted-foreground group-open:hidden">+</span>
                      <span className="float-right hidden text-muted-foreground group-open:inline">−</span>
                    </summary>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {/* DEUX FICHES EN UNE.

              Le bloc d'achat par défaut vend une action Qualiopi au devis :
              « Tarif sur devis », « Demander un devis », « Réponse garantie
              sous 72 h », « Émargement et suivi inclus ». Rien de tout cela
              n'est vrai d'une mini-formation gratuite suivie en ligne, et
              l'afficher quand même reviendrait à demander un devis pour un
              contenu accessible en un clic.

              On bascule donc sur un bloc entièrement distinct — un prix
              (gratuit), un bouton (commencer), et la mention honnête de
              l'attestation payante, qui est le seul élément facturé.
              Aucune formation existante n'est touchée : `freeOnline` vaut
              `false` partout ailleurs. */}
          {f.freeOnline ? (
            <Card>
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-2xl font-bold text-foreground">Gratuit</p>
                  <p className="text-xs text-muted-foreground">
                    Du premier au dernier module, sans carte bancaire et sans date de fin
                  </p>
                </div>
                {f.durationHours ? (
                  <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-4" /> Environ {f.durationHours} h, à votre rythme
                  </p>
                ) : null}
                {f.enrollUrl ? (
                  <Button asChild className="w-full">
                    {/* Le parcours est hébergé sur la plateforme pédagogique de
                        l'association : lien externe assumé, `rel` explicite. */}
                    <a href={f.enrollUrl} target="_blank" rel="noopener noreferrer">
                      Commencer la formation
                    </a>
                  </Button>
                ) : null}
                <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5">
                    <BadgeCheck className="size-3.5" />
                    Attestation de suivi nominative : 20 €, facultative
                  </p>
                  {/* Dire ce que l'attestation N'EST PAS est aussi important que
                      son prix : une attestation de suivi n'est ni un diplôme ni
                      une certification professionnelle, et laisser croire le
                      contraire pour 20 € serait une pratique trompeuse. */}
                  <p className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" />
                    Ni diplôme, ni certification professionnelle
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users className="size-3.5" /> Pour les parents comme pour les professionnels
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : null}
          {/* COMMENT ÇA SE PASSE — le bloc qui manquait.

              La fiche décrivait très bien la pédagogie (méthodologie,
              évaluation, prérequis, programme) et ne disait NULLE PART ce qui
              arrive quand on clique sur « Commencer la formation » : qu'on
              quitte ce site, qu'on arrive sur un espace de formation qui porte
              un autre nom, et qu'on n'a aucune carte bancaire à sortir. Sur une
              offre gratuite, c'est exactement là qu'on perd les gens — d'autant
              que la page porte par ailleurs un bouton « Créer un compte » qui
              parle d'autre chose (un compte Les Extras, sans rapport).

              Trois lignes ici, la version longue dans « Méthodologie
              pédagogique ». */}
          {f.freeOnline && f.enrollUrl ? (
            <Card>
              <CardContent className="space-y-2 p-5">
                <p className="text-sm font-semibold text-foreground">Comment ça se passe</p>
                <ol className="list-decimal space-y-1.5 pl-4 text-xs text-muted-foreground">
                  <li>
                    Le parcours se suit sur notre espace de formation en ligne&nbsp;: en
                    cliquant, vous quittez ce site.
                  </li>
                  <li>
                    L&apos;accès s&apos;y ouvre avec une adresse e-mail.{" "}
                    <strong className="font-semibold text-foreground">
                      Aucune carte bancaire n&apos;est demandée, à aucun moment.
                    </strong>
                  </li>
                  <li>
                    Quatre modules dans l&apos;ordre, à votre rythme, sans date de fin. Le
                    module&nbsp;3 lance une période de relevé dans votre quotidien&nbsp;; le
                    module&nbsp;4 se lit une fois cette période terminée.
                  </li>
                </ol>
              </CardContent>
            </Card>
          ) : null}

          {/* LA FICHE RÉCAP — une page A4 qui résume tout le parcours : la
              notion clé, les quatre modules, le schéma central, l'arbre de
              décision, la grille de relevé vierge, les erreurs fréquentes.

              Elle est ici, AVANT l'inscription et en libre accès, parce que
              c'est le meilleur aperçu possible de ce que vaut le parcours :
              on voit en dix secondes s'il traite bien le problème qu'on a.
              Les fichiers sont générés par scripts/mini-formations —
              `fiches-recap.js` — donc ils ne peuvent pas se désynchroniser
              du contenu des modules.

              Le PDF est vectoriel (~200 Ko) : il s'imprime net en A4. */}
          {f.freeOnline ? (
            <Card>
              <CardContent className="space-y-3 p-5">
                <p className="text-sm font-semibold text-foreground">
                  La fiche récap, en une page
                </p>
                <Link
                  href={`/fiches/${f.slug}.pdf`}
                  target="_blank"
                  rel="noopener"
                  className="block overflow-hidden rounded-md border border-border transition hover:opacity-90"
                >
                  <Image
                    src={`/fiches/${f.slug}.jpg`}
                    alt={`Aperçu de la fiche récapitulative A4 « ${f.title} »`}
                    width={827}
                    height={1170}
                    className="h-auto w-full"
                  />
                </Link>
                <p className="text-xs text-muted-foreground">
                  Tout le parcours sur une page&nbsp;: la notion clé, les quatre modules,
                  le schéma, l&apos;arbre de décision et{" "}
                  <strong className="font-semibold text-foreground">
                    la grille de relevé à recopier
                  </strong>
                  . À imprimer et à garder sous la main.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/fiches/${f.slug}.pdf`} target="_blank" rel="noopener">
                    Télécharger la fiche A4 (PDF)
                  </Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Libre d&apos;accès, sans inscription.
                </p>
              </CardContent>
            </Card>
          ) : null}

          {f.freeOnline ? null : (
          <Card>
            <CardContent className="space-y-4 p-5">
              {f.priceFrom ? (
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    à partir de {formatMoney(f.priceFrom)}
                  </p>
                  <p className="text-xs text-muted-foreground">Par participant, HT</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tarif sur devis</p>
              )}
              {f.nextSessionAt ? (
                <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CalendarClock className="size-4" /> Prochaine session le {formatDate(f.nextSessionAt)}
                </p>
              ) : null}

              {/* Même inversion que sur les fiches atelier : « S'inscrire »
                  passe par /marketplace, donc par la connexion. Le devis, lui,
                  n'exige rien — et c'est de toute façon au devis que se vend
                  une formation Qualiopi, facturée à l'établissement. */}
              <div className="space-y-2">
                <PublicQuoteForm formationSlug={f.slug} titre={f.title} principal />
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/marketplace/formations/${f.id}`}>
                    S’inscrire à une session — j’ai un compte
                  </Link>
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Formation intra-établissement possible. Réponse garantie sous 72 h.
                </p>
              </div>

              <div className="space-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Certification Qualiopi ADéPA</p>
                <p className="flex items-center gap-1.5"><BadgeCheck className="size-3.5" /> Attestation et certificat délivrés</p>
                <p className="flex items-center gap-1.5"><Users className="size-3.5" /> Émargement et suivi inclus</p>
              </div>
            </CardContent>
          </Card>
          )}

          <QrShare path={`/formations/${f.slug}`} title={f.title} fileName={f.slug} />

          {f.account ? (
            <Card>
              <CardContent className="space-y-2 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Organisme de formation
                </p>
                <p className="text-sm font-medium text-foreground">{f.account.name}</p>
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>

      {f.related && f.related.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Autres formations</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {f.related.map((r) => (
              <Link key={r.id} href={`/formations/${r.slug}`} className="group">
                <Card className="h-full overflow-hidden transition group-hover:shadow-card">
                  {premierVisuel(r.images) ? (
                    <div className="relative aspect-[16/10] bg-muted">
                      <Image src={premierVisuel(r.images)!} alt={r.title} fill sizes="33vw" className="object-cover" />
                    </div>
                  ) : null}
                  <CardContent className="space-y-1 p-4">
                    <p className="line-clamp-2 font-medium text-foreground">{r.title}</p>
                    {r.durationHours ? (
                      <p className="text-sm text-muted-foreground">{r.durationHours} h</p>
                    ) : null}
                    {r.freeOnline ? (
                      <p className="font-semibold text-primary">Gratuit · en ligne</p>
                    ) : r.priceFrom ? (
                      <p className="font-semibold text-primary">à partir de {formatMoney(r.priceFrom)}</p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "Course",
              name: f.title,
              description: resume(f.objectives || f.summary || f.title, 300),
              ...(images.length ? { image: images } : {}),
              provider: {
                "@type": "Organization",
                name: f.account?.name ?? "Les Extras",
              },
              // Une formation gratuite en ligne se déclare comme telle :
              // `price: "0"` + `category: "Free"`, et le mode de suivi. Sans
              // cela Google la range parmi les formations sans prix, c'est-à-dire
              // exactement comme celles qui se vendent au devis — alors que
              // « gratuit » est ce qui la fait cliquer.
              ...(f.freeOnline
                ? {
                    offers: {
                      "@type": "Offer",
                      price: "0",
                      priceCurrency: "EUR",
                      category: "Free",
                      availability: "https://schema.org/InStock",
                      ...(f.enrollUrl ? { url: f.enrollUrl } : {}),
                    },
                    // Pas de `courseWorkload` : la durée exacte varie d'une
                    // mini-formation à l'autre (36, 39, 45 min) et la fiche ne
                    // la porte qu'en heures entières. Annoncer une durée
                    // arrondie à Google serait la publier fausse.
                    hasCourseInstance: {
                      "@type": "CourseInstance",
                      courseMode: "online",
                    },
                  }
                : f.priceFrom
                ? {
                    offers: {
                      "@type": "Offer",
                      price: String(f.priceFrom),
                      priceCurrency: "EUR",
                      category: "Paid",
                    },
                  }
                : {}),
              ...(f.rating && f.ratingCount
                ? {
                    aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: f.rating,
                      reviewCount: f.ratingCount,
                    },
                  }
                : {}),
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                { "@type": "ListItem", position: 1, name: "Nos formations", item: "/formations" },
                { "@type": "ListItem", position: 2, name: f.title },
              ],
            },
            ...(faq.length
              ? [{
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  mainEntity: faq.map((q) => ({
                    "@type": "Question",
                    name: q.question,
                    acceptedAnswer: { "@type": "Answer", text: q.answer },
                  })),
                }]
              : []),
          ]),
        }}
      />
    </div>
  );
}

/**
 * Un encart d'attribut de la fiche.
 *
 * `ton` distingue deux encarts VOISINS qui portent des textes longs — « Public
 * visé » et « Prérequis » se lisent côte à côte, et sur le même fond de carte
 * ils formaient un seul pavé où l'œil ne trouvait plus la séparation. Le
 * second prend donc le fond `muted`, plus sourd d'un ton.
 */
/**
 * LES TROIS TONS D'UN ENCART D'ATTRIBUT.
 *
 * `neutre` sert aux attributs courts — durée, lieu, certification : une valeur
 * de trois mots n'a pas besoin d'être signalée, et douze encarts colorés ne
 * signalent plus rien.
 *
 * `primaire` et `secondaire` sont réservés aux DEUX encarts longs qui se
 * lisent côte à côte, « Public visé » et « Prérequis ». Sur le même fond de
 * carte, ils formaient un seul pavé de texte : l'œil ne trouvait ni la
 * séparation, ni le titre de chacun. D'où deux corrections qui vont ensemble —
 * un aplat teinté (et non une nuance de gris de plus, invisible sur charbon),
 * et un titre qui se voit : capitales, gras, interlettrage, à la couleur de
 * l'encart.
 *
 * Les aplats sont posés à 10 % : assez pour séparer deux blocs voisins, pas
 * assez pour concurrencer le texte qu'ils portent.
 */
const TONS = {
  neutre: {
    cadre: "border-border bg-card",
    titre: "text-muted-foreground",
    icone: "text-muted-foreground",
  },
  primaire: {
    cadre: "border-primary/35 bg-primary/10",
    titre: "text-primary",
    icone: "text-primary",
  },
  secondaire: {
    cadre: "border-secondary/35 bg-secondary/10",
    titre: "text-secondary",
    icone: "text-secondary",
  },
} as const;

function Attribut({
  icon,
  label,
  value,
  ton = "neutre",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  ton?: keyof typeof TONS;
}) {
  const t = TONS[ton];
  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${t.cadre}`}>
      <span className={`mt-0.5 shrink-0 ${t.icone}`}>{icon}</span>
      <div className="min-w-0">
        <p className={`text-[11px] font-bold uppercase tracking-[0.08em] ${t.titre}`}>{label}</p>
        <p className="mt-1.5 text-sm font-medium leading-relaxed text-foreground">{value}</p>
      </div>
    </div>
  );
}

function Bloc({ titre, texte }: { titre: string; texte?: string | null }) {
  if (!texte) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-foreground">{titre}</h2>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{texte}</div>
    </section>
  );
}
