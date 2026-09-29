'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Barres, euros } from './graphiques';
import type { ThemeFactures } from './MesFactures';

/**
 * PRÉVU / RÉALISÉ D'UNE ENVELOPPE.
 *
 * On dépose le dossier de subvention VALIDÉ (PDF, Word ou image) : le moteur
 * en relit le budget prévisionnel, les objectifs et le public visé. Mes
 * factures met en face ce qui a réellement été dépensé et encaissé sur
 * l'enveloppe (factures, notes de frais, relevé), rubrique par rubrique, et
 * signale les écarts à expliquer au financeur. Les objectifs et le public
 * touché se saisissent à la main : aucune pièce comptable ne les connaît.
 *
 * Rien n'est inventé : une ligne que le dossier ne porte pas reste vide, et
 * tout se corrige ici avant d'être exporté dans le compte rendu Excel.
 */

interface LigneBudget {
  code: string;
  libelle: string;
  prevu: number | null;
  realiseManuel?: number | null;
  commentaire?: string | null;
}
interface Objectif {
  intitule: string;
  indicateur: string | null;
  cible: number | null;
  unite: string | null;
  realise?: number | null;
  commentaire?: string | null;
}
interface Public {
  categorie: string;
  prevu: number | null;
  realise?: number | null;
  commentaire?: string | null;
}
interface LigneComparee {
  code: string;
  libelle: string;
  prevu: number;
  realiseCalcule: number;
  realiseManuel: number;
  realise: number;
  ecart: number;
  ecartPct: number | null;
  aExpliquer: boolean;
  commentaire: string | null;
  nonPrevue: boolean;
}
type Analyse =
  | { existe: false; dossierPilote: boolean }
  | {
      existe: true;
      dossierPilote: boolean;
      fichier: { id: string; nom: string | null } | null;
      origine: string;
      intitule: string | null;
      periodeDebut: string | null;
      periodeFin: string | null;
      seuilEcart: number;
      remarque: string | null;
      saisie: { charges: LigneBudget[]; produits: LigneBudget[]; objectifs: Objectif[]; publics: Public[] };
      charges: LigneComparee[];
      produits: LigneComparee[];
      objectifs: (Objectif & { taux: number | null })[];
      publics: (Public & { taux: number | null })[];
      synthese: {
        chargesPrevues: number;
        chargesRealisees: number;
        produitsPrevus: number;
        produitsRealises: number;
        aExpliquer: number;
        objectifsMesures: number;
        objectifsAtteints: number;
        objectifsTotal: number;
        publicPrevu: number;
        publicRealise: number;
        tauxPublic: number | null;
      };
      pieces: number;
    };

const ORIGINES: Record<string, string> = { moteur: 'lu dans le dossier déposé', dossier: 'repris du dossier Pilote', main: 'saisi à la main' };

async function appel<T>(path: string, init?: { method?: string; body?: unknown; form?: FormData }): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit | undefined;
  if (init?.form) body = init.form;
  else if (init?.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(init.body);
  }
  const res = await fetch(`/api/proxy${path}`, { method: init?.method ?? 'GET', headers, body, credentials: 'include' });
  const texte = await res.text();
  let charge: unknown = null;
  try {
    charge = texte ? JSON.parse(texte) : null;
  } catch {
    charge = null;
  }
  if (!res.ok) {
    const m = (charge as { message?: string | string[] } | null)?.message;
    throw new Error(Array.isArray(m) ? m.join(' ') : m || `Erreur ${res.status}`);
  }
  return charge as T;
}

/** Un nombre saisi : vide = null, virgule acceptée. */
function lireNombre(s: string): number | null {
  const t = s.replace(/\s/g, '').replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
const texteNombre = (n: number | null | undefined) => (n === null || n === undefined ? '' : String(n));

function Taux({ taux, encre }: { taux: number | null; encre: string }) {
  if (taux === null) return <span className="text-[12px] opacity-60" style={{ color: encre }}>à mesurer</span>;
  const p = Math.max(0, Math.min(100, taux));
  const teinte = taux >= 100 ? '#1E9E6A' : taux >= 70 ? '#F59E0B' : '#EF4444';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 overflow-hidden rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
        <div className="h-2 rounded-full" style={{ width: `${p}%`, background: teinte }} />
      </div>
      <span className="text-[12px] font-bold tabular-nums" style={{ color: teinte }}>
        {taux} %
      </span>
    </div>
  );
}

export function PrevuRealise({ theme, enveloppeId, onFermer }: { theme: ThemeFactures; enveloppeId: string; onFermer: () => void }) {
  const [a, setA] = useState<Analyse | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [edition, setEdition] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);
  const base = `/factures/enveloppes/${enveloppeId}/previsionnel`;

  const charger = useCallback(async () => {
    try {
      setA(await appel<Analyse>(base));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    }
  }, [base]);
  useEffect(() => {
    void charger();
  }, [charger]);

  const agir = async (fn: () => Promise<Analyse>, succes: string) => {
    setOccupe(true);
    setErreur(null);
    setMessage(null);
    try {
      setA(await fn());
      setMessage(succes);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : String(e));
    } finally {
      setOccupe(false);
    }
  };

  const deposer = (f: File) => {
    const form = new FormData();
    form.append('file', f);
    void agir(() => appel<Analyse>(base, { method: 'POST', form }), 'Dossier lu. Vérifiez les lignes reprises, puis saisissez le réalisé des objectifs et du public.');
  };

  const txt = { color: theme.encre };
  const champDepot = (
    <>
      <input
        ref={fichier}
        type="file"
        accept=".pdf,.doc,.docx,.odt,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) deposer(f);
          e.target.value = '';
        }}
      />
    </>
  );

  return (
    <div className="mt-4 border-t pt-4" style={{ borderColor: theme.bordure }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h5 className="text-[15px] font-black" style={txt}>
          Prévu / réalisé
        </h5>
        <button type="button" className="text-[13px] font-bold underline" style={{ color: theme.primaire }} onClick={onFermer}>
          Fermer
        </button>
      </div>
      {champDepot}
      {erreur ? <p className="mt-2 rounded-lg bg-[#FDE8EC] px-3 py-2 text-[13px] text-[#8A1B3D]">{erreur}</p> : null}
      {message ? <p className="mt-2 rounded-lg bg-[#E7F6EE] px-3 py-2 text-[13px] text-[#14532D]">{message}</p> : null}
      {occupe ? (
        <p className="mt-2 text-[13px] opacity-70" style={txt}>
          Lecture en cours, cela peut prendre une minute…
        </p>
      ) : null}

      {!a ? (
        <p className="mt-2 text-[13px] opacity-70" style={txt}>
          Chargement…
        </p>
      ) : !a.existe ? (
        <div className="mt-2 grid gap-3">
          <p className="text-[13px]" style={txt}>
            Déposez le dossier de subvention <strong>tel qu’il a été validé</strong> : Mes factures en relit le budget prévisionnel, les objectifs et le public visé, et met en face ce qui a réellement été dépensé sur cette enveloppe.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={occupe} className={theme.btnPrimaire} style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => fichier.current?.click()}>
              Déposer le dossier validé (PDF, Word, image)
            </button>
            {a.dossierPilote ? (
              <button type="button" disabled={occupe} className={theme.btnSecondaire} onClick={() => void agir(() => appel<Analyse>(`${base}/depuis-dossier`, { method: 'POST' }), 'Budget repris du dossier Pilote.')}>
                Reprendre le budget du dossier Pilote
              </button>
            ) : null}
            <button
              type="button"
              disabled={occupe}
              className={theme.btnSecondaire}
              onClick={() =>
                void agir(async () => {
                  const r = await appel<Analyse>(base, { method: 'PUT', body: {} });
                  setEdition(true);
                  return r;
                }, 'Tableau créé : saisissez le prévu ligne par ligne.')
              }
            >
              Saisir à la main
            </button>
          </div>
        </div>
      ) : (
        <Tableau theme={theme} a={a} occupe={occupe} edition={edition} setEdition={setEdition} redeposer={() => fichier.current?.click()} enregistrer={(corps) => agir(() => appel<Analyse>(base, { method: 'PUT', body: corps }), 'Enregistré.')} />
      )}
    </div>
  );
}

type Existe = Extract<Analyse, { existe: true }>;

function Tableau({ theme, a, occupe, edition, setEdition, redeposer, enregistrer }: { theme: ThemeFactures; a: Existe; occupe: boolean; edition: boolean; setEdition: (v: boolean) => void; redeposer: () => void; enregistrer: (corps: unknown) => Promise<void> }) {
  const txt = { color: theme.encre };
  const s = a.synthese;
  const toutes = [...a.charges];
  const taux = (p: number, r: number) => (p > 0 ? Math.round((r / p) * 100) : null);
  return (
    <div className="mt-2 grid gap-4">
      <p className="text-[12px] opacity-70" style={txt}>
        {a.intitule ? <strong>{a.intitule}</strong> : 'Dossier sans intitulé'}
        {a.periodeDebut || a.periodeFin ? ` · du ${a.periodeDebut ?? '?'} au ${a.periodeFin ?? '?'}` : ''} · prévu {ORIGINES[a.origine] ?? a.origine}
        {a.fichier ? ` (${a.fichier.nom ?? 'fichier'})` : ''} · {a.pieces} pièce{a.pieces > 1 ? 's' : ''} rattachée{a.pieces > 1 ? 's' : ''} à l’enveloppe
      </p>
      {a.remarque ? <p className="rounded-lg bg-[#FFF4D6] px-3 py-2 text-[13px] text-[#7A4B00]">{a.remarque}</p> : null}

      <div className="grid gap-2 sm:grid-cols-4">
        <Carte theme={theme} titre="Dépensé / prévu" valeur={`${euros(s.chargesRealisees)} / ${euros(s.chargesPrevues)}`} detail={taux(s.chargesPrevues, s.chargesRealisees) === null ? 'aucun budget prévu' : `${taux(s.chargesPrevues, s.chargesRealisees)} % du budget`} />
        <Carte theme={theme} titre="Encaissé / prévu" valeur={`${euros(s.produitsRealises)} / ${euros(s.produitsPrevus)}`} detail={taux(s.produitsPrevus, s.produitsRealises) === null ? 'aucun produit prévu' : `${taux(s.produitsPrevus, s.produitsRealises)} % des produits`} />
        <Carte theme={theme} titre="Objectifs atteints" valeur={`${s.objectifsAtteints} / ${s.objectifsTotal}`} detail={s.objectifsMesures < s.objectifsTotal ? `${s.objectifsTotal - s.objectifsMesures} encore à mesurer` : 'tous mesurés'} />
        <Carte theme={theme} titre="Public touché" valeur={`${s.publicRealise} / ${s.publicPrevu}`} detail={s.tauxPublic === null ? 'à saisir' : `${s.tauxPublic} % du public visé`} />
      </div>
      {s.aExpliquer ? (
        <p className="rounded-lg bg-[#FFF4D6] px-3 py-2 text-[13px] text-[#7A4B00]">
          {s.aExpliquer} rubrique{s.aExpliquer > 1 ? 's' : ''} s’écarte{s.aExpliquer > 1 ? 'nt' : ''} de plus de {a.seuilEcart} % du prévu (ou n’était pas prévue) : le financeur demandera une explication. Écrivez-la dans le commentaire de la ligne.
        </p>
      ) : null}

      {toutes.length ? (
        <div>
          <p className="mb-1 text-[12px] font-bold uppercase opacity-60" style={txt}>
            Charges par rubrique : prévu (clair) et réalisé (foncé)
          </p>
          <Barres
            encre={theme.encre}
            etiquettes={toutes.map((c) => c.code)}
            series={[
              { nom: 'Prévu', valeurs: toutes.map((c) => c.prevu), couleur: '#C7D2FE' },
              { nom: 'Réalisé', valeurs: toutes.map((c) => c.realise), couleur: theme.primaire },
            ]}
          />
        </div>
      ) : null}

      {edition ? (
        <Edition theme={theme} a={a} occupe={occupe} annuler={() => setEdition(false)} enregistrer={async (c) => { await enregistrer(c); setEdition(false); }} />
      ) : (
        <>
          <TableBudget theme={theme} titre="Charges" lignes={a.charges} />
          <TableBudget theme={theme} titre="Produits" lignes={a.produits} />
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[13px]" style={txt}>
              <thead>
                <tr className="border-b" style={{ borderColor: theme.bordure }}>
                  <th className="py-1.5 pr-2">Objectif</th>
                  <th className="py-1.5 pr-2">Cible</th>
                  <th className="py-1.5 pr-2">Réalisé</th>
                  <th className="py-1.5">Atteinte</th>
                </tr>
              </thead>
              <tbody>
                {a.objectifs.length ? (
                  a.objectifs.map((o, i) => (
                    <tr key={i} className="border-b align-top" style={{ borderColor: theme.bordure }}>
                      <td className="py-1.5 pr-2">
                        {o.intitule}
                        {o.indicateur ? <span className="block text-[12px] opacity-60">{o.indicateur}</span> : null}
                      </td>
                      <td className="py-1.5 pr-2 tabular-nums">{o.cible === null ? '' : `${o.cible}${o.unite ? ` ${o.unite}` : ''}`}</td>
                      <td className="py-1.5 pr-2 tabular-nums">{o.realise ?? ''}</td>
                      <td className="py-1.5">
                        <Taux taux={o.taux} encre={theme.encre} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-2 opacity-60">
                      Aucun objectif chiffré dans le dossier. Ajoutez-les en modifiant le tableau.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[13px]" style={txt}>
              <thead>
                <tr className="border-b" style={{ borderColor: theme.bordure }}>
                  <th className="py-1.5 pr-2">Public visé</th>
                  <th className="py-1.5 pr-2">Prévu</th>
                  <th className="py-1.5 pr-2">Touché</th>
                  <th className="py-1.5">Atteinte</th>
                </tr>
              </thead>
              <tbody>
                {a.publics.length ? (
                  a.publics.map((p, i) => (
                    <tr key={i} className="border-b" style={{ borderColor: theme.bordure }}>
                      <td className="py-1.5 pr-2">{p.categorie}</td>
                      <td className="py-1.5 pr-2 tabular-nums">{p.prevu ?? ''}</td>
                      <td className="py-1.5 pr-2 tabular-nums">{p.realise ?? ''}</td>
                      <td className="py-1.5">
                        <Taux taux={p.taux} encre={theme.encre} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-2 opacity-60">
                      Aucun public chiffré dans le dossier.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={occupe} className={theme.btnPrimaire} style={{ padding: '8px 14px', fontSize: 13 }} onClick={() => setEdition(true)}>
              Modifier et saisir le réalisé
            </button>
            <button type="button" disabled={occupe} className={theme.btnSecondaire} onClick={redeposer}>
              Déposer une nouvelle version du dossier
            </button>
          </div>
          <p className="text-[12px] opacity-70" style={txt}>
            Le compte rendu Excel de l’enveloppe contient désormais trois feuilles de plus : budget prévu et réalisé, objectifs, public. Une nouvelle version du dossier garde le réalisé déjà saisi.
          </p>
        </>
      )}
    </div>
  );
}

function Carte({ theme, titre, valeur, detail }: { theme: ThemeFactures; titre: string; valeur: string; detail: string }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: theme.bordure }}>
      <p className="text-[11px] uppercase opacity-60" style={{ color: theme.encre }}>
        {titre}
      </p>
      <p className="font-black tabular-nums" style={{ color: theme.encre }}>
        {valeur}
      </p>
      <p className="text-[12px] opacity-70" style={{ color: theme.encre }}>
        {detail}
      </p>
    </div>
  );
}

function TableBudget({ theme, titre, lignes }: { theme: ThemeFactures; titre: string; lignes: LigneComparee[] }) {
  const txt = { color: theme.encre };
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-[13px]" style={txt}>
        <thead>
          <tr className="border-b" style={{ borderColor: theme.bordure }}>
            <th className="py-1.5 pr-2">{titre}</th>
            <th className="py-1.5 pr-2 text-right">Prévu</th>
            <th className="py-1.5 pr-2 text-right">Réalisé</th>
            <th className="py-1.5 pr-2 text-right">Écart</th>
            <th className="py-1.5 pr-2 text-right">%</th>
            <th className="py-1.5">Explication</th>
          </tr>
        </thead>
        <tbody>
          {lignes.length ? (
            lignes.map((l) => (
              <tr key={l.code} className="border-b align-top" style={{ borderColor: theme.bordure, background: l.aExpliquer ? '#FFF8E6' : undefined }}>
                <td className="py-1.5 pr-2">
                  <strong>{l.code}</strong> {l.libelle}
                  {l.nonPrevue ? <span className="ml-1 text-[11px] font-bold text-[#7A4B00]">non prévu</span> : null}
                  {l.realiseManuel ? <span className="block text-[11px] opacity-60">dont {euros(l.realiseManuel, 2)} saisis à la main</span> : null}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{euros(l.prevu, 2)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{euros(l.realise, 2)}</td>
                <td className="py-1.5 pr-2 text-right tabular-nums" style={{ color: l.ecart > 0 ? '#B91C1C' : undefined }}>
                  {l.ecart > 0 ? '+' : ''}
                  {euros(l.ecart, 2)}
                </td>
                <td className="py-1.5 pr-2 text-right tabular-nums">{l.ecartPct === null ? '' : `${l.ecartPct > 0 ? '+' : ''}${l.ecartPct} %`}</td>
                <td className="py-1.5 text-[12px]">{l.commentaire ?? (l.aExpliquer ? <span className="font-bold text-[#7A4B00]">à expliquer</span> : '')}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="py-2 opacity-60">
                Aucune ligne.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────── Édition ─────────────── */

type LigneForm = { code: string; libelle: string; prevu: string; realiseManuel: string; commentaire: string };
type ObjectifForm = { intitule: string; indicateur: string; cible: string; unite: string; realise: string; commentaire: string };
type PublicForm = { categorie: string; prevu: string; realise: string; commentaire: string };

const versLigne = (l: LigneBudget): LigneForm => ({ code: l.code, libelle: l.libelle, prevu: texteNombre(l.prevu), realiseManuel: texteNombre(l.realiseManuel), commentaire: l.commentaire ?? '' });

function Edition({ theme, a, occupe, annuler, enregistrer }: { theme: ThemeFactures; a: Existe; occupe: boolean; annuler: () => void; enregistrer: (corps: unknown) => Promise<void> }) {
  const [charges, setCharges] = useState<LigneForm[]>(a.saisie.charges.map(versLigne));
  const [produits, setProduits] = useState<LigneForm[]>(a.saisie.produits.map(versLigne));
  const [objectifs, setObjectifs] = useState<ObjectifForm[]>(a.saisie.objectifs.map((o) => ({ intitule: o.intitule, indicateur: o.indicateur ?? '', cible: texteNombre(o.cible), unite: o.unite ?? '', realise: texteNombre(o.realise), commentaire: o.commentaire ?? '' })));
  const [publics, setPublics] = useState<PublicForm[]>(a.saisie.publics.map((p) => ({ categorie: p.categorie, prevu: texteNombre(p.prevu), realise: texteNombre(p.realise), commentaire: p.commentaire ?? '' })));
  const [seuil, setSeuil] = useState(String(a.seuilEcart));
  const champ = 'rounded-lg border px-2 py-1 text-[13px] w-full';
  const style = { borderColor: theme.bordure };
  const txt = { color: theme.encre };

  const lignesBudget = (titre: string, aide: string, lignes: LigneForm[], set: (l: LigneForm[]) => void, codeDefaut: string) => (
    <div className="grid gap-1.5">
      <p className="text-[13px] font-bold" style={txt}>
        {titre} <span className="font-normal opacity-60">{aide}</span>
      </p>
      {lignes.map((l, i) => {
        const maj = (p: Partial<LigneForm>) => set(lignes.map((x, j) => (j === i ? { ...x, ...p } : x)));
        return (
          <div key={i} className="grid gap-1.5 sm:grid-cols-12">
            <input aria-label="Compte" placeholder="Compte" className={`${champ} sm:col-span-1`} style={style} value={l.code} onChange={(e) => maj({ code: e.target.value.replace(/\D/g, '').slice(0, 6) })} />
            <input aria-label="Libellé" placeholder="Libellé" className={`${champ} sm:col-span-3`} style={style} value={l.libelle} onChange={(e) => maj({ libelle: e.target.value })} />
            <input aria-label="Prévu" inputMode="decimal" placeholder="Prévu €" className={`${champ} sm:col-span-2`} style={style} value={l.prevu} onChange={(e) => maj({ prevu: e.target.value })} />
            <input aria-label="Réalisé hors Mes factures" inputMode="decimal" placeholder="Réalisé à ajouter €" title="Ce qui a été dépensé ou encaissé sans passer par Mes factures (valorisation du bénévolat, dépense réglée par un partenaire…). Il s’ajoute au réalisé calculé." className={`${champ} sm:col-span-2`} style={style} value={l.realiseManuel} onChange={(e) => maj({ realiseManuel: e.target.value })} />
            <input aria-label="Explication de l’écart" placeholder="Explication de l’écart" className={`${champ} sm:col-span-3`} style={style} value={l.commentaire} onChange={(e) => maj({ commentaire: e.target.value })} />
            <button type="button" className="text-[12px] font-bold text-[#8A1B3D] underline sm:col-span-1" onClick={() => set(lignes.filter((_, j) => j !== i))}>
              Retirer
            </button>
          </div>
        );
      })}
      <button type="button" className="justify-self-start text-[13px] font-bold underline" style={{ color: theme.primaire }} onClick={() => set([...lignes, { code: codeDefaut, libelle: '', prevu: '', realiseManuel: '', commentaire: '' }])}>
        Ajouter une ligne
      </button>
    </div>
  );

  const soumettre = () => {
    const budget = (l: LigneForm[]) => l.filter((x) => x.code.length >= 2 && x.libelle.trim()).map((x) => ({ code: x.code, libelle: x.libelle.trim(), prevu: lireNombre(x.prevu), realiseManuel: lireNombre(x.realiseManuel), commentaire: x.commentaire.trim() || null }));
    const n = Number(seuil);
    void enregistrer({
      charges: budget(charges),
      produits: budget(produits),
      objectifs: objectifs.filter((o) => o.intitule.trim()).map((o) => ({ intitule: o.intitule.trim(), indicateur: o.indicateur.trim() || null, cible: lireNombre(o.cible), unite: o.unite.trim() || null, realise: lireNombre(o.realise), commentaire: o.commentaire.trim() || null })),
      publics: publics.filter((p) => p.categorie.trim()).map((p) => ({ categorie: p.categorie.trim(), prevu: lireNombre(p.prevu), realise: lireNombre(p.realise), commentaire: p.commentaire.trim() || null })),
      ...(Number.isInteger(n) && n >= 1 && n <= 100 ? { seuilEcart: n } : {}),
    });
  };

  return (
    <div className="grid gap-4 rounded-xl border p-3" style={style}>
      {lignesBudget('Charges prévues', '(comptes 60 à 68, 86)', charges, setCharges, '60')}
      {lignesBudget('Produits prévus', '(comptes 70 à 75, 87)', produits, setProduits, '74')}

      <div className="grid gap-1.5">
        <p className="text-[13px] font-bold" style={txt}>
          Objectifs <span className="font-normal opacity-60">(la cible vient du dossier, le réalisé se saisit ici)</span>
        </p>
        {objectifs.map((o, i) => {
          const maj = (p: Partial<ObjectifForm>) => setObjectifs(objectifs.map((x, j) => (j === i ? { ...x, ...p } : x)));
          return (
            <div key={i} className="grid gap-1.5 sm:grid-cols-12">
              <input aria-label="Objectif" placeholder="Objectif" className={`${champ} sm:col-span-3`} style={style} value={o.intitule} onChange={(e) => maj({ intitule: e.target.value })} />
              <input aria-label="Indicateur" placeholder="Indicateur" className={`${champ} sm:col-span-3`} style={style} value={o.indicateur} onChange={(e) => maj({ indicateur: e.target.value })} />
              <input aria-label="Cible" inputMode="decimal" placeholder="Cible" className={`${champ} sm:col-span-1`} style={style} value={o.cible} onChange={(e) => maj({ cible: e.target.value })} />
              <input aria-label="Unité" placeholder="Unité" className={`${champ} sm:col-span-1`} style={style} value={o.unite} onChange={(e) => maj({ unite: e.target.value })} />
              <input aria-label="Réalisé" inputMode="decimal" placeholder="Réalisé" className={`${champ} sm:col-span-1`} style={style} value={o.realise} onChange={(e) => maj({ realise: e.target.value })} />
              <input aria-label="Commentaire" placeholder="Commentaire" className={`${champ} sm:col-span-2`} style={style} value={o.commentaire} onChange={(e) => maj({ commentaire: e.target.value })} />
              <button type="button" className="text-[12px] font-bold text-[#8A1B3D] underline sm:col-span-1" onClick={() => setObjectifs(objectifs.filter((_, j) => j !== i))}>
                Retirer
              </button>
            </div>
          );
        })}
        <button type="button" className="justify-self-start text-[13px] font-bold underline" style={{ color: theme.primaire }} onClick={() => setObjectifs([...objectifs, { intitule: '', indicateur: '', cible: '', unite: '', realise: '', commentaire: '' }])}>
          Ajouter un objectif
        </button>
      </div>

      <div className="grid gap-1.5">
        <p className="text-[13px] font-bold" style={txt}>
          Public visé <span className="font-normal opacity-60">(nombre prévu et nombre de personnes réellement touchées)</span>
        </p>
        {publics.map((p, i) => {
          const maj = (x: Partial<PublicForm>) => setPublics(publics.map((y, j) => (j === i ? { ...y, ...x } : y)));
          return (
            <div key={i} className="grid gap-1.5 sm:grid-cols-12">
              <input aria-label="Public" placeholder="Public (ex. enfants 6-11 ans)" className={`${champ} sm:col-span-4`} style={style} value={p.categorie} onChange={(e) => maj({ categorie: e.target.value })} />
              <input aria-label="Prévu" inputMode="numeric" placeholder="Prévu" className={`${champ} sm:col-span-2`} style={style} value={p.prevu} onChange={(e) => maj({ prevu: e.target.value })} />
              <input aria-label="Touché" inputMode="numeric" placeholder="Touché" className={`${champ} sm:col-span-2`} style={style} value={p.realise} onChange={(e) => maj({ realise: e.target.value })} />
              <input aria-label="Commentaire" placeholder="Commentaire" className={`${champ} sm:col-span-3`} style={style} value={p.commentaire} onChange={(e) => maj({ commentaire: e.target.value })} />
              <button type="button" className="text-[12px] font-bold text-[#8A1B3D] underline sm:col-span-1" onClick={() => setPublics(publics.filter((_, j) => j !== i))}>
                Retirer
              </button>
            </div>
          );
        })}
        <button type="button" className="justify-self-start text-[13px] font-bold underline" style={{ color: theme.primaire }} onClick={() => setPublics([...publics, { categorie: '', prevu: '', realise: '', commentaire: '' }])}>
          Ajouter un public
        </button>
      </div>

      <label className="flex flex-wrap items-center gap-2 text-[13px]" style={txt}>
        Signaler un écart au-delà de
        <input inputMode="numeric" className="w-16 rounded-lg border px-2 py-1 text-[13px]" style={style} value={seuil} onChange={(e) => setSeuil(e.target.value.replace(/\D/g, '').slice(0, 3))} />
        % du prévu (reprenez la tolérance fixée par votre convention)
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={occupe} className={theme.btnPrimaire} style={{ padding: '8px 14px', fontSize: 13 }} onClick={soumettre}>
          Enregistrer
        </button>
        <button type="button" disabled={occupe} className={theme.btnSecondaire} onClick={annuler}>
          Annuler
        </button>
      </div>
    </div>
  );
}
