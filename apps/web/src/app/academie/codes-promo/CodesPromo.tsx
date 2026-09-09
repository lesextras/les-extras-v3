'use client';

import { useState, type FormEvent } from 'react';
import { appel, messageDe } from '../_ecole/api';
import { BTN_DISCRET, BTN_PRIMAIRE, CARTE, CHAMP, Encart, Pastille, formaterDate } from '../_ui';
import { euros, type CoursResume, type Promo, type TypeRemise } from '../_ecole/types';

/**
 * MES CODES PROMO.
 *
 * Un code créé sans restriction s'applique à tous les cours et à tous les
 * packs : c'est le cas courant, et c'est le défaut. Les restrictions —
 * certains cours, des dates, un nombre d'usages — sont là pour les campagnes.
 */

const aujourdhui = () => new Date().toISOString().slice(0, 10);

export function CodesPromo({ initiaux, cours }: { initiaux: Promo[]; cours: CoursResume[] }) {
  const [promos, setPromos] = useState(initiaux);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState<TypeRemise>('POURCENTAGE');
  const [valeur, setValeur] = useState('');
  const [restreindre, setRestreindre] = useState(false);
  const [choisis, setChoisis] = useState<string[]>([]);
  const [usageMax, setUsageMax] = useState('');
  const [debuteLe, setDebuteLe] = useState('');
  const [expireLe, setExpireLe] = useState('');

  function basculer(id: string) {
    setChoisis((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  }

  async function creer(e: FormEvent) {
    e.preventDefault();
    const propre = code.trim().toUpperCase();
    if (propre.length < 2) {
      setErreur('Donne un code : c’est ce que la personne saisira.');
      return;
    }
    const n = Number(valeur.replace(',', '.') || 0);
    if (!n || n <= 0) {
      setErreur('Indique le montant de la réduction.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const cree = await appel<Promo>('/ecole/codes-promo', {
        methode: 'POST',
        corps: {
          description: description.trim() || undefined,
          code: propre,
          type,
          valeur: type === 'POURCENTAGE' ? Math.round(n) : Math.round(n * 100),
          ...(restreindre && choisis.length ? { coursIds: choisis } : {}),
          ...(usageMax ? { usageMax: Number(usageMax) } : {}),
          ...(debuteLe ? { debuteLe: new Date(debuteLe).toISOString() } : {}),
          ...(expireLe ? { expireLe: new Date(expireLe).toISOString() } : {}),
        },
      });
      setPromos((l) => [cree, ...l]);
      setCode('');
      setDescription('');
      setValeur('');
      setChoisis([]);
      setRestreindre(false);
      setUsageMax('');
      setDebuteLe('');
      setExpireLe('');
    } catch (err) {
      setErreur(messageDe(err));
    } finally {
      setEnCours(false);
    }
  }

  async function basculerActif(p: Promo) {
    setErreur(null);
    try {
      const maj = await appel<Promo>(`/ecole/codes-promo/${p.id}`, { methode: 'PATCH', corps: { actif: !p.actif } });
      setPromos((l) => l.map((x) => (x.id === p.id ? maj : x)));
    } catch (err) {
      setErreur(messageDe(err));
    }
  }

  async function supprimer(id: string) {
    setErreur(null);
    try {
      await appel(`/ecole/codes-promo/${id}`, { methode: 'DELETE' });
      setPromos((l) => l.filter((x) => x.id !== id));
    } catch (err) {
      setErreur(messageDe(err));
    }
  }

  function remise(p: Promo) {
    return p.type === 'POURCENTAGE' ? `${p.valeur} %` : euros(p.valeur);
  }

  return (
    <>
      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {/* ------------------------------------------------------ le formulaire */}
      <form onSubmit={creer} className={`${CARTE} mb-8 p-5`}>
        <h2 className="mb-1 text-[18px] font-extrabold text-[#12312A]">Créer un code promo</h2>
        <p className="mb-4 max-w-[70ch] text-[14px] leading-relaxed text-[#5E7A6E]">
          Sans restriction, le code s&apos;applique à tous tes cours et à tous tes packs. Restreins-le seulement si tu
          fais une opération sur une formation précise.
        </p>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Description</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={CHAMP}
            maxLength={200}
            placeholder="Rentrée 2026 — 20 % sur le parcours complet"
          />
          <span className="mt-1 block text-[13px] text-[#5E7A6E]">
            Elle ne sort nulle part : elle te sert à retrouver ce code dans la liste.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Code</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
              className={CHAMP}
              maxLength={40}
              placeholder="RENTREE25"
              required
            />
            <span className="mt-1 block text-[13px] text-[#5E7A6E]">C&apos;est ce que la personne tape en payant.</span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Type</span>
              <select value={type} onChange={(e) => setType(e.target.value as TypeRemise)} className={CHAMP}>
                <option value="POURCENTAGE">Pourcentage</option>
                <option value="MONTANT">Montant fixe</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Réduction</span>
              <input
                value={valeur}
                onChange={(e) => setValeur(e.target.value)}
                className={CHAMP}
                inputMode="decimal"
                placeholder={type === 'POURCENTAGE' ? '25' : '50'}
                required
              />
              <span className="mt-1 block text-[13px] text-[#5E7A6E]">{type === 'POURCENTAGE' ? 'En %' : 'En euros'}</span>
            </label>
          </div>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-3 text-[15px] font-bold text-[#12312A]">
          <input
            type="checkbox"
            checked={restreindre}
            onChange={(e) => setRestreindre(e.target.checked)}
            className="h-4 w-4 accent-[#1E9E6A]"
          />
          Restreindre à certains cours
        </label>

        {restreindre ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {cours.map((c) => (
              <li key={c.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-[#DDEBE4] bg-white px-3.5 py-2.5 transition hover:border-[#1E9E6A]">
                  <input
                    type="checkbox"
                    checked={choisis.includes(c.id)}
                    onChange={() => basculer(c.id)}
                    className="h-4 w-4 accent-[#1E9E6A]"
                  />
                  <span className="truncate text-[15px] font-bold text-[#12312A]">{c.titre}</span>
                </label>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Nombre d&apos;utilisations</span>
            <input
              value={usageMax}
              onChange={(e) => setUsageMax(e.target.value.replace(/\D/g, ''))}
              className={CHAMP}
              inputMode="numeric"
              placeholder="illimité"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Début</span>
            <input type="date" value={debuteLe} onChange={(e) => setDebuteLe(e.target.value)} className={CHAMP} min={aujourdhui()} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Expiration</span>
            <input type="date" value={expireLe} onChange={(e) => setExpireLe(e.target.value)} className={CHAMP} />
          </label>
        </div>

        <div className="mt-5">
          <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
            {enCours ? 'Création…' : 'Créer'}
          </button>
        </div>
      </form>

      {/* ---------------------------------------------------------- la liste */}
      <h2 className="mb-3 text-[19px] font-extrabold text-[#12312A]">
        Tes codes promo <span className="text-[#5E7A6E]">({promos.length})</span>
      </h2>

      {promos.length ? (
        <ul className="grid gap-2">
          {promos.map((p) => {
            const expire = p.expireLe ? new Date(p.expireLe).getTime() < Date.now() : false;
            const epuise = p.usageMax !== null && p.usages >= p.usageMax;
            return (
              <li key={p.id} className={`${CARTE} flex flex-wrap items-center gap-3 p-4`}>
                <span className="rounded-lg bg-[#12312A] px-3 py-1.5 font-mono text-[15px] font-bold tracking-wide text-white">
                  {p.code}
                </span>
                <span className="min-w-[150px] flex-1">
                  <span className="block text-[16px] font-black text-[#0F5F3E]">-{remise(p)}</span>
                  {p.description ? (
                    <span className="block text-[14px] font-bold text-[#12312A]">{p.description}</span>
                  ) : null}
                  <span className="block text-[13px] text-[#5E7A6E]">
                    {p.coursIds.length ? `${p.coursIds.length} cours concernés` : 'Tous les cours et packs'}
                    {p.expireLe ? ` · jusqu'au ${formaterDate(p.expireLe)}` : ''}
                  </span>
                </span>
                <span className="text-[14px] text-[#334A42]">
                  {p.usages} utilisation{p.usages > 1 ? 's' : ''}
                  {p.usageMax ? ` / ${p.usageMax}` : ''}
                </span>
                {expire ? (
                  <Pastille ton="neutre">Expiré</Pastille>
                ) : epuise ? (
                  <Pastille ton="attention">Épuisé</Pastille>
                ) : p.actif ? (
                  <Pastille ton="ok">Actif</Pastille>
                ) : (
                  <Pastille ton="neutre">Désactivé</Pastille>
                )}
                <button type="button" onClick={() => basculerActif(p)} className={BTN_DISCRET}>
                  {p.actif ? 'Désactiver' : 'Réactiver'}
                </button>
                <button type="button" onClick={() => supprimer(p.id)} className={BTN_DISCRET}>
                  Supprimer
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-[15px] leading-relaxed text-[#5E7A6E]">
          Tu n&apos;as pas encore créé de code promo.
        </p>
      )}
    </>
  );
}
