'use client';

import Link from 'next/link';
import { useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../_client';
import { CARTE } from '../_ui';
import type { PartieChemin } from '../_chemin';
import { BadgeNature, LigneEcheance, LignePrerequis, type EcheanceEtape, type NatureEtape } from '../../_shared/chemin-obligations';

/* Copie de TEINTES_PARTIE (../_chemin.ts) : ce fichier-là importe du code
   serveur (« server-only »), qu'un composant client ne peut pas charger. Les
   deux tables bougent ensemble. */
const TEINTES_PARTIE: Record<PartieChemin, { fond: string; texte: string; bord: string; pastille: string }> = {
  NAITRE: { fond: 'bg-[#E3F5EC]', texte: 'text-[#0F5F3E]', bord: 'border-[#BFE6D2]', pastille: 'bg-[#1E9E6A]' },
  VIVRE: { fond: 'bg-[#FEF3E2]', texte: 'text-[#7C3E06]', bord: 'border-[#F5D6A8]', pastille: 'bg-[#F5B400]' },
  SUBVENTION: { fond: 'bg-[#ECEBFC]', texte: 'text-[#4338CA]', bord: 'border-[#C7C4F2]', pastille: 'bg-[#4F46E5]' },
  CHAQUE_ANNEE: { fond: 'bg-[#E0F4F3]', texte: 'text-[#115E59]', bord: 'border-[#A7DCD8]', pastille: 'bg-[#0D9488]' },
  SELON_ACTIVITE: { fond: 'bg-[#EEF0F4]', texte: 'text-[#3F4A5C]', bord: 'border-[#D3D8E2]', pastille: 'bg-[#64748B]' },
  EVENEMENT: { fond: 'bg-[#E0F2FE]', texte: 'text-[#075985]', bord: 'border-[#BAE6FD]', pastille: 'bg-[#0284C7]' },
};

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
}

/** Une phrase sous le titre des parties qui ne se lisent pas comme les autres. */
const AIDE_PARTIE: Partial<Record<PartieChemin, string>> = {
  CHAQUE_ANNEE: 'Ces étapes repassent dans « À faire » chaque 1er janvier.',
  SELON_ACTIVITE: 'Une étape ne te concerne pas ? Clique sur « Pas concerné ».',
  EVENEMENT: 'Pas de buvette ni de tombola ? Clique sur « Pas concerné ».',
};

export function KanbanChemin({
  etapes,
  parties,
  faites,
  verifiees,
  pasConcernees = [],
}: {
  etapes: CarteEtapeChemin[];
  parties: { code: PartieChemin; titre: string }[];
  faites: string[];
  verifiees: string[];
  pasConcernees?: string[];
}) {
  const router = useRouter();
  const [attrape, setAttrape] = useState<string | null>(null);
  const [survolee, setSurvolee] = useState<string | null>(null);
  /** Ce qui a bougé ici, en attendant la réponse : faite ou non, et « pas concerné ». */
  const [deplaces, setDeplaces] = useState<Record<string, { faite: boolean; pasConcerne: boolean }>>({});
  const [erreur, setErreur] = useState<string | null>(null);

  const confirmees = new Set(verifiees);
  const cochees = new Set(faites);
  const ecartees = new Set(pasConcernees);
  const estFaite = (slug: string) => confirmees.has(slug) || (deplaces[slug]?.faite ?? cochees.has(slug));
  const estPasConcernee = (slug: string) => estFaite(slug) && (deplaces[slug]?.pasConcerne ?? ecartees.has(slug));
  // L'ordre des numéros suit l'ordre voulu pour « Prochaine » : le chemin
  // d'abord, puis ce qui revient chaque année, puis ce qui dépend de l'activité.
  const triees = [...etapes].sort((a, b) => a.numero - b.numero);
  const prochaine = triees.find((e) => !estFaite(e.slug))?.slug ?? null;

  async function marquer(slug: string, faite: boolean, pasConcerne = false) {
    if (confirmees.has(slug) || (estFaite(slug) === faite && estPasConcernee(slug) === pasConcerne)) return;
    setErreur(null);
    setDeplaces((x) => ({ ...x, [slug]: { faite, pasConcerne } }));
    try {
      await appel(`/association/chemin/${slug}`, { method: 'POST', body: pasConcerne ? { faite, pasConcerne } : { faite } });
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

  // Glisser ou choisir une colonne coche ou décoche, sans toucher à « Pas concerné ».
  const deplacer = (slug: string, colonne: Colonne) => (estFaite(slug) === (colonne === 'FAIT') ? undefined : marquer(slug, colonne === 'FAIT'));

  function surDepot(e: DragEvent<HTMLDivElement>, colonne: Colonne) {
    e.preventDefault();
    setSurvolee(null);
    const slug = e.dataTransfer.getData('text/plain') || attrape;
    setAttrape(null);
    if (slug) void deplacer(slug, colonne);
  }

  return (
    <div id="chemin-etapes" className="mb-8 scroll-mt-24 space-y-4">
      <p className="text-sm text-[#6B6A8A]">Glisse une étape dans « Fait » pour la cocher.</p>
      {erreur ? (
        <p role="alert" className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">
          {erreur}
        </p>
      ) : null}

      {/* LES TROIS ÉTAPES DU CHEMIN RESTENT (01/10/2026, Siham : « il fallait
          laisser les étapes et juste mettre à l'intérieur les kanban ») :
          chaque partie garde son titre, et ses étapes se rangent dedans en
          deux colonnes. */}
      {parties.map((partie) => {
        const teintePartie = TEINTES_PARTIE[partie.code];
        const dePartie = triees.filter((e) => e.partie === partie.code);
        if (!dePartie.length) return null;
        const faitesIci = dePartie.filter((e) => estFaite(e.slug)).length;
        return (
      <section key={partie.code} id={`partie-${parties.indexOf(partie) + 1}`} className="scroll-mt-24 pt-4" aria-label={partie.titre}>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.12em]">
          <span className={`h-2.5 w-2.5 rounded-full ${teintePartie.pastille}`} aria-hidden="true" />
          <span className={teintePartie.texte}>{partie.titre}</span>
          {partie.code === 'SUBVENTION' ? <span className="rounded-full bg-[#F5B400] px-2 py-0.5 text-[10px] text-[#1D1B5C]">Le but</span> : null}
          <span className="ml-auto text-[#6B6A8A]">{faitesIci} / {dePartie.length}</span>
        </h2>
        {AIDE_PARTIE[partie.code] ? <p className="-mt-1 mb-3 text-sm text-[#6B6A8A]">{AIDE_PARTIE[partie.code]}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        {COLONNES.map((col) => {
          const siennes = dePartie.filter((e) => (col.code === 'FAIT') === estFaite(e.slug));
          const cle = `${partie.code}:${col.code}`;
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
              className={`rounded-2xl p-3 transition motion-reduce:transition-none ${cible ? 'bg-[#ECEBFC] ring-2 ring-[#4F46E5]' : 'bg-[#ECEBFC]/60'}`}
            >
              <h3 className="px-2 font-extrabold text-[#1D1B5C]">
                {col.titre} <span className="text-[#6B6A8A]">{siennes.length}</span>
              </h3>

              <ul className="mt-3 space-y-2">
                {siennes.map((e) => {
                  const confirmee = confirmees.has(e.slug);
                  const estProchaine = prochaine === e.slug;
                  const faite = estFaite(e.slug);
                  const pasConcerne = estPasConcernee(e.slug);
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
                              {estProchaine ? <span className="rounded-full bg-[#4F46E5] px-2 py-0.5 text-white">Prochaine</span> : null}
                              {confirmee ? <span className="rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[#0F5F3E]">Confirmée</span> : null}
                              {e.chaqueAnnee ? <span className="rounded-full bg-[#E0F4F3] px-2 py-0.5 text-[#115E59]">Chaque année</span> : null}
                              {pasConcerne ? <span className="rounded-full bg-[#EEF0F4] px-2 py-0.5 text-[#3F4A5C]">Pas concerné</span> : null}
                              {faite ? null : <BadgeNature nature={e.nature} />}
                            </p>
                            {faite ? null : (
                              <>
                                <LigneEcheance echeance={e.echeance} chaqueAnnee={e.chaqueAnnee} theme="association" />
                                <LignePrerequis
                                  prerequis={e.prerequis}
                                  etapes={etapes}
                                  faites={etapes.filter((x) => estFaite(x.slug)).map((x) => x.slug)}
                                  theme="association"
                                />
                              </>
                            )}
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

                        {e.peutNePasConcerner && !faite ? (
                          <button
                            type="button"
                            onClick={() => void marquer(e.slug, true, true)}
                            className="mt-2 rounded-lg border border-[#D3D8E2] bg-white px-2.5 py-1 text-xs font-bold text-[#3F4A5C] hover:bg-[#EEF0F4] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#64748B]"
                          >
                            Pas concerné
                          </button>
                        ) : null}

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
      </div>
      </section>
        );
      })}
    </div>
  );
}
