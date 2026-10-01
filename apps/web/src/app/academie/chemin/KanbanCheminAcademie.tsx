'use client';

import Link from 'next/link';
import { useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../_client';
import {
  BadgeAnnuel,
  BadgeNature,
  BadgePriorite,
  LigneDebloque,
  LigneEcheance,
  LignePrerequis,
  premierePhrase,
  prochaineEtape,
  type EcheanceEtape,
  type NatureEtape,
  type Priorite,
} from '../../_shared/chemin-obligations';
import { CarteRetournable } from '../../_shared/CarteRetournable';

/**
 * LE CHEMIN DE L'ACADÉMIE EN KANBAN, TEMPS PAR TEMPS (01/10/2026).
 * Les temps restent (Exister, Se tenir, Se certifier, puis À chaque session, Chaque année et
 * Être finançable) avec leur bandeau ;
 * dans chacun, les étapes se rangent en « À faire », « Fait » et « Pas
 * concerné ». Glisser une carte coche, décoche ou écarte l'étape
 * (POST /academie/chemin/:slug). Une étape obligatoire pour tous ne va pas
 * dans « Pas concerné » : la colonne la refuse, avec un mot. Les étapes
 * cochées toutes seules par la donnée (« Auto ») ne se déplacent pas.
 * Les cartes se retournent : au dos, l'étape en trois lignes.
 */
type Colonne = 'A_FAIRE' | 'FAIT' | 'PAS_CONCERNE';
const COLONNES: { code: Colonne; titre: string }[] = [
  { code: 'A_FAIRE', titre: 'À faire' },
  { code: 'FAIT', titre: 'Fait' },
  { code: 'PAS_CONCERNE', titre: 'Pas concerné' },
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
  /** Revient chaque année : badge « Chaque année ». */
  chaqueAnnee?: boolean;
  /** Peut être écartée : action « Pas concerné ». */
  peutNePasConcerner?: boolean;
  /** Obligatoire, conseillée ou « si concerné » : un badge. */
  nature?: NatureEtape;
  /** L'échéance légale : une ligne à l'horloge. */
  echeance?: EcheanceEtape;
  /** Les étapes à faire avant : « Il faut d'abord ». */
  prerequis?: string[];
  priorite?: Priorite;
  /** Les financements que l'étape ouvre. */
  debloque?: string[];
  /** Pour le dos de la carte. */
  resume?: string;
  declencheur?: string;
}

/** Ce que l'espace sait d'une étape annuelle : son cycle et son échéance. */
export type CyclesAcademie = Record<string, { cycle: number | null; echeanceLe: string | null }>;

export function KanbanCheminAcademie({
  temps,
  etapes,
  faites,
  automatiques,
  pasConcernees = [],
  cycles = {},
}: {
  temps: TempsKanban[];
  etapes: EtapeKanban[];
  faites: string[];
  automatiques: string[];
  pasConcernees?: string[];
  cycles?: CyclesAcademie;
}) {
  const router = useRouter();
  const [attrape, setAttrape] = useState<string | null>(null);
  const [survolee, setSurvolee] = useState<string | null>(null);
  /** Ce qui a bougé ici, en attendant la réponse : faite ou non, et « pas concerné ». */
  const [deplaces, setDeplaces] = useState<Record<string, { faite: boolean; pasConcerne: boolean }>>({});
  const [erreur, setErreur] = useState<string | null>(null);

  const auto = new Set(automatiques);
  const cochees = new Set(faites);
  const ecartees = new Set(pasConcernees);
  const parSlug = new Map(etapes.map((e) => [e.slug, e]));
  const estFaite = (slug: string) => deplaces[slug]?.faite ?? cochees.has(slug);
  const estPasConcernee = (slug: string) => estFaite(slug) && (deplaces[slug]?.pasConcerne ?? ecartees.has(slug));
  const colonneDe = (slug: string): Colonne => (!estFaite(slug) ? 'A_FAIRE' : estPasConcernee(slug) ? 'PAS_CONCERNE' : 'FAIT');
  // Les numéros suivent déjà la priorité dans chaque temps (l'API les range).
  const triees = [...etapes].sort((a, b) => a.numero - b.numero);
  const prochaine = prochaineEtape(triees, estFaite)?.slug ?? null;
  const verrouillee = (slug: string) => auto.has(slug) && cochees.has(slug);
  const refusee = (slug: string | null, colonne: Colonne) => colonne === 'PAS_CONCERNE' && Boolean(slug) && !parSlug.get(slug as string)?.peutNePasConcerner;

  function deplacer(slug: string, colonne: Colonne) {
    if (colonneDe(slug) === colonne) return;
    if (refusee(slug, colonne)) {
      setErreur(`« ${parSlug.get(slug)?.titre ?? 'Cette étape'} » est obligatoire pour tout organisme : elle ne va pas dans « Pas concerné ».`);
      return;
    }
    void marquer(slug, colonne !== 'A_FAIRE', colonne === 'PAS_CONCERNE');
  }

  async function marquer(slug: string, faite: boolean, pasConcerne = false) {
    if (verrouillee(slug) || (estFaite(slug) === faite && estPasConcernee(slug) === pasConcerne)) return;
    setErreur(null);
    setDeplaces((x) => ({ ...x, [slug]: { faite, pasConcerne } }));
    try {
      await appel(`/academie/chemin/${encodeURIComponent(slug)}`, { method: 'POST', body: pasConcerne ? { faite, pasConcerne } : { faite } });
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
    if (slug) deplacer(slug, colonne);
  }

  return (
    <div className="space-y-10">
      <p className="text-sm text-[#5E7A6E]">Glisse une étape dans « Fait » pour la cocher, ou dans « Pas concerné » pour l&apos;écarter. Passe sur une carte pour voir son dos.</p>
      {erreur ? (
        <p role="alert" className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">
          {erreur}
        </p>
      ) : null}

      {temps.map((t, i) => {
        const deTemps = triees.filter((e) => e.numero >= t.de && e.numero <= t.a);
        if (!deTemps.length) return null;
        const premier = deTemps[0].numero;
        const dernier = deTemps[deTemps.length - 1].numero;
        const faitesIci = deTemps.filter((e) => estFaite(e.slug)).length;
        return (
          <section key={t.titre} className="scroll-mt-24" aria-label={t.titre}>
            <div className={`rounded-2xl border ${t.teinte.bord} ${t.teinte.fond} p-5 sm:p-6`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-extrabold text-white ${t.teinte.pastille}`}>{i + 1}</span>
                <h2 className={`text-2xl font-extrabold tracking-tight ${t.teinte.texte}`}>{t.titre}</h2>
                <span className={`rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${t.teinte.texte}`}>
                  {premier === dernier ? `étape ${premier}` : `étapes ${premier} à ${dernier}`}
                </span>
                <span className="ml-auto text-sm font-bold text-[#5E7A6E]">
                  {faitesIci} / {deTemps.length}
                </span>
              </div>
              <p className={`mt-2 max-w-[70ch] text-sm leading-relaxed ${t.teinte.texte}`}>{t.resume}</p>
            </div>

            <div className="mt-3 grid gap-4 md:grid-cols-3">
              {COLONNES.map((col) => {
                const siennes = deTemps.filter((e) => colonneDe(e.slug) === col.code);
                const cle = `${t.titre}:${col.code}`;
                const cible = survolee === cle;
                const refus = cible && refusee(attrape, col.code);
                return (
                  <div
                    key={col.code}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = refusee(attrape, col.code) ? 'none' : 'move';
                      setSurvolee(cle);
                    }}
                    onDragLeave={() => setSurvolee((s) => (s === cle ? null : s))}
                    onDrop={(e) => surDepot(e, col.code)}
                    className={`rounded-2xl p-3 transition motion-reduce:transition-none ${
                      refus
                        ? 'bg-[#FDE8EC] ring-2 ring-[#9F1239]'
                        : cible
                          ? 'bg-[#DDEBE4] ring-2 ring-[#1E9E6A]'
                          : col.code === 'PAS_CONCERNE'
                            ? 'bg-[#EEF0F4]/70'
                            : 'bg-[#E3F5EC]/60'
                    }`}
                  >
                    <h3 className="px-2 font-extrabold text-[#12312A]">
                      {col.titre} <span className="text-[#5E7A6E]">{siennes.length}</span>
                    </h3>
                    {refus ? <p className="mt-1 px-2 text-xs font-bold text-[#9F1239]">Obligatoire pour tout organisme : pas ici.</p> : null}
                    <ul className="mt-3 space-y-2">
                      {siennes.map((e) => {
                        const faite = estFaite(e.slug);
                        const bloquee = verrouillee(e.slug);
                        const estProchaine = prochaine === e.slug;
                        const pasConcerne = estPasConcernee(e.slug);
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
                              className={`${bloquee ? '' : 'cursor-grab active:cursor-grabbing'} ${attrape === e.slug ? 'opacity-50' : ''}`}
                            >
                              <CarteRetournable
                                theme="academie"
                                titre={e.titre}
                                verso={{
                                  cestQuoi: premierePhrase(e.resume),
                                  pourquoi: e.declencheur,
                                  comment: [e.pourPasser, e.echeance?.texte].filter(Boolean).join(' '),
                                  debloque: e.debloque,
                                  href: `/academie/chemin/${e.slug}`,
                                }}
                                recto={(boutonRetourner) => (
                            <div
                              className={`h-full rounded-2xl border bg-white p-3 transition motion-reduce:transition-none ${
                                estProchaine ? 'border-2 border-[#1E9E6A] shadow-[0_12px_28px_-20px_rgba(15,95,62,0.8)]' : 'border-[#DCE9E2]'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                                    faite ? (pasConcerne ? 'bg-[#64748B] text-white' : 'bg-[#1E9E6A] text-white') : estProchaine ? 'bg-[#0F5F3E] text-white' : `${t.teinte.fond} ${t.teinte.texte}`
                                  }`}
                                  aria-label={`Étape ${e.numero}${pasConcerne ? ', pas concerné' : faite ? ', faite' : ''}`}
                                >
                                  {faite && !pasConcerne ? '✓' : e.numero}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className={`font-extrabold leading-snug ${faite ? 'text-[#5E7A6E]' : 'text-[#12312A]'}`}>{e.titre}</p>
                                  {estProchaine ? (
                                    <p className="mt-1 text-[13px] leading-snug text-[#334A42]">
                                      <span className="font-bold text-[#0F5F3E]">Pour passer :</span> {e.pourPasser}
                                    </p>
                                  ) : null}
                                  <p className="mt-1 flex flex-wrap gap-1.5 text-xs font-bold">
                                    {estProchaine ? <span className="rounded-full bg-[#1E9E6A] px-2 py-0.5 text-white">Prochaine</span> : null}
                                    {bloquee ? <span className="rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[#0F5F3E]">Auto</span> : null}
                                    {faite ? null : <BadgePriorite priorite={e.priorite} />}
                                    {e.chaqueAnnee ? <BadgeAnnuel cycle={cycles[e.slug]?.cycle} /> : null}
                                    {faite ? null : <BadgeNature nature={e.nature} />}
                                  </p>
                                  {faite ? null : (
                                    <>
                                      <LigneEcheance echeance={e.echeance} chaqueAnnee={e.chaqueAnnee} echeanceLe={cycles[e.slug]?.echeanceLe} theme="academie" />
                                      <LignePrerequis
                                        prerequis={e.prerequis}
                                        etapes={etapes}
                                        faites={etapes.filter((x) => estFaite(x.slug)).map((x) => x.slug)}
                                        theme="academie"
                                      />
                                      <LigneDebloque debloque={e.debloque} theme="academie" />
                                    </>
                                  )}
                                </div>
                                <div className="flex shrink-0 flex-col items-end gap-1.5">
                                  <Link
                                    href={`/academie/chemin/${e.slug}`}
                                    draggable={false}
                                    aria-label={`Ouvrir l’étape ${e.numero} : ${e.titre}`}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-bold no-underline ${
                                      estProchaine ? 'bg-[#1E9E6A] text-white hover:bg-[#17845A]' : 'text-[#0F5F3E] hover:bg-[#E3F5EC]'
                                    }`}
                                  >
                                    Ouvrir
                                  </Link>
                                  {boutonRetourner}
                                </div>
                              </div>
                              {bloquee ? null : (
                                <label className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#5E7A6E]">
                                  Déplacer vers
                                  <select
                                    value={colonneDe(e.slug)}
                                    onChange={(ev) => deplacer(e.slug, ev.target.value as Colonne)}
                                    aria-label={`Déplacer l’étape ${e.numero} vers`}
                                    className="flex-1 rounded-lg border border-[#DCE9E2] bg-white px-2 py-1 text-xs font-bold text-[#12312A] focus:border-[#1E9E6A] focus:outline-none"
                                  >
                                    {COLONNES.map((c) => (
                                      <option key={c.code} value={c.code} disabled={c.code === 'PAS_CONCERNE' && !e.peutNePasConcerner}>
                                        {c.code === 'PAS_CONCERNE' && !e.peutNePasConcerner ? 'Pas concerné (obligatoire pour tous)' : c.titre}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              )}
                            </div>
                                )}
                              />
                            </div>
                          </li>
                        );
                      })}
                      {siennes.length === 0 ? (
                        <li className="px-2 py-6 text-center text-sm text-[#8FA89C]">{cible && !refus ? 'Pose la carte ici' : 'Rien ici'}</li>
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
