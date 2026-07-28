// CONFETTIS — implémentation maison, sans dépendance.
//
// Pourquoi pas une librairie : la seule chose dont on a besoin, c'est un
// canvas plein écran, une centaine de rectangles, de la gravité et un peu de
// rotation. C'est 80 lignes. Ajouter 8 ko de dépendance pour ça, et un
// paquet de plus à surveiller, n'a pas de sens.
//
// Règles de bonne conduite appliquées ici :
// - rien ne se déclenche si l'utilisateur a demandé moins d'animations ;
// - le canvas est `pointer-events: none` et `aria-hidden` : il n'intercepte
//   aucun clic et n'existe pas pour un lecteur d'écran ;
// - il se détruit tout seul à la fin, aucun nœud résiduel dans le DOM ;
// - une seule volée à la fois : deux envois rapprochés ne superposent pas
//   deux canvas.

type Options = {
  /** Origine de la volée, en fraction de l'écran. Défaut : un peu au-dessus du centre. */
  origine?: { x: number; y: number };
  /** Nombre de morceaux. Défaut 90 — au-delà, ça fait sapin de Noël. */
  nombre?: number;
};

const COULEURS = [
  'hsl(347, 80%, 57%)', // framboise — primaire
  'hsl(14, 72%, 58%)', // terracotta — secondaire
  'hsl(152, 58%, 52%)', // vert de validation
  'hsl(38, 92%, 62%)', // ambre
  'hsl(40, 30%, 96%)', // ivoire
];

let canvasActif: HTMLCanvasElement | null = null;

type Morceau = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  taille: number;
  couleur: string;
  angle: number;
  vitesseAngle: number;
  /** Fait « respirer » le rectangle pour simuler une feuille qui tourne sur elle-même. */
  phase: number;
};

export function lancerConfettis(options: Options = {}): void {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Une volée en cours : on la remplace plutôt que d'empiler.
  if (canvasActif) {
    canvasActif.remove();
    canvasActif = null;
  }

  const { origine = { x: 0.5, y: 0.34 }, nombre = 90 } = options;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '9999',
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(canvas);
  canvasActif = canvas;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const L = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = L * dpr;
  canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    canvasActif = null;
    return;
  }
  ctx.scale(dpr, dpr);

  const ox = L * origine.x;
  const oy = H * origine.y;

  const morceaux: Morceau[] = Array.from({ length: nombre }, () => {
    // Volée en éventail vers le haut, jamais strictement verticale : c'est ce
    // qui donne l'impression d'un « pop » et non d'une fontaine.
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
    const force = 7 + Math.random() * 9;
    return {
      x: ox + (Math.random() - 0.5) * 40,
      y: oy,
      vx: Math.cos(angle) * force,
      vy: Math.sin(angle) * force,
      taille: 5 + Math.random() * 6,
      couleur: COULEURS[Math.floor(Math.random() * COULEURS.length)]!,
      angle: Math.random() * Math.PI * 2,
      vitesseAngle: (Math.random() - 0.5) * 0.32,
      phase: Math.random() * Math.PI * 2,
    };
  });

  const GRAVITE = 0.28;
  const FROTTEMENT = 0.988;
  const DUREE = 3200;
  const depart = performance.now();
  let raf = 0;

  function boucle(maintenant: number) {
    const ecoule = maintenant - depart;
    if (!ctx) return;
    ctx.clearRect(0, 0, L, H);

    // Fondu sur le dernier tiers : les confettis s'effacent au lieu de
    // disparaître d'un coup.
    const opacite = ecoule > DUREE * 0.6 ? Math.max(0, 1 - (ecoule - DUREE * 0.6) / (DUREE * 0.4)) : 1;
    ctx.globalAlpha = opacite;

    for (const m of morceaux) {
      m.vy += GRAVITE;
      m.vx *= FROTTEMENT;
      m.vy *= FROTTEMENT;
      m.x += m.vx;
      m.y += m.vy;
      m.angle += m.vitesseAngle;
      m.phase += 0.14;

      // Largeur oscillante : le rectangle semble tourner dans l'espace.
      const largeur = m.taille * Math.abs(Math.cos(m.phase));

      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.angle);
      ctx.fillStyle = m.couleur;
      ctx.fillRect(-largeur / 2, -m.taille / 2, largeur, m.taille);
      ctx.restore();
    }

    if (ecoule < DUREE) {
      raf = requestAnimationFrame(boucle);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
      if (canvasActif === canvas) canvasActif = null;
    }
  }

  raf = requestAnimationFrame(boucle);
}
