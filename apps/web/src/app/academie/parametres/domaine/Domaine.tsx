'use client';

import { useState } from 'react';
import { appel, messageDe } from '../../_ecole/api';
import { BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, Pastille } from '../../_ui';
import type { ReglagesSuite } from '../../_ecole/suite-types';

export function Domaine({ initial }: { initial: ReglagesSuite }) {
  const [domaine, setDomaine] = useState(initial.domaine ?? '');
  const [enregistre, setEnregistre] = useState(initial.domaine);
  const [verifie, setVerifie] = useState(Boolean(initial.domaineVerifieLe));
  const [message, setMessage] = useState<{ ton: 'ok' | 'alerte' | 'attention'; texte: string } | null>(null);
  const [occupe, setOccupe] = useState(false);

  async function enregistrer() {
    setOccupe(true);
    setMessage(null);
    try {
      const r = await appel<{ domaine: string | null }>('/ecole/reglages-suite', { methode: 'PATCH', corps: { domaine: domaine.trim() || null } });
      setEnregistre(r.domaine ?? (domaine.trim() || null));
      setVerifie(false);
      setMessage({ ton: 'ok', texte: domaine.trim() ? 'Domaine enregistré. Pose maintenant l’enregistrement DNS, puis vérifie.' : 'Domaine retiré.' });
    } catch (e) {
      setMessage({ ton: 'alerte', texte: messageDe(e) });
    } finally {
      setOccupe(false);
    }
  }

  async function verifier() {
    setOccupe(true);
    setMessage(null);
    try {
      const r = await appel<{ verifie: boolean; message: string }>('/ecole/reglages-suite/domaine/verifier', { methode: 'POST' });
      setVerifie(r.verifie);
      setMessage({ ton: r.verifie ? 'ok' : 'attention', texte: r.message });
    } catch (e) {
      setMessage({ ton: 'alerte', texte: messageDe(e) });
    } finally {
      setOccupe(false);
    }
  }

  const sous = (enregistre ?? '').split('.').length > 2;

  return (
    <div className="grid gap-5">
      <section className={`${CARTE} p-5`}>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Ton domaine</span>
          <input value={domaine} onChange={(e) => setDomaine(e.target.value)} placeholder="formations.monsite.fr" className={CHAMP} maxLength={200} />
        </label>
        <p className="mt-2 text-sm text-[#5E7A6E]">Un sous-domaine (formations.monsite.fr) est le plus simple : ton site principal reste où il est.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={occupe} onClick={enregistrer} className={BTN_PRIMAIRE}>
            Enregistrer
          </button>
          {enregistre ? (
            <button type="button" disabled={occupe} onClick={verifier} className={BTN_SECONDAIRE}>
              Vérifier la configuration
            </button>
          ) : null}
          {enregistre ? <Pastille ton={verifie ? 'ok' : 'attention'}>{verifie ? 'Vérifié' : 'En attente de DNS'}</Pastille> : null}
        </div>
      </section>

      {message ? <Encart ton={message.ton}>{message.texte}</Encart> : null}

      {enregistre ? (
        <section className={`${CARTE} p-5`}>
          <h2 className="text-[17px] font-extrabold text-[#12312A]">L&apos;enregistrement à poser chez ton hébergeur de domaine</h2>
          <p className="mt-1 text-[15px] text-[#5E7A6E]">Dans la zone DNS de ton domaine (OVH, Hostinger, Gandi, IONOS…), ajoute une seule de ces lignes :</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[15px]">
              <thead>
                <tr className="text-[13px] uppercase tracking-wide text-[#5E7A6E]">
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Nom</th>
                  <th className="py-2">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {sous ? (
                  <tr className="border-t border-[#EDF4F1]">
                    <td className="py-2 pr-4 font-bold">CNAME</td>
                    <td className="py-2 pr-4 font-mono">{enregistre.split('.')[0]}</td>
                    <td className="py-2 font-mono">{initial.hotePilote}</td>
                  </tr>
                ) : null}
                <tr className="border-t border-[#EDF4F1]">
                  <td className="py-2 pr-4 font-bold">A</td>
                  <td className="py-2 pr-4 font-mono">{sous ? enregistre.split('.')[0] : '@'}</td>
                  <td className="py-2 font-mono">{initial.ipServeur}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed">
            Une fois vérifié, Piloter active le domaine et pose son certificat de sécurité (https) : compte quelques heures, parfois jusqu&apos;à 24 h.
            Ton adresse pilote.toulali.fr/ecole/… continue de marcher.
          </p>
        </section>
      ) : null}
    </div>
  );
}
