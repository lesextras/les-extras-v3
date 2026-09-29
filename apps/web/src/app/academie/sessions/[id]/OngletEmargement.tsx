'use client';

import { useEffect, useMemo, useState } from 'react';
import { appel } from '../../_client';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CHAMP, Encart, Pastille } from '../../_ui';
import { MOMENT, jourIso, jourLong, telecharger } from '../../_gestion/outils';
import type { Seance } from '../../_gestion/types';
import { SignatureTrace } from '../../../_shared/pilote/SignatureTrace';
import { Bloc } from './OngletApercu';
import type { ContexteFiche } from './Fiche';

interface Etat {
  seances: (Seance & { signatures: number })[];
  emargements: { inscriptionId: string; slotDate: string; slot: string; present: boolean; signatureTrace: boolean }[];
}

const cle = (slotDate: string, slot: string) => `${slotDate.slice(0, 10)}:${slot}`;

/**
 * L'ÉMARGEMENT, EN SALLE.
 *
 * L'écran se projette ou se montre sur une tablette : le code est en très
 * grand, la liste de ceux qui ont signé se met à jour toute seule. Le
 * formateur signe la séance ici même, avant de la fermer.
 */
export function OngletEmargement({ ctx }: { ctx: ContexteFiche }) {
  const s = ctx.session;
  const [etat, setEtat] = useState<Etat | null>(null);
  const [formateurNom, setFormateurNom] = useState(() => {
    const f = ctx.formateurs.find((x) => x.id === s.formateurOrganismeId);
    return f ? `${f.prenom} ${f.nom}` : '';
  });
  const [trace, setTrace] = useState<string | null>(null);
  const [plein, setPlein] = useState(false);
  const [choix, setChoix] = useState<string>('');
  const [erreur, setErreur] = useState<string | null>(null);

  const ouverte = useMemo(() => {
    const limite = Date.now() - 12 * 3_600_000;
    return (etat?.seances ?? s.seances).find((x) => !x.fermeeLe && new Date(x.ouverteLe).getTime() >= limite) ?? null;
  }, [etat, s.seances]);

  useEffect(() => {
    let actif = true;
    const lire = () =>
      appel<Etat>(`/academie/gestion/sessions/${s.id}/emargement`)
        .then((e) => actif && setEtat(e))
        .catch(() => undefined);
    void lire();
    // Pendant qu'une séance est ouverte, la liste des signatures se met à jour seule.
    const t = setInterval(() => ouverte && void lire(), 5000);
    return () => {
      actif = false;
      clearInterval(t);
    };
  }, [s.id, ouverte]);

  const actifs = s.inscriptions.filter((i) => i.status !== 'CANCELLED');
  const colonnes = useMemo(() => {
    const m = new Map<string, { slotDate: string; slot: 'MORNING' | 'AFTERNOON' }>();
    for (const p of s.planning) m.set(cle(p.slotDate, p.slot), { slotDate: p.slotDate, slot: p.slot });
    for (const x of etat?.seances ?? s.seances) m.set(cle(x.slotDate, x.slot), { slotDate: x.slotDate, slot: x.slot });
    for (const e of etat?.emargements ?? []) m.set(cle(e.slotDate, e.slot), { slotDate: e.slotDate, slot: e.slot as 'MORNING' | 'AFTERNOON' });
    // ⚠ Chronologique, pas alphabétique : « AFTERNOON » passerait avant « MORNING ».
    const rang = (k: string) => k.slice(0, 10) + (k.endsWith('MORNING') ? '1' : '2');
    return [...m.entries()].sort((a, b) => (rang(a[0]) < rang(b[0]) ? -1 : rang(a[0]) > rang(b[0]) ? 1 : 0));
  }, [s.planning, s.seances, etat]);

  const emargementDe = (inscriptionId: string, k: string) => etat?.emargements.find((e) => e.inscriptionId === inscriptionId && cle(e.slotDate, e.slot) === k);

  const ouvrir = async () => {
    setErreur(null);
    const c = colonnes.find(([k]) => k === choix)?.[1];
    const ok = await ctx.agir(() => appel(`/academie/gestion/sessions/${s.id}/seances`, { method: 'POST', body: c ? { slotDate: c.slotDate, slot: c.slot } : {} }), 'Séance ouverte : montre le code aux stagiaires.');
    if (ok) setEtat(await appel<Etat>(`/academie/gestion/sessions/${s.id}/emargement`));
  };

  const signerEtFermer = async () => {
    if (!ouverte) return;
    setErreur(null);
    if (trace && formateurNom.trim().length >= 2) {
      const ok = await ctx.agir(() => appel(`/academie/gestion/sessions/${s.id}/seances/${ouverte.id}/signature`, { method: 'POST', body: { nom: formateurNom.trim(), trace } }));
      if (!ok) return;
    } else if (!ouverte.formateurSigneLe && !window.confirm('Fermer sans la signature du formateur ? La feuille la montrera vide pour cette demi-journée.')) {
      return;
    }
    await ctx.agir(() => appel(`/academie/gestion/sessions/${s.id}/seances/${ouverte.id}/fermer`, { method: 'POST' }), 'Séance fermée.');
    setEtat(await appel<Etat>(`/academie/gestion/sessions/${s.id}/emargement`));
    setTrace(null);
    setPlein(false);
  };

  const basculer = (inscriptionId: string, slotDate: string, slot: string, present: boolean) =>
    void ctx.agir(async () => {
      await appel(`/academie/gestion/stagiaires/${inscriptionId}/presence`, { method: 'PUT', body: { slotDate: slotDate.slice(0, 10), slot, present } });
      setEtat(await appel<Etat>(`/academie/gestion/sessions/${s.id}/emargement`));
    });

  const signes = ouverte ? (etat?.emargements ?? []).filter((e) => e.signatureTrace && cle(e.slotDate, e.slot) === cle(ouverte.slotDate, ouverte.slot)) : [];
  const aujourdhui = jourIso(new Date());

  return (
    <>
      {erreur ? (
        <div className="mb-4">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {ouverte ? (
        <section className={`${plein ? 'fixed inset-0 z-50 overflow-auto' : 'mb-6 rounded-3xl'} bg-[#0F5F3E] p-6 text-white sm:p-8`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#B7E4CE]">
                Émargement ouvert · <span className="first-letter:uppercase">{jourLong(ouverte.slotDate)}</span>, {MOMENT[ouverte.slot].toLowerCase()}
              </p>
              <p className="mt-3 text-lg">Ouvrez votre lien personnel, recopiez ce code, puis signez :</p>
            </div>
            <button type="button" className="rounded-xl border-2 border-white/40 px-4 py-2 font-bold" onClick={() => setPlein((p) => !p)}>
              {plein ? 'Réduire' : 'Plein écran'}
            </button>
          </div>
          <p className="my-6 text-center font-mono text-[64px] font-extrabold tracking-[0.25em] tabular-nums sm:text-[112px]" aria-live="polite">
            {ouverte.code.slice(0, 3)} {ouverte.code.slice(3)}
          </p>
          <p className="text-center text-xl font-extrabold">
            {signes.length} sur {actifs.length} ont signé
          </p>
          <ul className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
            {actifs.map((i) => {
              const fait = signes.some((e) => e.inscriptionId === i.id);
              return (
                <li key={i.id} className={`rounded-full px-3 py-1 text-sm font-bold ${fait ? 'bg-white text-[#0F5F3E]' : 'bg-white/10 text-white/80'}`}>
                  {fait ? '✓ ' : ''}
                  {i.learnerName}
                </li>
              );
            })}
          </ul>
          <div className="mx-auto mt-8 max-w-xl rounded-2xl bg-white p-5 text-[#12312A]">
            <p className="font-extrabold">Signature du formateur</p>
            {ouverte.formateurSigneLe ? (
              <p className="mt-1 text-[15px]">Signée par {ouverte.formateurNom}.</p>
            ) : (
              <>
                <input className={`${CHAMP} mt-2`} value={formateurNom} onChange={(e) => setFormateurNom(e.target.value)} placeholder="Prénom et nom du formateur" aria-label="Nom du formateur" />
                <div className="mt-3">
                  <SignatureTrace onChange={setTrace} libelle="Le formateur signe ici" />
                </div>
              </>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={BTN_PRIMAIRE} disabled={ctx.occupe} onClick={() => void signerEtFermer()}>
                {trace ? 'Signer et fermer la séance' : 'Fermer la séance'}
              </button>
              <button
                type="button"
                className={BTN_SECONDAIRE}
                disabled={ctx.occupe}
                onClick={() =>
                  void ctx.agir(async () => {
                    await appel(`/academie/gestion/sessions/${s.id}/seances/${ouverte.id}/code`, { method: 'POST' });
                    setEtat(await appel<Etat>(`/academie/gestion/sessions/${s.id}/emargement`));
                  }, 'Nouveau code affiché.')
                }
              >
                Changer le code
              </button>
            </div>
          </div>
        </section>
      ) : (
        <Bloc
          titre="Ouvrir l'émargement"
          aide="Au début de chaque demi-journée : un code à six chiffres s'affiche, les stagiaires le recopient depuis leur lien et signent du doigt. Le code prouve la présence en salle ; la séance se ferme seule après douze heures."
        >
          <div className="flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold text-[#12312A]">Demi-journée</span>
              <select className={CHAMP} value={choix} onChange={(e) => setChoix(e.target.value)}>
                <option value="">Maintenant</option>
                {colonnes.map(([k, c]) => (
                  <option key={k} value={k}>
                    {jourLong(c.slotDate)}, {MOMENT[c.slot].toLowerCase()}
                    {c.slotDate.slice(0, 10) === aujourdhui ? ' (aujourd’hui)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className={BTN_PRIMAIRE} disabled={ctx.occupe || !actifs.length} onClick={() => void ouvrir()}>
              Ouvrir la séance
            </button>
          </div>
          {!actifs.length ? <p className="mt-3 text-[15px] text-[#8A1B3D]">Inscris d&apos;abord les stagiaires.</p> : null}
        </Bloc>
      )}

      <Bloc titre="Feuille d'émargement" aide="Signé : par le stagiaire, avec le code de la séance. Déclaré : coché par l'organisme, pour une personne qui n'a pas pu signer (la feuille le distingue).">
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={BTN_SECONDAIRE}
            onClick={() => void telecharger(`/academie/gestion/sessions/${s.id}/documents/emargement/pdf`, 'emargement.pdf').catch((e: Error) => setErreur(e.message))}
          >
            Télécharger la feuille (PDF)
          </button>
        </div>
        {!colonnes.length || !actifs.length ? (
          <Encart ton="info">La feuille se remplit dès qu&apos;il y a un planning et des stagiaires.</Encart>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-[#DDEBE4]">
            <table className="min-w-full border-collapse text-[14px]">
              <thead className="bg-[#F7FBF9]">
                <tr>
                  <th scope="col" className="sticky left-0 bg-[#F7FBF9] px-3 py-2 text-left font-extrabold text-[#12312A]">
                    Stagiaire
                  </th>
                  {colonnes.map(([k, c]) => (
                    <th key={k} scope="col" className="whitespace-nowrap px-2 py-2 text-center font-bold text-[#5E7A6E]">
                      {new Date(c.slotDate).toLocaleDateString('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'short' })}
                      <br />
                      {c.slot === 'MORNING' ? 'matin' : 'après-midi'}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actifs.map((i) => (
                  <tr key={i.id} className="border-t border-[#EDF3F0]">
                    <th scope="row" className="sticky left-0 whitespace-nowrap bg-white px-3 py-2 text-left font-bold text-[#12312A]">
                      {i.learnerName}
                    </th>
                    {colonnes.map(([k, c]) => {
                      const e = emargementDe(i.id, k);
                      if (e?.signatureTrace) {
                        return (
                          <td key={k} className="px-2 py-2 text-center">
                            <Pastille ton="ok">Signé</Pastille>
                          </td>
                        );
                      }
                      return (
                        <td key={k} className="px-2 py-2 text-center">
                          <label className="inline-flex cursor-pointer items-center gap-1 text-[13px] text-[#5E7A6E]">
                            <input
                              type="checkbox"
                              className="h-4 w-4 accent-[#1E9E6A]"
                              checked={!!e?.present}
                              disabled={ctx.occupe}
                              onChange={(ev) => basculer(i.id, c.slotDate, c.slot, ev.target.checked)}
                              aria-label={`${i.learnerName}, ${k} : présence déclarée`}
                            />
                            {e?.present ? 'Déclaré' : ''}
                          </label>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {(etat?.seances ?? []).length ? (
          <ul className="mt-4 grid gap-1 text-[14px] text-[#5E7A6E]">
            {(etat?.seances ?? []).map((x) => (
              <li key={x.id}>
                <span className="inline-block first-letter:uppercase">{jourLong(x.slotDate)}</span>, {MOMENT[x.slot].toLowerCase()} : {x.signatures} signature{x.signatures > 1 ? 's' : ''}
                {x.formateurSigneLe ? `, signée par ${x.formateurNom}` : ', sans signature du formateur'}
                {x.fermeeLe ? '' : ' (ouverte)'}
              </li>
            ))}
          </ul>
        ) : null}
        <button type="button" className={`${BTN_DISCRET} mt-2`} onClick={() => void appel<Etat>(`/academie/gestion/sessions/${s.id}/emargement`).then(setEtat)}>
          Actualiser
        </button>
      </Bloc>
    </>
  );
}
