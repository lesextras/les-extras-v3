'use client';

import { useMemo, useState } from 'react';
import { BTN_DISCRET, BTN_SECONDAIRE, CARTE, CHAMP, Encart, Pastille } from '../_ui';
import { dateCourte, euros, type Apprenant, type Vente } from '../_ecole/types';

/**
 * MES APPRENANTS — LA LISTE DES PERSONNES.
 *
 * Trois idées, et rien d'autre : qui, depuis quand, où elle en est. Le tri par
 * « dernière visite » est celui qui sert vraiment — c'est lui qui montre les
 * personnes qui décrochent, pendant qu'on peut encore les rattraper.
 */

type Tri = 'inscription' | 'visite' | 'nom' | 'progression';
type Filtre = 'tous' | 'en-cours' | 'termines' | 'inactifs';

interface Personne {
  cle: string;
  nom: string;
  email: string;
  inscritLe: string;
  derniereVisite: string | null;
  cours: Apprenant[];
  progression: number;
  termines: number;
  revenusCents: number;
}

/** « il y a 22 jours », « il y a 2 mois » — la même façon de dire que partout. */
function ilYA(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const jours = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return 'hier';
  if (jours < 31) return `il y a ${jours} jours`;
  const mois = Math.floor(jours / 30);
  if (mois < 12) return `il y a ${mois} mois`;
  const ans = Math.floor(mois / 12);
  return `il y a ${ans} an${ans > 1 ? 's' : ''}`;
}

function joursDepuis(iso: string | null | undefined) {
  if (!iso) return Number.POSITIVE_INFINITY;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return Number.POSITIVE_INFINITY;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
}

/** Une inscription par cours devient une personne, avec son détail. */
function regrouper(inscriptions: Apprenant[], ventes: Vente[]): Personne[] {
  const paye = new Map<string, number>();
  for (const v of ventes) {
    if (v.statut !== 'PAYEE') continue;
    const c = v.email.trim().toLowerCase();
    paye.set(c, (paye.get(c) ?? 0) + (v.montantCents ?? 0));
  }

  const par = new Map<string, Personne>();
  for (const i of inscriptions) {
    const cle = i.email.trim().toLowerCase();
    const p = par.get(cle);
    if (p) {
      p.cours.push(i);
      if (i.inscritLe < p.inscritLe) p.inscritLe = i.inscritLe;
      if (i.derniereVisite && (!p.derniereVisite || i.derniereVisite > p.derniereVisite)) {
        p.derniereVisite = i.derniereVisite;
      }
      if (!p.nom && i.nom) p.nom = i.nom;
    } else {
      par.set(cle, {
        cle,
        nom: i.nom ?? '',
        email: i.email,
        inscritLe: i.inscritLe,
        derniereVisite: i.derniereVisite,
        cours: [i],
        progression: 0,
        termines: 0,
        revenusCents: paye.get(cle) ?? 0,
      });
    }
  }

  for (const p of par.values()) {
    p.progression = Math.round(p.cours.reduce((t, c) => t + (c.progression ?? 0), 0) / p.cours.length);
    p.termines = p.cours.filter((c) => c.statut === 'TERMINEE').length;
  }
  return [...par.values()];
}

function versCsv(personnes: Personne[]) {
  const entetes = ['Nom', 'E-mail', 'Inscrit le', 'Dernière visite', 'Formations', 'Terminées', 'Progression %', 'Payé (€)'];
  const echapper = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lignes = personnes.map((p) =>
    [
      p.nom || '',
      p.email,
      p.inscritLe.slice(0, 10),
      p.derniereVisite ? p.derniereVisite.slice(0, 10) : '',
      String(p.cours.length),
      String(p.termines),
      String(p.progression),
      (p.revenusCents / 100).toFixed(2).replace('.', ','),
    ]
      .map(echapper)
      .join(';'),
  );
  return [entetes.map(echapper).join(';'), ...lignes].join('\r\n');
}

export function Apprenants({ inscriptions, ventes }: { inscriptions: Apprenant[]; ventes: Vente[] }) {
  const personnes = useMemo(() => regrouper(inscriptions, ventes), [inscriptions, ventes]);
  const [recherche, setRecherche] = useState('');
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const [tri, setTri] = useState<Tri>('inscription');
  const [ouvert, setOuvert] = useState<string | null>(null);

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    let l = personnes.filter((p) => !q || p.email.toLowerCase().includes(q) || p.nom.toLowerCase().includes(q));
    if (filtre === 'en-cours') l = l.filter((p) => p.termines < p.cours.length);
    if (filtre === 'termines') l = l.filter((p) => p.termines === p.cours.length && p.cours.length > 0);
    if (filtre === 'inactifs') l = l.filter((p) => joursDepuis(p.derniereVisite) >= 30);
    const trie = [...l];
    if (tri === 'inscription') trie.sort((a, b) => (a.inscritLe < b.inscritLe ? 1 : -1));
    if (tri === 'visite') trie.sort((a, b) => joursDepuis(a.derniereVisite) - joursDepuis(b.derniereVisite));
    if (tri === 'nom') trie.sort((a, b) => (a.nom || a.email).localeCompare(b.nom || b.email, 'fr'));
    if (tri === 'progression') trie.sort((a, b) => b.progression - a.progression);
    return trie;
  }, [personnes, recherche, filtre, tri]);

  const inactifs = personnes.filter((p) => joursDepuis(p.derniereVisite) >= 30).length;

  function exporter() {
    const contenu = '﻿' + versCsv(visibles);
    const url = URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `apprenants-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  if (!personnes.length) {
    return (
      <Encart ton="info">
        Personne n&apos;est encore inscrit. Publie un cours, partage son adresse : chacun crée son compte lui-même et
        apparaît ici dès sa première connexion.
      </Encart>
    );
  }

  return (
    <>
      {inactifs ? (
        <div className="mb-6">
          <Encart ton="attention">
            {inactifs} personne{inactifs > 1 ? 's' : ''} n&apos;{inactifs > 1 ? 'ont' : 'a'} pas ouvert son cours
            depuis plus d&apos;un mois. C&apos;est le moment de relancer, pas dans trois mois.
          </Encart>
        </div>
      ) : null}

      {/* ------------------------------------------------------- les filtres */}
      <div className={`${CARTE} mb-5 p-4 sm:p-5`}>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Filtrer</span>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className={CHAMP}
              placeholder="Un nom, une adresse e-mail"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Qui</span>
            <select value={filtre} onChange={(e) => setFiltre(e.target.value as Filtre)} className={CHAMP}>
              <option value="tous">Tout le monde</option>
              <option value="en-cours">En cours</option>
              <option value="termines">Ont terminé</option>
              <option value="inactifs">Sans visite depuis un mois</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Trier par</span>
            <select value={tri} onChange={(e) => setTri(e.target.value as Tri)} className={CHAMP}>
              <option value="inscription">Date d&apos;inscription</option>
              <option value="visite">Dernière visite</option>
              <option value="nom">Nom</option>
              <option value="progression">Progression</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-[15px] text-[#334A42]">
            <span className="font-extrabold text-[#12312A]">
              {visibles.length} apprenant{visibles.length > 1 ? 's' : ''}
            </span>
            {visibles.length === personnes.length ? '' : ` sur ${personnes.length}`}
          </p>
          <button type="button" onClick={exporter} className={`${BTN_SECONDAIRE} ml-auto`}>
            Exporter en CSV
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------ les personnes */}
      <ul className="grid gap-2">
        {visibles.map((p) => {
          const deplie = ouvert === p.cle;
          return (
            <li key={p.cle} className={CARTE}>
              <button
                type="button"
                onClick={() => setOuvert(deplie ? null : p.cle)}
                aria-expanded={deplie}
                className="flex w-full flex-wrap items-center gap-3 rounded-2xl p-4 text-left transition hover:bg-[#F2F7F5] sm:p-5"
              >
                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E3F5EC] text-[#0F5F3E] transition-transform ${deplie ? 'rotate-90' : ''}`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </span>

                <span className="min-w-[180px] flex-1">
                  <span className="block text-[16px] font-extrabold text-[#12312A]">{p.nom || 'Sans nom'}</span>
                  <span className="block break-all text-[14px] text-[#5E7A6E]">{p.email}</span>
                </span>

                <span className="min-w-[190px] text-[14px] leading-relaxed text-[#334A42]">
                  <span className="block">
                    <span className="font-bold">Inscrit</span> {ilYA(p.inscritLe) ?? dateCourte(p.inscritLe)}
                  </span>
                  <span className="block">
                    <span className="font-bold">Connecté</span> {ilYA(p.derniereVisite) ?? 'jamais'}
                  </span>
                </span>

                <span className="min-w-[110px] text-right">
                  <span className="block text-[16px] font-black text-[#12312A]">{euros(p.revenusCents)}</span>
                  <span className="block text-[13px] italic text-[#5E7A6E]">
                    {p.cours.length} formation{p.cours.length > 1 ? 's' : ''}
                  </span>
                </span>

                <span className="hidden sm:block">
                  {p.termines === p.cours.length ? (
                    <Pastille ton="ok">Terminé</Pastille>
                  ) : joursDepuis(p.derniereVisite) >= 30 ? (
                    <Pastille ton="attention">À relancer</Pastille>
                  ) : (
                    <Pastille ton="neutre">{p.progression} %</Pastille>
                  )}
                </span>
              </button>

              {deplie ? (
                <div className="border-t border-[#EDF4F1] px-4 pb-4 pt-3 sm:px-5">
                  <ul className="grid gap-2">
                    {p.cours.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-[#F2F7F5] px-4 py-3">
                        <span className="min-w-[180px] flex-1">
                          <span className="block text-[15px] font-bold text-[#12312A]">{c.cours.titre}</span>
                          <span className="block text-[13px] text-[#5E7A6E]">
                            Inscrit le {dateCourte(c.inscritLe)}
                            {c.termineLe ? ` · terminé le ${dateCourte(c.termineLe)}` : ''}
                            {c.certificatEmisLe ? ` · certificat le ${dateCourte(c.certificatEmisLe)}` : ''}
                          </span>
                        </span>
                        <span className="w-[160px]">
                          <span className="block h-2 w-full overflow-hidden rounded-full bg-[#DDEBE4]">
                            <span
                              className="block h-full rounded-full bg-[#1E9E6A]"
                              style={{ width: `${Math.min(100, Math.max(0, c.progression ?? 0))}%` }}
                            />
                          </span>
                          <span className="mt-1 block text-[13px] text-[#5E7A6E]">{c.progression ?? 0} % du cours</span>
                        </span>
                        {c.lien ? (
                          <a href={c.lien} target="_blank" rel="noreferrer" className={BTN_DISCRET}>
                            Ouvrir son cours
                          </a>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="mt-6 max-w-[75ch] text-[14px] leading-relaxed text-[#5E7A6E]">
        Personne n&apos;est inscrit à sa place : chacun crée son compte depuis l&apos;adresse du cours. L&apos;export
        CSV reprend exactement ce que la liste affiche, filtres compris.
      </p>
    </>
  );
}
