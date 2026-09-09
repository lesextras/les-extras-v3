'use client';

import { useState } from 'react';
import { appel } from '../../_client';
import { CARTE, Encart } from '../../_ui';
import type { EtatStripe } from './_types';

/**
 * LE COMPTE D'ENCAISSEMENT DE L'ASSOCIATION.
 *
 * Tant qu'aucun compte n'est relié, la recette d'une vente arrive sur le
 * compte de la plateforme, qui doit ensuite la reverser à la main. Relier son
 * propre compte, c'est recevoir l'argent directement.
 *
 * Le dossier d'identité (pièce, IBAN, représentant légal) se remplit
 * ENTIÈREMENT chez Stripe : ni cette page ni cette application ne voient
 * jamais ces informations, et aucun mot de passe ne se tape ici.
 */
export function Encaissement({ etat }: { etat: EtatStripe | null }) {
  const [travail, setTravail] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  async function partir(chemin: string, quoi: string) {
    setTravail(quoi);
    setErreur(null);
    try {
      const r = await appel<{ url: string }>(chemin, {
        method: 'POST',
        body: { retour: window.location.href.split('?')[0] },
      });
      window.location.href = r.url;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "L'opération n'a pas abouti.");
      setTravail(null);
    }
  }

  const relie = Boolean(etat?.relie);
  const pret = Boolean(etat?.pret);

  return (
    <div className={`${CARTE} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg font-extrabold text-[#1D1B5C]">Où arrive l&apos;argent</p>
          <p className="mt-1 max-w-[62ch] text-sm leading-relaxed text-[#6B6A8A]">
            {pret
              ? "Le compte de l'association est relié : chaque vente lui est versée directement, sans passer par la plateforme."
              : relie
                ? "Le dossier est ouvert mais pas terminé : tant qu'il l'est, les ventes continuent d'arriver sur le compte de la plateforme."
                : "Aucun compte n'est relié : les ventes arrivent aujourd'hui sur le compte de la plateforme, qui doit vous les reverser à la main."}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${
            pret
              ? 'bg-[#E3F3EC] text-[#0F5F3E]'
              : relie
                ? 'bg-[#FDF0D9] text-[#8A5A19]'
                : 'bg-[#F0EFF7] text-[#6B6A8A]'
          }`}
        >
          {pret ? 'Relié' : relie ? 'À terminer' : 'Non relié'}
        </span>
      </div>

      {relie && !pret && etat?.aFournir.length ? (
        <p className="mt-3 text-sm text-[#6B6A8A]">
          Stripe attend encore {etat.aFournir.length} élément
          {etat.aFournir.length > 1 ? 's' : ''} du dossier.
        </p>
      ) : null}

      {erreur ? (
        <div className="mt-4">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={travail !== null}
          onClick={() => partir('/paiements/stripe/lier', 'lier')}
          className="rounded-xl bg-[#1D1B5C] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {travail === 'lier'
            ? 'Ouverture…'
            : pret
              ? 'Modifier le dossier'
              : relie
                ? 'Terminer le dossier'
                : 'Relier le compte de l’association'}
        </button>
        {pret ? (
          <button
            type="button"
            disabled={travail !== null}
            onClick={() => partir('/paiements/stripe/tableau-de-bord', 'bord')}
            className="rounded-xl border-2 border-[#C7C4F2] px-4 py-2 text-sm font-bold text-[#1D1B5C] disabled:opacity-60"
          >
            {travail === 'bord' ? 'Ouverture…' : 'Voir mes versements'}
          </button>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[#6B6A8A]">
        Le dossier se remplit sur les pages de Stripe : pièce d&apos;identité, IBAN, représentant
        légal. Rien de tout cela ne transite par cette application, et aucun mot de passe ne se
        tape ici.
        {pret && (etat?.commissionVentePourcent ?? 0) === 0 ? (
          <>
            {' '}
            Aucune part n&apos;est retenue par la plateforme sur ces ventes ; les frais du
            prestataire de paiement restent à sa charge.
          </>
        ) : null}
      </p>
    </div>
  );
}
