'use client';

import { useState } from 'react';
import { appel, messageDe } from '../../_ecole/api';
import { BTN_PRIMAIRE, CARTE, CHAMP, Encart } from '../../_ui';
import type { ReglagesSuite } from '../../_ecole/suite-types';

export function Referencement({ initial }: { initial: ReglagesSuite }) {
  const [titre, setTitre] = useState(initial.seoTitre ?? '');
  const [description, setDescription] = useState(initial.seoDescription ?? '');
  const [indexable, setIndexable] = useState(initial.indexable);
  const [message, setMessage] = useState<{ ton: 'ok' | 'alerte'; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  async function enregistrer() {
    setOccupe(true);
    setMessage(null);
    try {
      await appel('/ecole/reglages-suite', { methode: 'PATCH', corps: { seoTitre: titre.trim(), seoDescription: description.trim(), indexable } });
      setMessage({ ton: 'ok', texte: 'Enregistré. Google le prendra en compte à son prochain passage.' });
    } catch (e) {
      setMessage({ ton: 'alerte', texte: messageDe(e) });
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className="grid gap-5">
      <section className={`${CARTE} grid gap-4 p-5`}>
        <label className="block">
          <span className="mb-1.5 flex justify-between text-[13px] font-bold text-[#12312A]">
            Titre dans Google <span className={titre.length > 60 ? 'text-[#C42B57]' : 'text-[#5E7A6E]'}>{titre.length}/60</span>
          </span>
          <input value={titre} onChange={(e) => setTitre(e.target.value.slice(0, 70))} className={CHAMP} placeholder="Nom de ton école, et ce qu'on y apprend" />
        </label>
        <label className="block">
          <span className="mb-1.5 flex justify-between text-[13px] font-bold text-[#12312A]">
            Description <span className={description.length > 155 ? 'text-[#C42B57]' : 'text-[#5E7A6E]'}>{description.length}/155</span>
          </span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 170))} className={`${CHAMP} min-h-[90px]`} placeholder="Une phrase qui donne envie de cliquer : pour qui, quoi, comment." />
        </label>
        <label className="flex items-center gap-2 text-[15px]">
          <input type="checkbox" checked={indexable} onChange={(e) => setIndexable(e.target.checked)} />
          Laisser les moteurs de recherche référencer la page de mon école
        </label>
        <div>
          <button type="button" disabled={occupe} onClick={enregistrer} className={BTN_PRIMAIRE}>
            Enregistrer
          </button>
        </div>
      </section>
      {message ? <Encart ton={message.ton}>{message.texte}</Encart> : null}
      <section className={`${CARTE} p-5`}>
        <p className="text-sm font-bold uppercase tracking-wide text-[#5E7A6E]">Aperçu</p>
        <div className="mt-3 max-w-[600px]">
          <p className="truncate text-[20px] text-[#1a0dab]">{titre || 'Le nom de ton école'}</p>
          <p className="text-[14px] text-[#006621]">pilote.toulali.fr › ecole</p>
          <p className="line-clamp-2 text-[14px] text-[#545454]">{description || 'La description de ton école apparaîtra ici.'}</p>
        </div>
      </section>
    </div>
  );
}
