/**
 * LE CENTRE DE FORMATION ADÉPA — le SEUL bloc « formation » de Les Extras.
 *
 * ⚠⚠ DÉCISION DE SIHAM, 28/09/2026 : LES FORMATIONS QUITTENT LES EXTRAS.
 * adepa77.fr (WordPress) est désormais LE site de l'organisme de formation :
 * catalogue (`/formations/`), une fiche par formation au MÊME slug que sur Les
 * Extras (`/formations/<slug>/`), et les pages réglementaires (informations
 * réglementaires, CGV formation, réclamation, accessibilité handicap). Les
 * anciennes adresses de Les Extras y redirigent en 308 (`next.config.mjs`).
 *
 * Sur Les Extras il ne reste que CE bloc : il présente les parcours gratuits,
 * dit en deux lignes ce qu'est le centre de formation, et renvoie vers
 * adepa77.fr. ⚠ NE PAS EN AJOUTER UN SECOND ailleurs sur l'accueil, ni
 * remettre une carte, un onglet ou une puce « formations » dans les autres
 * sections : c'est exactement ce qui vient d'être retiré.
 *
 * ⚠ LA LISTE EST STATIQUE, ET C'EST VOULU. Elle ne dépend d'aucun appel à
 * l'API : le service ne vit plus ici, et l'accueil ne doit pas perdre ce bloc
 * pendant un redéploiement. Titres, slugs et durées sont ceux du catalogue
 * public relevé le 28/09/2026 (`/public/formations`), recopiés tels quels. Les
 * couvertures sont dans `public/images/mini-formations/` (chemins relatifs,
 * elles ne passent pas par la médiathèque WordPress). Si un titre change sur
 * adepa77.fr, il change ici aussi.
 *
 * ⚠ AUCUN PRIX, AUCUN « CERTIFICAT ». Les parcours sont gratuits ; ce qui se
 * délivre à la fin est une attestation de suivi, et ce bloc n'en parle pas :
 * c'est adepa77.fr qui porte les conditions. Le numéro Qualiopi est celui du
 * certificat de l'organisme (QNW0132, voir le pied de page) : il atteste d'un
 * PROCESSUS, pas d'un titre.
 *
 * ⚠ COMPOSANT SERVEUR. Aucun état, aucun effet : seul `Reveal`, déjà chargé
 * par toute la page, anime l'apparition comme pour les autres sections.
 */
import Image from 'next/image';
import { ArrowRight, Clock, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal } from './Reveal';

/** Le site du centre de formation. Toutes les adresses de ce bloc en partent. */
const ADEPA_FORMATIONS = 'https://adepa77.fr/formations/';

type Parcours = { titre: string; slug: string; minutes: number };

/**
 * Quatre parcours gratuits, un par grande entrée du catalogue : comprendre
 * (les fonctions), la crise, la consigne, l'écrit. Les quatre ont leur
 * couverture dans `public/images/mini-formations/<slug>.jpg`.
 */
const PARCOURS: Parcours[] = [
  { titre: 'Les quatre fonctions d’un comportement', slug: 'les-quatre-fonctions-d-un-comportement', minutes: 45 },
  { titre: 'Les premières minutes d’une crise', slug: 'les-premieres-minutes-d-une-crise', minutes: 45 },
  { titre: 'L’enfant qui dit non à tout', slug: 'l-enfant-qui-dit-non-a-tout', minutes: 45 },
  { titre: 'Décrire un comportement sans le juger', slug: 'decrire-un-comportement-sans-le-juger', minutes: 46 },
];

export function CentreFormationAdepa() {
  return (
    <section id="centre-de-formation" className="scroll-mt-24 bg-nacre">
      <div className="section">
        <Reveal className="max-w-3xl">
          <span className="eyebrow flex w-fit">
            <GraduationCap className="size-3.5" />
            Centre de formation ADéPA
          </span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl text-balance">
            Des parcours gratuits pour comprendre un comportement avant de le changer
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            ADéPA, l’association qui porte Les Extras, est un organisme de formation certifié
            Qualiopi (n°&nbsp;QNW0132) pour les actions de formation et les bilans de compétences.
          </p>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Ses formations en établissement sont finançables par votre OPCO. Ses parcours en ligne
            sont gratuits, sans carte bancaire, à suivre à votre rythme.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PARCOURS.map((p, i) => (
            <Reveal key={p.slug} delay={i * 90} className="h-full">
              <a
                href={`${ADEPA_FORMATIONS}${p.slug}/`}
                target="_blank"
                rel="noopener"
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background no-underline shadow-card transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="relative aspect-[16/10] bg-muted">
                  {/* `alt` vide : le titre est écrit juste en dessous, dans le
                      même lien. Le répéter ferait annoncer deux fois la même
                      chose aux lecteurs d'écran. */}
                  <Image
                    src={`/images/mini-formations/${p.slug}.jpg`}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="rounded-full bg-primary-soft px-2.5 py-1 font-semibold text-primary">
                      Gratuit · en ligne
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
                      <Clock className="size-3.5" aria-hidden />
                      {p.minutes}&nbsp;min
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold leading-snug text-foreground">{p.titre}</h3>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-sm font-medium text-primary">
                    Voir le parcours
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button asChild size="lg">
            <a href={ADEPA_FORMATIONS} target="_blank" rel="noopener">
              Découvrir le centre de formation
              <ArrowRight />
            </a>
          </Button>
          <p className="text-sm text-muted-foreground">
            Catalogue, formations en établissement et informations réglementaires sur adepa77.fr.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
