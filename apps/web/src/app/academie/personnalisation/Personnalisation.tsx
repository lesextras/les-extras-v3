'use client';

import { useState, type FormEvent } from 'react';
import { appel, messageDe } from '../_ecole/api';
import { BTN_PRIMAIRE, CARTE, CHAMP, Encart } from '../_ui';
import type { Vitrine } from '../_ecole/types';

/**
 * L'IMAGE DE MARQUE, EN TROIS RÉGLAGES.
 *
 * Logo, bannière, couleur. Les images se donnent par leur adresse : on ne
 * stocke pas de fichier ici, on pointe vers celui qui existe déjà — souvent
 * celui du site. L'aperçu se met à jour pendant la saisie, pour qu'on voie
 * avant d'enregistrer.
 */

/** Quelques couleurs qui fonctionnent, pour ne pas partir de rien. */
const PALETTE = ['#1E9E6A', '#0F5F3E', '#4F46E5', '#C42B57', '#D4AF37', '#12203B', '#F5B400'];

function lisible(hex: string) {
  const c = hex.replace('#', '');
  if (c.length !== 6) return '#FFFFFF';
  const r = parseInt(c.slice(0, 2), 16);
  const v = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  // Luminance perçue : au-delà de 150, le texte foncé passe mieux.
  return 0.299 * r + 0.587 * v + 0.114 * b > 150 ? '#12312A' : '#FFFFFF';
}

export function Personnalisation({ vitrine }: { vitrine: Vitrine }) {
  const [v, setV] = useState(vitrine);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);

  const couleur = /^#[0-9a-fA-F]{6}$/.test(v.couleur ?? '') ? v.couleur : '#1E9E6A';

  function set<K extends keyof Vitrine>(cle: K, valeur: Vitrine[K]) {
    setV((x) => ({ ...x, [cle]: valeur }));
    setEnregistre(false);
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const maj = await appel<Vitrine>('/ecole/vitrine', {
        methode: 'PATCH',
        corps: {
          logoUrl: v.logoUrl ?? '',
          banniereUrl: v.banniereUrl ?? '',
          couleur,
        },
      });
      setV(maj);
      setEnregistre(true);
    } catch (err) {
      setErreur(messageDe(err));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <>
      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ------------------------------------------------------ les champs */}
        <form onSubmit={enregistrer} className={`${CARTE} p-5`}>
          <h2 className="mb-4 text-[18px] font-extrabold text-[#12312A]">Tes éléments</h2>

          <div className="grid gap-4">
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Adresse de ton logo</span>
              <input
                value={v.logoUrl ?? ''}
                onChange={(e) => set('logoUrl', e.target.value)}
                className={CHAMP}
                maxLength={600}
                placeholder="https://toulali.fr/logo.png"
              />
              <span className="mt-1 block text-[13px] text-[#5E7A6E]">
                Carré de préférence, fond transparent si tu en as un.
              </span>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Adresse de ta bannière</span>
              <input
                value={v.banniereUrl ?? ''}
                onChange={(e) => set('banniereUrl', e.target.value)}
                className={CHAMP}
                maxLength={600}
                placeholder="https://toulali.fr/banniere.jpg"
              />
              <span className="mt-1 block text-[13px] text-[#5E7A6E]">
                Une image large : elle s&apos;affiche en haut de ta page publique.
              </span>
            </label>

            <div>
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Ta couleur principale</span>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="color"
                  value={couleur}
                  onChange={(e) => set('couleur', e.target.value.toUpperCase())}
                  className="h-11 w-14 cursor-pointer rounded-lg border-2 border-[#DDEBE4] bg-white p-1"
                  aria-label="Choisir la couleur principale"
                />
                <input
                  value={couleur}
                  onChange={(e) => set('couleur', e.target.value.toUpperCase())}
                  className={`${CHAMP} max-w-[140px] font-mono`}
                  maxLength={9}
                />
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {PALETTE.map((c) => (
                  <li key={c}>
                    <button
                      type="button"
                      onClick={() => set('couleur', c)}
                      aria-label={`Utiliser la couleur ${c}`}
                      className={`h-8 w-8 rounded-lg border-2 transition ${couleur === c ? 'border-[#12312A]' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[13px] text-[#5E7A6E]">
                C&apos;est la couleur des boutons de ta page et de l&apos;espace apprenant.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
              {enCours ? 'Enregistrement…' : 'Mettre à jour'}
            </button>
            {enregistre ? <span className="text-[15px] font-bold text-[#0F5F3E]">Enregistré.</span> : null}
          </div>
        </form>

        {/* ------------------------------------------------------- l'aperçu */}
        <div className={`${CARTE} overflow-hidden`}>
          <p className="border-b border-[#EDF4F1] px-5 py-3 text-[13px] font-bold uppercase tracking-wide text-[#5E7A6E]">
            Aperçu
          </p>

          <div
            className="h-32 w-full bg-[#E3F5EC] bg-cover bg-center"
            style={v.banniereUrl ? { backgroundImage: `url(${v.banniereUrl})` } : undefined}
            aria-hidden="true"
          />

          <div className="px-5 pb-6">
            <div className="-mt-8 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-2 border-white bg-white shadow-sm">
              {v.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={v.logoUrl} alt="" className="h-full w-full object-contain" />
              ) : (
                <span className="text-[20px] font-black text-[#5E7A6E]">
                  {(v.nom || '?').slice(0, 1).toUpperCase()}
                </span>
              )}
            </div>

            <h3 className="mt-3 text-[20px] font-black text-[#12312A]">{v.nom}</h3>
            {v.sousTitre ? <p className="text-[15px] leading-relaxed text-[#334A42]">{v.sousTitre}</p> : null}

            <button
              type="button"
              className="mt-4 rounded-xl px-5 py-3 text-[15px] font-bold"
              style={{ backgroundColor: couleur, color: lisible(couleur) }}
            >
              Voir les formations
            </button>

            <p className="mt-4 text-[13px] leading-relaxed text-[#5E7A6E]">
              Le nom, la phrase de présentation et le texte de la page se règlent dans « Ma page ».
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
