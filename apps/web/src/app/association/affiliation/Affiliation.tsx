'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { appel, messageDe } from '../../academie/_ecole/api';
import { BTN_DISCRET, BTN_PRIMAIRE, CARTE, CHAMP, Encart, Pastille } from '../_ui';
import { euros, type Affilie, type Vente } from '../../academie/_ecole/types';

/**
 * LE PROGRAMME D'AFFILIATION DE L'ASSOCIATION.
 *
 * Trois chiffres en haut — ce que l'affiliation a rapporté, ce qu'elle a
 * coûté en commissions, combien de ventes — puis la liste des affiliés avec
 * leur lien à copier. Rien n'est versé automatiquement : le montant dû est
 * affiché, le virement reste une décision humaine.
 */

const ORIGINE = 'https://pilote.toulali.fr';

export function Affiliation({ initiaux, ventes }: { initiaux: Affilie[]; ventes: Vente[] }) {
  const [affilies, setAffilies] = useState(initiaux);
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [copie, setCopie] = useState<string | null>(null);

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [commission, setCommission] = useState('20');

  /** Ce que chaque code a réellement rapporté, calculé sur les ventes payées. */
  const parCode = useMemo(() => {
    const m = new Map<string, { ventes: number; caCents: number }>();
    for (const v of ventes) {
      if (v.statut !== 'PAYEE' || !v.affiliation) continue;
      const cle = v.affiliation.toUpperCase();
      const a = m.get(cle) ?? { ventes: 0, caCents: 0 };
      a.ventes += 1;
      a.caCents += v.montantCents ?? 0;
      m.set(cle, a);
    }
    return m;
  }, [ventes]);

  const totalVentes = [...parCode.values()].reduce((t, x) => t + x.ventes, 0);
  const totalCa = [...parCode.values()].reduce((t, x) => t + x.caCents, 0);
  const totalCommissions = affilies.reduce((t, a) => {
    const x = parCode.get(a.code.toUpperCase());
    return t + Math.round(((x?.caCents ?? 0) * a.commissionPourcent) / 100);
  }, 0);

  async function ajouter(e: FormEvent) {
    e.preventDefault();
    if (nom.trim().length < 2) {
      setErreur("Indique le nom de la personne qui va te recommander.");
      return;
    }
    if (!email.includes('@')) {
      setErreur('Indique son adresse e-mail.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const cree = await appel<Affilie>('/ecole/affilies', {
        methode: 'POST',
        corps: {
          nom: nom.trim(),
          email: email.trim().toLowerCase(),
          ...(code.trim() ? { code: code.trim().toUpperCase() } : {}),
          commissionPourcent: Math.min(90, Math.max(0, Number(commission) || 0)),
        },
      });
      setAffilies((l) => [cree, ...l]);
      setNom('');
      setEmail('');
      setCode('');
      setOuvert(false);
    } catch (err) {
      setErreur(messageDe(err));
    } finally {
      setEnCours(false);
    }
  }

  async function basculerActif(a: Affilie) {
    setErreur(null);
    try {
      const maj = await appel<Affilie>(`/ecole/affilies/${a.id}`, { methode: 'PATCH', corps: { actif: !a.actif } });
      setAffilies((l) => l.map((x) => (x.id === a.id ? maj : x)));
    } catch (err) {
      setErreur(messageDe(err));
    }
  }

  async function copier(a: Affilie) {
    const lien = `${ORIGINE}/?aff=${encodeURIComponent(a.code)}`;
    try {
      await navigator.clipboard.writeText(lien);
      setCopie(a.id);
      window.setTimeout(() => setCopie(null), 2500);
    } catch {
      setErreur("Le lien n'a pas pu être copié. Sélectionne-le à la main : " + lien);
    }
  }

  return (
    <>
      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {/* ------------------------------------------------------ les chiffres */}
      <div className="mb-7 grid gap-3 sm:grid-cols-3">
        <div className={`${CARTE} p-5`}>
          <p className="text-[13px] font-bold uppercase tracking-wide text-[#6B6A8A]">Ventes par recommandation</p>
          <p className="mt-1 text-[30px] font-black leading-none text-[#1D1B5C]">{totalVentes}</p>
        </div>
        <div className={`${CARTE} p-5`}>
          <p className="text-[13px] font-bold uppercase tracking-wide text-[#6B6A8A]">Chiffre d&apos;affaires généré</p>
          <p className="mt-1 text-[30px] font-black leading-none text-[#4338CA]">{euros(totalCa)}</p>
        </div>
        <div className={`${CARTE} p-5`}>
          <p className="text-[13px] font-bold uppercase tracking-wide text-[#6B6A8A]">Commissions dues</p>
          <p className={`mt-1 text-[30px] font-black leading-none ${totalCommissions ? 'text-[#7C3E06]' : 'text-[#1D1B5C]'}`}>
            {euros(totalCommissions)}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------- les affiliés */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 className="text-[19px] font-extrabold text-[#1D1B5C]">
          Tes affiliés <span className="text-[#6B6A8A]">({affilies.length})</span>
        </h2>
        <button type="button" onClick={() => setOuvert((o) => !o)} className={`${BTN_PRIMAIRE} ml-auto`}>
          {ouvert ? 'Fermer' : 'Ajouter un affilié'}
        </button>
      </div>

      {ouvert ? (
        <form onSubmit={ajouter} className={`${CARTE} mb-6 p-5`}>
          <p className="mb-4 max-w-[70ch] text-[14px] leading-relaxed text-[#6B6A8A]">
            Tu crées le code, tu lui envoies son lien. Aucun compte n&apos;est ouvert à sa place : le code suffit pour
            que la vente lui soit attribuée.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#1D1B5C]">Nom</span>
              <input value={nom} onChange={(e) => setNom(e.target.value)} className={CHAMP} maxLength={120} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#1D1B5C]">Adresse e-mail</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CHAMP} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#1D1B5C]">Code</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                className={CHAMP}
                maxLength={40}
                placeholder="laissé vide, il est tiré au sort"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#1D1B5C]">Commission</span>
              <input
                value={commission}
                onChange={(e) => setCommission(e.target.value.replace(/\D/g, ''))}
                className={CHAMP}
                inputMode="numeric"
              />
              <span className="mt-1 block text-[13px] text-[#6B6A8A]">En % du montant payé. Au maximum 90 %.</span>
            </label>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
              {enCours ? 'Ajout…' : 'Ajouter'}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className={BTN_DISCRET}>
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      {affilies.length ? (
        <ul className="grid gap-3">
          {affilies.map((a) => {
            const x = parCode.get(a.code.toUpperCase());
            const du = Math.round(((x?.caCents ?? 0) * a.commissionPourcent) / 100);
            return (
              <li key={a.id} className={`${CARTE} p-4 sm:p-5`}>
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-[200px] flex-1">
                    <p className="text-[16px] font-extrabold text-[#1D1B5C]">{a.nom}</p>
                    <p className="break-all text-[13px] text-[#6B6A8A]">{a.email}</p>
                  </div>
                  <span className="rounded-lg bg-[#1D1B5C] px-3 py-1.5 font-mono text-[14px] font-bold text-white">
                    {a.code}
                  </span>
                  <span className="text-[14px] font-bold text-[#3B3A66]">{a.commissionPourcent} %</span>
                  {a.actif ? <Pastille ton="ok">Actif</Pastille> : <Pastille ton="neutre">Désactivé</Pastille>}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-[#E6E4F3] pt-3">
                  <span className="text-[15px] text-[#3B3A66]">
                    <span className="font-bold text-[#1D1B5C]">{x?.ventes ?? 0}</span> vente
                    {(x?.ventes ?? 0) > 1 ? 's' : ''} · {euros(x?.caCents ?? 0)} généré
                  </span>
                  <span className="text-[15px] font-bold text-[#4338CA]">{euros(du)} à lui verser</span>
                  <button type="button" onClick={() => copier(a)} className={`${BTN_DISCRET} ml-auto`}>
                    {copie === a.id ? 'Lien copié' : 'Copier son lien'}
                  </button>
                  <button type="button" onClick={() => basculerActif(a)} className={BTN_DISCRET}>
                    {a.actif ? 'Désactiver' : 'Réactiver'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <Encart ton="info">
          Tu n&apos;as pas encore d&apos;affilié. L&apos;affiliation marche bien avec des personnes qui ont déjà suivi
          ta formation : elles en parlent juste, et le code fait le reste.
        </Encart>
      )}
    </>
  );
}
