/**
 * DES CONFETTIS, SANS DÉPENDANCE.
 *
 * Une soixantaine de lignes plutôt qu'une bibliothèque : le paquet le plus
 * courant pèse une trentaine de kilo-octets pour dessiner des rectangles qui
 * tombent, et il partirait dans le bundle de TOUTES les pages. Ici on
 * n'embarque rien, on ne charge rien depuis un CDN — la politique de sécurité
 * du site l'interdirait de toute façon — et le canvas s'efface tout seul.
 *
 * ── Deux règles de retenue ────────────────────────────────────────────────
 *
 * 1. RIEN NE SE DÉCLENCHE SANS UNE ACTION. Des confettis à l'arrivée sur une
 *    page ne félicitent personne : ils célèbrent le fait d'avoir chargé un
 *    écran. On les réserve au moment où quelqu'un fait quelque chose — copier
 *    son lien de parrainage, ici.
 *
 * 2. ON RESPECTE `prefers-reduced-motion`. Ce réglage n'est pas une
 *    préférence esthétique : il est posé par des personnes que le mouvement
 *    rend malades, ou dont il déclenche des migraines. Une animation qui
 *    l'ignore n'est pas festive, elle est agressive. Dans ce cas la fonction
 *    ne fait rien du tout, et l'action reste parfaitement utilisable.
 */

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vitesseRotation: number;
  largeur: number;
  hauteur: number;
  couleur: string;
}

/**
 * Palette « Quietly Bold » — les couleurs de la marque, pas un arc-en-ciel
 * générique. Le teal et le terracotta portent l'identité ; l'ambre et le vert
 * ne sont là que pour éviter la monotonie sur une centaine de pièces.
 */
const COULEURS = ['#0D7377', '#C75B39', '#E8A87C', '#2A9D8F', '#F4A261'];

const DUREE_MS = 2600;
const GRAVITE = 0.13;
const FROTTEMENT = 0.994;

function mouvementReduit(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Lance une volée de confettis depuis le bas de l'écran.
 *
 * @param nombre Nombre de pièces. Au-delà de 150 le rendu devient une bouillie
 *               sur un écran de portable, sans gagner en joie.
 */
export function lancerConfettis(nombre = 110): void {
  if (typeof document === 'undefined') return;
  if (mouvementReduit()) return;

  const canvas = document.createElement('canvas');
  // `pointer-events: none` est ce qui rend l'effet inoffensif : la page reste
  // entièrement cliquable pendant qu'il tombe. Sans cela, on poserait un
  // calque invisible sur toute l'interface pendant deux secondes et demie.
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const L = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = L * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  // Deux gerbes parties des coins bas, comme des canons à confettis : une
  // pluie qui tombe du haut évoque plutôt la panne que la fête.
  const pieces: Piece[] = Array.from({ length: nombre }, (_, i) => {
    const gauche = i % 2 === 0;
    const angle = (gauche ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.9;
    const force = 11 + Math.random() * 9;
    return {
      x: gauche ? 0 : L,
      y: H,
      vx: Math.cos(angle) * force * (gauche ? 1 : -1),
      vy: Math.sin(angle) * force,
      rotation: Math.random() * Math.PI * 2,
      vitesseRotation: (Math.random() - 0.5) * 0.3,
      largeur: 6 + Math.random() * 5,
      hauteur: 3 + Math.random() * 4,
      couleur: COULEURS[Math.floor(Math.random() * COULEURS.length)],
    };
  });

  const depart = performance.now();
  let image = 0;

  function dessiner(maintenant: number) {
    const ecoule = maintenant - depart;
    if (ecoule > DUREE_MS) {
      canvas.remove();
      return;
    }
    // Les pièces s'effacent sur le dernier tiers : elles ne disparaissent pas
    // d'un coup, ce qui donnerait l'impression d'un plantage.
    const opacite = ecoule < DUREE_MS * 0.66 ? 1 : 1 - (ecoule - DUREE_MS * 0.66) / (DUREE_MS * 0.34);

    ctx!.clearRect(0, 0, L, H);
    ctx!.globalAlpha = opacite;

    for (const p of pieces) {
      p.vy += GRAVITE;
      p.vx *= FROTTEMENT;
      p.vy *= FROTTEMENT;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vitesseRotation;

      ctx!.save();
      ctx!.translate(p.x, p.y);
      ctx!.rotate(p.rotation);
      ctx!.fillStyle = p.couleur;
      ctx!.fillRect(-p.largeur / 2, -p.hauteur / 2, p.largeur, p.hauteur);
      ctx!.restore();
    }

    image = requestAnimationFrame(dessiner);
  }

  image = requestAnimationFrame(dessiner);

  // Filet de sécurité : si l'onglet passe en arrière-plan, les images d'animation
  // s'arrêtent et le canvas resterait posé sur la page au retour.
  window.setTimeout(() => {
    cancelAnimationFrame(image);
    canvas.remove();
  }, DUREE_MS + 400);
}
