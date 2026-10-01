/* Petits outils partagés par « À faire », les tâches d'un projet et le planning. Sans 'server-only'. */
import type { MembreEquipe, PrioriteTache, StatutTache, TacheProjet } from '../../association/espace/_types';

export const STATUTS: { code: StatutTache; libelle: string; barre: string; fond: string; texte: string }[] = [
  { code: 'A_FAIRE', libelle: 'À faire', barre: 'var(--pj-accent,#4F46E5)', fond: 'var(--pj-teinte,#ECEBFC)', texte: 'var(--pj-accent-fonce,#4338CA)' },
  { code: 'EN_COURS', libelle: 'En cours', barre: '#F5B400', fond: '#FEF3E2', texte: '#7C3E06' },
  { code: 'BLOQUEE', libelle: 'Bloquée', barre: '#8A1B3D', fond: '#FDE7EC', texte: '#8A1B3D' },
  { code: 'FAITE', libelle: 'Faite', barre: '#1E9E6A', fond: '#E3F5EC', texte: '#0F5F3E' },
];

export const STATUT = Object.fromEntries(STATUTS.map((s) => [s.code, s])) as Record<StatutTache, (typeof STATUTS)[number]>;

export const PRIORITES: { code: PrioriteTache; libelle: string }[] = [
  { code: 'BASSE', libelle: 'Basse' },
  { code: 'NORMALE', libelle: 'Normale' },
  { code: 'HAUTE', libelle: 'Haute' },
];

export const ROUGE = '#D6335C';

/** La carte blanche des projets, à la teinte de l'espace. */
export const CARTE = 'rounded-2xl border border-[var(--pj-bord,#E6E4F3)] bg-white shadow-[0_1px_2px_rgba(29,27,92,0.04)]';

/** Jour civil (UTC) d'une date ISO stockée « à minuit ». */
export function jourDe(iso: string): number {
  const d = new Date(iso);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Aujourd'hui, au jour civil local, exprimé comme un jour UTC (comparable à jourDe). */
export function aujourdhui(): number {
  const d = new Date();
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

export const JOUR = 86_400_000;

export function joursAvant(iso: string): number {
  return Math.round((jourDe(iso) - aujourdhui()) / JOUR);
}

export function enRetard(t: Pick<TacheProjet, 'statut' | 'echeance'>): boolean {
  return t.statut !== 'FAITE' && Boolean(t.echeance) && joursAvant(t.echeance as string) < 0;
}

export function dateMini(iso: string): string {
  return new Date(jourDe(iso)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
}

/** Le badge d'échéance : rouge si dépassée, ambre à 7 jours ou moins. */
export function Echeance({ tache }: { tache: Pick<TacheProjet, 'statut' | 'echeance'> }) {
  if (!tache.echeance) return null;
  const j = joursAvant(tache.echeance);
  const fini = tache.statut === 'FAITE';
  const ton = fini
    ? 'bg-[var(--pj-fond,#F0EFF7)] text-[var(--pj-gris,#6B6A8A)]'
    : j < 0
      ? 'bg-[#FDE7EC] text-[#8A1B3D]'
      : j <= 7
        ? 'bg-[#FEF3E2] text-[#7C3E06]'
        : 'bg-[var(--pj-fond,#F0EFF7)] text-[var(--pj-texte,#3B3A66)]';
  const texte = fini ? dateMini(tache.echeance) : j < 0 ? `${-j} j de retard` : j === 0 ? "Aujourd'hui" : j === 1 ? 'Demain' : dateMini(tache.echeance);
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${ton}`} title={dateMini(tache.echeance)} suppressHydrationWarning>
      <Icone nom="calendrier" className="h-3 w-3" />
      {texte}
    </span>
  );
}

/** Les initiales d'une personne, dans une pastille. */
export function Avatar({ nom, moi = false, taille = 'md' }: { nom: string | null; moi?: boolean; taille?: 'sm' | 'md' }) {
  const t = taille === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-xs';
  if (!nom) {
    return (
      <span className={`inline-flex ${t} shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--pj-bord-vif,#C7C4F2)] text-[var(--pj-gris-clair,#9A99B5)]`} title="Personne">
        <Icone nom="personne" className="h-3.5 w-3.5" />
      </span>
    );
  }
  const mots = nom.trim().split(/\s+/);
  const ini = (mots.length > 1 ? `${mots[0][0]}${mots[mots.length - 1][0]}` : nom.slice(0, 2)).toUpperCase();
  return (
    <span
      className={`inline-flex ${t} shrink-0 items-center justify-center rounded-full font-extrabold ${moi ? 'bg-[var(--pj-accent,#4F46E5)] text-white' : 'bg-[var(--pj-teinte,#ECEBFC)] text-[var(--pj-accent-fonce,#4338CA)]'}`}
      title={nom}
    >
      {ini}
    </span>
  );
}

export function nomResponsable(t: TacheProjet, equipe: MembreEquipe[]): { nom: string | null; moi: boolean } {
  if (!t.responsable) return { nom: null, moi: false };
  const m = equipe.find((x) => x.cle === t.responsable?.cle);
  return { nom: m?.nom ?? t.responsable.nom, moi: t.aMoi };
}

const TRACES = {
  calendrier: 'M3 5h18v16H3zM3 9h18M8 3v4M16 3v4',
  coche: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  colonnes: 'M4 4h4v16H4zM10 4h4v10h-4zM16 4h4v13h-4z',
  planning: 'M3 5h18M3 12h18M3 19h18M6 3.5v3M11 10.5v3M15 17.5v3',
  personne: 'M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  drapeau: 'M5 21V4M5 4h11l-2 4 2 4H5',
  alerte: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  croix: 'M6 6l12 12M18 6 6 18',
  liste: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  toque: 'M22 10L12 5 2 10l10 5 10-5zM6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5',
} as const;

export function Icone({ nom, className = 'h-4 w-4' }: { nom: keyof typeof TRACES; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={TRACES[nom]} />
    </svg>
  );
}

/** Ce qu'il faut pour enregistrer une tâche, depuis un formulaire. */
export interface ValeursTache {
  actionId: string;
  titre: string;
  description: string;
  responsable: string;
  debut: string;
  echeance: string;
  priorite: PrioriteTache;
  statut: StatutTache;
}
