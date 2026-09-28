'use client';

import { useState } from 'react';

/**
 * LES GRAPHIQUES DE « MES FACTURES » : camembert, barres, jauge. En SVG
 * inline, sans bibliothèque : ils suivent les couleurs de l'espace et pèsent
 * quelques lignes. Chaque graphique porte sa légende en toutes lettres, et le
 * survol montre la valeur exacte.
 */

export const PALETTE = ['#4F46E5', '#1E9E6A', '#F59E0B', '#EF4444', '#0EA5E9', '#8B5CF6', '#EC4899', '#84CC16', '#F97316', '#14B8A6', '#6B7280', '#A855F7'];

export function euros(n: number, decimales = 0) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: decimales }).format(n);
}

export function Camembert({ parts, titre, encre, taille = 180 }: { parts: { nom: string; valeur: number }[]; titre?: string; encre: string; taille?: number }) {
  const [actif, setActif] = useState<number | null>(null);
  const total = parts.reduce((t, p) => t + Math.max(0, p.valeur), 0);
  if (!total) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-[13px] opacity-60" style={{ color: encre }}>
        {titre ? <p className="font-bold">{titre}</p> : null}
        <p>Rien à afficher pour l’instant.</p>
      </div>
    );
  }
  const r = taille / 2;
  const ri = r * 0.55;
  let angle = -Math.PI / 2;
  const secteurs = parts
    .filter((p) => p.valeur > 0)
    .map((p, i) => {
      const a0 = angle;
      const a1 = angle + (p.valeur / total) * Math.PI * 2;
      angle = a1;
      const grand = a1 - a0 > Math.PI ? 1 : 0;
      const x0 = r + r * Math.cos(a0), y0 = r + r * Math.sin(a0);
      const x1 = r + r * Math.cos(a1), y1 = r + r * Math.sin(a1);
      const xi0 = r + ri * Math.cos(a1), yi0 = r + ri * Math.sin(a1);
      const xi1 = r + ri * Math.cos(a0), yi1 = r + ri * Math.sin(a0);
      const d = a1 - a0 >= Math.PI * 2 - 0.0001
        ? `M ${r} 0 A ${r} ${r} 0 1 1 ${r - 0.01} 0 L ${r - 0.01} ${r - ri} A ${ri} ${ri} 0 1 0 ${r} ${r - ri} Z`
        : `M ${x0} ${y0} A ${r} ${r} 0 ${grand} 1 ${x1} ${y1} L ${xi0} ${yi0} A ${ri} ${ri} 0 ${grand} 0 ${xi1} ${yi1} Z`;
      return { ...p, d, couleur: PALETTE[i % PALETTE.length], pct: Math.round((p.valeur / total) * 100), i };
    });
  const montre = actif !== null ? secteurs.find((s) => s.i === actif) : null;
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
      <svg width={taille} height={taille} viewBox={`0 0 ${taille} ${taille}`} role="img" aria-label={titre ?? 'Répartition'} className="shrink-0">
        {secteurs.map((s) => (
          <path key={s.i} d={s.d} fill={s.couleur} opacity={actif === null || actif === s.i ? 1 : 0.35} stroke="#fff" strokeWidth={2} onMouseEnter={() => setActif(s.i)} onMouseLeave={() => setActif(null)} onClick={() => setActif(actif === s.i ? null : s.i)} style={{ cursor: 'pointer', transition: 'opacity .15s' }} />
        ))}
        <text x={r} y={r - 6} textAnchor="middle" fontSize={11} fill={encre} opacity={0.7}>
          {montre ? montre.nom.slice(0, 18) : titre ?? 'Total'}
        </text>
        <text x={r} y={r + 12} textAnchor="middle" fontSize={14} fontWeight={800} fill={encre}>
          {euros(montre ? montre.valeur : total)}
        </text>
      </svg>
      <ul className="grid w-full gap-1 text-[13px]" style={{ color: encre }}>
        {secteurs.map((s) => (
          <li key={s.i} className="flex items-center gap-2 rounded px-1" style={{ background: actif === s.i ? 'rgba(0,0,0,0.04)' : undefined }} onMouseEnter={() => setActif(s.i)} onMouseLeave={() => setActif(null)}>
            <span className="inline-block size-3 shrink-0 rounded-sm" style={{ background: s.couleur }} />
            <span className="min-w-0 flex-1 truncate">{s.nom}</span>
            <span className="tabular-nums opacity-70">{s.pct} %</span>
            <b className="tabular-nums">{euros(s.valeur)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Barres({ series, etiquettes, encre, hauteur = 140 }: { series: { nom: string; valeurs: number[]; couleur: string }[]; etiquettes: string[]; encre: string; hauteur?: number }) {
  const plafond = Math.max(1, ...series.flatMap((s) => s.valeurs));
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: hauteur }}>
        {etiquettes.map((e, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1" title={series.map((s) => `${s.nom} : ${euros(s.valeurs[i] ?? 0)}`).join(' · ')}>
            <div className="flex w-full items-end justify-center gap-[2px]" style={{ height: hauteur - 18 }}>
              {series.map((s, k) => (
                <div key={k} className="rounded-t" style={{ width: `${Math.max(20, 60 / series.length)}%`, height: `${Math.max(2, ((s.valeurs[i] ?? 0) / plafond) * 100)}%`, background: s.couleur }} />
              ))}
            </div>
            <span className="text-[10px] opacity-70" style={{ color: encre }}>
              {e}
            </span>
          </div>
        ))}
      </div>
      {series.length > 1 ? (
        <div className="mt-2 flex flex-wrap gap-3 text-[12px]" style={{ color: encre }}>
          {series.map((s) => (
            <span key={s.nom} className="flex items-center gap-1">
              <span className="inline-block size-3 rounded-sm" style={{ background: s.couleur }} /> {s.nom}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function Jauge({ pourcentage, couleur, encre, libelle }: { pourcentage: number | null; couleur: string; encre: string; libelle?: string }) {
  const p = pourcentage === null ? 0 : Math.max(0, Math.min(100, pourcentage));
  const teinte = pourcentage !== null && pourcentage >= 100 ? '#EF4444' : pourcentage !== null && pourcentage >= 80 ? '#F59E0B' : couleur;
  return (
    <div className="w-full">
      <div className="h-3 w-full overflow-hidden rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-3 rounded-full" style={{ width: `${p}%`, background: teinte, transition: 'width .3s' }} />
      </div>
      {libelle ? (
        <p className="mt-1 text-[12px] opacity-70" style={{ color: encre }}>
          {libelle}
        </p>
      ) : null}
    </div>
  );
}
