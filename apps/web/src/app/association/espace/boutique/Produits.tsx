'use client';

import { useState } from 'react';
import { appel } from '../../_client';
import { CARTE, Encart } from '../../_ui';
import { euros, type NatureProduit, type Produit } from './_types';

/**
 * CE QUE L'ASSOCIATION VEND.
 *
 * Deux natures, et la différence commande tout le formulaire : un objet réel
 * demande un stock et des frais d'expédition ; un produit virtuel demande le
 * fichier ou le lien qu'on remettra à l'acheteur. On ne montre jamais les
 * champs de l'autre : c'est ce qui rend l'écran lisible.
 */
export function Produits({ initiaux }: { initiaux: Produit[] }) {
  const [produits, setProduits] = useState(initiaux);
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [titreNeuf, setTitreNeuf] = useState('');
  const [natureNeuve, setNatureNeuve] = useState<NatureProduit>('REEL');

  async function creer() {
    const titre = titreNeuf.trim();
    if (titre.length < 2) {
      setErreur('Donne un titre à ce produit.');
      return;
    }
    setOccupe(true);
    setErreur(null);
    try {
      const p = await appel<Produit>('/boutique/produits', {
        method: 'POST',
        body: { titre, nature: natureNeuve },
      });
      setProduits((l) => [p, ...l]);
      setTitreNeuf('');
      setOuvert(p.id);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Le produit n'a pas été créé.");
    } finally {
      setOccupe(false);
    }
  }

  async function enregistrer(id: string, patch: Partial<Produit>) {
    setErreur(null);
    try {
      const p = await appel<Produit>(`/boutique/produits/${id}`, { method: 'PATCH', body: patch });
      setProduits((l) => l.map((x) => (x.id === id ? p : x)));
      return true;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "La modification n'a pas été enregistrée.");
      return false;
    }
  }

  async function supprimer(id: string, titre: string) {
    if (!window.confirm(`Supprimer « ${titre} » ? Cette action ne se défait pas.`)) return;
    setErreur(null);
    try {
      await appel(`/boutique/produits/${id}`, { method: 'DELETE' });
      setProduits((l) => l.filter((x) => x.id !== id));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Le produit n'a pas été supprimé.");
    }
  }

  return (
    <div>
      {/* ----------------------------------------------------- en ajouter un */}
      <div className={`${CARTE} mb-4 p-5`}>
        <p className="font-extrabold text-[#1D1B5C]">Ajouter un produit</p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="grid min-w-[16rem] flex-1 gap-1 text-sm font-bold text-[#3B3A66]">
            Ce que tu vends
            <input
              value={titreNeuf}
              onChange={(e) => setTitreNeuf(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void creer();
              }}
              placeholder="Livret d’accompagnement, t-shirt, place d’atelier…"
              className="rounded-xl border-2 border-[#E6E4F3] px-3 py-2 text-[15px] font-normal text-[#1D1B5C] focus:outline-none"
            />
          </label>
          <label className="grid gap-1 text-sm font-bold text-[#3B3A66]">
            Nature
            <select
              value={natureNeuve}
              onChange={(e) => setNatureNeuve(e.target.value as NatureProduit)}
              className="rounded-xl border-2 border-[#E6E4F3] px-3 py-2 text-[15px] font-normal text-[#1D1B5C] focus:outline-none"
            >
              <option value="REEL">Objet à remettre ou expédier</option>
              <option value="VIRTUEL">Fichier ou accès en ligne</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void creer()}
            disabled={occupe}
            className="rounded-xl bg-[#1D1B5C] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            Ajouter
          </button>
        </div>
      </div>

      {erreur ? (
        <div className="mb-4">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {/* ------------------------------------------------------- la liste */}
      {produits.length === 0 ? (
        <Encart>
          Rien en vente pour l&apos;instant. Ajoute un premier produit : il reste en brouillon tant
          que tu ne l&apos;as pas mis en vente.
        </Encart>
      ) : (
        <ul className="grid gap-3">
          {produits.map((p) => (
            <li key={p.id} className={`${CARTE} overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <button
                  type="button"
                  onClick={() => setOuvert(ouvert === p.id ? null : p.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block font-extrabold text-[#1D1B5C]">{p.titre}</span>
                  <span className="mt-0.5 block text-sm text-[#6B6A8A]">
                    {p.nature === 'REEL' ? 'Objet' : 'Fichier ou accès'} ·{' '}
                    {p.prixCents > 0 ? euros(p.prixCents) : 'prix à fixer'}
                    {p.nature === 'REEL' && p.stock !== null ? ` · ${p.stock} en stock` : ''}
                  </span>
                </button>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-extrabold ${
                    p.statut === 'PUBLIE'
                      ? 'bg-[#E3F3EC] text-[#0F5F3E]'
                      : p.statut === 'ARCHIVE'
                        ? 'bg-[#F0EFF7] text-[#6B6A8A]'
                        : 'bg-[#FDF0D9] text-[#8A5A19]'
                  }`}
                >
                  {p.statut === 'PUBLIE' ? 'En vente' : p.statut === 'ARCHIVE' ? 'Retiré' : 'Brouillon'}
                </span>
              </div>

              {ouvert === p.id ? (
                <FicheProduit
                  produit={p}
                  enregistrer={(patch) => enregistrer(p.id, patch)}
                  supprimer={() => supprimer(p.id, p.titre)}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────── la fiche ────── */

function FicheProduit({
  produit,
  enregistrer,
  supprimer,
}: {
  produit: Produit;
  enregistrer: (patch: Partial<Produit>) => Promise<boolean>;
  supprimer: () => void;
}) {
  const [p, setP] = useState(produit);
  const [enCours, setEnCours] = useState(false);
  const [dit, setDit] = useState<string | null>(null);

  const champ =
    'w-full rounded-xl border-2 border-[#E6E4F3] px-3 py-2 text-[15px] text-[#1D1B5C] focus:outline-none';
  const etiquette = 'grid gap-1 text-sm font-bold text-[#3B3A66]';

  function set(patch: Partial<Produit>) {
    setP((x) => ({ ...x, ...patch }));
    setDit(null);
  }

  async function sauver(extra?: Partial<Produit>) {
    setEnCours(true);
    const patch: Partial<Produit> = {
      titre: p.titre,
      description: p.description,
      imageUrl: p.imageUrl,
      nature: p.nature,
      prixCents: p.prixCents,
      prixBarreCents: p.prixBarreCents ?? 0,
      tvaPourcent: p.tvaPourcent,
      ...(p.nature === 'REEL'
        ? { stock: p.stock ?? undefined, livraisonCents: p.livraisonCents }
        : { fichierUrl: p.fichierUrl, lienUrl: p.lienUrl }),
      ...extra,
    };
    const ok = await enregistrer(patch);
    setEnCours(false);
    if (ok) setDit('Enregistré.');
  }

  return (
    <div className="grid gap-4 border-t border-[#E6E4F3] bg-[#FBFAFF] px-5 py-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className={etiquette}>
          Le titre
          <input value={p.titre} onChange={(e) => set({ titre: e.target.value })} className={champ} />
        </label>
        <label className={etiquette}>
          Nature
          <select
            value={p.nature}
            onChange={(e) => set({ nature: e.target.value as NatureProduit })}
            className={champ}
          >
            <option value="REEL">Objet à remettre ou expédier</option>
            <option value="VIRTUEL">Fichier ou accès en ligne</option>
          </select>
        </label>
      </div>

      <label className={etiquette}>
        La description
        <textarea
          rows={3}
          value={p.description ?? ''}
          onChange={(e) => set({ description: e.target.value })}
          className={champ}
          placeholder="Ce que la personne reçoit, en quelques lignes."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className={etiquette}>
          Le prix, en euros
          <input
            type="number"
            min={0}
            step="0.01"
            value={p.prixCents ? p.prixCents / 100 : ''}
            onChange={(e) => set({ prixCents: Math.round(Number(e.target.value || 0) * 100) })}
            className={champ}
          />
        </label>
        <label className={etiquette}>
          Prix barré (facultatif)
          <input
            type="number"
            min={0}
            step="0.01"
            value={p.prixBarreCents ? p.prixBarreCents / 100 : ''}
            onChange={(e) => set({ prixBarreCents: Math.round(Number(e.target.value || 0) * 100) })}
            className={champ}
          />
        </label>
        <label className={etiquette}>
          TVA, en %
          <input
            type="number"
            min={0}
            max={100}
            value={p.tvaPourcent}
            onChange={(e) => set({ tvaPourcent: Number(e.target.value || 0) })}
            className={champ}
          />
        </label>
      </div>

      {p.nature === 'REEL' ? (
        <div className="grid gap-4 md:grid-cols-2">
          <label className={etiquette}>
            Stock (vide : on ne compte pas)
            <input
              type="number"
              min={0}
              value={p.stock ?? ''}
              onChange={(e) =>
                set({ stock: e.target.value === '' ? null : Number(e.target.value) })
              }
              className={champ}
            />
          </label>
          <label className={etiquette}>
            Frais d&apos;expédition, en euros
            <input
              type="number"
              min={0}
              step="0.01"
              value={p.livraisonCents ? p.livraisonCents / 100 : ''}
              onChange={(e) =>
                set({ livraisonCents: Math.round(Number(e.target.value || 0) * 100) })
              }
              className={champ}
            />
            <span className="text-xs font-normal text-[#6B6A8A]">
              Comptés une fois par produit dans la commande, pas par exemplaire. À zéro : remise en
              main propre, ou port offert.
            </span>
          </label>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <label className={etiquette}>
            Le fichier remis
            <input
              value={p.fichierUrl ?? ''}
              onChange={(e) => set({ fichierUrl: e.target.value })}
              className={champ}
              placeholder="/medias/… ou https://…"
            />
          </label>
          <label className={etiquette}>
            Ou l&apos;accès en ligne
            <input
              value={p.lienUrl ?? ''}
              onChange={(e) => set({ lienUrl: e.target.value })}
              className={champ}
              placeholder="https://…"
            />
          </label>
          <p className="text-xs text-[#6B6A8A] md:col-span-2">
            L&apos;un des deux suffit. C&apos;est ce lien qui part dans le message de confirmation,
            au moment du paiement.
          </p>
        </div>
      )}

      <label className={etiquette}>
        L&apos;image (facultative)
        <input
          value={p.imageUrl ?? ''}
          onChange={(e) => set({ imageUrl: e.target.value })}
          className={champ}
          placeholder="https://…"
        />
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void sauver()}
          disabled={enCours}
          className="rounded-xl bg-[#1D1B5C] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          Enregistrer
        </button>
        {p.statut === 'PUBLIE' ? (
          <button
            type="button"
            onClick={() => void sauver({ statut: 'BROUILLON' })}
            disabled={enCours}
            className="rounded-xl border-2 border-[#C7C4F2] px-4 py-2 text-sm font-bold text-[#1D1B5C] disabled:opacity-60"
          >
            Retirer de la vente
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void sauver({ statut: 'PUBLIE' })}
            disabled={enCours}
            className="rounded-xl border-2 border-[#0F5F3E] px-4 py-2 text-sm font-bold text-[#0F5F3E] disabled:opacity-60"
          >
            Mettre en vente
          </button>
        )}
        <button
          type="button"
          onClick={supprimer}
          className="ml-auto text-sm font-bold text-[#8A2419] underline underline-offset-4"
        >
          Supprimer
        </button>
      </div>
      {dit ? <p className="text-sm font-bold text-[#0F5F3E]">{dit}</p> : null}
    </div>
  );
}
