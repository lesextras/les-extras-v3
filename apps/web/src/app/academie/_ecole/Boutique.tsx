'use client';

import Link from 'next/link';
import { useState } from 'react';
import { appel, messageDe } from './api';
import {
  NOM_STATUT_VENTE,
  VERT,
  dateCourte,
  dateEtHeure,
  euros,
  type Affilie,
  type Apprenant,
  type Classe,
  type CoursResume,
  type Pack,
  type Promo,
  type Vente,
  type Vitrine,
} from './types';

/**
 * LA BOUTIQUE DE L'ÉCOLE.
 *
 * Les écrans qui entourent les cours : qui apprend, ce qui se vend, les codes
 * de réduction, les packs, les classes en direct, la vitrine, l'affiliation.
 * Ils partagent la même grammaire — un tableau, un formulaire d'ajout, une
 * ligne qui se supprime — pour qu'on n'ait à l'apprendre qu'une fois.
 */

/* ============================================================== outils ==== */

const CHAMP =
  'w-full rounded-xl border border-[#CFE4D9] bg-white px-4 py-2.5 text-[15px] text-[#12312A] placeholder:text-[#8FA79B] focus:border-[#1E9E6A] focus:outline-none focus:ring-4 focus:ring-[#E3F5EC]';

function Cadre({ titre, aide, children }: { titre: string; aide?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-5 sm:p-6" style={{ borderColor: VERT.bord }}>
      <h2 className="text-lg font-extrabold tracking-tight" style={{ color: VERT.encre }}>
        {titre}
      </h2>
      {aide ? (
        <p className="mt-1 max-w-[70ch] text-[15px] leading-relaxed" style={{ color: VERT.texte }}>
          {aide}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Erreur({ texte }: { texte: string | null }) {
  if (!texte) return null;
  return (
    <p className="rounded-2xl border border-[#F3B0C2] bg-[#FDE7EC] px-5 py-4 text-[15px] font-bold text-[#8A1B3D]">{texte}</p>
  );
}

function Vide({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border bg-white px-5 py-6 text-center" style={{ borderColor: VERT.bord, color: VERT.texte }}>
      {children}
    </p>
  );
}

function Tableau({ colonnes, children }: { colonnes: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border bg-white" style={{ borderColor: VERT.bord }}>
      <table className="w-full min-w-[720px] text-left text-[15px]">
        <thead>
          <tr style={{ backgroundColor: VERT.fond, color: VERT.sourdine }}>
            {colonnes.map((c) => (
              <th key={c} className="px-4 py-3 font-bold">
                {c}
              </th>
            ))}
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function BoutonPlein({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-xl px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
      style={{ backgroundColor: VERT.fonce }}
    >
      {children}
    </button>
  );
}

function BoutonRetirer({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className="rounded-lg border border-[#F3B0C2] px-3 py-1.5 text-sm font-bold text-[#8A1B3D] disabled:opacity-60"
    >
      {children}
    </button>
  );
}

/* ======================================================= LES APPRENANTS === */

export function TableauApprenants({ apprenants: initiaux, origine }: { apprenants: Apprenant[]; origine: string }) {
  const [apprenants, setApprenants] = useState(initiaux);
  const [erreur, setErreur] = useState<string | null>(null);
  const [filtre, setFiltre] = useState('');

  const visibles = apprenants.filter((a) =>
    filtre.trim()
      ? `${a.email} ${a.nom ?? ''} ${a.cours.titre}`.toLowerCase().includes(filtre.trim().toLowerCase())
      : true,
  );

  async function retirer(id: string) {
    setErreur(null);
    try {
      await appel(`/ecole/apprenants/${id}`, { methode: 'DELETE' });
      setApprenants((p) => p.filter((a) => a.id !== id));
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  return (
    <div className="grid gap-4">
      <Erreur texte={erreur} />
      <input value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder="Chercher un nom, une adresse, un cours" className={CHAMP} />
      {visibles.length === 0 ? (
        <Vide>Personne n&apos;est encore inscrit à un cours.</Vide>
      ) : (
        <Tableau colonnes={['Personne', 'Cours', 'Avancement', 'Inscrit le', 'Lien']}>
          {visibles.map((a) => (
            <tr key={a.id} className="border-t" style={{ borderColor: VERT.bord }}>
              <td className="px-4 py-3" style={{ color: VERT.encre }}>
                <span className="font-bold">{a.nom ?? 'Non renseigné'}</span>
                <br />
                <span className="text-sm" style={{ color: VERT.sourdine }}>
                  {a.email}
                </span>
              </td>
              <td className="px-4 py-3" style={{ color: VERT.texte }}>
                {a.cours.titre}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 overflow-hidden rounded-full" style={{ backgroundColor: VERT.clair }}>
                    <div className="h-full rounded-full" style={{ width: `${a.progression}%`, backgroundColor: VERT.plein }} />
                  </div>
                  <span className="tabular-nums text-sm font-bold" style={{ color: VERT.texte }}>
                    {a.progression} %
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: VERT.texte }}>
                {dateCourte(a.inscritLe)}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(`${origine}${a.lien}`)}
                  className="rounded-lg border-2 bg-white px-3 py-1.5 text-sm font-bold"
                  style={{ borderColor: VERT.bord, color: VERT.encre }}
                >
                  Copier
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <BoutonRetirer onClick={() => retirer(a.id)}>Retirer</BoutonRetirer>
              </td>
            </tr>
          ))}
        </Tableau>
      )}
    </div>
  );
}

/* ========================================================== LES VENTES ==== */

export function TableauVentes({ ventes: initiales, cours }: { ventes: Vente[]; cours: CoursResume[] }) {
  const [ventes, setVentes] = useState(initiales);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [form, setForm] = useState({ coursId: cours[0]?.id ?? '', email: '', nom: '', euros: '', moyen: 'Virement' });

  const total = ventes.filter((v) => v.statut === 'PAYEE').reduce((n, v) => n + v.montantCents, 0);

  async function ajouter() {
    setOccupe(true);
    setErreur(null);
    try {
      await appel('/ecole/ventes', {
        methode: 'POST',
        corps: {
          coursId: form.coursId || undefined,
          email: form.email.trim(),
          nom: form.nom.trim(),
          montantCents: Math.round((Number(form.euros) || 0) * 100),
          moyen: form.moyen,
        },
      });
      setVentes(await appel<Vente[]>('/ecole/ventes'));
      setForm({ ...form, email: '', nom: '', euros: '' });
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  async function supprimer(id: string) {
    try {
      await appel(`/ecole/ventes/${id}`, { methode: 'DELETE' });
      setVentes((p) => p.filter((v) => v.id !== id));
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  return (
    <div className="grid gap-4">
      <Erreur texte={erreur} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Tuile libelle="Encaissé" valeur={euros(total)} />
        <Tuile libelle="Ventes" valeur={String(ventes.length)} />
        <Tuile libelle="Panier moyen" valeur={ventes.length ? euros(Math.round(total / ventes.length)) : 'Non renseigné'} />
      </div>

      <Cadre
        titre="Enregistrer une vente"
        aide="Le paiement se fait où tu veux, virement, espèces, lien de paiement, facture OPCO. On note ici ce qui est entré, pour que le suivi et les statistiques disent vrai."
      >
        <div className="grid gap-3 sm:grid-cols-5">
          <select value={form.coursId} onChange={(e) => setForm({ ...form, coursId: e.target.value })} className={CHAMP}>
            <option value="">Sans cours</option>
            {cours.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titre}
              </option>
            ))}
          </select>
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Nom" className={CHAMP} />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Adresse e-mail" className={CHAMP} />
          <input
            value={form.euros}
            onChange={(e) => setForm({ ...form, euros: e.target.value })}
            placeholder="Montant en euros"
            type="number"
            min={0}
            step="0.01"
            className={CHAMP}
          />
          <BoutonPlein onClick={ajouter} disabled={occupe || !form.email.trim()}>
            Enregistrer
          </BoutonPlein>
        </div>
      </Cadre>

      {ventes.length === 0 ? (
        <Vide>Aucune vente enregistrée.</Vide>
      ) : (
        <Tableau colonnes={['Date', 'Personne', 'Cours', 'Montant', 'État']}>
          {ventes.map((v) => (
            <tr key={v.id} className="border-t" style={{ borderColor: VERT.bord }}>
              <td className="px-4 py-3 text-sm" style={{ color: VERT.texte }}>
                {dateCourte(v.le)}
              </td>
              <td className="px-4 py-3" style={{ color: VERT.encre }}>
                <span className="font-bold">{v.nom ?? 'Non renseigné'}</span>
                <br />
                <span className="text-sm" style={{ color: VERT.sourdine }}>
                  {v.email}
                </span>
              </td>
              <td className="px-4 py-3" style={{ color: VERT.texte }}>
                {v.cours?.titre ?? 'Non renseigné'}
              </td>
              <td className="px-4 py-3 font-bold tabular-nums" style={{ color: VERT.encre }}>
                {euros(v.montantCents)}
              </td>
              <td className="px-4 py-3">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style={
                    v.statut === 'PAYEE'
                      ? { backgroundColor: VERT.clair, color: VERT.fonce }
                      : { backgroundColor: '#FEF3E2', color: '#7C3E06' }
                  }
                >
                  {NOM_STATUT_VENTE[v.statut]}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <BoutonRetirer onClick={() => supprimer(v.id)}>Supprimer</BoutonRetirer>
              </td>
            </tr>
          ))}
        </Tableau>
      )}
    </div>
  );
}

function Tuile({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="rounded-2xl border bg-white p-5" style={{ borderColor: VERT.bord }}>
      <p className="text-sm font-bold" style={{ color: VERT.sourdine }}>
        {libelle}
      </p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums" style={{ color: VERT.encre }}>
        {valeur}
      </p>
    </div>
  );
}

/* ====================================================== LES CODES PROMO === */

export function TableauPromos({ promos: initiaux }: { promos: Promo[] }) {
  const [promos, setPromos] = useState(initiaux);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'POURCENTAGE' as Promo['type'], valeur: '10', expireLe: '' });

  async function ajouter() {
    setOccupe(true);
    setErreur(null);
    try {
      await appel('/ecole/codes-promo', {
        methode: 'POST',
        corps: {
          code: form.code.trim(),
          type: form.type,
          valeur: form.type === 'POURCENTAGE' ? Number(form.valeur) || 10 : Math.round((Number(form.valeur) || 0) * 100),
          expireLe: form.expireLe || undefined,
        },
      });
      setPromos(await appel<Promo[]>('/ecole/codes-promo'));
      setForm({ ...form, code: '' });
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  async function basculer(p: Promo) {
    try {
      await appel(`/ecole/codes-promo/${p.id}`, { methode: 'PATCH', corps: { actif: !p.actif } });
      setPromos((liste) => liste.map((x) => (x.id === p.id ? { ...x, actif: !x.actif } : x)));
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  async function supprimer(id: string) {
    try {
      await appel(`/ecole/codes-promo/${id}`, { methode: 'DELETE' });
      setPromos((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  return (
    <div className="grid gap-4">
      <Erreur texte={erreur} />
      <Cadre titre="Créer un code" aide="Un code de réduction se donne à l'oral, s'imprime sur un flyer, ou se colle dans un e-mail. Il vaut un pourcentage ou un montant.">
        <div className="grid gap-3 sm:grid-cols-4">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="RENTREE25" className={CHAMP} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Promo['type'] })} className={CHAMP}>
            <option value="POURCENTAGE">Un pourcentage</option>
            <option value="MONTANT">Un montant en euros</option>
          </select>
          <input value={form.valeur} onChange={(e) => setForm({ ...form, valeur: e.target.value })} type="number" min={1} className={CHAMP} />
          <BoutonPlein onClick={ajouter} disabled={occupe}>
            Créer le code
          </BoutonPlein>
        </div>
      </Cadre>

      {promos.length === 0 ? (
        <Vide>Aucun code pour le moment.</Vide>
      ) : (
        <Tableau colonnes={['Code', 'Remise', 'Utilisations', 'Expire le', 'État']}>
          {promos.map((p) => (
            <tr key={p.id} className="border-t" style={{ borderColor: VERT.bord }}>
              <td className="px-4 py-3 font-extrabold" style={{ color: VERT.encre }}>
                {p.code}
              </td>
              <td className="px-4 py-3" style={{ color: VERT.texte }}>
                {p.type === 'POURCENTAGE' ? `${p.valeur} %` : euros(p.valeur)}
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: VERT.texte }}>
                {p.usages}
                {p.usageMax ? ` / ${p.usageMax}` : ''}
              </td>
              <td className="px-4 py-3 text-sm" style={{ color: VERT.texte }}>
                {dateCourte(p.expireLe)}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => basculer(p)}
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style={p.actif ? { backgroundColor: VERT.clair, color: VERT.fonce } : { backgroundColor: '#EDF3F0', color: VERT.sourdine }}
                >
                  {p.actif ? 'Actif' : 'Désactivé'}
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <BoutonRetirer onClick={() => supprimer(p.id)}>Supprimer</BoutonRetirer>
              </td>
            </tr>
          ))}
        </Tableau>
      )}
    </div>
  );
}

/* =========================================================== LES PACKS ==== */

export function TableauPacks({ packs: initiaux, cours }: { packs: Pack[]; cours: CoursResume[] }) {
  const [packs, setPacks] = useState(initiaux);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [titre, setTitre] = useState('');

  async function ajouter() {
    setOccupe(true);
    setErreur(null);
    try {
      await appel('/ecole/packs', { methode: 'POST', corps: { titre: titre.trim() || 'Nouveau pack' } });
      setPacks(await appel<Pack[]>('/ecole/packs'));
      setTitre('');
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  async function modifier(p: Pack, patch: Partial<Pack>) {
    try {
      const maj = await appel<Pack>(`/ecole/packs/${p.id}`, { methode: 'PATCH', corps: patch });
      setPacks((liste) => liste.map((x) => (x.id === p.id ? maj : x)));
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  async function supprimer(id: string) {
    try {
      await appel(`/ecole/packs/${id}`, { methode: 'DELETE' });
      setPacks((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  return (
    <div className="grid gap-4">
      <Erreur texte={erreur} />
      <Cadre titre="Créer un pack" aide="Plusieurs cours vendus ensemble, à un prix qui n'est pas la somme des prix. C'est ce qui fait monter le panier sans baisser la valeur d'un cours.">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Le parcours complet" className={CHAMP} />
          <BoutonPlein onClick={ajouter} disabled={occupe}>
            Créer le pack
          </BoutonPlein>
        </div>
      </Cadre>

      {packs.length === 0 ? (
        <Vide>Aucun pack pour le moment.</Vide>
      ) : (
        <div className="grid gap-3">
          {packs.map((p) => (
            <section key={p.id} className="rounded-2xl border bg-white p-5" style={{ borderColor: VERT.bord }}>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  defaultValue={p.titre}
                  onBlur={(e) => e.target.value.trim() !== p.titre && modifier(p, { titre: e.target.value.trim() })}
                  className="min-w-0 flex-1 rounded-lg border-2 border-transparent px-2 py-1.5 text-lg font-extrabold focus:border-[#B7E4CE] focus:outline-none"
                  style={{ color: VERT.encre }}
                  aria-label="Titre du pack"
                />
                <label className="flex items-center gap-2 text-sm font-bold" style={{ color: VERT.texte }}>
                  Prix
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={(p.prixCents / 100).toString()}
                    onBlur={(e) => modifier(p, { prixCents: Math.round((Number(e.target.value) || 0) * 100) })}
                    className="w-28 rounded-lg border px-2 py-1.5"
                    style={{ borderColor: VERT.bord }}
                  />
                  €
                </label>
                <button
                  type="button"
                  onClick={() => modifier(p, { statut: p.statut === 'PUBLIE' ? 'BROUILLON' : 'PUBLIE' })}
                  className="rounded-lg px-3 py-1.5 text-sm font-bold text-white"
                  style={{ backgroundColor: p.statut === 'PUBLIE' ? VERT.sourdine : VERT.fonce }}
                >
                  {p.statut === 'PUBLIE' ? 'Dépublier' : 'Publier'}
                </button>
                <BoutonRetirer onClick={() => supprimer(p.id)}>Supprimer</BoutonRetirer>
              </div>

              <p className="mt-3 text-sm font-bold" style={{ color: VERT.sourdine }}>
                Les cours du pack
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {cours.map((c) => {
                  const dedans = p.coursIds.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        modifier(p, { coursIds: dedans ? p.coursIds.filter((x) => x !== c.id) : [...p.coursIds, c.id] })
                      }
                      className="rounded-full border px-3 py-1.5 text-sm font-bold"
                      style={
                        dedans
                          ? { borderColor: VERT.fonce, backgroundColor: VERT.clair, color: VERT.fonce }
                          : { borderColor: VERT.bord, backgroundColor: '#FFFFFF', color: VERT.texte }
                      }
                    >
                      {c.titre}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================ LES CLASSES VIRTUELLES = */

export function TableauClasses({ classes: initiales, cours }: { classes: Classe[]; cours: CoursResume[] }) {
  const [classes, setClasses] = useState(initiales);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [form, setForm] = useState({ titre: '', debut: '', lien: '', coursId: '' });

  async function ajouter() {
    setOccupe(true);
    setErreur(null);
    try {
      await appel('/ecole/classes', {
        methode: 'POST',
        corps: {
          titre: form.titre.trim() || 'Classe virtuelle',
          debut: form.debut ? new Date(form.debut).toISOString() : new Date().toISOString(),
          lien: form.lien.trim(),
          coursId: form.coursId || undefined,
        },
      });
      setClasses(await appel<Classe[]>('/ecole/classes'));
      setForm({ titre: '', debut: '', lien: '', coursId: '' });
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  async function supprimer(id: string) {
    try {
      await appel(`/ecole/classes/${id}`, { methode: 'DELETE' });
      setClasses((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  return (
    <div className="grid gap-4">
      <Erreur texte={erreur} />
      <Cadre titre="Programmer une classe" aide="Un rendez-vous en visio, rattaché à un cours ou non. Le lien est ce que tu envoies aux inscrits.">
        <div className="grid gap-3 sm:grid-cols-5">
          <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Titre" className={CHAMP} />
          <input
            value={form.debut}
            onChange={(e) => setForm({ ...form, debut: e.target.value })}
            type="datetime-local"
            className={CHAMP}
            aria-label="Date et heure"
          />
          <input value={form.lien} onChange={(e) => setForm({ ...form, lien: e.target.value })} placeholder="Lien de la visio" className={CHAMP} />
          <select value={form.coursId} onChange={(e) => setForm({ ...form, coursId: e.target.value })} className={CHAMP}>
            <option value="">Sans cours</option>
            {cours.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titre}
              </option>
            ))}
          </select>
          <BoutonPlein onClick={ajouter} disabled={occupe}>
            Programmer
          </BoutonPlein>
        </div>
      </Cadre>

      {classes.length === 0 ? (
        <Vide>Aucune classe programmée.</Vide>
      ) : (
        <Tableau colonnes={['Quand', 'Titre', 'Cours', 'Lien']}>
          {classes.map((c) => (
            <tr key={c.id} className="border-t" style={{ borderColor: VERT.bord }}>
              <td className="px-4 py-3 text-sm font-bold" style={{ color: VERT.encre }}>
                {dateEtHeure(c.debut)}
              </td>
              <td className="px-4 py-3" style={{ color: VERT.texte }}>
                {c.titre}
              </td>
              <td className="px-4 py-3" style={{ color: VERT.texte }}>
                {c.cours?.titre ?? 'Non renseigné'}
              </td>
              <td className="px-4 py-3">
                {c.lien ? (
                  <a href={c.lien} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-4" style={{ color: VERT.fonce }}>
                    Ouvrir
                  </a>
                ) : (
                  'Non renseigné'
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <BoutonRetirer onClick={() => supprimer(c.id)}>Supprimer</BoutonRetirer>
              </td>
            </tr>
          ))}
        </Tableau>
      )}
    </div>
  );
}

/* ========================================================== LA VITRINE ==== */

export function FormulaireVitrine({ vitrine: initiale, origine }: { vitrine: Vitrine; origine: string }) {
  const [v, setV] = useState(initiale);
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);

  const set = (patch: Partial<Vitrine>) => setV((p) => ({ ...p, ...patch }));

  async function enregistrer(patch?: Partial<Vitrine>) {
    setOccupe(true);
    setErreur(null);
    setMessage(null);
    try {
      const maj = await appel<Vitrine>('/ecole/vitrine', {
        methode: 'PATCH',
        corps: {
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
          ...patch,
        },
      });
      setV(maj);
      setMessage('La vitrine est enregistrée.');
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  return (
    <div className="grid gap-4">
      <Erreur texte={erreur} />
      {message ? (
        <p className="rounded-2xl border px-5 py-4 text-[15px] font-bold" style={{ borderColor: VERT.bord, backgroundColor: VERT.clair, color: VERT.fonce }}>
          {message}
        </p>
      ) : null}

      <Cadre titre="L'adresse de ton école" aide="C'est la page qui rassemble tous tes cours. Une seule adresse à donner, à mettre en bio, à imprimer.">
        <div className="flex flex-wrap items-center gap-3">
          <code className="min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-sm" style={{ backgroundColor: VERT.fond, color: VERT.texte }}>
            {origine}/ecole/{v.slug}
          </code>
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(`${origine}/ecole/${v.slug}`)}
            className="rounded-lg border-2 bg-white px-4 py-2 text-sm font-bold"
            style={{ borderColor: VERT.bord, color: VERT.encre }}
          >
            Copier
          </button>
          <button
            type="button"
            onClick={() => enregistrer({ publiee: !v.publiee })}
            disabled={occupe}
            className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: v.publiee ? VERT.sourdine : VERT.fonce }}
          >
            {v.publiee ? 'Dépublier la vitrine' : 'Publier la vitrine'}
          </button>
        </div>
      </Cadre>

      <Cadre titre="Ce qu'on voit en haut de la page">
        <div className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold" style={{ color: VERT.texte }}>
                Nom de l&apos;école
              </span>
              <input value={v.nom} onChange={(e) => set({ nom: e.target.value })} className={CHAMP} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold" style={{ color: VERT.texte }}>
                Adresse courte
              </span>
              <input value={v.slug} onChange={(e) => set({ slug: e.target.value })} className={CHAMP} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold" style={{ color: VERT.texte }}>
              Phrase d&apos;accroche
            </span>
            <input value={v.sousTitre ?? ''} onChange={(e) => set({ sousTitre: e.target.value })} className={CHAMP} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold" style={{ color: VERT.texte }}>
              Présentation
            </span>
            <textarea rows={6} value={v.presentation ?? ''} onChange={(e) => set({ presentation: e.target.value })} className={CHAMP} />
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold" style={{ color: VERT.texte }}>
                Logo (adresse)
              </span>
              <input value={v.logoUrl ?? ''} onChange={(e) => set({ logoUrl: e.target.value })} className={CHAMP} placeholder="https://…" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold" style={{ color: VERT.texte }}>
                Bannière (adresse)
              </span>
              <input value={v.banniereUrl ?? ''} onChange={(e) => set({ banniereUrl: e.target.value })} className={CHAMP} placeholder="https://…" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-bold" style={{ color: VERT.texte }}>
                Couleur
              </span>
              <input type="color" value={v.couleur} onChange={(e) => set({ couleur: e.target.value })} className="h-[46px] w-full rounded-xl border" style={{ borderColor: VERT.bord }} />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold" style={{ color: VERT.texte }}>
              Adresse de contact
            </span>
            <input value={v.contactEmail ?? ''} onChange={(e) => set({ contactEmail: e.target.value })} className={CHAMP} />
          </label>
        </div>
      </Cadre>

      <Cadre titre="Les mentions et les conditions" aide="Obligatoires dès que tu vends en ligne. Elles s'affichent en bas de la vitrine et des pages de cours.">
        <div className="grid gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold" style={{ color: VERT.texte }}>
              Conditions générales de vente
            </span>
            <textarea rows={6} value={v.cgv ?? ''} onChange={(e) => set({ cgv: e.target.value })} className={CHAMP} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold" style={{ color: VERT.texte }}>
              Mentions légales
            </span>
            <textarea rows={5} value={v.mentions ?? ''} onChange={(e) => set({ mentions: e.target.value })} className={CHAMP} />
          </label>
        </div>
      </Cadre>

      <div>
        <button
          type="button"
          onClick={() => enregistrer()}
          disabled={occupe}
          className="rounded-xl px-6 py-3 text-base font-extrabold text-white disabled:opacity-60"
          style={{ backgroundColor: VERT.fonce }}
        >
          Enregistrer la vitrine
        </button>
      </div>
    </div>
  );
}

/* ====================================================== L'AFFILIATION ==== */

export function TableauAffilies({ affilies: initiaux, origine }: { affilies: Affilie[]; origine: string }) {
  const [affilies, setAffilies] = useState(initiaux);
  const [erreur, setErreur] = useState<string | null>(null);
  const [occupe, setOccupe] = useState(false);
  const [form, setForm] = useState({ nom: '', email: '', code: '', commission: '20' });

  async function ajouter() {
    setOccupe(true);
    setErreur(null);
    try {
      await appel('/ecole/affilies', {
        methode: 'POST',
        corps: {
          nom: form.nom.trim(),
          email: form.email.trim(),
          code: form.code.trim(),
          commissionPourcent: Number(form.commission) || 20,
        },
      });
      setAffilies(await appel<Affilie[]>('/ecole/affilies'));
      setForm({ nom: '', email: '', code: '', commission: '20' });
    } catch (e) {
      setErreur(messageDe(e));
    } finally {
      setOccupe(false);
    }
  }

  async function supprimer(id: string) {
    try {
      await appel(`/ecole/affilies/${id}`, { methode: 'DELETE' });
      setAffilies((p) => p.filter((x) => x.id !== id));
    } catch (e) {
      setErreur(messageDe(e));
    }
  }

  return (
    <div className="grid gap-4">
      <Erreur texte={erreur} />
      <Cadre
        titre="Ajouter un partenaire"
        aide="Un partenaire partage un lien qui porte son code. Quand une vente arrive avec ce code, on sait à qui elle revient, et combien lui revient."
      >
        <div className="grid gap-3 sm:grid-cols-5">
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Nom" className={CHAMP} />
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Adresse e-mail" className={CHAMP} />
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Code (facultatif)" className={CHAMP} />
          <input
            value={form.commission}
            onChange={(e) => setForm({ ...form, commission: e.target.value })}
            type="number"
            min={0}
            max={90}
            className={CHAMP}
            aria-label="Commission en pourcentage"
          />
          <BoutonPlein onClick={ajouter} disabled={occupe}>
            Ajouter
          </BoutonPlein>
        </div>
      </Cadre>

      {affilies.length === 0 ? (
        <Vide>Aucun partenaire pour le moment.</Vide>
      ) : (
        <Tableau colonnes={['Partenaire', 'Code', 'Commission', 'Ventes', 'Lien à partager']}>
          {affilies.map((a) => (
            <tr key={a.id} className="border-t" style={{ borderColor: VERT.bord }}>
              <td className="px-4 py-3" style={{ color: VERT.encre }}>
                <span className="font-bold">{a.nom}</span>
                <br />
                <span className="text-sm" style={{ color: VERT.sourdine }}>
                  {a.email}
                </span>
              </td>
              <td className="px-4 py-3 font-extrabold" style={{ color: VERT.encre }}>
                {a.code}
              </td>
              <td className="px-4 py-3" style={{ color: VERT.texte }}>
                {a.commissionPourcent} %
              </td>
              <td className="px-4 py-3 tabular-nums" style={{ color: VERT.texte }}>
                {a.ventes} · {euros(a.gainsCents)}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => void navigator.clipboard?.writeText(`${origine}/ecole?a=${a.code}`)}
                  className="rounded-lg border-2 bg-white px-3 py-1.5 text-sm font-bold"
                  style={{ borderColor: VERT.bord, color: VERT.encre }}
                >
                  Copier
                </button>
              </td>
              <td className="px-4 py-3 text-right">
                <BoutonRetirer onClick={() => supprimer(a.id)}>Retirer</BoutonRetirer>
              </td>
            </tr>
          ))}
        </Tableau>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ lien -- */

export function LienCours({ id, titre }: { id: string; titre: string }) {
  return (
    <Link href={`/academie/cours-en-ligne/${id}`} className="font-bold no-underline hover:underline" style={{ color: VERT.fonce }}>
      {titre}
    </Link>
  );
}
