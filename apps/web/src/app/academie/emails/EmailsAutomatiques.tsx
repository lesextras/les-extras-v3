'use client';

import { useState } from 'react';
import { appel, messageDe } from '../_ecole/api';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, Pastille } from '../_ui';

export interface ModeleEmail {
  type: string;
  libelle: string;
  declencheur: string;
  delaiReglable: boolean;
  actif: boolean;
  sujet: string;
  corps: string;
  delaiMinutes: number;
  personnalise: boolean;
  parDefaut: { sujet: string; corps: string; delaiMinutes: number };
  envoyes30j: number;
}

const VARIABLES = ['{prenom}', '{formation}', '{lecon}', '{ecole}', '{lien}', '{date}', '{liste}'];

/** Un délai lisible : minutes, heures ou jours, selon ce qui tombe juste. */
function versUnite(minutes: number): { valeur: number; unite: 'minutes' | 'heures' | 'jours' } {
  if (minutes && minutes % 1440 === 0) return { valeur: minutes / 1440, unite: 'jours' };
  if (minutes && minutes % 60 === 0) return { valeur: minutes / 60, unite: 'heures' };
  return { valeur: minutes, unite: 'minutes' };
}
const FACTEUR = { minutes: 1, heures: 60, jours: 1440 } as const;

export function EmailsAutomatiques({ initiaux, courriel }: { initiaux: ModeleEmail[]; courriel: string }) {
  const [modeles, setModeles] = useState(initiaux);
  const [choisi, setChoisi] = useState(initiaux[0]?.type ?? '');
  const m = modeles.find((x) => x.type === choisi) ?? modeles[0];
  const [sujet, setSujet] = useState(m?.sujet ?? '');
  const [corps, setCorps] = useState(m?.corps ?? '');
  const [delai, setDelai] = useState(() => versUnite(m?.delaiMinutes ?? 0));
  const [test, setTest] = useState(courriel);
  const [occupe, setOccupe] = useState(false);
  const [message, setMessage] = useState<{ ton: 'ok' | 'alerte'; texte: string } | null>(null);

  function choisir(type: string) {
    const x = modeles.find((y) => y.type === type);
    if (!x) return;
    setChoisi(type);
    setSujet(x.sujet);
    setCorps(x.corps);
    setDelai(versUnite(x.delaiMinutes));
    setMessage(null);
  }

  async function recharger(type = choisi) {
    const l = await appel<ModeleEmail[]>('/ecole/emails');
    setModeles(l);
    const x = l.find((y) => y.type === type);
    if (x) {
      setSujet(x.sujet);
      setCorps(x.corps);
      setDelai(versUnite(x.delaiMinutes));
    }
  }

  async function agir(fn: () => Promise<unknown>, ok: string) {
    setOccupe(true);
    setMessage(null);
    try {
      await fn();
      setMessage({ ton: 'ok', texte: ok });
    } catch (e) {
      setMessage({ ton: 'alerte', texte: messageDe(e) });
    } finally {
      setOccupe(false);
    }
  }

  if (!m) return <Encart>Aucun courriel.</Encart>;

  const enregistrer = () =>
    agir(async () => {
      await appel(`/ecole/emails/${m.type}`, {
        methode: 'PATCH',
        corps: { sujet, corps, ...(m.delaiReglable ? { delaiMinutes: Math.max(0, Math.round(delai.valeur * FACTEUR[delai.unite])) } : {}) },
      });
      await recharger();
    }, 'Enregistré.');

  const basculer = (x: ModeleEmail) =>
    agir(async () => {
      await appel(`/ecole/emails/${x.type}`, { methode: 'PATCH', corps: { actif: !x.actif } });
      await recharger();
    }, x.actif ? 'Courriel coupé.' : 'Courriel activé.');

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <ul className={`${CARTE} self-start p-2`}>
        {modeles.map((x) => (
          <li key={x.type}>
            <button
              type="button"
              onClick={() => choisir(x.type)}
              className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[15px] ${x.type === m.type ? 'bg-[#E3F5EC] font-extrabold text-[#0F5F3E]' : 'text-[#12312A] hover:bg-[#F3F8F5]'}`}
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${x.actif ? 'bg-[#1E9E6A]' : 'bg-[#C9D6CF]'}`} aria-hidden="true" />
              <span className="flex-1">{x.libelle}</span>
              {x.envoyes30j ? <span className="text-xs text-[#5E7A6E]">{x.envoyes30j}</span> : null}
            </button>
          </li>
        ))}
      </ul>

      <section className={`${CARTE} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-[220px] flex-1">
            <h2 className="text-xl font-extrabold text-[#12312A]">{m.libelle}</h2>
            <p className="mt-1 text-[15px] text-[#5E7A6E]">{m.declencheur}</p>
          </div>
          <Pastille ton={m.actif ? 'ok' : 'neutre'}>{m.actif ? 'Actif' : 'Coupé'}</Pastille>
          {m.personnalise ? <Pastille ton="accent">Personnalisé</Pastille> : null}
          <button type="button" disabled={occupe} onClick={() => basculer(m)} className={BTN_SECONDAIRE}>
            {m.actif ? 'Couper' : 'Activer'}
          </button>
        </div>

        {message ? (
          <div className="mt-4">
            <Encart ton={message.ton}>{message.texte}</Encart>
          </div>
        ) : null}

        <div className="mt-5 grid gap-4">
          {m.delaiReglable ? (
            <div>
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Envoyé après</span>
              <div className="flex gap-2">
                <input
                  value={String(delai.valeur)}
                  onChange={(e) => setDelai((d) => ({ ...d, valeur: Number(e.target.value.replace(/\D/g, '') || 0) }))}
                  inputMode="numeric"
                  className={`${CHAMP} w-28`}
                  aria-label="Délai"
                />
                <select value={delai.unite} onChange={(e) => setDelai((d) => ({ ...d, unite: e.target.value as 'minutes' | 'heures' | 'jours' }))} className={`${CHAMP} w-auto`} aria-label="Unité">
                  <option value="minutes">minutes</option>
                  <option value="heures">heures</option>
                  <option value="jours">jours</option>
                </select>
              </div>
            </div>
          ) : null}
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Objet</span>
            <input value={sujet} onChange={(e) => setSujet(e.target.value)} maxLength={200} className={CHAMP} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Message</span>
            <textarea value={corps} onChange={(e) => setCorps(e.target.value)} maxLength={8000} className={`${CHAMP} min-h-[260px] leading-relaxed`} />
          </label>
          <p className="text-sm text-[#5E7A6E]">
            Variables remplacées à l&apos;envoi :{' '}
            {VARIABLES.map((v) => (
              <button key={v} type="button" onClick={() => setCorps((c) => `${c}${v}`)} className="mr-1.5 rounded-md bg-[#EDF3F0] px-1.5 py-0.5 font-mono text-[13px] text-[#0F5F3E]">
                {v}
              </button>
            ))}
            . Un paragraphe se sépare par une ligne vide.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={occupe} onClick={enregistrer} className={BTN_PRIMAIRE}>
              Enregistrer
            </button>
            {m.personnalise ? (
              <button
                type="button"
                disabled={occupe}
                onClick={() =>
                  agir(async () => {
                    await appel(`/ecole/emails/${m.type}/reinitialiser`, { methode: 'POST' });
                    await recharger();
                  }, 'Texte d’origine rétabli.')
                }
                className={BTN_DISCRET}
              >
                Revenir au texte d&apos;origine
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-2 border-t border-[#EDF4F1] pt-5">
          <label className="block min-w-[240px] flex-1">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">S&apos;envoyer un essai</span>
            <input value={test} onChange={(e) => setTest(e.target.value)} type="email" className={CHAMP} />
          </label>
          <button
            type="button"
            disabled={occupe || !test}
            onClick={() => agir(() => appel(`/ecole/emails/${m.type}/tester`, { methode: 'POST', corps: { email: test } }), `Essai envoyé à ${test}.`)}
            className={BTN_SECONDAIRE}
          >
            Envoyer l&apos;essai
          </button>
        </div>
        <p className="mt-2 text-sm text-[#5E7A6E]">L&apos;essai part avec des exemples à la place des variables. Enregistre d&apos;abord pour tester ta dernière version.</p>
      </section>
    </div>
  );
}
