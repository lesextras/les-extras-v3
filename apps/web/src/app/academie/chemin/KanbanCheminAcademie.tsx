'use client';

import Link from 'next/link';
import { useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../_client';

/**
 * LE CHEMIN DE L'ACADÉMIE EN KANBAN, TEMPS PAR TEMPS (01/10/2026).
 * Les trois temps restent (Exister, Se tenir, Se certifier) avec leur bandeau ;
 * dans chacun, les étapes se rangent en « À faire » et « Fait ». Glisser une
 * carte coche ou décoche l'étape (POST /academie/chemin/:slug). Les étapes
 * cochées toutes seules par la donnée (« Auto ») ne se déplacent pas.
 */
type Colonne = 'A_FAIRE' | 'FAIT';
const COLONNES: { code: Colonne; titre: string }[] = [
  { code: 'A_FAIRE', titre: 'À faire' },
  { code: 'FAIT', titre: 'Fait' },
];

export interface TempsKanban {
  titre: string;
  de: number;
  a: number;
  resume: string;
  teinte: { fond: string; texte: string; bord: string; pastille: string };
}

export interface EtapeKanban {
  slug: string;
  numero: number;
  titre: string;
  pourPasser: string;
}

export function KanbanCheminAcademie({
  temps,
  etapes,
  faites,
  automatiques,
}: {
  temps: TempsKanban[];
  etapes: EtapeKanban[];
  faites: string[];
  automatiques: string[];
}) {
  const router = useRouter();
  const [attrape, setAttrape] = useState<string | null>(null);
  const [survolee, setSurvolee] = useState<string | null>(null);
  const [deplaces, setDeplaces] = useState<Record<string, boolean>>({});
  const [erreur, setErreur] = useState<string | null>(null);

  const auto = new Set(automatiques);
  const cochees = new Set(faites);
  const estFaite = (slug: string) => deplaces[slug] ?? cochees.has(slug);
  const triees = [...etapes].sort((a, b) => a.numero - b.numero);
  const prochaine = triees.find((e) => !estFaite(e.slug))?.slug ?? null;
  const verrouillee = (slug: string) => auto.has(slug) && cochees.has(slug);

  async function deplacer(slug: string, colonne: Colonne) {
    const faite = colonne === 'FAIT';
    if (verrouillee(slug) || estFaite(slug) === faite) return;
    setErreur(null);
    setDeplaces((x) => ({ ...x, [slug]: faite }));
    try {
      await appel(`/academie/chemin/${encodeURIComponent(slug)}`, { method: 'POST', body: { faite } });
      router.refresh();
    } catch (err) {
      setDeplaces((x) => {
        const suite = { ...x };
        delete suite[slug];
        return suite;
      });
      setErreur(err instanceof Error ? err.message : 'Le déplacement a échoué.');
    }
  }

  function surDepot(e: DragEvent<HTMLDivElement>, colonne: Colonne) {
    e.preventDefault();
    setSurvolee(null);
    const slug = e.dataTransfer.getData('text/plain') || attrape;
    setAttrape(null);
    if (slug) void deplacer(slug, colonne);
  }

  return (
    <div className="space-y-10">
      <p className="text-sm text-[#5E7A6E]">Glisse une étape dans « Fait » pour la cocher.</p>
      {erreur ? (
        <p role="alert" className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">
          {erreur}
        </p>
      ) : null}

      {temps.map((t, i) => {
        const deTemps = triees.filter((e) => e.numero >= t.de && e.numero <= t.a);
        const faitesIci = deTemps.filter((e) => estFaite(e.slug)).length;
        return (
          <section key={t.titre} className="scroll-mt-24" aria-label={t.titre}>
            <div className={`rounded-2xl border ${t.teinte.bord} ${t.teinte.fond} p-5 sm:p-6`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-extrabold text-white ${t.teinte.pastille}`}>{i + 1}</span>
                <h2 className={`text-2xl font-extrabold tracking-tight ${t.teinte.texte}`}>{t.titre}</h2>
                <span className={`rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${t.teinte.texte}`}>
                  étapes {t.de} à {t.a}
                </span>
                <span className="ml-auto text-sm font-bold text-[#5E7A6E]">
                  {faitesIci} / {deTemps.length}
                </span>
              </div>
              <p className={`mt-2 max-w-[70ch] text-sm leading-relaxed ${t.teinte.texte}`}>{t.resume}</p>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {COLONNES.map((col) => {
                const siennes = deTemps.filter((e) => (col.code === 'FAIT') === estFaite(e.slug));
                const cle = `${t.titre}:${col.code}`;
                const cible = survolee === cle;
                return (
                  <div
                    key={col.code}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setSurvolee(cle);
                    }}
                    onDragLeave={() => setSurvolee((s) => (s === cle ? null : s))}
                    onDrop={(e) => surDepot(e, col.code)}
                    className={`rounded-2xl p-3 transition motion-reduce:transition-none ${cible ? 'bg-[#DDEBE4] ring-2 ring-[#1E9E6A]' : 'bg-[#E3F5EC]/60'}`}
                  >
                    <h3 className="px-2 font-extrabold text-[#12312A]">
                      {col.titre} <span className="text-[#5E7A6E]">{siennes.length}</span>
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {siennes.map((e) => {
                        const faite = estFaite(e.slug);
                        const bloquee = verrouillee(e.slug);
                        const estProchaine = prochaine === e.slug;
                        return (
                          <li key={e.slug}>
                            <div
                              draggable={!bloquee}
                              onDragStart={(ev) => {
                                ev.dataTransfer.setData('text/plain', e.slug);
                                ev.dataTransfer.effectAllowed = 'move';
                                setAttrape(e.slug);
                              }}
                              onDragEnd={() => setAttrape(null)}
                              className={`rounded-2xl border bg-white p-3 transition motion-reduce:transition-none ${bloquee ? '' : 'cursor-grab active:cursor-grabbing'} ${
                                estProchaine ? 'border-2 border-[#1E9E6A] shadow-[0_12px_28px_-20px_rgba(15,95,62,0.8)]' : 'border-[#DCE9E2]'
                              } ${attrape === e.slug ? 'opacity-50' : ''}`}
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                                    faite ? 'bg-[#1E9E6A] text-white' : estProchaine ? 'bg-[#0F5F3E] text-white' : `${t.teinte.fond} ${t.teinte.texte}`
                                  }`}
                                  aria-label={`Étape ${e.numero}${faite ? ', faite' : ''}`}
                                >
                                  {faite ? '✓' : e.numero}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className={`font-extrabold leading-snug ${faite ? 'text-[#5E7A6E]' : 'text-[#12312A]'}`}>{e.titre}</p>
                                  {estProchaine ? (
                                    <p className="mt-1 text-[13px] leading-snug text-[#334A42]">
                                      <span className="font-bold text-[#0F5F3E]">Pour passer :</span> {e.pourPasser}
                                    </p>
                                  ) : null}
                                  {estProchaine || bloquee ? (
                                    <p className="mt-1 flex gap-1.5 text-xs font-bold">
                                      {estProchaine ? <span className="rounded-full bg-[#1E9E6A] px-2 py-0.5 text-white">Prochaine</span> : null}
                                      {bloquee ? <span className="rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[#0F5F3E]">Auto</span> : null}
                                    </p>
                                  ) : null}
                                </div>
                                <Link
                                  href={`/academie/chemin/${e.slug}`}
                                  draggable={false}
                                  aria-label={`Ouvrir l’étape ${e.numero} : ${e.titre}`}
                                  className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold no-underline ${
                                    estProchaine ? 'bg-[#1E9E6A] text-white hover:bg-[#17845A]' : 'text-[#0F5F3E] hover:bg-[#E3F5EC]'
                                  }`}
                                >
                                  Ouvrir
                                </Link>
                              </div>
                              {bloquee ? null : (
                                <label className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#5E7A6E]">
                                  Déplacer vers
                                  <select
                                    value={faite ? 'FAIT' : 'A_FAIRE'}
                                    onChange={(ev) => void deplacer(e.slug, ev.target.value as Colonne)}
                                    aria-label={`Déplacer l’étape ${e.numero} vers`}
                                    className="flex-1 rounded-lg border border-[#DCE9E2] bg-white px-2 py-1 text-xs font-bold text-[#12312A] focus:border-[#1E9E6A] focus:outline-none"
                                  >
                                    {COLONNES.map((c) => (
                                      <option key={c.code} value={c.code}>
                                        {c.titre}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              )}
                            </div>
                          </li>
                        );
                      })}
                      {siennes.length === 0 ? (
                        <li className="px-2 py-6 text-center text-sm text-[#8FA89C]">{cible ? 'Pose la carte ici' : 'Rien ici'}</li>
                      ) : null}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
