'use client';

import Link from 'next/link';
import { useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../_client';
import { CARTE } from '../_ui';
import { TEINTES_PARTIE, type PartieChemin } from '../_chemin';

/**
 * MON CHEMIN EN COLONNES.
 *
 * À faire, fait : on attrape une étape et on la pose dans l'autre colonne.
 * Sur téléphone, le menu « Déplacer vers » fait pareil. Une étape confirmée
 * par les répertoires publics (RNA, SIRENE) reste dans « Fait » : l'API la
 * compte faite quoi qu'on coche.
 */
type Colonne = 'A_FAIRE' | 'FAIT';

const COLONNES: { code: Colonne; titre: string; aide: string }[] = [
  { code: 'A_FAIRE', titre: 'À faire', aide: 'Les étapes qui t’attendent' },
  { code: 'FAIT', titre: 'Fait', aide: 'Ce que tu as déjà coché' },
];

export interface CarteEtapeChemin {
  numero: number;
  slug: string;
  titre: string;
  partie: PartieChemin;
}

export function KanbanChemin({
  etapes,
  parties,
  faites,
  verifiees,
}: {
  etapes: CarteEtapeChemin[];
  parties: { code: PartieChemin; titre: string }[];
  faites: string[];
  verifiees: string[];
}) {
  const router = useRouter();
  const [attrape, setAttrape] = useState<string | null>(null);
  const [survolee, setSurvolee] = useState<Colonne | null>(null);
  const [deplaces, setDeplaces] = useState<Record<string, boolean>>({});
  const [erreur, setErreur] = useState<string | null>(null);

  const titrePartie = new Map(parties.map((p) => [p.code, p.titre]));
  const confirmees = new Set(verifiees);
  const cochees = new Set(faites);
  const estFaite = (slug: string) => confirmees.has(slug) || (deplaces[slug] ?? cochees.has(slug));
  const triees = [...etapes].sort((a, b) => a.numero - b.numero);
  const prochaine = triees.find((e) => !estFaite(e.slug))?.slug ?? null;

  async function deplacer(slug: string, colonne: Colonne) {
    const faite = colonne === 'FAIT';
    if (confirmees.has(slug) || estFaite(slug) === faite) return;
    setErreur(null);
    setDeplaces((x) => ({ ...x, [slug]: faite }));
    try {
      await appel(`/association/chemin/${slug}`, { method: 'POST', body: { faite } });
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
    <div id="partie-1" className="mb-8 scroll-mt-24 space-y-4">
      <p className="text-sm text-[#6B6A8A]">Glisse une étape dans « Fait » pour la cocher.</p>
      {erreur ? (
        <p role="alert" className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">
          {erreur}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2" aria-label="Mon chemin en colonnes">
        {COLONNES.map((col) => {
          const siennes = triees.filter((e) => (col.code === 'FAIT') === estFaite(e.slug));
          const cible = survolee === col.code;
          return (
            <div
              key={col.code}
              onDragOver={(e) => {
                e.preventDefault();
                setSurvolee(col.code);
              }}
              onDragLeave={() => setSurvolee((s) => (s === col.code ? null : s))}
              onDrop={(e) => surDepot(e, col.code)}
              className={`rounded-2xl p-3 transition motion-reduce:transition-none ${cible ? 'bg-[#ECEBFC] ring-2 ring-[#4F46E5]' : 'bg-[#ECEBFC]/60'}`}
            >
              <h2 className="px-2 font-extrabold text-[#1D1B5C]">
                {col.titre} <span className="text-[#6B6A8A]">{siennes.length}</span>
              </h2>
              <p className="px-2 text-xs text-[#6B6A8A]">{col.aide}</p>

              <ul className="mt-3 space-y-2">
                {siennes.map((e) => {
                  const teinte = TEINTES_PARTIE[e.partie];
                  const confirmee = confirmees.has(e.slug);
                  const estProchaine = prochaine === e.slug;
                  const faite = estFaite(e.slug);
                  return (
                    <li key={e.slug}>
                      <div
                        draggable={!confirmee}
                        onDragStart={(ev) => {
                          ev.dataTransfer.setData('text/plain', e.slug);
                          ev.dataTransfer.effectAllowed = 'move';
                          setAttrape(e.slug);
                        }}
                        onDragEnd={() => setAttrape(null)}
                        className={`${CARTE} p-3 transition motion-reduce:transition-none ${confirmee ? '' : 'cursor-grab active:cursor-grabbing'} ${
                          estProchaine ? '!border-2 !border-[#4F46E5] shadow-[0_12px_28px_-20px_rgba(29,27,92,0.8)]' : ''
                        } ${attrape === e.slug ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                              faite ? 'bg-[#1E9E6A] text-white' : estProchaine ? 'bg-[#4F46E5] text-white' : 'border-2 border-[#D9D6EE] bg-white text-[#6B6A8A]'
                            }`}
                            aria-label={`Étape ${e.numero}${faite ? ', faite' : ''}`}
                          >
                            {faite ? '✓' : e.numero}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={`font-extrabold leading-snug ${faite ? 'text-[#6B6A8A]' : 'text-[#1D1B5C]'}`}>{e.titre}</p>
                            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-bold">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${teinte.fond} ${teinte.texte}`}>
                                <span className={`h-2 w-2 rounded-full ${teinte.pastille}`} aria-hidden="true" />
                                {titrePartie.get(e.partie) ?? e.partie}
                              </span>
                              {estProchaine ? <span className="rounded-full bg-[#4F46E5] px-2 py-0.5 text-white">Prochaine</span> : null}
                              {confirmee ? <span className="rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[#0F5F3E]">Confirmée</span> : null}
                            </p>
                          </div>
                          <Link
                            href={`/chemin/${e.slug}`}
                            draggable={false}
                            aria-label={`Ouvrir l’étape ${e.numero} : ${e.titre}`}
                            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-bold no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] ${
                              estProchaine ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]' : 'text-[#4F46E5] hover:bg-[#ECEBFC]'
                            }`}
                          >
                            Ouvrir
                          </Link>
                        </div>

                        {confirmee ? null : (
                          <label className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#6B6A8A]">
                            Déplacer vers
                            <select
                              value={faite ? 'FAIT' : 'A_FAIRE'}
                              onChange={(ev) => void deplacer(e.slug, ev.target.value as Colonne)}
                              aria-label={`Déplacer l’étape ${e.numero} vers`}
                              className="flex-1 rounded-lg border border-[#D9D6EE] bg-white px-2 py-1 text-xs font-bold text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none"
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
                  <li className="px-2 py-6 text-center text-sm text-[#9A99B5]">{cible ? 'Pose la carte ici' : 'Rien ici'}</li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </section>
    </div>
  );
}
