'use client';

import { useState } from 'react';
import { appel } from '../../_client';
import { CARTE, Encart } from '../../_ui';
import { Partage } from './Partage';
import type { Vitrine as VitrineType } from './_types';

/**
 * LA VITRINE : ce que voit quelqu'un qui arrive sur la boutique.
 *
 * Elle reste hors ligne tant que l'association ne l'a pas ouverte — on ne
 * publie jamais une page à sa place.
 */
export function Vitrine({ initiale }: { initiale: VitrineType }) {
  const [v, setV] = useState(initiale);
  /**
   * L'etat REELLEMENT enregistre, distinct de la saisie en cours.
   *
   * Le QR code et le lien de partage doivent pointer vers l'adresse qui
   * fonctionne AUJOURD'HUI, pas vers celle qu'on est en train de taper. Sans
   * cette distinction, on imprime une affiche vers une page qui n'existe pas.
   */
  const [enregistree, setEnregistree] = useState(initiale);
  const [erreur, setErreur] = useState<string | null>(null);
  const [dit, setDit] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const champ =
    'w-full rounded-xl border-2 border-[#E6E4F3] px-3 py-2 text-[15px] text-[#1D1B5C] focus:outline-none';
  const etiquette = 'grid gap-1 text-sm font-bold text-[#3B3A66]';

  /**
   * L'adresse telle que le serveur la rangera. Meme regle que `normaliser()`
   * cote API : on montre le resultat AVANT d'enregistrer, plutot que de faire
   * decouvrir apres coup que « ADéPA Boutique » est devenu autre chose.
   */
  const apercu = v.slug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

  async function sauver(extra?: Partial<VitrineType>) {
    setOccupe(true);
    setErreur(null);
    setDit(null);
    try {
      const maj = await appel<VitrineType>('/boutique/vitrine', {
        method: 'PATCH',
        body: {
          nom: v.nom,
          slug: v.slug,
          sousTitre: v.sousTitre ?? '',
          presentation: v.presentation ?? '',
          logoUrl: v.logoUrl ?? '',
          banniereUrl: v.banniereUrl ?? '',
          couleur: v.couleur,
          contactEmail: v.contactEmail ?? '',
          cgv: v.cgv ?? '',
          mentions: v.mentions ?? '',
          livraisonTexte: v.livraisonTexte ?? '',
          ...extra,
        },
      });
      setV(maj);
      setEnregistree(maj);
      setDit('Enregistré.');
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "La vitrine n'a pas été enregistrée.");
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className={`${CARTE} grid gap-4 p-5`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-[#1D1B5C]">La vitrine</p>
          <p className="mt-0.5 text-sm text-[#6B6A8A]">
            Adresse publique :{' '}
            <a
              href={`/boutique/${enregistree.slug}`}
              target="_blank"
              rel="noopener"
              className="font-bold text-[#4F46E5] underline underline-offset-4"
            >
              /boutique/{enregistree.slug}
            </a>
          </p>
        </div>
        <button
          type="button"
          disabled={occupe}
          onClick={() => void sauver({ publiee: !v.publiee })}
          className={`rounded-xl px-4 py-2 text-sm font-bold disabled:opacity-60 ${
            v.publiee
              ? 'border-2 border-[#C7C4F2] text-[#1D1B5C]'
              : 'bg-[#0F5F3E] text-white'
          }`}
        >
          {v.publiee ? 'Fermer la boutique' : 'Ouvrir la boutique'}
        </button>
      </div>

      {!v.publiee ? (
        <Encart ton="attention">
          La boutique est fermée : personne ne peut y accéder. Ouvre-la quand tes produits sont
          prêts.
        </Encart>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className={etiquette}>
          Le nom
          <input value={v.nom} onChange={(e) => setV({ ...v, nom: e.target.value })} className={champ} />
        </label>
        <label className={etiquette}>
          La phrase d&apos;accueil
          <input
            value={v.sousTitre ?? ''}
            onChange={(e) => setV({ ...v, sousTitre: e.target.value })}
            className={champ}
            placeholder="Ce qu’on trouve ici, en une ligne."
          />
        </label>
      </div>

      <label className={etiquette}>
        L&apos;adresse de la boutique
        <span className="flex items-center gap-0 overflow-hidden rounded-xl border-2 border-[#E6E4F3] focus-within:border-[#C7C4F2]">
          <span className="shrink-0 bg-[#F3F2FD] px-3 py-2 text-[15px] font-normal text-[#6B6A8A]">
            /boutique/
          </span>
          <input
            value={v.slug}
            onChange={(e) => setV({ ...v, slug: e.target.value })}
            className="w-full border-0 px-3 py-2 text-[15px] text-[#1D1B5C] focus:outline-none"
            placeholder="adepa"
          />
        </span>
        <span className="text-xs font-normal text-[#6B6A8A]">
          C&apos;est ce qu&apos;on lit sur le lien et ce qui sert au QR code : plus c&apos;est
          court, plus c&apos;est facile à dire à voix haute et à scanner.{' '}
          {apercu && apercu !== v.slug ? (
            <>
              Ce sera enregistré sous <strong className="text-[#1D1B5C]">/boutique/{apercu}</strong>.
            </>
          ) : null}{' '}
          Changer l&apos;adresse casse les liens et les QR codes déjà partagés : l&apos;ancienne ne
          mène plus nulle part.
        </span>
      </label>

      <label className={etiquette}>
        La présentation
        <textarea
          rows={3}
          value={v.presentation ?? ''}
          onChange={(e) => setV({ ...v, presentation: e.target.value })}
          className={champ}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className={etiquette}>
          La couleur
          <input
            value={v.couleur}
            onChange={(e) => setV({ ...v, couleur: e.target.value })}
            className={champ}
            placeholder="#0F5F3E"
          />
        </label>
        <label className={etiquette}>
          Le logo
          <input
            value={v.logoUrl ?? ''}
            onChange={(e) => setV({ ...v, logoUrl: e.target.value })}
            className={champ}
            placeholder="https://…"
          />
        </label>
        <label className={etiquette}>
          L&apos;adresse de contact
          <input
            value={v.contactEmail ?? ''}
            onChange={(e) => setV({ ...v, contactEmail: e.target.value })}
            className={champ}
          />
        </label>
      </div>

      <label className={etiquette}>
        Ce que tu dis sur la livraison
        <textarea
          rows={2}
          value={v.livraisonTexte ?? ''}
          onChange={(e) => setV({ ...v, livraisonTexte: e.target.value })}
          className={champ}
          placeholder="Délais, points de retrait, ce qui est possible et ce qui ne l’est pas."
        />
        <span className="text-xs font-normal text-[#6B6A8A]">
          Ce texte s&apos;affiche sur la boutique et part dans le message de confirmation, quand la
          commande contient un objet. Laissé vide, rien ne s&apos;affiche : mieux vaut ne rien dire
          qu&apos;annoncer un délai qu&apos;on ne tiendra pas.
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className={etiquette}>
          Conditions de vente
          <textarea
            rows={4}
            value={v.cgv ?? ''}
            onChange={(e) => setV({ ...v, cgv: e.target.value })}
            className={champ}
          />
        </label>
        <label className={etiquette}>
          Mentions légales
          <textarea
            rows={4}
            value={v.mentions ?? ''}
            onChange={(e) => setV({ ...v, mentions: e.target.value })}
            className={champ}
          />
        </label>
      </div>

      {erreur ? <Encart ton="alerte">{erreur}</Encart> : null}
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={occupe}
          onClick={() => void sauver()}
          className="rounded-xl bg-[#1D1B5C] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          Enregistrer
        </button>
        {dit ? <span className="text-sm font-bold text-[#0F5F3E]">{dit}</span> : null}
      </div>

      <Partage
        slug={enregistree.slug}
        nom={enregistree.nom}
        publiee={enregistree.publiee}
        modifie={apercu !== enregistree.slug}
      />
    </div>
  );
}
