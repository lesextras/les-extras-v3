'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** La boîte dans laquelle tout tracé est ramené : c'est ce que l'API accepte et ce que le PDF dessine. */
export const BOITE = { largeur: 300, hauteur: 100 };

type Point = { x: number; y: number };

/**
 * Transforme des traits (en pixels de l'écran) en un chemin SVG normalisé dans
 * la boîte 300 × 100 : uniquement des commandes M et L, deux décimales au plus.
 * C'est ce texte, et rien d'autre, qui part au serveur.
 */
export function cheminNormalise(traits: Point[][], largeur: number, hauteur: number): string {
  const sx = BOITE.largeur / Math.max(1, largeur);
  const sy = BOITE.hauteur / Math.max(1, hauteur);
  const n = (v: number) => String(Math.round(v * 10) / 10);
  return traits
    .filter((t) => t.length > 1)
    .map((t) => t.map((p, i) => `${i ? 'L' : 'M'} ${n(p.x * sx)} ${n(p.y * sy)}`).join(' '))
    .join(' ');
}

/**
 * UN CADRE OÙ SIGNER, DU DOIGT OU À LA SOURIS.
 *
 * Les événements de pointeur couvrent la souris, le stylet et le doigt ; le
 * cadre bloque le défilement de la page pendant qu'on signe (sinon, sur un
 * téléphone, la page part avec le doigt). Un tracé trop court n'est pas rendu :
 * un simple clic n'est pas une signature.
 */
export function SignatureTrace({
  onChange,
  couleur = '#12312A',
  libelle = 'Signez dans le cadre',
}: {
  onChange: (trace: string | null) => void;
  couleur?: string;
  libelle?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const traits = useRef<Point[][]>([]);
  const enCours = useRef(false);
  const [vide, setVide] = useState(true);

  const redessiner = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const ratio = window.devicePixelRatio || 1;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = couleur;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const t of traits.current) {
      ctx.beginPath();
      t.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
    }
  }, [couleur]);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const ajuster = () => {
      const r = c.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      c.width = Math.round(r.width * ratio);
      c.height = Math.round(r.height * ratio);
      redessiner();
    };
    ajuster();
    window.addEventListener('resize', ajuster);
    return () => window.removeEventListener('resize', ajuster);
  }, [redessiner]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const publier = () => {
    const c = canvas.current;
    if (!c) return;
    const r = c.getBoundingClientRect();
    const total = traits.current.reduce((t, x) => t + x.length, 0);
    const chemin = cheminNormalise(traits.current, r.width, r.height);
    const ok = total >= 8 && chemin.length >= 20;
    setVide(!ok);
    onChange(ok ? chemin : null);
  };

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvas}
          aria-label={libelle}
          role="img"
          className="block h-[150px] w-full touch-none rounded-xl border-2 border-dashed border-[#CFE4D9] bg-white"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            enCours.current = true;
            traits.current.push([point(e)]);
          }}
          onPointerMove={(e) => {
            if (!enCours.current) return;
            traits.current[traits.current.length - 1]?.push(point(e));
            redessiner();
          }}
          onPointerUp={() => {
            enCours.current = false;
            publier();
          }}
          onPointerCancel={() => {
            enCours.current = false;
            publier();
          }}
        />
        {vide ? (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold text-[#8FA79B]">{libelle}</span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => {
          traits.current = [];
          redessiner();
          setVide(true);
          onChange(null);
        }}
        className="mt-2 text-sm font-bold text-[#0F5F3E] underline underline-offset-4"
      >
        Effacer et recommencer
      </button>
    </div>
  );
}
