'use client';

// LIRE LE PLANNING D'ÉQUIPE, SANS L'ENVOYER NULLE PART.
//
// Un planning d'équipe nomme des personnes, leurs horaires et leurs absences.
// C'est un document interne, et il n'a aucune raison de quitter le poste de
// celui qui le consulte : tout le calcul se fait ICI, dans le navigateur. Rien
// n'est téléversé, rien n'est enregistré, et fermer l'onglet efface tout. On
// ne demande donc pas la confiance, on retire le besoin d'en avoir.
//
// Le format attendu est un CSV — celui que sortent Excel, LibreOffice et la
// plupart des logiciels de planning. On ne devine RIEN : les colonnes sont
// nommées, et une ligne qu'on ne sait pas lire est signalée plutôt qu'ignorée.
// Sur du temps de travail, une ligne avalée en silence, c'est une heure qui
// manque au compteur de quelqu'un.

import * as React from 'react';
import { Upload, FileSpreadsheet, TriangleAlert, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Colonnes reconnues, avec les intitulés courants rencontrés en établissement. */
const COLONNES: Record<string, string[]> = {
  personne: ['personne', 'salarie', 'salarié', 'nom', 'agent', 'intervenant', 'prenom nom', 'prénom nom'],
  date: ['date', 'jour'],
  debut: ['debut', 'début', 'heure debut', 'heure début', 'arrivee', 'arrivée', 'h debut', 'h début'],
  fin: ['fin', 'heure fin', 'depart', 'départ', 'h fin'],
  type: ['type', 'nature', 'motif', 'categorie', 'catégorie', 'absence'],
};

/** Ce qui compte comme une absence plutôt que comme du travail. */
const ABSENCES = ['conge', 'congé', 'conges', 'congés', 'cp', 'rtt', 'absence', 'repos', 'maladie', 'arret', 'arrêt', 'ferie', 'férié'];

export interface LignePlanning {
  personne: string;
  date: string;
  debut?: string;
  fin?: string;
  type?: string;
  heures: number;
  estAbsence: boolean;
}

export interface BilanPersonne {
  personne: string;
  heuresTravaillees: number;
  joursAbsence: number;
  jours: number;
}

/** Enlève les accents et la casse, pour comparer des intitulés de colonnes. */
function normaliser(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

/** Découpe une ligne CSV en respectant les guillemets et le point-virgule français. */
export function decouper(ligne: string, sep: string): string[] {
  const cases: string[] = [];
  let courant = '';
  let dansGuillemets = false;
  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (c === '"') {
      if (dansGuillemets && ligne[i + 1] === '"') {
        courant += '"';
        i++;
      } else {
        dansGuillemets = !dansGuillemets;
      }
    } else if (c === sep && !dansGuillemets) {
      cases.push(courant);
      courant = '';
    } else {
      courant += c;
    }
  }
  cases.push(courant);
  return cases.map((c) => c.trim());
}

/** « 8h30 », « 08:30 », « 8.5 » → minutes depuis minuit. null si illisible. */
export function enMinutes(valeur: string): number | null {
  const v = valeur.trim().replace(',', '.');
  if (!v) return null;
  const hm = v.match(/^(\d{1,2})\s*[h:.]\s*(\d{1,2})$/i);
  if (hm) {
    const h = Number(hm[1]);
    const m = Number(hm[2]);
    if (h > 23 || m > 59) return null;
    return h * 60 + m;
  }
  const h = v.match(/^(\d{1,2})\s*h?$/i);
  if (h) {
    const n = Number(h[1]);
    return n > 23 ? null : n * 60;
  }
  return null;
}

export interface Lecture {
  lignes: LignePlanning[];
  refusees: { numero: number; raison: string }[];
  colonnesManquantes: string[];
}

/**
 * Lit un CSV de planning. Ne lève jamais : ce qui n'est pas compris revient
 * dans `refusees`, avec son numéro de ligne, pour être montré tel quel.
 */
export function lirePlanning(texte: string): Lecture {
  const lignes = texte.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lignes.length < 2) {
    return { lignes: [], refusees: [], colonnesManquantes: ['personne', 'date'] };
  }

  // Séparateur : le point-virgule domine en France (Excel FR l'écrit par défaut).
  const sep = (lignes[0].match(/;/g)?.length ?? 0) >= (lignes[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const entetes = decouper(lignes[0], sep).map(normaliser);

  const index: Record<string, number> = {};
  for (const [cle, alias] of Object.entries(COLONNES)) {
    const i = entetes.findIndex((e) => alias.includes(e));
    if (i >= 0) index[cle] = i;
  }

  const manquantes = ['personne', 'date'].filter((c) => index[c] === undefined);
  if (manquantes.length > 0) return { lignes: [], refusees: [], colonnesManquantes: manquantes };

  const sorties: LignePlanning[] = [];
  const refusees: { numero: number; raison: string }[] = [];

  for (let i = 1; i < lignes.length; i++) {
    const cases = decouper(lignes[i], sep);
    const personne = (cases[index.personne] ?? '').trim();
    const date = (cases[index.date] ?? '').trim();
    if (!personne || !date) {
      refusees.push({ numero: i + 1, raison: 'personne ou date absente' });
      continue;
    }

    const type = index.type !== undefined ? (cases[index.type] ?? '').trim() : '';
    const estAbsence = ABSENCES.includes(normaliser(type));

    let heures = 0;
    if (!estAbsence && index.debut !== undefined && index.fin !== undefined) {
      const d = enMinutes(cases[index.debut] ?? '');
      const f = enMinutes(cases[index.fin] ?? '');
      if (d === null || f === null) {
        refusees.push({ numero: i + 1, raison: 'horaire illisible' });
        continue;
      }
      // Un poste de nuit finit le lendemain : 21 h → 7 h fait dix heures, pas
      // moins quatorze. Sans cette ligne, une équipe de nuit sort en négatif.
      const duree = f >= d ? f - d : 24 * 60 - d + f;
      heures = duree / 60;
    }

    sorties.push({ personne, date, type: type || undefined, heures, estAbsence,
      debut: index.debut !== undefined ? cases[index.debut] : undefined,
      fin: index.fin !== undefined ? cases[index.fin] : undefined });
  }

  return { lignes: sorties, refusees, colonnesManquantes: [] };
}

/** Agrège par personne : heures travaillées et jours d'absence. */
export function bilanParPersonne(lignes: LignePlanning[]): BilanPersonne[] {
  const carte = new Map<string, BilanPersonne>();
  for (const l of lignes) {
    const b = carte.get(l.personne) ?? { personne: l.personne, heuresTravaillees: 0, joursAbsence: 0, jours: 0 };
    if (l.estAbsence) b.joursAbsence += 1;
    else b.heuresTravaillees += l.heures;
    b.jours += 1;
    carte.set(l.personne, b);
  }
  return [...carte.values()].sort((a, b) => a.personne.localeCompare(b.personne, 'fr'));
}

const EXEMPLE = `personne;date;debut;fin;type
Sophie Marchand;2026-09-01;09:00;17:00;travail
Sophie Marchand;2026-09-02;;;congé
Karim Belhadj;2026-09-01;21:00;07:00;travail
`;

function heuresLisibles(h: number) {
  const entier = Math.floor(h);
  const min = Math.round((h - entier) * 60);
  return min === 0 ? `${entier} h` : `${entier} h ${String(min).padStart(2, '0')}`;
}

export function PlanningEquipe({ plafondAnnuel = 1607 }: { plafondAnnuel?: number }) {
  const [lecture, setLecture] = React.useState<Lecture | null>(null);
  const [nomFichier, setNomFichier] = React.useState<string | null>(null);
  const entree = React.useRef<HTMLInputElement>(null);

  async function charger(fichier: File) {
    const texte = await fichier.text();
    setNomFichier(fichier.name);
    setLecture(lirePlanning(texte));
  }

  const bilans = lecture ? bilanParPersonne(lecture.lignes) : [];
  const totalHeures = bilans.reduce((n, b) => n + b.heuresTravaillees, 0);
  const totalAbsences = bilans.reduce((n, b) => n + b.joursAbsence, 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileSpreadsheet className="size-5 text-primary" aria-hidden />
            Votre planning d’équipe
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Déposez le planning que vous tenez déjà, en CSV. Il est lu{' '}
            <strong className="font-semibold text-foreground">sur votre poste</strong> : rien
            n’est téléversé, rien n’est enregistré, et fermer l’onglet efface tout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={entree}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void charger(f);
            }}
          />
          <Button type="button" onClick={() => entree.current?.click()}>
            <Upload className="size-4" aria-hidden />
            Choisir un fichier
          </Button>
          {lecture ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setLecture(null);
                setNomFichier(null);
                if (entree.current) entree.current.value = '';
              }}
              aria-label="Retirer le planning chargé"
            >
              <X className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>

      {!lecture ? (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-background/40 p-4">
          <p className="text-sm font-medium text-foreground">Colonnes attendues</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <code className="text-foreground">personne</code> et{' '}
            <code className="text-foreground">date</code> sont obligatoires ;{' '}
            <code className="text-foreground">debut</code>,{' '}
            <code className="text-foreground">fin</code> et{' '}
            <code className="text-foreground">type</code> sont facultatifs. Une ligne dont le{' '}
            <code className="text-foreground">type</code> vaut congé, RTT, maladie ou férié
            compte comme une absence et non comme du travail.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
{EXEMPLE}
          </pre>
        </div>
      ) : null}

      {lecture && lecture.colonnesManquantes.length > 0 ? (
        <p className="mt-5 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <span>
            Colonne{lecture.colonnesManquantes.length > 1 ? 's' : ''} introuvable
            {lecture.colonnesManquantes.length > 1 ? 's' : ''} :{' '}
            <strong>{lecture.colonnesManquantes.join(', ')}</strong>. Renommez l’en-tête et
            redéposez le fichier — mieux vaut ne rien compter que compter faux.
          </span>
        </p>
      ) : null}

      {lecture && lecture.lignes.length > 0 ? (
        <div className="mt-5 space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { k: heuresLisibles(totalHeures), v: 'planifiées sur la période' },
              { k: String(totalAbsences), v: `jour${totalAbsences > 1 ? 's' : ''} d’absence posé${totalAbsences > 1 ? 's' : ''}` },
              { k: String(bilans.length), v: `personne${bilans.length > 1 ? 's' : ''} au planning` },
            ].map((s) => (
              <div key={s.v} className="rounded-xl bg-background/50 p-4 ring-1 ring-inset ring-border">
                <p className="text-2xl font-semibold tabular-nums text-foreground">{s.k}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.v}</p>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl ring-1 ring-inset ring-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Personne</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Heures planifiées</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Absences</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Reste sur {plafondAnnuel} h</th>
                </tr>
              </thead>
              <tbody>
                {bilans.map((b) => {
                  const reste = plafondAnnuel - b.heuresTravaillees;
                  return (
                    <tr key={b.personne} className="border-t border-border">
                      <td className="px-4 py-2.5 font-medium text-foreground">{b.personne}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{heuresLisibles(b.heuresTravaillees)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {b.joursAbsence > 0 ? `${b.joursAbsence} j` : '—'}
                      </td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${reste < 0 ? 'font-semibold text-destructive' : 'text-muted-foreground'}`}>
                        {heuresLisibles(Math.abs(reste))}{reste < 0 ? ' au-delà' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {nomFichier ? <span className="text-foreground">{nomFichier}</span> : null}
            {nomFichier ? ' — ' : null}
            Le reste est calculé sur le plafond annuel d’ordre public ({plafondAnnuel} h). Il ne
            tient pas compte des jours non encore planifiés : c’est une lecture du document
            déposé, pas un solde de paie.
          </p>

          {lecture.refusees.length > 0 ? (
            <div className="rounded-lg bg-warning/10 px-4 py-3 text-sm">
              <p className="flex items-center gap-2 font-medium text-foreground">
                <TriangleAlert className="size-4 shrink-0 text-warning" aria-hidden />
                {lecture.refusees.length} ligne{lecture.refusees.length > 1 ? 's' : ''} non
                comptée{lecture.refusees.length > 1 ? 's' : ''}
              </p>
              <ul className="mt-1.5 space-y-0.5 text-muted-foreground">
                {lecture.refusees.slice(0, 8).map((r) => (
                  <li key={r.numero}>Ligne {r.numero} — {r.raison}</li>
                ))}
                {lecture.refusees.length > 8 ? <li>…</li> : null}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
