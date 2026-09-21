'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { appel, messageDe } from '../_ecole/api';
import { BTN_DISCRET, BTN_PRIMAIRE, BTN_SECONDAIRE, CARTE, CHAMP, Encart, Pastille } from '../_ui';
import { NOM_STATUT_VENTE, dateCourte, euros, type CoursResume, type Pack, type StatutVente, type Vente } from '../_ecole/types';

/**
 * MES VENTES.
 *
 * Une vente peut venir de la boutique ou d'ailleurs — un virement, un chèque,
 * une prise en charge. Les deux comptent pareil : l'écran permet donc de la
 * saisir à la main, et de changer son statut quand l'argent arrive.
 */

type Tri = 'date' | 'montant' | 'acheteur' | 'reste';

/**
 * CE QUI RESTE À ENCAISSER SUR UNE VENTE.
 *
 * Une vente réglée ne doit plus rien ; une vente remboursée non plus. Reste
 * une vente enregistrée mais pas encore payée : c'est celle-là qu'on relance.
 */
function resteAPayer(v: Vente) {
  return v.statut === 'EN_ATTENTE' ? (v.montantCents ?? 0) : 0;
}

const STATUTS: StatutVente[] = ['EN_ATTENTE', 'PAYEE', 'REMBOURSEE', 'ANNULEE'];

const TON: Record<StatutVente, 'ok' | 'attention' | 'neutre' | 'alerte'> = {
  PAYEE: 'ok',
  EN_ATTENTE: 'attention',
  REMBOURSEE: 'neutre',
  ANNULEE: 'alerte',
};

function versCsv(ventes: Vente[]) {
  const entetes = ['Date', 'Acheteur', 'E-mail', 'Produit', 'Statut', 'Moyen', 'Reste à payer (€)', 'Montant (€)'];
  const e = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lignes = ventes.map((v) =>
    [
      v.le.slice(0, 10),
      v.nom ?? '',
      v.email,
      v.cours?.titre ?? (v.packId ? 'Pack' : ''),
      NOM_STATUT_VENTE[v.statut],
      v.moyen ?? '',
      (resteAPayer(v) / 100).toFixed(2).replace('.', ','),
      ((v.montantCents ?? 0) / 100).toFixed(2).replace('.', ','),
    ]
      .map(e)
      .join(';'),
  );
  return [entetes.map(e).join(';'), ...lignes].join('\r\n');
}

export function Ventes({ initiales, cours, packs }: { initiales: Vente[]; cours: CoursResume[]; packs: Pack[] }) {
  const [ventes, setVentes] = useState(initiales);
  const [recherche, setRecherche] = useState('');
  const [tri, setTri] = useState<Tri>('date');
  const [ouvert, setOuvert] = useState(false);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const [produit, setProduit] = useState('');
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');
  const [moyen, setMoyen] = useState('Virement');
  const [statut, setStatut] = useState<StatutVente>('PAYEE');

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const l = ventes.filter(
      (v) =>
        !q ||
        v.email.toLowerCase().includes(q) ||
        (v.nom ?? '').toLowerCase().includes(q) ||
        (v.cours?.titre ?? '').toLowerCase().includes(q),
    );
    const t = [...l];
    if (tri === 'date') t.sort((a, b) => +new Date(b.le) - +new Date(a.le));
    if (tri === 'montant') t.sort((a, b) => (b.montantCents ?? 0) - (a.montantCents ?? 0));
    if (tri === 'reste') t.sort((a, b) => resteAPayer(b) - resteAPayer(a));
    if (tri === 'acheteur') t.sort((a, b) => (a.nom || a.email).localeCompare(b.nom || b.email, 'fr'));
    return t;
  }, [ventes, recherche, tri]);

  const encaisse = visibles.filter((v) => v.statut === 'PAYEE').reduce((t, v) => t + (v.montantCents ?? 0), 0);
  const attendu = visibles.filter((v) => v.statut === 'EN_ATTENTE').reduce((t, v) => t + (v.montantCents ?? 0), 0);

  async function enregistrer(e: FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) {
      setErreur("Indique l'adresse e-mail de la personne.");
      return;
    }
    if (!produit) {
      setErreur('Choisis le cours ou le pack acheté.');
      return;
    }
    setEnCours(true);
    setErreur(null);
    try {
      const [genre, id] = produit.split(':');
      const creee = await appel<Vente>('/ecole/ventes', {
        methode: 'POST',
        corps: {
          ...(genre === 'cours' ? { coursId: id } : { packId: id }),
          email: email.trim().toLowerCase(),
          ...(nom.trim() ? { nom: nom.trim() } : {}),
          montantCents: Math.round(Number(montant.replace(',', '.') || 0) * 100),
          ...(moyen.trim() ? { moyen: moyen.trim() } : {}),
          statut,
        },
      });
      setVentes((l) => [creee, ...l]);
      setEmail('');
      setNom('');
      setMontant('');
      setProduit('');
      setOuvert(false);
    } catch (err) {
      setErreur(messageDe(err));
    } finally {
      setEnCours(false);
    }
  }

  async function changerStatut(v: Vente, vers: StatutVente) {
    setErreur(null);
    try {
      const maj = await appel<Vente>(`/ecole/ventes/${v.id}`, { methode: 'PATCH', corps: { statut: vers } });
      setVentes((l) => l.map((x) => (x.id === v.id ? maj : x)));
    } catch (err) {
      setErreur(messageDe(err));
    }
  }

  function exporter() {
    const url = URL.createObjectURL(new Blob(['﻿' + versCsv(visibles)], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventes-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {erreur ? (
        <div className="mb-5">
          <Encart ton="alerte">{erreur}</Encart>
        </div>
      ) : null}

      {/* ------------------------------------------------------ les filtres */}
      <div className={`${CARTE} mb-5 p-4 sm:p-5`}>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Filtrer</span>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className={CHAMP}
              placeholder="Un nom, une adresse e-mail, une formation"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Trier par</span>
            <select value={tri} onChange={(e) => setTri(e.target.value as Tri)} className={CHAMP}>
              <option value="date">Date d&apos;achat</option>
              <option value="montant">Montant</option>
              <option value="reste">Reste à payer</option>
              <option value="acheteur">Acheteur</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-[15px] text-[#334A42]">
            <span className="font-extrabold text-[#12312A]">
              {visibles.length} vente{visibles.length > 1 ? 's' : ''}
            </span>{' '}
            · encaissé {euros(encaisse)}
            {attendu ? ` · en attente ${euros(attendu)}` : ''}
          </p>
          <button type="button" onClick={exporter} className={`${BTN_SECONDAIRE} ml-auto`}>
            Exporter en CSV
          </button>
          <button type="button" onClick={() => setOuvert((o) => !o)} className={BTN_PRIMAIRE}>
            {ouvert ? 'Fermer' : 'Enregistrer une vente'}
          </button>
        </div>
      </div>

      {/* --------------------------------------------- saisir une vente */}
      {ouvert ? (
        <form onSubmit={enregistrer} className={`${CARTE} mb-6 p-5`}>
          <p className="mb-4 max-w-[70ch] text-[14px] leading-relaxed text-[#5E7A6E]">
            Pour une vente réglée hors boutique : virement, chèque, espèces, ou prise en charge par un employeur ou un
            OPCO. Elle apparaîtra dans ta comptabilité comme les autres.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Produit acheté</span>
              <select value={produit} onChange={(e) => setProduit(e.target.value)} className={CHAMP} required>
                <option value="">Choisir…</option>
                {cours.map((c) => (
                  <option key={c.id} value={`cours:${c.id}`}>
                    {c.titre}
                  </option>
                ))}
                {packs.map((p) => (
                  <option key={p.id} value={`pack:${p.id}`}>
                    Pack · {p.titre}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Adresse e-mail</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={CHAMP} required />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Nom</span>
              <input value={nom} onChange={(e) => setNom(e.target.value)} className={CHAMP} maxLength={120} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Montant</span>
              <input value={montant} onChange={(e) => setMontant(e.target.value)} className={CHAMP} inputMode="decimal" placeholder="790" required />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Moyen</span>
                <input value={moyen} onChange={(e) => setMoyen(e.target.value)} className={CHAMP} maxLength={60} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-bold text-[#12312A]">Statut</span>
                <select value={statut} onChange={(e) => setStatut(e.target.value as StatutVente)} className={CHAMP}>
                  {STATUTS.map((s) => (
                    <option key={s} value={s}>
                      {NOM_STATUT_VENTE[s]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" disabled={enCours} className={BTN_PRIMAIRE}>
              {enCours ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            <button type="button" onClick={() => setOuvert(false)} className={BTN_DISCRET}>
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      {/* --------------------------------------------------------- la liste */}
      {visibles.length ? (
        <ul className="grid gap-2">
          {visibles.map((v) => (
            <li key={v.id} className={`${CARTE} flex flex-wrap items-center gap-3 p-4`}>
              <span className="w-[92px] shrink-0 text-[14px] text-[#5E7A6E]">{dateCourte(v.le)}</span>
              <span className="min-w-[170px] flex-1">
                <span className="block text-[15px] font-bold text-[#12312A]">{v.nom || 'Sans nom'}</span>
                <span className="block break-all text-[13px] text-[#5E7A6E]">{v.email}</span>
              </span>
              <span className="min-w-[170px] flex-1 text-[15px] text-[#334A42]">
                {v.cours?.titre ?? (v.packId ? 'Pack' : 'Non renseigné')}
                {v.codePromo ? <span className="block text-[13px] text-[#5E7A6E]">code {v.codePromo}</span> : null}
              </span>
              <Pastille ton={TON[v.statut]}>{NOM_STATUT_VENTE[v.statut]}</Pastille>
              <span className="w-[110px] text-right">
                <span className="block text-[13px] font-bold uppercase tracking-wide text-[#5E7A6E]">Reste</span>
                <span
                  className={`block text-[15px] font-black ${resteAPayer(v) ? 'text-[#8A1B3D]' : 'text-[#5E7A6E]'}`}
                >
                  {euros(resteAPayer(v))}
                </span>
              </span>
              <span className="w-[100px] text-right text-[16px] font-black text-[#12312A]">
                {euros(v.montantCents)}
              </span>
              {v.statut === 'EN_ATTENTE' ? (
                <button type="button" onClick={() => changerStatut(v, 'PAYEE')} className={BTN_DISCRET}>
                  Marquer payée
                </button>
              ) : v.statut === 'PAYEE' ? (
                <button type="button" onClick={() => changerStatut(v, 'REMBOURSEE')} className={BTN_DISCRET}>
                  Rembourser
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <Encart ton="info">
          {ventes.length
            ? "Aucune vente ne correspond à cette recherche."
            : "Aucune vente pour l'instant. Dès qu'une formation est achetée, elle apparaît ici."}
        </Encart>
      )}
    </>
  );
}
