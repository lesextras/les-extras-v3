// LA VIGNETTE DE CEUX QUI N'ONT PAS MIS DE PHOTO.
//
// ⚠ CE QU'ON REMPLACE, ET POURQUOI. Une fiche sans photo affichait un
// rectangle beige avec « Les Extras » écrit au milieu. Quatre fiches côte à
// côte dans le carrousel, c'était quatre fois le même rectangle : le catalogue
// avait l'air vide, et rien ne distinguait une fiche de sa voisine. Or on ne
// force personne à déposer une image — c'est une règle de la maison — donc le
// cas sans photo n'est pas une exception à traiter au minimum, c'est un cas
// ordinaire qui doit être beau.
//
// CE QU'ON MET À LA PLACE. Une scène dessinée qui bouge : deux masses de
// couleur qui dérivent lentement derrière un pictogramme qui respire. Elle
// change d'une fiche à l'autre — la teinte et le décalage des mouvements sont
// tirés du titre — et le dessin suit ce qu'on regarde, un atelier, une
// formation, un parcours ou un article.
//
// POURQUOI DU DESSIN ET PAS UN GIF. Un GIF pèse cent kilo-octets par carte,
// se pixellise dès qu'on l'agrandit, ne connaît pas le mode sombre et s'anime
// même chez qui a demandé moins d'animations. Ceci est du SVG et du CSS :
// quelques centaines d'octets, net à toutes les tailles, aux couleurs du site,
// et immobile si le système le demande (voir `prefers-reduced-motion`).
//
// C'est décoratif : `aria-hidden` sur le dessin, le titre de la fiche est
// juste à côté et dit déjà de quoi il s'agit.

type Motif = 'atelier' | 'formation' | 'parcours' | 'article';

/** Trois accords de couleurs, tous tirés de la charte. */
const ACCORDS = [
  { de: 'hsl(var(--primary)/0.30)', vers: 'hsl(var(--secondary)/0.22)', trait: 'text-primary' },
  { de: 'hsl(var(--secondary)/0.30)', vers: 'hsl(var(--primary)/0.18)', trait: 'text-secondary' },
  { de: 'hsl(38 92% 55%/0.26)', vers: 'hsl(var(--primary)/0.20)', trait: 'text-amber-600' },
];

/** Une empreinte stable à partir du texte : la même fiche garde sa vignette. */
function empreinte(graine: string) {
  let n = 0;
  for (let i = 0; i < graine.length; i += 1) n = (n * 31 + graine.charCodeAt(i)) % 100_000;
  return n;
}

/** Les traits du dessin, selon ce qu'on regarde. */
const DESSINS: Record<Motif, string[]> = {
  // Deux mains qui se rejoignent au-dessus d'un cercle : l'atelier.
  atelier: [
    'M32 44a12 12 0 1 1 24 0',
    'M20 66c0-9 7-16 16-16h16c9 0 16 7 16 16',
    'M44 22v8',
  ],
  // Un livre ouvert.
  formation: [
    'M14 26h22a8 8 0 0 1 8 8v34a8 8 0 0 0-8-8H14z',
    'M74 26H52a8 8 0 0 0-8 8v34a8 8 0 0 1 8-8h22z',
    'M44 34v34',
  ],
  // Trois jalons reliés : le parcours.
  parcours: [
    'M18 64h12l10-24 10 34 10-20h12',
    'M18 64a5 5 0 1 0 0 .01',
    'M72 54a5 5 0 1 0 0 .01',
  ],
  // Une page et une plume.
  article: [
    'M26 18h28l12 12v44H26z',
    'M54 18v12h12',
    'M36 46h20M36 58h14',
  ],
};

export function VignetteSansPhoto({
  graine,
  libelle,
  motif = 'atelier',
}: {
  /** Ce qui rend la vignette unique : le titre de la fiche fait très bien. */
  graine: string;
  /** Le mot écrit sous le dessin. La catégorie, à défaut le rayon. */
  libelle?: string | null;
  motif?: Motif;
}) {
  const n = empreinte(graine);
  const accord = ACCORDS[n % ACCORDS.length];
  // Des retards négatifs : chaque vignette est déjà en mouvement à l'arrivée,
  // au lieu de démarrer toutes ensemble comme un métronome.
  const retard1 = `-${(n % 90) / 10}s`;
  const retard2 = `-${((n * 7) % 130) / 10}s`;

  return (
    <div
      className="relative grid h-full w-full place-items-center overflow-hidden"
      style={{ backgroundImage: `linear-gradient(140deg, ${accord.de} 0%, ${accord.vers} 100%)` }}
    >
      {/* Les deux masses qui dérivent. Jamais nettes, donc jamais lisibles
          comme des formes : elles font seulement respirer le fond. */}
      <span
        aria-hidden
        className="animate-halo pointer-events-none absolute -left-8 -top-10 size-40 rounded-full blur-2xl"
        style={{ backgroundColor: accord.de, animationDelay: retard1 }}
      />
      <span
        aria-hidden
        className="animate-halo-2 pointer-events-none absolute -bottom-12 -right-10 size-44 rounded-full blur-2xl"
        style={{ backgroundColor: accord.vers, animationDelay: retard2 }}
      />

      <div className="animate-derive relative flex flex-col items-center gap-2" style={{ animationDelay: retard1 }}>
        <svg
          viewBox="0 0 88 88"
          className={`size-16 ${accord.trait}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          role="presentation"
          aria-hidden
          focusable="false"
        >
          {DESSINS[motif].map((d) => (
            <path key={d} d={d} opacity="0.85" />
          ))}
        </svg>
        {libelle ? (
          <span className="max-w-[85%] px-3 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/55">
            {libelle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
