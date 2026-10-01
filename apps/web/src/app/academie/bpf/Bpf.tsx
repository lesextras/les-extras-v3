'use client';
/* Textes allégés le 01/10/2026 (demande : le moins de texte possible) */

import { useCallback, useEffect, useState } from 'react';
import { appel } from '../_client';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, SousTitre } from '../_ui';
import { euros, telecharger } from '../_gestion/outils';

interface LigneC {
  cle: string;
  ligne: string;
  libelle: string;
  deduit: number;
  montant: number;
  saisi: boolean;
}
interface Calcul {
  annee: number;
  organisme: { nom: string; nda: string | null; siret: string | null; adresse: string };
  cadreC: { lignes: LigneC[]; total: number; partChiffreAffaires: number | null };
  cadreD: { totalCharges: number | null; salairesFormateurs: number | null; achatsPrestations: number | null };
  cadreE: { internes: { personnes: number; heures: number }; externes: { personnes: number; heures: number } };
  cadreF1: { ligne: string; libelle: string; cle: string; stagiaires: number; heures: number }[];
  cadreF1Distance: number;
  cadreF2: { stagiaires: number; heures: number };
  cadreF3: { cle: string; libelle: string; stagiaires: number; heures: number }[];
  cadreF4: { code: string; stagiaires: number; heures: number }[];
  cadreG: { stagiaires: number; heures: number };
  deposeLe: string | null;
  alertes: string[];
}

const h = (n: number) => `${String(n).replace('.', ',')} h`;

export function Bpf({ anneeInitiale }: { anneeInitiale: number }) {
  const [annee, setAnnee] = useState(anneeInitiale);
  const [b, setB] = useState<Calcul | null>(null);
  const [saisies, setSaisies] = useState<Record<string, string>>({});
  const [erreur, setErreur] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const appliquer = (c: Calcul) => {
    setB(c);
    const s: Record<string, string> = {};
    for (const l of c.cadreC.lignes) if (l.saisi) s[`C:${l.cle}`] = String(l.montant);
    if (c.cadreC.partChiffreAffaires !== null) s['C:part'] = String(c.cadreC.partChiffreAffaires);
    if (c.cadreD.totalCharges !== null) s['D:total'] = String(c.cadreD.totalCharges);
    if (c.cadreD.salairesFormateurs !== null) s['D:salaires'] = String(c.cadreD.salairesFormateurs);
    if (c.cadreD.achatsPrestations !== null) s['D:achats'] = String(c.cadreD.achatsPrestations);
    setSaisies(s);
  };
  const lire = useCallback(async () => {
    setErreur(null);
    appliquer(await appel<Calcul>(`/academie/gestion/bpf?annee=${annee}`));
  }, [annee]);
  useEffect(() => {
    lire().catch((e: Error) => setErreur(e.message));
  }, [lire]);

  const enregistrer = async () => {
    setOccupe(true);
    setErreur(null);
    setInfo(null);
    try {
      const corps: Record<string, number | null> = {};
      const cles = ['C:part', 'D:total', 'D:salaires', 'D:achats', ...(b?.cadreC.lignes.map((l) => `C:${l.cle}`) ?? [])];
      for (const k of cles) {
        const t = (saisies[k] ?? '').trim();
        corps[k] = t === '' ? null : Number(t.replace(',', '.'));
      }
      appliquer(await appel<Calcul>(`/academie/gestion/bpf?annee=${annee}`, { method: 'PATCH', body: { saisies: corps } }));
      setInfo('Saisies enregistrées.');
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'enregistrement a échoué.");
    } finally {
      setOccupe(false);
    }
  };

  const champ = (k: string, placeholder?: string) => (
    <input className={`${CHAMP} max-w-[180px] text-right`} inputMode="decimal" value={saisies[k] ?? ''} placeholder={placeholder} onChange={(e) => setSaisies((x) => ({ ...x, [k]: e.target.value }))} aria-label={k} />
  );

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {[anneeInitiale - 1, anneeInitiale, new Date().getFullYear()].filter((x, i, t) => t.indexOf(x) === i).map((a) => (
          <button key={a} type="button" onClick={() => setAnnee(a)} className={`rounded-full px-4 py-2 text-sm font-bold ${a === annee ? 'bg-[#0F5F3E] text-white' : 'bg-[#E3F5EC] text-[#0F5F3E]'}`}>
            Exercice {a}
          </button>
        ))}
        <span className="ml-auto flex flex-wrap gap-2">
          <button type="button" className={BTN_SECONDAIRE} onClick={() => void telecharger(`/academie/gestion/bpf.xlsx?annee=${annee}`, `bpf-${annee}.xlsx`).catch((e: Error) => setErreur(e.message))}>
            Télécharger (Excel)
          </button>
          <a className={BTN_SECONDAIRE} href="https://www.monactiviteformation.emploi.gouv.fr/" target="_blank" rel="noopener noreferrer">
            Mon Activité Formation ↗
          </a>
        </span>
      </div>

      {erreur ? (
        <div className="mb-4">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}
      {info ? (
        <div className="mb-4">
          <Encart ton="ok">{info}</Encart>
        </div>
      ) : null}
      {!b ? (
        <p className="text-[15px] text-[#5E7A6E]">Calcul en cours…</p>
      ) : (
        <>
          {b.alertes.length ? (
            <div className="mb-5">
              <Encart ton="attention">
                <p className="font-extrabold">À vérifier avant le dépôt</p>
                <ul className="mt-1 list-disc pl-5">
                  {b.alertes.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </Encart>
            </div>
          ) : null}
          <div className="mb-5">
            <Encart ton="info">Aide au remplissage : le formulaire officiel fait foi.</Encart>
          </div>

          <section className={`${CARTE} mb-6 p-5 sm:p-6`}>
            <SousTitre>Cadre C : l&apos;origine des produits (HT)</SousTitre>
            <table className="w-full text-[15px]">
              <tbody>
                {b.cadreC.lignes.map((l) => (
                  <tr key={l.cle} className="border-b border-[#EDF3F0]">
                    <td className="py-2 pr-3 text-[#5E7A6E]">{l.ligne}</td>
                    <td className="py-2 pr-3 text-[#12312A]">{l.libelle}</td>
                    <td className="py-2 text-right tabular-nums text-[#5E7A6E]">{l.deduit ? euros(l.deduit) : ''}</td>
                    <td className="py-2 pl-3 text-right">{champ(`C:${l.cle}`, l.deduit ? String(l.deduit) : '0')}</td>
                  </tr>
                ))}
                <tr>
                  <td />
                  <td className="py-3 font-extrabold text-[#12312A]">Total des produits</td>
                  <td />
                  <td className="py-3 text-right text-[17px] font-extrabold tabular-nums text-[#12312A]">{euros(b.cadreC.total)}</td>
                </tr>
              </tbody>
            </table>
            <label className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[15px]">
              <span>Part de la formation dans le chiffre d&apos;affaires global (%)</span>
              {champ('C:part', '100')}
            </label>
          </section>

          <section className={`${CARTE} mb-6 p-5 sm:p-6`}>
            <SousTitre>Cadre D : les charges de l&apos;organisme</SousTitre>
            <p className="mb-3 text-sm text-[#5E7A6E]">Elles viennent de ta comptabilité : Pilote ne les devine pas.</p>
            {[
              ['D:total', 'Total des charges de l’organisme liées à la formation'],
              ['D:salaires', 'dont salaires des formateurs'],
              ['D:achats', 'dont achats de prestations de formation et honoraires'],
            ].map(([k, l]) => (
              <label key={k} className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDF3F0] py-2 text-[15px]">
                <span>{l}</span>
                {champ(k)}
              </label>
            ))}
          </section>

          <button type="button" className={`${BTN_PRIMAIRE} mb-6`} disabled={occupe} onClick={() => void enregistrer()}>
            Enregistrer les saisies
          </button>

          <section className={`${CARTE} mb-6 p-5 sm:p-6`}>
            <SousTitre>Cadre E : qui a dispensé la formation</SousTitre>
            <dl className="grid gap-2 text-[15px]">
              <div className="flex justify-between border-b border-[#EDF3F0] py-2">
                <dt>Personnes de l&apos;organisme</dt>
                <dd className="font-bold">
                  {b.cadreE.internes.personnes} · {h(b.cadreE.internes.heures)}
                </dd>
              </div>
              <div className="flex justify-between border-b border-[#EDF3F0] py-2">
                <dt>Personnes extérieures (contrat de prestation)</dt>
                <dd className="font-bold">
                  {b.cadreE.externes.personnes} · {h(b.cadreE.externes.heures)}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-sm text-[#5E7A6E]">Calculé sur les créneaux du planning et le statut de chaque formateur de l&apos;annuaire.</p>
          </section>

          <section className={`${CARTE} mb-6 p-5 sm:p-6`}>
            <SousTitre>Cadre F : les stagiaires et les heures</SousTitre>
            <table className="w-full text-[15px]">
              <thead>
                <tr className="text-left text-sm text-[#5E7A6E]">
                  <th className="py-1 font-bold">F-1 : type de stagiaires</th>
                  <th className="py-1 text-right font-bold">Stagiaires</th>
                  <th className="py-1 text-right font-bold">Heures</th>
                </tr>
              </thead>
              <tbody>
                {b.cadreF1.map((l) => (
                  <tr key={l.cle} className="border-b border-[#EDF3F0]">
                    <td className="py-2">
                      {l.ligne} {l.libelle}
                    </td>
                    <td className="py-2 text-right tabular-nums">{l.stagiaires}</td>
                    <td className="py-2 text-right tabular-nums">{h(l.heures)}</td>
                  </tr>
                ))}
                <tr className="border-b border-[#EDF3F0]">
                  <td className="py-2 text-[#5E7A6E]">dont formation à distance ou mixte</td>
                  <td className="py-2 text-right tabular-nums">{b.cadreF1Distance}</td>
                  <td />
                </tr>
                <tr className="border-b border-[#EDF3F0]">
                  <td className="py-2">F-2 : activité confiée à un autre organisme</td>
                  <td className="py-2 text-right tabular-nums">{b.cadreF2.stagiaires}</td>
                  <td className="py-2 text-right tabular-nums">{h(b.cadreF2.heures)}</td>
                </tr>
              </tbody>
            </table>
            <p className="mb-1 mt-5 text-sm font-bold text-[#5E7A6E]">F-3 : objectif général des prestations</p>
            <ul className="grid gap-1 text-[15px]">
              {b.cadreF3.filter((l) => l.stagiaires).map((l) => (
                <li key={l.cle} className="flex justify-between border-b border-[#EDF3F0] py-1.5">
                  <span>{l.libelle}</span>
                  <span className="tabular-nums">
                    {l.stagiaires} · {h(l.heures)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mb-1 mt-5 text-sm font-bold text-[#5E7A6E]">F-4 : les cinq spécialités principales (NSF)</p>
            {b.cadreF4.length ? (
              <ul className="grid gap-1 text-[15px]">
                {b.cadreF4.map((l) => (
                  <li key={l.code} className="flex justify-between border-b border-[#EDF3F0] py-1.5">
                    <span>{l.code}</span>
                    <span className="tabular-nums">
                      {l.stagiaires} · {h(l.heures)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[15px] text-[#5E7A6E]">Aucun code NSF : renseigne-le dans le classement de chaque programme (fiche session, onglet Aperçu).</p>
            )}
          </section>

          <section className={`${CARTE} mb-6 p-5 sm:p-6`}>
            <SousTitre>Cadre G : formations réalisées pour un autre organisme</SousTitre>
            <p className="text-[15px]">
              {b.cadreG.stagiaires} stagiaires · {h(b.cadreG.heures)}
            </p>
          </section>

          <section className={`${CARTE} p-5 sm:p-6`}>
            <SousTitre>Le dépôt</SousTitre>
            {b.deposeLe ? (
              <p className="text-[15px] text-[#0F5F3E]">Déposé le {new Date(b.deposeLe).toLocaleDateString('fr-FR')}.</p>
            ) : (
              <p className="text-[15px] text-[#334A42]">Quand tu as déposé le bilan sur Mon Activité Formation, note-le ici : le chemin et la certification le retiendront.</p>
            )}
            <button
              type="button"
              className={`${BTN_SECONDAIRE} mt-3`}
              disabled={occupe}
              onClick={() =>
                void appel<Calcul>(`/academie/gestion/bpf/depose?annee=${annee}`, { method: 'POST', body: { depose: !b.deposeLe } })
                  .then(appliquer)
                  .catch((e: Error) => setErreur(e.message))
              }
            >
              {b.deposeLe ? 'Annuler : pas encore déposé' : "C'est déposé"}
            </button>
          </section>
        </>
      )}
    </>
  );
}
