// LE MOT « RENFORT » EN DÉSIGNE DEUX, ET ILS N'ONT PAS LE MÊME CONTRAT.
//
// ⚠⚠ C'EST LA SECTION LA PLUS SENSIBLE DE L'ACCUEIL, ET CE N'EST PAS DU
// MARKETING. Un remplacement de poste ne se couvre qu'en CDD salarié — le
// Conseil d'État l'a jugé le 11 février 2025 (n° 491128, affaire Mediflash), et
// la LFSS 2025 (art. 70) a resserré l'intérim en ESSMS dans la foulée. Un
// indépendant qui facturerait un remplacement, c'est une requalification pour
// lui et un risque de travail dissimulé pour l'établissement.
//
// Le défaut ne se voit JAMAIS à l'écran : la mission se pourvoit, les documents
// s'impriment, tout le monde est content. Il se découvre au contrôle.
//
// D'où la règle, posée par Siham et reprise ici mot pour mot :
//   CE N'EST PAS LA PERSONNE QUI CHOISIT LE MONTAGE, C'EST LE BESOIN.
//
// ⚠ LES DEUX NE S'AFFICHENT JAMAIS SANS LEUR MONTAGE ÉCRIT DESSUS. Deux cartes
// côte à côte intitulées « renfort » et « renfort », sans « CDD » et sans
// « prestation », reproduiraient exactement la confusion qu'on répare.
//
// ⚠ ON N'ÉCRIT PAS « FREELANCE » ICI. C'est le vocabulaire sanctionné par la
// décision ci-dessus : « remplaçant en CDD » pour le renfort de poste,
// « intervenant » ou « indépendant » pour la prestation.
//
// ⚠ ET « INDÉPENDANT » NE PASSE JAMAIS DU CÔTÉ CDD. Sur la prestation, c'est le
// mot juste — la personne facture par sa structure et ne remplace personne. Sur
// un remplacement de poste, c'est exactement ce que le Conseil d'État a écarté.
// Le même mot, à deux centimètres d'écart, dit une chose exacte et une faute.
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  FileSignature,
  HeartHandshake,
  ReceiptText,
  ScrollText,
  UsersRound,
} from 'lucide-react';
import { Reveal } from './Reveal';
import { wp } from '@/lib/media';

/**
 * LE PETIT FILM DE CHAQUE CARTE — en SVG animé, pas en GIF.
 *
 * ⚠ VOLONTAIREMENT PAS UN FICHIER .GIF, et il ne faut pas le remplacer par un.
 * Un GIF pèse des centaines de kilo-octets pour trois cercles et un trait, il
 * arrive pixellisé sur un écran moderne, il ne sait pas changer de couleur
 * entre le thème clair et le thème sombre, et il continue de tourner quand le
 * visiteur a demandé moins d'animations. Ce SVG fait le même travail en deux
 * kilo-octets, prend les couleurs du thème, et s'arrête tout seul sous
 * `prefers-reduced-motion` (la règle globale de `globals.css` le couvre).
 *
 * Ce qu'il montre : le trajet réel, de gauche à droite — trois jalons, et une
 * bille qui les parcourt. C'est la seule chose qu'un visiteur pressé retiendra
 * de la carte, donc elle doit dire le chemin, pas décorer.
 */
function Trajet({
  etapes,
  teinte,
  retard = 0,
}: {
  etapes: string[];
  /** Classe de couleur du trait et des jalons (currentColor). */
  teinte: string;
  retard?: number;
}) {
  return (
    <div className={teinte}>
      <svg
        viewBox="0 0 320 64"
        className="w-full"
        role="img"
        aria-label={`Le chemin : ${etapes.join(', puis ')}.`}
      >
        {/* Le rail, en clair : il dit où ça va avant que la bille n'y aille. */}
        <line
          x1="26"
          y1="26"
          x2="294"
          y2="26"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.22"
        />
        {/* Le trait qui se remplit, une fois, à l'arrivée à l'écran. */}
        <line
          x1="26"
          y1="26"
          x2="294"
          y2="26"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="animate-rail"
          style={{ animationDelay: `${retard}ms` }}
        />
        {etapes.map((etape, i) => {
          const x = 26 + i * 134;
          return (
            <g key={etape}>
              <circle
                cx={x}
                cy="26"
                r="7"
                fill="currentColor"
                className="animate-jalon"
                style={{ animationDelay: `${retard + 260 + i * 420}ms` }}
              />
              <text
                x={x}
                y="52"
                textAnchor={i === 0 ? 'start' : i === etapes.length - 1 ? 'end' : 'middle'}
                className="fill-muted-foreground text-[10px] font-medium"
                style={{ fontSize: 10 }}
              >
                {etape}
              </text>
            </g>
          );
        })}
        {/* La bille : elle repart en boucle, c'est ce qui rend la carte vivante. */}
        <circle
          cx="26"
          cy="26"
          r="4"
          fill="currentColor"
          className="animate-bille"
          style={{ animationDelay: `${retard}ms` }}
        />
      </svg>
    </div>
  );
}

const RENFORTS = [
  {
    cle: 'cdd',
    icone: CalendarClock,
    montage: 'Remplacement · CDD',
    titre: 'Un poste à couvrir',
    /**
     * ⚠ L'IMAGE MONTRE LE POSTE, PAS LE CONTRAT. Deux cartes qui expliquent un
     * montage juridique n'ont aucune illustration possible du montage lui-même ;
     * ce qu'on illustre, c'est la SITUATION qui l'appelle — quelqu'un au poste
     * d'un côté, un accompagnement à deux de l'autre. Les fichiers viennent de
     * la médiathèque de l'association (vérifiés en ligne le 16/09/2026), comme
     * les trois cartes d'usage plus haut.
     */
    image: wp('/wp-content/uploads/2023/02/aide-soignant.jpg'),
    accroche:
      'Une éducatrice en arrêt, un veilleur absent. Quelqu’un manque : il faut quelqu’un à sa place.',
    etapes: ['Vous publiez', 'Votre équipe, puis le réseau', 'CDD signé'],
    points: [
      { icone: UsersRound, texte: 'Diffusé en cascade : vos salariés, vos habitués, le réseau.' },
      { icone: FileSignature, texte: 'Contrat de travail édité ici, signé en ligne.' },
      { icone: BadgeCheck, texte: 'Identité et bulletin n° 3 déjà au dossier.' },
    ],
    conclusion: 'Vous embauchez en CDD, comme un vacataire. C’est vous l’employeur.',
    action: { libelle: 'Comment marche RenforTeam', href: '/renforteam' },
    teinte: 'text-primary',
    bordure: 'border-primary/35',
    fond: 'bg-gradient-to-br from-primary/[0.14] via-card to-card',
    pastille: 'bg-primary text-primary-foreground',
    puce: 'text-primary',
    lisere: 'bg-primary',
  },
  {
    cle: 'personnalise',
    icone: HeartHandshake,
    montage: 'Renfort personnalisé · prestation',
    titre: 'Un accompagnement 1 pour 1',
    image: wp('/wp-content/uploads/2023/02/educatheure.jpeg'),
    accroche:
      'Un jeune à accompagner, un suivi individuel. Personne ne manque : il faut quelqu’un EN PLUS.',
    etapes: ['Vous choisissez', 'Devis', 'Facture de sa structure'],
    points: [
      { icone: ScrollText, texte: 'Une fiche, un devis, un contrat de prestation.' },
      { icone: ReceiptText, texte: 'L’indépendant facture par sa structure.' },
      { icone: BadgeCheck, texte: 'Rien n’est engagé avant votre accord.' },
    ],
    conclusion: 'Il reste indépendant parce qu’il ne remplace personne.',
    action: {
      libelle: 'Voir les intervenants',
      href: '/marketplace?type=services&format=INDIVIDUEL',
    },
    teinte: 'text-secondary',
    bordure: 'border-secondary/35',
    fond: 'bg-gradient-to-br from-secondary/[0.14] via-card to-card',
    pastille: 'bg-secondary text-secondary-foreground',
    puce: 'text-secondary',
    lisere: 'bg-secondary',
  },
];

export function DeuxRenforts() {
  return (
    <section className="section">
      {/*
        ⚠ L'EN-TÊTE PORTE LE NOM DU PRODUIT — 16/09/2026, demande de Siham.

        Le titre était la RÈGLE (« ce n'est pas la personne qui choisit le
        montage, c'est le besoin ») : juste, mais abstraite, et elle ne disait
        ni le nom du service ni ce qu'on y fait. Un directeur qui arrive doit
        lire en une seconde ce qu'il peut obtenir — un remplaçant qu'il
        embauche, ou un indépendant pour un accompagnement. La règle n'est pas
        perdue : elle tient en fin de sous-titre, où elle explique les deux
        cartes au lieu de les annoncer.

        ⚠ « INDÉPENDANT » EST CORRECT ICI, ET SEULEMENT ICI. Le mot est banni
        du remplacement de poste (CE 11/02/2025 n° 491128) ; c'est précisément
        le montage de l'autre colonne, celle de la prestation sur un besoin
        nommé. Il ne doit jamais glisser vers la carte CDD. « Freelance »,
        lui, reste banni des deux côtés.
      */}
      <Reveal className="max-w-3xl">
        {/*
          ⚠ LE NOM DU PRODUIT EST DANS LE TITRE, PAS DANS LA PASTILLE
          (16/09/2026, demande de Siham) — exactement comme la section LEX plus
          bas : « LEX, pour celles et ceux qui font le terrain ». Une pastille
          grise est l'endroit qu'on saute ; le titre est la seule ligne qu'un
          visiteur pressé lit. La pastille ne porte donc plus que la catégorie,
          « Renfort », qui dit de quoi parle la section avant de dire son nom.
        */}
        <span className="eyebrow">Renfort</span>
        <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight md:text-4xl">
          RenforTeam, deux renforts.{' '}
          <span className="text-gradient-brand">Deux contrats.</span>
        </h2>
        {/*
          ⚠ TROIS LIGNES, ET C'EST VOULU (demande de Siham). Les trois idées
          étaient dans un seul paragraphe : les deux montages s'y lisaient comme
          une seule phrase, et la règle finale — celle qui explique les deux
          cartes — se perdait en fin de bloc. Séparées, chaque ligne se lit
          seule : le cas de gauche, le cas de droite, puis ce qui tranche.
          Ne pas les recoller en un paragraphe.
        */}
        <div className="mt-4 space-y-2 text-lg leading-relaxed text-muted-foreground">
          <p>Un poste à couvrir&nbsp;? Un CDD que vous embauchez, comme un vacataire.</p>
          <p>Un besoin en plus de l’équipe&nbsp;: un indépendant, en prestation.</p>
          <p>C’est le besoin qui choisit, pas la personne.</p>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {RENFORTS.map((r, i) => (
          <Reveal key={r.cle} delay={i * 120} className="h-full">
            <article
              className={`reflet group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 ${r.bordure} ${r.fond} shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-xl`}
            >
              {/* Le liseré se trace de haut en bas quand la carte arrive. Il
                  part sous l'image : sinon il traverse la photo et la salit. */}
              <span
                className={`animate-trait absolute left-0 top-[46%] bottom-6 w-[3px] rounded-full ${r.lisere}`}
                aria-hidden
              />

              {/*
                ⚠ LE FORMAT EST PLUS BAS QUE CELUI DES CARTES D'USAGE (21/9 au
                lieu de 16/9). Ces deux cartes-ci portent beaucoup plus de texte
                — un trajet, trois repères, une conclusion — et une image au même
                format les aurait poussées bien au-delà d'un écran. L'image est
                un repère, pas le sujet.
              */}
              <div className="relative aspect-[21/9] overflow-hidden bg-muted">
                <Image
                  src={r.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Le fondu vers le fond de la carte : sans lui, la photo se
                    termine par une arête franche au milieu du bloc. */}
                <span
                  className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-card to-transparent"
                  aria-hidden
                />
              </div>

              <div className="flex flex-1 flex-col p-6 pl-7">
              <div className="flex items-start gap-3">
                <span
                  className={`relative grid size-11 shrink-0 place-items-center rounded-xl ${r.pastille}`}
                >
                  <r.icone className="size-5" aria-hidden />
                  {/* L'anneau qui pulse : « c'est vivant », sans clignoter. */}
                  <span
                    className={`animate-anneau absolute inset-0 rounded-xl ${r.lisere}`}
                    aria-hidden
                  />
                </span>
                <div className="min-w-0">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-[0.14em] ${r.teinte}`}
                  >
                    {r.montage}
                  </span>
                  <h3 className="mt-1 text-xl font-bold leading-snug text-foreground">{r.titre}</h3>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground" lang="fr">
                {r.accroche}
              </p>

              <div className="mt-5">
                <Trajet etapes={r.etapes} teinte={r.teinte} retard={i * 300} />
              </div>

              <ul className="mt-5 space-y-2.5">
                {r.points.map((p) => (
                  <li key={p.texte} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <p.icone className={`mt-0.5 size-4 shrink-0 ${r.puce}`} aria-hidden />
                    <span>{p.texte}</span>
                  </li>
                ))}
              </ul>

              {/* `mt-auto` colle la conclusion et le lien en bas : les deux
                  cartes n'ont pas la même longueur de texte, et sans ça leurs
                  deux liens ne s'alignent pas — l'œil lit alors un déséquilibre
                  là où il n'y en a pas. */}
              <p className="mt-auto pt-5 text-sm font-medium text-foreground">
                <span className="block rounded-lg border border-border bg-card/70 px-3.5 py-2.5">
                  {r.conclusion}
                </span>
              </p>

              <Link
                href={r.action.href}
                className={`mt-5 inline-flex items-center gap-1.5 text-sm font-semibold ${r.teinte} hover:underline`}
              >
                {r.action.libelle}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {/*
        ⚠⚠ LA BANDE DE DROIT A ÉTÉ RETIRÉE DE L'ACCUEIL LE 16/09/2026, À LA
        DEMANDE DE SIHAM — ET ELLE N'A PAS ÉTÉ SUPPRIMÉE DU SITE. Elle a été
        DÉPLACÉE sur /renforteam, c'est-à-dire sur la page où mène la première
        carte et où un directeur lit vraiment comment se monte un remplacement.

        ⚠ NE PAS LA REMETTRE ICI. Sur l'accueil, elle arrêtait la lecture avec
        deux références d'articles au moment précis où le visiteur cherche
        encore à savoir si le site est pour lui. La règle, elle, tient toujours
        sans elle : chaque carte porte son montage écrit dessus
        (« Remplacement · CDD », « Renfort personnalisé · prestation ») et sa
        phrase de conclusion dit qui embauche et qui facture. C'est ce qui
        interdit la confusion, pas la citation.

        La citation reste lisible à trois endroits : /renforteam,
        /comparatif-plateformes-remplacement, et dans le produit (inscription,
        disponibilité, publication d'une fiche).
      */}
    </section>
  );
}
