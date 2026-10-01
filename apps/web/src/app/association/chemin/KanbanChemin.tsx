'use client';

import Link from 'next/link';
import { useState, type DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import { appel } from '../_client';
import { CARTE } from '../_ui';
import type { PartieChemin } from '../_chemin';
import {
  BadgeAnnuel,
  BadgeNature,
  BadgePriorite,
  LigneDebloque,
  LigneEcheance,
  LignePrerequis,
  formaterJour,
  lireJour,
  premierePhrase,
  prochaineEtape,
  type EcheanceEtape,
  type NatureEtape,
  type Priorite,
} from '../../_shared/chemin-obligations';
import { CarteRetournable } from '../../_shared/CarteRetournable';

/* Copie de TEINTES_PARTIE (../_chemin.ts) : ce fichier-là importe du code
   serveur (« server-only »), qu'un composant client ne peut pas charger. Les
   deux tables bougent ensemble. */
const TEINTES_PARTIE: Record<PartieChemin, { fond: string; texte: string; bord: string; pastille: string }> = {
  NAITRE: { fond: 'bg-[#E3F5EC]', texte: 'text-[#0F5F3E]', bord: 'border-[#BFE6D2]', pastille: 'bg-[#1E9E6A]' },
  VIVRE: { fond: 'bg-[#FEF3E2]', texte: 'text-[#7C3E06]', bord: 'border-[#F5D6A8]', pastille: 'bg-[#F5B400]' },
  SUBVENTION: { fond: 'bg-[#ECEBFC]', texte: 'text-[#4338CA]', bord: 'border-[#C7C4F2]', pastille: 'bg-[#4F46E5]' },
  AGREMENTS: { fond: 'bg-[#FCE7F3]', texte: 'text-[#9D174D]', bord: 'border-[#FBCFE8]', pastille: 'bg-[#DB2777]' },
  CHAQUE_ANNEE: { fond: 'bg-[#E0F4F3]', texte: 'text-[#115E59]', bord: 'border-[#A7DCD8]', pastille: 'bg-[#0D9488]' },
  SELON_ACTIVITE: { fond: 'bg-[#EEF0F4]', texte: 'text-[#3F4A5C]', bord: 'border-[#D3D8E2]', pastille: 'bg-[#64748B]' },
  EVENEMENT: { fond: 'bg-[#E0F2FE]', texte: 'text-[#075985]', bord: 'border-[#BAE6FD]', pastille: 'bg-[#0284C7]' },
};

/**
 * MON CHEMIN EN COLONNES.
 *
 * À faire, Fait, Pas concerné (01/10/2026) : on attrape une étape et on la
 * pose dans une autre colonne. Sur téléphone, le menu « Déplacer vers » fait
 * pareil. Une étape obligatoire pour toutes les associations ne va pas dans
 * « Pas concerné » : la colonne la refuse, avec un mot d'explication. Une
 * étape confirmée par les répertoires publics (RNA, SIRENE) reste dans
 * « Fait » : l'API la compte faite quoi qu'on coche.
 *
 * Les cartes se retournent (CarteRetournable) : au dos, l'étape en trois
 * lignes et ce qu'elle débloque.
 */
type Colonne = 'A_FAIRE' | 'FAIT' | 'PAS_CONCERNE';

const COLONNES: { code: Colonne; titre: string }[] = [
  { code: 'A_FAIRE', titre: 'À faire' },
  { code: 'FAIT', titre: 'Fait' },
  { code: 'PAS_CONCERNE', titre: 'Pas concerné' },
];

export interface CarteEtapeChemin {
  numero: number;
  slug: string;
  titre: string;
  partie: PartieChemin;
  /** Revient chaque année : badge « Chaque année · 2026 ». */
  chaqueAnnee?: boolean;
  /** Peut aller dans « Pas concerné ». */
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
  /** « Date de l'AG » : l'étape a une date que l'association choisit. */
  dateChoisie?: { libelle: string };
  /** Pour le dos de la carte. */
  enUnMot?: string;
  pourquoi?: string;
  declencheur?: string;
  premiereAction?: string;
}

/** Ce que l'espace sait d'une étape annuelle : son cycle, son échéance, la date choisie. */
export type CyclesCartes = Record<string, { cycle: number | null; echeanceLe: string | null; dateChoisie: string | null }>;

/** Une phrase sous le titre des parties qui ne se lisent pas comme les autres. */
const AIDE_PARTIE: Partial<Record<PartieChemin, string>> = {
  AGREMENTS: 'Un agrément ne te concerne pas ? Glisse-le dans « Pas concerné ».',
  CHAQUE_ANNEE: "Une fois la date de l'année passée, l'étape revient dans « À faire » pour l'année suivante.",
  SELON_ACTIVITE: 'Une étape ne te concerne pas ? Glisse-la dans « Pas concerné ».',
  EVENEMENT: 'Pas de buvette ni de tombola ? Glisse-les dans « Pas concerné ».',
};

export function KanbanChemin({
  etapes,
  parties,
  faites,
  verifiees,
  pasConcernees = [],
  cycles = {},
}: {
  etapes: CarteEtapeChemin[];
  parties: { code: PartieChemin; titre: string }[];
  faites: string[];
  verifiees: string[];
  pasConcernees?: string[];
  cycles?: CyclesCartes;
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
  const parSlug = new Map(etapes.map((e) => [e.slug, e]));
  const estFaite = (slug: string) => confirmees.has(slug) || (deplaces[slug]?.faite ?? cochees.has(slug));
  const estPasConcernee = (slug: string) => !confirmees.has(slug) && estFaite(slug) && (deplaces[slug]?.pasConcerne ?? ecartees.has(slug));
  const colonneDe = (slug: string): Colonne => (!estFaite(slug) ? 'A_FAIRE' : estPasConcernee(slug) ? 'PAS_CONCERNE' : 'FAIT');
  // Les numéros suivent déjà la priorité dans chaque partie (l'API les range).
  const triees = [...etapes].sort((a, b) => a.numero - b.numero);
  const prochaine = prochaineEtape(triees, estFaite)?.slug ?? null;
  const refusee = (slug: string | null, colonne: Colonne) => colonne === 'PAS_CONCERNE' && Boolean(slug) && !parSlug.get(slug as string)?.peutNePasConcerner;

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

  function deplacer(slug: string, colonne: Colonne) {
    if (colonneDe(slug) === colonne) return;
    if (refusee(slug, colonne)) {
      setErreur(`« ${parSlug.get(slug)?.titre ?? 'Cette étape'} » est obligatoire pour toutes les associations : elle ne va pas dans « Pas concerné ».`);
      return;
    }
    void marquer(slug, colonne !== 'A_FAIRE', colonne === 'PAS_CONCERNE');
  }

  function surDepot(e: DragEvent<HTMLDivElement>, colonne: Colonne) {
    e.preventDefault();
    setSurvolee(null);
    const slug = e.dataTransfer.getData('text/plain') || attrape;
    setAttrape(null);
    if (slug) deplacer(slug, colonne);
  }

  return (
    <div id="chemin-etapes" className="mb-8 scroll-mt-24 space-y-4">
      <p className="text-sm text-[#6B6A8A]">Glisse une étape dans « Fait » pour la cocher, ou dans « Pas concerné » pour l&apos;écarter. Passe sur une carte pour voir son dos.</p>
      {erreur ? (
        <p role="alert" className="rounded-xl border border-[#F5D6A8] bg-[#FEF3E2] px-4 py-3 text-sm text-[#7C3E06]">
          {erreur}
        </p>
      ) : null}

      {/* LES ÉTAPES DU CHEMIN RESTENT (01/10/2026, Siham : « il fallait
          laisser les étapes et juste mettre à l'intérieur les kanban ») :
          chaque partie garde son titre, et ses étapes se rangent dedans en
          trois colonnes. */}
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
              <span className="ml-auto text-[#6B6A8A]">
                {faitesIci} / {dePartie.length}
              </span>
            </h2>
            {AIDE_PARTIE[partie.code] ? <p className="-mt-1 mb-3 text-sm text-[#6B6A8A]">{AIDE_PARTIE[partie.code]}</p> : null}
            <div className="grid gap-4 md:grid-cols-3">
              {COLONNES.map((col) => {
                const siennes = dePartie.filter((e) => colonneDe(e.slug) === col.code);
                const cle = `${partie.code}:${col.code}`;
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
                          ? 'bg-[#ECEBFC] ring-2 ring-[#4F46E5]'
                          : col.code === 'PAS_CONCERNE'
                            ? 'bg-[#EEF0F4]/70'
                            : 'bg-[#ECEBFC]/60'
                    }`}
                  >
                    <h3 className="px-2 font-extrabold text-[#1D1B5C]">
                      {col.titre} <span className="text-[#6B6A8A]">{siennes.length}</span>
                    </h3>
                    {refus ? <p className="mt-1 px-2 text-xs font-bold text-[#9F1239]">Obligatoire pour toutes les associations : pas ici.</p> : null}

                    <ul className="mt-3 space-y-2">
                      {siennes.map((e) => (
                        <li key={e.slug}>
                          <Carte
                            e={e}
                            etapes={etapes}
                            confirmee={confirmees.has(e.slug)}
                            estProchaine={prochaine === e.slug}
                            faite={estFaite(e.slug)}
                            pasConcerne={estPasConcernee(e.slug)}
                            colonne={colonneDe(e.slug)}
                            attrapee={attrape === e.slug}
                            cycle={cycles[e.slug]}
                            faitesSlugs={etapes.filter((x) => estFaite(x.slug)).map((x) => x.slug)}
                            onAttrape={setAttrape}
                            onDeplacer={deplacer}
                          />
                        </li>
                      ))}
                      {siennes.length === 0 ? (
                        <li className="px-2 py-6 text-center text-sm text-[#9A99B5]">{cible && !refus ? 'Pose la carte ici' : 'Rien ici'}</li>
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

function Carte({
  e,
  etapes,
  confirmee,
  estProchaine,
  faite,
  pasConcerne,
  colonne,
  attrapee,
  cycle,
  faitesSlugs,
  onAttrape,
  onDeplacer,
}: {
  e: CarteEtapeChemin;
  etapes: CarteEtapeChemin[];
  confirmee: boolean;
  estProchaine: boolean;
  faite: boolean;
  pasConcerne: boolean;
  colonne: Colonne;
  attrapee: boolean;
  cycle?: CyclesCartes[string];
  faitesSlugs: string[];
  onAttrape: (slug: string | null) => void;
  onDeplacer: (slug: string, colonne: Colonne) => void;
}) {
  const dateChoisie = lireJour(cycle?.dateChoisie);
  return (
    <div
      draggable={!confirmee}
      onDragStart={(ev) => {
        ev.dataTransfer.setData('text/plain', e.slug);
        ev.dataTransfer.effectAllowed = 'move';
        onAttrape(e.slug);
      }}
      onDragEnd={() => onAttrape(null)}
      className={`${confirmee ? '' : 'cursor-grab active:cursor-grabbing'} ${attrapee ? 'opacity-50' : ''}`}
    >
      <CarteRetournable
        theme="association"
        titre={e.titre}
        verso={{
          cestQuoi: e.enUnMot,
          pourquoi: e.declencheur ?? premierePhrase(e.pourquoi),
          comment: [e.premiereAction, e.echeance?.texte].filter(Boolean).join(' '),
          debloque: e.debloque,
          href: `/chemin/${e.slug}`,
        }}
        recto={(boutonRetourner) => (
          <div
            className={`${CARTE} h-full p-3 transition motion-reduce:transition-none ${
              estProchaine ? '!border-2 !border-[#4F46E5] shadow-[0_12px_28px_-20px_rgba(29,27,92,0.8)]' : ''
            }`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${
                  faite ? (pasConcerne ? 'bg-[#64748B] text-white' : 'bg-[#1E9E6A] text-white') : estProchaine ? 'bg-[#4F46E5] text-white' : 'border-2 border-[#D9D6EE] bg-white text-[#6B6A8A]'
                }`}
                aria-label={`Étape ${e.numero}${pasConcerne ? ', pas concerné' : faite ? ', faite' : ''}`}
              >
                {faite && !pasConcerne ? '✓' : e.numero}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`font-extrabold leading-snug ${faite ? 'text-[#6B6A8A]' : 'text-[#1D1B5C]'}`}>{e.titre}</p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs font-bold">
                  {estProchaine ? <span className="rounded-full bg-[#4F46E5] px-2 py-0.5 text-white">Prochaine</span> : null}
                  {confirmee ? <span className="rounded-full bg-[#E3F5EC] px-2 py-0.5 text-[#0F5F3E]">Confirmée</span> : null}
                  {faite ? null : <BadgePriorite priorite={e.priorite} />}
                  {e.chaqueAnnee ? <BadgeAnnuel cycle={cycle?.cycle} /> : null}
                  {faite ? null : <BadgeNature nature={e.nature} />}
                </p>
                {e.dateChoisie ? (
                  <p className="mt-1.5 text-xs leading-snug text-[#1D1B5C]">
                    <span className="font-bold">{e.dateChoisie.libelle} : </span>
                    {dateChoisie ? (
                      formaterJour(dateChoisie)
                    ) : (
                      <Link href={`/chemin/${e.slug}#date-choisie`} draggable={false} className="font-bold text-[#4F46E5] underline underline-offset-2">
                        à choisir
                      </Link>
                    )}
                  </p>
                ) : null}
                {faite ? null : (
                  <>
                    <LigneEcheance echeance={e.echeance} chaqueAnnee={e.chaqueAnnee} echeanceLe={cycle?.echeanceLe} theme="association" />
                    <LignePrerequis prerequis={e.prerequis} etapes={etapes} faites={faitesSlugs} theme="association" />
                    <LigneDebloque debloque={e.debloque} theme="association" />
                  </>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <Link
                  href={`/chemin/${e.slug}`}
                  draggable={false}
                  aria-label={`Ouvrir l’étape ${e.numero} : ${e.titre}`}
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5] ${
                    estProchaine ? 'bg-[#4F46E5] text-white hover:bg-[#4338CA]' : 'text-[#4F46E5] hover:bg-[#ECEBFC]'
                  }`}
                >
                  Ouvrir
                </Link>
                {boutonRetourner}
              </div>
            </div>

            {confirmee ? null : (
              <label className="mt-2 flex items-center gap-2 text-[11px] font-bold text-[#6B6A8A]">
                Déplacer vers
                <select
                  value={colonne}
                  onChange={(ev) => onDeplacer(e.slug, ev.target.value as Colonne)}
                  aria-label={`Déplacer l’étape ${e.numero} vers`}
                  className="flex-1 rounded-lg border border-[#D9D6EE] bg-white px-2 py-1 text-xs font-bold text-[#1D1B5C] focus:border-[#4F46E5] focus:outline-none"
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
  );
}
