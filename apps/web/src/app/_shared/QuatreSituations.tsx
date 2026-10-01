/**
 * LES SITUATIONS — le fil de l'accueil.
 *
 * ⚠⚠ TROIS SITUATIONS, PLUS QUATRE (28/09/2026, décision de Siham). La
 * situation « Formations » est retirée : les formations ont quitté Les Extras
 * pour adepa77.fr, le site du centre de formation ADéPA. L'accueil les présente
 * désormais dans UN bloc à part, `CentreFormationAdepa`, qui renvoie vers
 * adepa77.fr. Le composant garde son nom (`QuatreSituations`) pour ne pas
 * déplacer le fichier ; c'est le contenu qui fait foi.
 *
 * ⚠ POURQUOI CE BLOC REMPLACE « LES TROIS USAGES » (demande de Siham,
 * 21/09/2026). L'accueil enchaînait « Le réseau répond aux trois » puis « Le
 * travail administratif que vous ne ferez plus » : deux fois les mêmes offres,
 * une fois en produits, une fois en fonctions du logiciel. Le visiteur lisait
 * donc deux inventaires et aucune histoire — et RenforTeam n'avait nulle part
 * une section qui l'explique, alors que c'est le service le plus difficile à
 * comprendre.
 *
 * ⚠ LA RÈGLE D'ÉCRITURE, ET C'EST ELLE QU'IL NE FAUT PAS DÉFAIRE : chaque
 * section s'ouvre sur LA SITUATION, jamais sur le produit. Le titre est une
 * phrase qu'on pourrait entendre dans un couloir d'établissement ou dans une
 * cuisine à 21 h ; le service n'arrive qu'en réponse. Un visiteur ne cherche
 * pas « une plateforme de mise en relation », il cherche à sortir de quelque
 * chose.
 *
 * ⚠ LES CHIFFRES SONT VRAIS, ET ILS VIENNENT D'AILLEURS DANS LE SITE :
 *  - 0 % sur les ateliers, 15 % sur le renfort
 *    (/frais-de-service, arrêté le 21/09/2026) ;
 *  - 48 h pour un devis (promesse tenue partout ailleurs) ;
 *  - 15 générations LEX offertes par mois, puis 19 € (billing.service.ts).
 * Aucun n'est arrondi ni inventé. Si l'un bouge, il bouge aux deux endroits.
 *
 * ⚠ ON N'ÉCRIT PAS « VISIOCONSULTATION » ICI tant que
 * `NEXT_PUBLIC_VISIOCONSULTATION` n'est pas posée. L'ancienne carte « Renfort »
 * l'annonçait alors que `/visio/:jeton` redirige : la page promettait un
 * service que le site ne pouvait pas rendre. La mention est donc conditionnée,
 * comme la carte de l'accueil et comme /renforteam.
 *
 * ⚠ AUCUNE PROMESSE DE VÉRIFICATION. Ni « intervenants vérifiés », ni
 * « profils contrôlés » : aucune vérification d'identité, de diplôme ou de
 * casier n'existe dans ce produit, et c'est l'établissement qui contrôle à
 * l'embauche. Le test `promesses-interdites` le vérifie.
 *
 * ⚠⚠ RESSERRÉ LE 21/09/2026 — « il y a trop de textes à lire », demande de
 * Siham, capture à l'appui. Chaque section portait DEUX paragraphes : le
 * premier posait la situation, le second la reposait depuis l'autre côté
 * (l'établissement après la famille, les assistants génériques après LEX).
 * Le second commentait le premier, et c'est exactement ce qui fait sauter les
 * deux. Un paragraphe par section désormais, deux phrases au plus.
 *
 * ⚠ ET PLUS DE TIRET CADRATIN NI DE DEUX-POINTS DANS CE BLOC, toujours à sa
 * demande. Ce n'est pas une préférence de ponctuation, c'est un effet mesuré à
 * l'écran : un « — » ou un « : » au milieu d'une ligne annonce une SUITE, donc
 * une phrase plus longue, et sur des sections empilées cela se lit comme un
 * mur. Les incises deviennent des phrases, les listes après deux-points
 * deviennent la phrase elle-même. Si une nouvelle section en rapporte un, elle
 * rouvre le défaut pour tout le bloc.
 *
 * ⚠ AUCUN CHIFFRE N'A ÉTÉ RETIRÉ au passage, et aucun fait : 48 h, 0 %, 15
 * écrits puis 19 €. Ce qui a sauté, ce sont les redites. Un resserrage qui
 * emporte un chiffre fait mentir la page au lieu de l'alléger. (Les « 14
 * parcours » sont partis le 28/09 avec la situation « Formations ».)
 *
 * ⚠⚠ REFAIT EN « CHIFFRES D'ABORD » LE 30/09/2026, demande de Siham, capture à
 * l'appui : « trop de textes, pas assez clair, pas assez percutant ». Chaque
 * section portait encore un paragraphe, trois puces, une ligne de prix, un
 * encadré et un chiffre : cinq blocs de texte pour un seul service. Elle porte
 * désormais le titre (la phrase du couloir), TROIS POINTS COURTS à icône (pas
 * des phrases, demande explicite), TROIS repères chiffrés en cartes, l'image
 * gardée et animée, et un bouton. Ce que disaient les puces et la
 * ligne « Combien ça coûte » vit dans les repères : 48 h, 15 %, les métiers,
 * 0 %, devis sans compte, 15 écrits puis 19 € ou un pack dès 9 €. AUCUN
 * chiffre n'est tombé ; si l'un bouge, il bouge ici ET sur la page du service.
 * ⚠ NE PAS REMETTRE DE PARAGRAPHE SOUS LE TITRE : c'est exactement ce qui a
 * été retiré, deux fois (21/09, puis 30/09).
 *
 * ⚠ LES ANIMATIONS PASSENT TOUTES PAR LES CLASSES EXISTANTES de globals.css
 * (`reveal`, `animate-panoramique`, `animate-derive`, `animate-anneau`), qui
 * sont déjà coupées par `prefers-reduced-motion`. Une animation ajoutée en
 * dehors de cette liste continuerait de bouger pour qui a demandé le calme.
 */
import Link from 'next/link';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  ClipboardList,
  FileCheck,
  Gift,
  GraduationCap,
  HeartHandshake,
  ListChecks,
  NotebookPen,
  Palette,
  PenLine,
  Send,
  ShieldCheck,
  Sparkles,
  Tag,
  UserRoundCheck,
} from 'lucide-react';
import { wp } from '@/lib/media';
import { visioconsultationVisible } from '@/lib/offre';
import { Reveal } from './Reveal';

/**
 * ⚠ LU UNE SEULE FOIS, EN TÊTE DE MODULE. `NEXT_PUBLIC_VISIOCONSULTATION` est
 * figée à la construction : l'appeler à chaque rendu ne change rien.
 */
const VISIO = visioconsultationVisible();

type Point = { icone: LucideIcon; texte: string };
/** Un repère : un chiffre (ou un mot) en gros, ce qu'il désigne en petit. */
type Repere = { icone: LucideIcon; valeur: string; quoi: string };

type Situation = {
  service: string;
  /**
   * Ce que le nom veut dire, en une ligne, sous le nom du service. Demande de
   * Siham le 30/09 : « RenforTeam, c'est la team en renfort pour le
   * médico-social ». Un nom de marque seul ne dit pas ce qu'on achète.
   */
  accroche?: string;
  icone: LucideIcon;
  /** La phrase du couloir. C'est le titre, et c'est le problème. */
  probleme: string;
  /** TROIS points, quelques mots chacun. Jamais une phrase entière. */
  points: [Point, Point, Point];
  /**
   * TROIS repères, jamais plus. Chaque chiffre est relu dans le code ou sur
   * la page du service, jamais inventé (voir l'en-tête).
   */
  reperes: [Repere, Repere, Repere];
  /** La pastille qui flotte sur l'image. Un fait, pas un slogan. */
  badge: string;
  lien: { href: string; libelle: string };
  /** Une photo, OU `visuel: 'lex'` pour le rendu maison. Jamais les deux. */
  image?: string;
  alt?: string;
  visuel?: 'lex';
  /*
    ⚠ CLASSES ÉCRITES EN TOUTES LETTRES, JAMAIS CALCULÉES : Tailwind ne génère
    que les classes littérales des sources (défaut du 21/09 sur le filet).
  */
  teinte: string;
  trait: string;
  tuile: string;
  carte: string;
  point: string;
};

const SITUATIONS: Situation[] = [
  {
    service: 'RenforTeam',
    accroche: 'La team en renfort pour le médico-social',
    icone: HeartHandshake,
    probleme: 'Il faudrait un éducateur de plus. Personne ne vient pour quelques heures.',
    points: [
      { icone: ClipboardList, texte: 'Besoin décrit en 5 minutes' },
      { icone: UserRoundCheck, texte: 'Vous choisissez qui vient' },
      { icone: FileCheck, texte: 'Devis écrit avant l’intervention' },
    ],
    reperes: [
      // ⚠ PLUS DE PRIX NI DE DÉLAI SUR L'ACCUEIL (01/10/2026, méthode Airbnb) :
      // « 48 h » et « +15 % » sont retirés. Les frais restent écrits sur
      // /renforteam, /frais-de-service et au moment du devis.
      { icone: UserRoundCheck, valeur: 'Vérifiés', quoi: 'par l’association' },
      {
        icone: GraduationCap,
        valeur: 'ES · ME · AES',
        // ⚠ La visio reste conditionnée : sans la variable, /visio redirige.
        quoi: VISIO ? 'présentiel ou visio' : 'sur place ou à domicile',
      },
      { icone: FileCheck, valeur: 'Devis', quoi: 'avant l’intervention' },
    ],
    badge: 'Éducateurs en renfort',
    lien: { href: '/renforteam', libelle: 'Comment ça se passe' },
    image: wp('/wp-content/uploads/2025/02/mineur-protection-de-lenfance.jpg'),
    alt: 'Un professionnel accompagne un enfant lors d’une séance individuelle',
    teinte: 'text-primary',
    trait: 'bg-primary',
    tuile: 'bg-primary/10 text-primary ring-primary/20',
    carte: 'border-primary/20 bg-primary/[0.06] hover:border-primary/50',
    point: 'bg-primary',
  },
  {
    service: 'Ateliers',
    icone: Palette,
    probleme: 'Il faut « faire quelque chose » avec le groupe, et personne n’a le temps de le monter.',
    points: [
      { icone: Sparkles, texte: 'Musicothérapie, théâtre, boxe, slam' },
      { icone: ListChecks, texte: 'Public, durée, matériel et tarif affichés' },
      // Audit du 28/09 : le paiement en ligne n'est actif sur aucune fiche.
      { icone: Send, texte: 'Devis sans créer de compte' },
    ],
    reperes: [
      // Pas de chiffre ni de prix sur l'accueil (01/10/2026) : le tarif se
      // lit sur chaque fiche.
      { icone: ListChecks, valeur: 'Public', quoi: 'durée et matériel indiqués' },
      { icone: Send, valeur: 'Sans compte', quoi: 'pour demander un devis' },
      { icone: Tag, valeur: 'Tarif', quoi: 'écrit sur chaque fiche' },
    ],
    badge: 'Ateliers clés en main',
    lien: { href: '/ateliers', libelle: 'Parcourir le catalogue' },
    image: wp('/wp-content/uploads/2023/02/cerf-volant-game-enfant-400x400.jpg'),
    alt: 'Des enfants en activité collective en extérieur',
    teinte: 'text-secondary',
    trait: 'bg-secondary',
    tuile: 'bg-secondary/10 text-secondary ring-secondary/20',
    carte: 'border-secondary/20 bg-secondary/[0.06] hover:border-secondary/50',
    point: 'bg-secondary',
  },
  {
    service: 'LEX',
    icone: PenLine,
    // ⚠ LEX EN TROIS TÂCHES (01/10/2026, décision de Siham) : préparer une
    // activité, améliorer un écrit, transformer des notes en compte rendu.
    // Aucun prix ici ; ils sont sur /lex.
    accroche: 'Vos activités et vos écrits du quotidien',
    probleme: 'Une activité à préparer, un compte rendu à écrire, et pas le temps.',
    points: [
      { icone: Sparkles, texte: 'Préparer une activité' },
      { icone: PenLine, texte: 'Améliorer un écrit' },
      { icone: NotebookPen, texte: 'Vos notes en compte rendu' },
    ],
    reperes: [
      { icone: ListChecks, valeur: '3', quoi: 'tâches, un seul outil' },
      { icone: ShieldCheck, valeur: 'Noms', quoi: 'retirés avant l’envoi' },
      // FREE_MONTHLY_CREDITS (credits.constants.ts) : une gratuité, pas un prix.
      { icone: Gift, valeur: 'Gratuit', quoi: 'pour commencer' },
    ],
    badge: 'le nom part ici',
    lien: { href: '/lex', libelle: 'Ce que LEX fait, et ne fait pas' },
    // ⚠ PAS DE PHOTO : le avant / après montre en trois secondes que les noms
    // sont remplacés, ce qu'aucune photo de bureau ne dit.
    visuel: 'lex',
    teinte: 'text-primary',
    trait: 'bg-primary',
    tuile: 'bg-primary/10 text-primary ring-primary/20',
    carte: 'border-primary/20 bg-primary/[0.06] hover:border-primary/50',
    point: 'bg-primary',
  },
];

/** Pastille « vivante » : un point qui pulse, puis le texte. */
function Pastille({ texte, point }: { texte: string; point: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-bold text-foreground shadow-card backdrop-blur">
      <span className="relative flex size-2">
        <span className={`absolute inset-0 rounded-full ${point} animate-anneau`} aria-hidden />
        <span className={`relative size-2 rounded-full ${point}`} aria-hidden />
      </span>
      {texte}
    </span>
  );
}

/**
 * LE AVANT / APRÈS DE LEX. ⚠ Il montre le jeton `[LE JEUNE]`, et c'est tout
 * l'intérêt : on voit le nom disparaître. Texte fictif, prénom seul.
 */
function VisuelLex({ badge, point }: { badge: string; point: string }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-4 shadow-card transition duration-500 hover:shadow-lg sm:p-5">
      <div className="rounded-xl border border-border bg-background p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Vos notes</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          «&nbsp;<span className="font-semibold">Kevin</span> a encore quitté la table hier soir, 3<sup>e</sup> fois
          cette semaine.&nbsp;»
        </p>
      </div>

      <div className="flex items-center gap-3 py-3">
        <span className="h-px flex-1 bg-border" aria-hidden />
        <span className="animate-derive">
          <Pastille texte={badge} point={point} />
        </span>
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Ce que le modèle reçoit
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          «&nbsp;<mark className="rounded bg-primary-soft px-1 font-semibold text-primary">[LE JEUNE]</mark> a quitté
          la table à trois reprises cette semaine.&nbsp;»
        </p>
      </div>
    </div>
  );
}

export function QuatreSituations() {
  return (
    <section className="bg-background">
      <div className="section">
        <Reveal className="max-w-3xl">
          <span className="eyebrow">Ce qu’on résout</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl text-balance">
            Trois situations qu’on connaît tous. Trois réponses.
          </h2>
        </Reveal>

        <div className="mt-12 space-y-20 md:space-y-28">
          {SITUATIONS.map((s, i) => {
            const Icone = s.icone;
            return (
              /*
                ⚠ L'ALTERNANCE SE FAIT PAR `order`, PAS PAR `flex-row-reverse` :
                sur mobile l'image doit TOUJOURS passer après le texte.
              */
              <div key={s.service} className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
                <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                  <Reveal>
                    {/*
                      ⚠ LE NOM DU SERVICE EST EN GRAND (30/09, demande de Siham :
                      « met en avant RENFORTEAM et ATELIER »). Il était en
                      sur-titre de 12 px, plus petit que les points en dessous.
                    */}
                    <div className="flex items-center gap-3.5">
                      <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ring-1 ${s.tuile}`}>
                        <Icone className="size-6" aria-hidden />
                      </span>
                      <div>
                        <p className={`text-3xl font-extrabold uppercase leading-none tracking-tight md:text-4xl ${s.teinte}`}>
                          {s.service}
                        </p>
                        {s.accroche ? (
                          <p className="mt-1.5 text-sm font-semibold text-foreground/80 md:text-base">{s.accroche}</p>
                        ) : null}
                      </div>
                    </div>

                    <span className={`mt-5 block h-px w-12 ${s.trait}`} aria-hidden />
                    <h3 className="mt-5 text-xl font-bold leading-tight tracking-tight text-foreground md:text-2xl text-balance">
                      {s.probleme}
                    </h3>
                  </Reveal>

                  <ul className="mt-6 space-y-3">
                    {s.points.map((p, k) => {
                      const I = p.icone;
                      return (
                        <li key={p.texte}>
                          <Reveal delay={120 + k * 110} className="flex items-center gap-3">
                            <span className={`grid size-8 shrink-0 place-items-center rounded-lg ring-1 ${s.tuile}`}>
                              <I className="size-4" aria-hidden />
                            </span>
                            <span className="text-[15px] font-semibold text-foreground">{p.texte}</span>
                          </Reveal>
                        </li>
                      );
                    })}
                  </ul>

                  <dl className="mt-7 grid grid-cols-3 gap-2.5 sm:gap-3">
                    {s.reperes.map((r, k) => {
                      const I = r.icone;
                      return (
                        <Reveal key={r.valeur} delay={400 + k * 110}>
                          <div
                            className={`group h-full rounded-2xl border p-3 transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-4 ${s.carte}`}
                          >
                            <I
                              className={`size-4 transition duration-300 group-hover:scale-125 ${s.teinte}`}
                              aria-hidden
                            />
                            <dt
                              className={`mt-2 text-base font-extrabold leading-tight tracking-tight sm:text-2xl ${s.teinte}`}
                            >
                              {r.valeur}
                            </dt>
                            <dd className="mt-1 text-[11px] leading-snug text-muted-foreground sm:text-xs">
                              {r.quoi}
                            </dd>
                          </div>
                        </Reveal>
                      );
                    })}
                  </dl>

                  <Reveal delay={700}>
                    {/*
                      ⚠ UN <Link> AUX CLASSES DU BOUTON « outline », PAS `Button asChild`
                      (et pas `buttonVariants` : button.tsx est un module client).
                      Le bouton du milieu arrivait dans un segment de rendu en
                      flux, et `Slot` y perdait toutes ses classes : un lien nu,
                      le texte et la flèche sur deux lignes (vu le 30/09).
                    */}
                    <Link
                      href={s.lien.href}
                      className="group mt-7 inline-flex h-11 w-fit items-center gap-2 whitespace-nowrap rounded-lg border border-input bg-card px-5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {s.lien.libelle}
                      <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                    </Link>
                  </Reveal>
                </div>

                <Reveal delay={150} className={i % 2 === 1 ? 'md:order-1' : ''}>
                  {s.visuel === 'lex' ? (
                    <VisuelLex badge={s.badge} point={s.point} />
                  ) : (
                    <div className="group relative aspect-[4/3] overflow-hidden rounded-3xl border border-border shadow-card">
                      <div className="absolute inset-0 animate-panoramique">
                        <Image
                          src={s.image as string}
                          alt={s.alt as string}
                          fill
                          sizes="(min-width: 768px) 46vw, 100vw"
                          className="object-cover transition duration-700 group-hover:scale-105"
                        />
                      </div>
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent"
                        aria-hidden
                      />
                      <div className="absolute bottom-4 left-4 animate-derive">
                        <Pastille texte={s.badge} point={s.point} />
                      </div>
                    </div>
                  )}
                </Reveal>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
