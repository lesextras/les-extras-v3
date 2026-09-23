'use client';

import Link from 'next/link';
import { useState } from 'react';
import { appel, messageDe } from '../../_ecole/api';
import { BTN_DISCRET, BTN_PRIMAIRE, CARTE, CHAMP, Encart } from '../../_ui';
import type { ReglagesSuite } from '../../_ecole/suite-types';

export function Legal({ initial, slug }: { initial: ReglagesSuite; slug: string | null }) {
  const [cgu, setCgu] = useState(initial.cgu ?? '');
  const [conf, setConf] = useState(initial.confidentialite ?? '');
  const [message, setMessage] = useState<{ ton: 'ok' | 'alerte'; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  async function enregistrer() {
    setOccupe(true);
    setMessage(null);
    try {
      await appel('/ecole/reglages-suite', { methode: 'PATCH', corps: { cgu: cgu.trim(), confidentialite: conf.trim() } });
      setMessage({ ton: 'ok', texte: 'Enregistré.' });
    } catch (e) {
      setMessage({ ton: 'alerte', texte: messageDe(e) });
    } finally {
      setOccupe(false);
    }
  }

  const bloc = (titre: string, valeur: string, fixer: (v: string) => void, defaut: string) => (
    <section className={`${CARTE} p-5`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex-1 text-[17px] font-extrabold text-[#12312A]">{titre}</h2>
        {!valeur.trim() ? <span className="text-sm text-[#5E7A6E]">Texte par défaut affiché</span> : null}
        <button type="button" onClick={() => fixer(defaut)} className={BTN_DISCRET}>
          Partir du texte par défaut
        </button>
      </div>
      <textarea value={valeur} onChange={(e) => fixer(e.target.value)} className={`${CHAMP} mt-3 min-h-[240px] text-[15px] leading-relaxed`} placeholder={defaut.slice(0, 300)} maxLength={60000} />
      <p className="mt-1 text-sm text-[#5E7A6E]">« {'{organisme}'} » est remplacé par le nom de ton organisme. Laisse vide pour afficher le texte par défaut.</p>
    </section>
  );

  return (
    <div className="grid gap-5">
      <Encart ton="info">
        Tes apprenants trouvent ces textes en pied de chaque page de ton école
        {slug ? (
          <>
            {' '}(
            <Link href={`/ecole/${slug}/legal`} className="font-bold underline underline-offset-4" target="_blank">
              voir la page
            </Link>
            )
          </>
        ) : null}
        . Pour les données de tes apprenants, tu es responsable du traitement et ADéPA, qui édite Piloter, est ton sous-traitant :{' '}
        <a href="/legal/dpa" target="_blank" rel="noreferrer" className="font-bold underline underline-offset-4">
          lire l&apos;accord de traitement (DPA)
        </a>
        .
      </Encart>
      {bloc("Conditions générales d'utilisation", cgu, setCgu, initial.parDefaut.cgu)}
      {bloc('Politique de confidentialité', conf, setConf, initial.parDefaut.confidentialite)}
      {message ? <Encart ton={message.ton}>{message.texte}</Encart> : null}
      <div>
        <button type="button" disabled={occupe} onClick={enregistrer} className={BTN_PRIMAIRE}>
          Enregistrer les deux textes
        </button>
      </div>
    </div>
  );
}
