'use client';

import { useState } from 'react';
import { CARTE, Encart } from '../../_ui';
import { appel } from '../../_client';
import {
  LIBELLE_STATUT_COMMANDE,
  euros,
  type Commande,
  type StatutCommande,
} from './_types';

const SUITE: StatutCommande[] = ['PAYEE', 'PREPAREE', 'EXPEDIEE', 'REMISE'];

/**
 * LES COMMANDES REÇUES.
 *
 * Une commande n'existe que payée : il n'y a donc pas de panier abandonné à
 * relancer ici. Ce qui reste à faire, c'est la suivre — préparée, expédiée,
 * remise — et garder l'adresse sous les yeux quand il y a un colis.
 */
export function Commandes({ initiales }: { initiales: Commande[] }) {
  const [commandes, setCommandes] = useState(initiales);
  const [erreur, setErreur] = useState<string | null>(null);
  const [ouverte, setOuverte] = useState<string | null>(null);

  async function suivre(id: string, patch: { statut?: StatutCommande; note?: string }) {
    setErreur(null);
    try {
      const c = await appel<Commande>(`/boutique/commandes/${id}`, { method: 'PATCH', body: patch });
      setCommandes((l) => l.map((x) => (x.id === id ? c : x)));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Le suivi n'a pas été enregistré.");
    }
  }

  if (!commandes.length) {
    return (
      <Encart>
        Aucune commande pour l&apos;instant. Elles apparaîtront ici dès qu&apos;un paiement sera
        confirmé, rien n&apos;est enregistré avant.
      </Encart>
    );
  }

  return (
    <div>
      {erreur ? (
        <div className="mb-4">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}
      <ul className="grid gap-3">
        {commandes.map((c) => {
          const aExpedier = c.lignes.some((l) => l.nature === 'REEL');
          const suivant = SUITE[SUITE.indexOf(c.statut) + 1];
          return (
            <li key={c.id} className={`${CARTE} overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setOuverte(ouverte === c.id ? null : c.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block font-extrabold text-[#1D1B5C]">
                    {c.nom || c.email}
                  </span>
                  <span className="mt-0.5 block text-sm text-[#6B6A8A]">
                    {new Date(c.createdAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}{' '}
                    · {c.lignes.length} article{c.lignes.length > 1 ? 's' : ''}
                    {aExpedier ? ' · à expédier' : ' · remise immédiate'}
                  </span>
                </button>
                <span className="shrink-0 font-extrabold tabular-nums text-[#0F5F3E]">
                  {euros(c.totalCents)}
                </span>
                <span className="shrink-0 rounded-full bg-[#F0EFF7] px-3 py-1 text-xs font-extrabold text-[#3B3A66]">
                  {LIBELLE_STATUT_COMMANDE[c.statut]}
                </span>
              </div>

              {ouverte === c.id ? (
                <div className="grid gap-4 border-t border-[#E6E4F3] bg-[#FBFAFF] px-5 py-5">
                  <ul className="grid gap-1 text-sm text-[#3B3A66]">
                    {c.lignes.map((l) => (
                      <li key={l.id} className="flex items-center justify-between gap-3">
                        <span>
                          {l.titre}
                          {l.quantite > 1 ? ` × ${l.quantite}` : ''}
                          {l.nature === 'VIRTUEL' ? ', remis en ligne' : ''}
                        </span>
                        <span className="font-bold tabular-nums">
                          {euros(l.prixCents * l.quantite)}
                        </span>
                      </li>
                    ))}
                    {c.fraisPortCents > 0 ? (
                      <li className="flex items-center justify-between gap-3 border-t border-[#E6E4F3] pt-1">
                        <span>Frais d&apos;expédition</span>
                        <span className="font-bold tabular-nums">{euros(c.fraisPortCents)}</span>
                      </li>
                    ) : null}
                  </ul>

                  <div className="grid gap-1 text-sm text-[#3B3A66]">
                    <p>
                      <span className="font-bold">Contact :</span> {c.email}
                      {c.telephone ? ` · ${c.telephone}` : ''}
                    </p>
                    {aExpedier && c.adresse ? (
                      <p>
                        <span className="font-bold">Livraison :</span> {c.adresse}, {c.codePostal}{' '}
                        {c.ville}
                        {c.pays ? `, ${c.pays}` : ''}
                      </p>
                    ) : null}
                  </div>

                  <label className="grid gap-1 text-sm font-bold text-[#3B3A66]">
                    Ma note (numéro de suivi, rendez-vous de remise…)
                    <textarea
                      rows={2}
                      defaultValue={c.note ?? ''}
                      onBlur={(e) => void suivre(c.id, { note: e.target.value })}
                      className="rounded-xl border-2 border-[#E6E4F3] px-3 py-2 text-[15px] font-normal text-[#1D1B5C] focus:outline-none"
                    />
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {suivant ? (
                      <button
                        type="button"
                        onClick={() => void suivre(c.id, { statut: suivant })}
                        className="rounded-xl bg-[#1D1B5C] px-4 py-2 text-sm font-bold text-white"
                      >
                        Marquer {LIBELLE_STATUT_COMMANDE[suivant].toLowerCase()}
                      </button>
                    ) : null}
                    {c.statut !== 'ANNULEE' && c.statut !== 'REMBOURSEE' ? (
                      <button
                        type="button"
                        onClick={() => void suivre(c.id, { statut: 'REMBOURSEE' })}
                        className="rounded-xl border-2 border-[#C7C4F2] px-4 py-2 text-sm font-bold text-[#1D1B5C]"
                      >
                        Noter comme remboursée
                      </button>
                    ) : null}
                  </div>
                  <p className="text-xs text-[#6B6A8A]">
                    Noter une commande remboursée ici ne rembourse pas l&apos;acheteur : le
                    remboursement se fait depuis le tableau de bord du compte d&apos;encaissement.
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
