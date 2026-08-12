'use client';

// DÉPOSER UN PLANNING D'ÉQUIPE — sans l'envoyer nulle part.
//
// Un planning nomme des personnes, leurs horaires et leurs absences. C'est un
// document interne, et il n'a aucune raison de quitter le poste de celui qui
// le consulte : tout le calcul se fait ICI, dans le navigateur. Rien n'est
// téléversé, rien n'est enregistré, et fermer l'onglet efface tout. On ne
// demande donc pas la confiance, on retire le besoin d'en avoir.
//
// Trois formats, parce que ce sont les utilisateurs qui déposent ce qu'ils
// ont : CSV, Excel et PDF. Les deux premiers portent leur structure ; le PDF,
// lui, n'est que du texte posé à des coordonnées — sa lecture est une
// reconstitution, et l'écran le dit.
//
// La logique de comptage vit dans `lib/planning` : c'est elle qui se teste.

import * as React from 'react';
import { Upload, FileSpreadsheet, TriangleAlert, X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  lirePlanningCsv,
  bilanParPersonne,
  type Lecture,
} from '@/lib/planning/lecture';

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

type Format = 'csv' | 'excel' | 'pdf';

function formatDe(nom: string): Format | null {
  const n = nom.toLowerCase();
  if (n.endsWith('.csv') || n.endsWith('.txt') || n.endsWith('.tsv')) return 'csv';
  if (n.endsWith('.xlsx') || n.endsWith('.xlsm')) return 'excel';
  if (n.endsWith('.pdf')) return 'pdf';
  return null;
}

export function PlanningEquipe({ plafondAnnuel = 1607 }: { plafondAnnuel?: number }) {
  const [lecture, setLecture] = React.useState<Lecture | null>(null);
  const [nomFichier, setNomFichier] = React.useState<string | null>(null);
  const [format, setFormat] = React.useState<Format | null>(null);
  const [enLecture, setEnLecture] = React.useState(false);
  const [panne, setPanne] = React.useState<string | null>(null);
  const entree = React.useRef<HTMLInputElement>(null);

  async function charger(fichier: File) {
    const f = formatDe(fichier.name);
    setNomFichier(fichier.name);
    setPanne(null);
    setLecture(null);
    setFormat(f);
    if (!f) {
      setPanne("Format non reconnu. Déposez un CSV, un classeur Excel (.xlsx) ou un PDF.");
      return;
    }
    setEnLecture(true);
    try {
      if (f === 'csv') {
        setLecture(lirePlanningCsv(await fichier.text()));
      } else if (f === 'excel') {
        // Chargés à la demande : personne ne paie ces kilo-octets tant qu'il
        // n'ouvre pas un classeur ou un PDF.
        const { lireClasseur } = await import('@/lib/planning/tableur');
        const { lireMatrice } = await import('@/lib/planning/lecture');
        setLecture(lireMatrice(await lireClasseur(await fichier.arrayBuffer())));
      } else {
        const { lirePlanningPdf } = await import('@/lib/planning/pdf');
        setLecture(await lirePlanningPdf(await fichier.arrayBuffer()));
      }
    } catch (e) {
      setPanne(
        e instanceof Error
          ? `Lecture impossible : ${e.message}`
          : "Lecture impossible : le fichier n'a pas pu être ouvert.",
      );
    } finally {
      setEnLecture(false);
    }
  }

  function vider() {
    setLecture(null);
    setNomFichier(null);
    setFormat(null);
    setPanne(null);
    if (entree.current) entree.current.value = '';
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
            Déposez le planning que vous tenez déjà — <strong className="font-semibold text-foreground">CSV,
            Excel ou PDF</strong>. Il est lu{' '}
            <strong className="font-semibold text-foreground">sur votre poste</strong> : rien
            n’est téléversé, rien n’est enregistré, et fermer l’onglet efface tout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={entree}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xlsm,.pdf,text/csv,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void charger(f);
            }}
          />
          <Button type="button" onClick={() => entree.current?.click()} disabled={enLecture}>
            <Upload className="size-4" aria-hidden />
            {enLecture ? 'Lecture…' : 'Choisir un fichier'}
          </Button>
          {lecture ? (
            <Button
              type="button"
              variant="ghost"
              onClick={vider}
              aria-label="Retirer le planning chargé"
            >
              <X className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>

      {panne ? (
        <p className="mt-5 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          <span>{panne}</span>
        </p>
      ) : null}

      {!lecture && !panne ? (
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
          <p className="mt-2 text-sm text-muted-foreground">
            Le nom des colonnes est reconnu dans ses formes courantes —{' '}
            <code className="text-foreground">nom</code>,{' '}
            <code className="text-foreground">salarié</code>,{' '}
            <code className="text-foreground">agent</code> valent{' '}
            <code className="text-foreground">personne</code> — et l’en-tête n’a pas besoin
            d’être sur la première ligne : un titre et une date au-dessus du tableau ne
            gênent pas.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
{EXEMPLE}
          </pre>
          <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>
              Un <strong className="font-semibold text-foreground">PDF</strong> se lit aussi,
              mais il ne contient pas de tableau : seulement du texte posé à des coordonnées.
              Les colonnes y sont reconstituées d’après la position des titres, et le résultat
              se relit. Un CSV ou un classeur porte sa structure : c’est plus sûr quand vous
              avez le choix.
            </span>
          </p>
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
          {format === 'pdf' ? (
            <p className="flex items-start gap-2 rounded-lg bg-warning/10 px-4 py-3 text-sm text-foreground">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <span>
                Lecture d’un PDF : les colonnes ont été reconstituées d’après la position des
                titres. <strong>Vérifiez les totaux</strong> avant de vous en servir — et si
                quelque chose cloche, redéposez le même planning en CSV ou en Excel.
              </span>
            </p>
          ) : null}

          {lecture.entetes && lecture.entetes.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Colonnes comprises :{' '}
              {lecture.entetes.filter(Boolean).map((e, i) => (
                <span key={e + i}>
                  {i > 0 ? ' · ' : ''}
                  <span className="text-foreground">{e}</span>
                </span>
              ))}
            </p>
          ) : null}
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
            {lecture.lignes.length} ligne{lecture.lignes.length > 1 ? 's' : ''} lue
            {lecture.lignes.length > 1 ? 's' : ''}. Le reste est calculé sur le plafond annuel
            d’ordre public ({plafondAnnuel} h) et ne tient pas compte des jours non encore
            planifiés : c’est une lecture du document déposé, pas un solde de paie.
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
