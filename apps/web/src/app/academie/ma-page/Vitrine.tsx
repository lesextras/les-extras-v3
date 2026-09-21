'use client';

import { useState, type FormEvent } from 'react';
import { appel } from '../_client';
import { BTN_DISCRET, BTN_PRIMAIRE, CARTE, CHAMP, Encart, Pastille } from '../_ui';
import type { Vitrine as DonneesVitrine } from '../_ecole/types';

/**
 * LA VITRINE, ÉCRITE PUIS PUBLIÉE.
 *
 * Deux gestes séparés, volontairement : on remplit la page, et on décide
 * ensuite de la rendre visible. Tant que « publiée » est éteint, l'adresse
 * renvoie une page introuvable — personne ne tombe sur un brouillon.
 */

const ORIGINE = 'https://pilote.toulali.fr';

/** Ce qui manque avant de publier : dit une fois, en clair. */
function manques(v: {
  sousTitre: string | null;
  presentation: string | null;
  contactEmail: string | null;
  slug: string;
}) {
  const m: string[] = [];
  if (!v.slug?.trim()) m.push("l'adresse de la page");
  if (!v.sousTitre?.trim()) m.push('la phrase de présentation');
  if (!v.presentation?.trim()) m.push('le texte « qui sommes-nous »');
  if (!v.contactEmail?.trim()) m.push('une adresse de contact');
  return m;
}

export function Vitrine({ vitrine }: { vitrine: DonneesVitrine }) {
  const [v, setV] = useState(vitrine);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistre, setEnregistre] = useState(false);

  const aFaire = manques(v);
  const adresse = `${ORIGINE}/ecole/${v.slug}`;

  function set<K extends keyof DonneesVitrine>(cle: K) {
    return (valeur: DonneesVitrine[K]) => {
      setV((x) => ({ ...x, [cle]: valeur }));
      setEnregistre(false);
    };
  }

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur(null);
    try {
      const maj = await appel<DonneesVitrine>('/ecole/vitrine', {
        method: 'PATCH',
        body: {
          nom: v.nom.trim(),
          slug: v.slug.trim(),
          sousTitre: v.sousTitre ?? '',
          presentation: v.presentation ?? '',
          contactEmail: v.contactEmail ?? '',
        },
      });
      setV(maj);
      setEnregistre(true);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "La page n'a pas pu être enregistrée.");
    } finally {
      setEnCours(false);
    }
  }

  async function basculerPublication() {
    setErreur(null);
    if (!v.publiee && aFaire.length) {
      setErreur(`Avant de publier, il manque : ${aFaire.join(', ')}.`);
      return;
    }
    setEnCours(true);
    try {
      const maj = await appel<DonneesVitrine>('/ecole/vitrine', { method: 'PATCH', body: { publiee: !v.publiee } });
      setV(maj);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "La publication n'a pas pu être changée.");
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

      {/* ------------------------------------------------------- l'adresse */}
      <section className={`${CARTE} mb-5 p-5`}>
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-[240px] flex-1">
            <h2 className="text-[18px] font-extrabold text-[#12312A]">L&apos;adresse de ta page</h2>
            <p className="mt-1 break-all text-[15px] font-bold text-[#0F5F3E]">{adresse}</p>
            <div className="mt-2">
              {v.publiee ? (
                <Pastille ton="ok">Visible par tout le monde</Pastille>
              ) : (
                <Pastille ton="attention">Privée, personne ne peut l&apos;ouvrir</Pastille>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {v.publiee ? (
              <a href={`/ecole/${v.slug}`} target="_blank" rel="noreferrer" className={BTN_DISCRET}>
                Voir la page
              </a>
            ) : null}
            <button type="button" onClick={basculerPublication} disabled={enCours} className={BTN_PRIMAIRE}>
              {v.publiee ? 'La remettre en privé' : 'Publier la page'}
            </button>
          </div>
        </div>
        {!v.publiee && aFaire.length ? (
          <p className="mt-3 rounded-xl bg-[#FEF3E2] px-4 py-3 text-[14px] leading-relaxed text-[#7C3E06]">
            Avant de publier : {aFaire.join(', ')}.
          </p>
        ) : null}
      </section>

      {/* ---------------------------------------------------- le contenu */}
      <form onSubmit={enregistrer} className={`${CARTE} p-5`}>
        <h2 className="mb-4 text-[18px] font-extrabold text-[#12312A]">Ce qu&apos;on lit sur la page</h2>

        <div className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Nom affiché</span>
            <input
              value={v.nom}
              onChange={(e) => set('nom')(e.target.value)}
              className={CHAMP}
              maxLength={120}
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Adresse de la page</span>
            <input
              value={v.slug}
              onChange={(e) => set('slug')(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              className={CHAMP}
              maxLength={60}
              required
            />
            <span className="mt-1 block text-[13px] text-[#5E7A6E]">
              Lettres, chiffres et tirets. C&apos;est ce qui apparaît après /ecole/ dans le lien.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">
              En une phrase, ce que tu proposes
            </span>
            <input
              value={v.sousTitre ?? ''}
              onChange={(e) => set('sousTitre')(e.target.value)}
              className={CHAMP}
              maxLength={200}
              placeholder="Formations courtes pour les professionnels du médico-social"
            />
            <span className="mt-1 block text-[13px] text-[#5E7A6E]">
              C&apos;est aussi le texte repris quand on partage le lien, et la description lue par les moteurs de
              recherche.
            </span>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Qui sommes-nous</span>
            <textarea
              value={v.presentation ?? ''}
              onChange={(e) => set('presentation')(e.target.value)}
              className={`${CHAMP} min-h-[200px]`}
              maxLength={8000}
              placeholder="Qui tu es, pour qui tu formes, ce qui te distingue. Écris comme tu parles."
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Adresse de contact</span>
            <input
              type="email"
              value={v.contactEmail ?? ''}
              onChange={(e) => set('contactEmail')(e.target.value)}
              className={CHAMP}
              maxLength={200}
            />
            <span className="mt-1 block text-[13px] text-[#5E7A6E]">
              C&apos;est là qu&apos;arrivent les questions des personnes intéressées.
            </span>
          </label>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
            {enCours ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          {enregistre ? <span className="text-[15px] font-bold text-[#0F5F3E]">Enregistré.</span> : null}
        </div>
      </form>
    </>
  );
}
