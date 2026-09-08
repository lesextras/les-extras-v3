'use client';

import { useState, type FormEvent } from 'react';
import { appel, messageDe } from '../_ecole/api';
import { BTN_PRIMAIRE, CARTE, CHAMP, Encart } from '../_ui';
import type { Vitrine } from '../_ecole/types';

/**
 * L'IMAGE DE MARQUE.
 *
 * La couleur principale suffit : c'est le seul réglage obligatoire. Les cinq
 * autres — le fond, les titres, les textes, les boutons, le texte des boutons
 * — se règlent seulement si on veut aller plus loin ; laissées vides, elles se
 * déduisent de la principale. Les images se donnent par leur adresse : on ne
 * stocke pas de fichier ici, on pointe vers celui qui existe déjà — souvent
 * celui du site. L'aperçu se met à jour pendant la saisie, pour qu'on voie
 * avant d'enregistrer.
 */

/** Les réseaux sur lesquels une école peut renvoyer, dans l'ordre du choix. */
const RESEAUX: { cle: string; nom: string }[] = [
  { cle: 'site', nom: 'Site web' },
  { cle: 'facebook', nom: 'Facebook' },
  { cle: 'messenger', nom: 'Messenger' },
  { cle: 'whatsapp', nom: 'WhatsApp' },
  { cle: 'instagram', nom: 'Instagram' },
  { cle: 'tiktok', nom: 'TikTok' },
  { cle: 'linkedin', nom: 'LinkedIn' },
  { cle: 'youtube', nom: 'YouTube' },
  { cle: 'twitter', nom: 'X' },
  { cle: 'vimeo', nom: 'Vimeo' },
  { cle: 'soundcloud', nom: 'Soundcloud' },
  { cle: 'spotify', nom: 'Spotify' },
  { cle: 'pinterest', nom: 'Pinterest' },
  { cle: 'github', nom: 'GitHub' },
];

/** Les cinq couleurs qu'on peut régler en plus de la principale. */
const AUTRES_COULEURS: { cle: 'couleurFond' | 'couleurTitres' | 'couleurTextes' | 'couleurBoutons' | 'couleurTexteBoutons'; nom: string; defaut: string }[] = [
  { cle: 'couleurFond', nom: "Couleur d'arrière-plan", defaut: '#F7F8F7' },
  { cle: 'couleurTitres', nom: 'Couleur des titres', defaut: '#12312A' },
  { cle: 'couleurTextes', nom: 'Couleur des textes', defaut: '#334A42' },
  { cle: 'couleurBoutons', nom: 'Couleur des boutons', defaut: '' },
  { cle: 'couleurTexteBoutons', nom: 'Couleur du texte des boutons', defaut: '#FFFFFF' },
];

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
  const liens = Array.isArray(v.liensSociaux) ? v.liensSociaux : [];
  const [reseauNeuf, setReseauNeuf] = useState('site');
  const [urlNeuve, setUrlNeuve] = useState('');

  const poserLiens = (l: { reseau: string; url: string }[]) => set('liensSociaux', l);

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
          faviconUrl: v.faviconUrl ?? '',
          couleur,
          couleurFond: v.couleurFond ?? '',
          couleurTitres: v.couleurTitres ?? '',
          couleurTextes: v.couleurTextes ?? '',
          couleurBoutons: v.couleurBoutons ?? '',
          couleurTexteBoutons: v.couleurTexteBoutons ?? '',
          liensSociaux: liens,
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

            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Adresse de ton favicon</span>
              <input
                value={v.faviconUrl ?? ''}
                onChange={(e) => set('faviconUrl', e.target.value)}
                className={CHAMP}
                maxLength={600}
                placeholder="https://toulali.fr/favicon.png"
              />
              <span className="mt-1 block text-[13px] text-[#5E7A6E]">
                La petite image de l&apos;onglet du navigateur. Carrée, 64 pixels, en PNG.
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

          <details className="mt-5 rounded-xl border-2 border-[#DDEBE4] p-4">
            <summary className="cursor-pointer text-[15px] font-extrabold text-[#12312A]">
              Régler les autres couleurs
            </summary>
            <p className="mt-2 text-[13px] text-[#5E7A6E]">
              Laisse un champ vide et la couleur se déduit de la principale. Tu n&apos;as pas
              besoin d&apos;y toucher pour que ta page soit correcte.
            </p>
            <div className="mt-3 grid gap-3">
              {AUTRES_COULEURS.map((c) => {
                const val = (v[c.cle] as string | null) ?? '';
                return (
                  <div key={c.cle} className="flex flex-wrap items-center gap-3">
                    <span className="min-w-[200px] text-[13px] font-bold text-[#12312A]">{c.nom}</span>
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(val) ? val : c.defaut || couleur}
                      onChange={(e) => set(c.cle, e.target.value.toUpperCase())}
                      className="h-10 w-12 cursor-pointer rounded-lg border-2 border-[#DDEBE4] bg-white p-1"
                      aria-label={c.nom}
                    />
                    <input
                      value={val}
                      onChange={(e) => set(c.cle, e.target.value.toUpperCase())}
                      className={`${CHAMP} max-w-[130px] font-mono`}
                      maxLength={9}
                      placeholder={c.defaut || couleur}
                    />
                    {val ? (
                      <button
                        type="button"
                        onClick={() => set(c.cle, '')}
                        className="text-[13px] font-bold text-[#8A1B3D] underline underline-offset-4"
                      >
                        Effacer
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </details>

          <div className="mt-5 rounded-xl border-2 border-[#DDEBE4] p-4">
            <h3 className="text-[15px] font-extrabold text-[#12312A]">Tes liens sociaux</h3>
            <p className="mt-1 text-[13px] text-[#5E7A6E]">
              Ils s&apos;affichent en bas de ta page publique.
            </p>

            {liens.length ? (
              <ul className="mt-3 grid gap-2">
                {liens.map((l, i) => (
                  <li key={`${l.reseau}-${i}`} className="flex flex-wrap items-center gap-2">
                    <span className="min-w-[110px] text-[14px] font-bold text-[#12312A]">
                      {RESEAUX.find((r) => r.cle === l.reseau)?.nom ?? l.reseau}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[14px] text-[#334A42]">{l.url}</span>
                    <button
                      type="button"
                      onClick={() => poserLiens(liens.filter((_, j) => j !== i))}
                      className="text-[13px] font-bold text-[#8A1B3D] underline underline-offset-4"
                    >
                      Retirer
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-[14px] text-[#5E7A6E]">Aucun lien pour le moment.</p>
            )}

            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Réseau</span>
                <select value={reseauNeuf} onChange={(e) => setReseauNeuf(e.target.value)} className={CHAMP}>
                  {RESEAUX.map((r) => (
                    <option key={r.cle} value={r.cle}>
                      {r.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block min-w-[220px] flex-1">
                <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Adresse</span>
                <input
                  value={urlNeuve}
                  onChange={(e) => setUrlNeuve(e.target.value)}
                  className={CHAMP}
                  placeholder="https://instagram.com/…"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  const url = urlNeuve.trim();
                  if (!/^https?:\/\//.test(url)) {
                    setErreur('Un lien commence par https://');
                    return;
                  }
                  setErreur(null);
                  poserLiens([...liens, { reseau: reseauNeuf, url }]);
                  setUrlNeuve('');
                }}
                className="rounded-xl border-2 border-[#DDEBE4] bg-white px-4 py-2 text-[14px] font-extrabold text-[#0F5F3E]"
              >
                Ajouter
              </button>
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
